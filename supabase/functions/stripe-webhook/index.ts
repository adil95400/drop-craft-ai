import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}`, details ? JSON.stringify(details, null, 2) : '');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    if (!signature) {
      throw new Error('No Stripe signature found');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep('Webhook verified', { type: event.type, id: event.id });
    } catch (err) {
      logStep('Webhook verification failed', { error: err.message });
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Store webhook event
    await supabase.from('stripe_webhooks').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      data: event.data,
      processed: false
    });

    // Process different webhook events
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event, supabase);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event, supabase);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event, supabase);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event, supabase);
        break;
      
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event, supabase);
        break;
      
      default:
        logStep('Unhandled event type', { type: event.type });
    }

    // Mark webhook as processed
    await supabase
      .from('stripe_webhooks')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('stripe_event_id', event.id);

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logStep('Webhook error', { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

async function handleSubscriptionChange(event: Stripe.Event, supabase: any) {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;
  
  logStep('Processing subscription change', { 
    subscriptionId: subscription.id, 
    status: subscription.status 
  });

  // Get customer email
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');
  const customer = await stripe.customers.retrieve(customerId);
  
  if (!customer || customer.deleted || !customer.email) {
    throw new Error('Customer not found or no email');
  }

  // Determine subscription tier based on price
  let subscriptionTier = 'standard';
  if (subscription.items.data.length > 0) {
    const price = subscription.items.data[0].price;
    const amount = price.unit_amount || 0;
    
    if (amount >= 2999) {
      subscriptionTier = 'ultra_pro';
    } else if (amount >= 999) {
      subscriptionTier = 'pro';
    }
  }

  // Update subscribers table
  await supabase.from('subscribers').upsert({
    email: customer.email,
    stripe_customer_id: customerId,
    subscribed: subscription.status === 'active',
    subscription_tier: subscriptionTier,
    subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'email' });

  // Update user profile plan if user exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', customer.email)
    .maybeSingle();

  if (profile) {
    await supabase
      .from('profiles')
      .update({ 
        plan: subscriptionTier,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);
  }

  logStep('Subscription updated', { email: customer.email, tier: subscriptionTier });
}

async function handleSubscriptionCanceled(event: Stripe.Event, supabase: any) {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;
  
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');
  const customer = await stripe.customers.retrieve(customerId);
  
  if (!customer || customer.deleted || !customer.email) {
    return;
  }

  // Update subscribers table
  await supabase.from('subscribers').upsert({
    email: customer.email,
    stripe_customer_id: customerId,
    subscribed: false,
    subscription_tier: null,
    subscription_end: null,
    updated_at: new Date().toISOString()
  }, { onConflict: 'email' });

  // Revert user to standard plan
  await supabase
    .from('profiles')
    .update({ 
      plan: 'standard',
      updated_at: new Date().toISOString()
    })
    .eq('email', customer.email);

  logStep('Subscription canceled', { email: customer.email });
}

async function handlePaymentSucceeded(event: Stripe.Event, supabase: any) {
  const invoice = event.data.object as Stripe.Invoice;
  logStep('Payment succeeded', { invoiceId: invoice.id, amount: invoice.amount_paid });
  
  // You can add additional logic here for payment tracking
}

async function handlePaymentFailed(event: Stripe.Event, supabase: any) {
  const invoice = event.data.object as Stripe.Invoice;
  logStep('Payment failed', { invoiceId: invoice.id, amount: invoice.amount_due });
  
  // You can add additional logic here for handling failed payments
}

async function handleCheckoutCompleted(event: Stripe.Event, supabase: any) {
  const session = event.data.object as Stripe.Checkout.Session;
  logStep('Checkout completed', { sessionId: session.id, mode: session.mode });
  
  if (session.mode === 'subscription') {
    // Subscription checkout - will be handled by subscription.created webhook
    return;
  }
  
  // Handle one-time payment if needed
  if (session.customer_email) {
    // Update any order records or perform other actions
    logStep('One-time payment completed', { email: session.customer_email });
  }
}