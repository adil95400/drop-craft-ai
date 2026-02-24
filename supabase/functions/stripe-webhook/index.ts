/**
 * Stripe Webhook Handler - Secure Edge Function
 * SECURITY: Uses signature verification (not JWT)
 * P0.4 FIX: Webhooks don't need CORS * since they're server-to-server
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Webhooks are server-to-server, no CORS needed for browsers
// But we still handle OPTIONS for any edge cases
const webhookHeaders = {
  'Content-Type': 'application/json',
};

const logStep = (step: string, details?: any) => {
  const safeDetails = details ? { ...details } : undefined;
  // Don't log sensitive data
  if (safeDetails?.customer_email) {
    safeDetails.customer_email = '***@***';
  }
  console.log(`[STRIPE-WEBHOOK] ${step}${safeDetails ? ` - ${JSON.stringify(safeDetails)}` : ''}`);
};

serve(async (req) => {
  // Webhooks shouldn't receive browser CORS preflight, but handle just in case
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: webhookHeaders,
    });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY not configured");
      throw new Error("Stripe not configured");
    }
    if (!webhookSecret) {
      logStep("ERROR: STRIPE_WEBHOOK_SECRET not configured");
      throw new Error("Webhook secret not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // CRITICAL SECURITY: Verify Stripe signature
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("SECURITY: Missing stripe-signature header");
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 401,
        headers: webhookHeaders,
      });
    }

    const body = await req.text();
    logStep("Verifying webhook signature");

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logStep("SECURITY: Webhook signature verification failed");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: webhookHeaders,
      });
    }

    logStep("Event verified", { type: event.type });

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { sessionId: session.id?.slice(0, 10) });

        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const productId = subscription.items.data[0].price.product as string;
          
          // Map product ID to plan type
          const planMap: Record<string, string> = {
            "prod_TuImodwMnB71NS": "standard",
            "prod_TuImFSanPs0svj": "pro",
            "prod_T3RTMipVwUA7Ud": "ultra_pro"
          };
          
          const plan = planMap[productId] || "standard";
          
          // Update user profile with new plan
          if (session.customer_email) {
            const { data: profiles, error: profileError } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', session.customer_email)
              .maybeSingle();

            if (profileError) {
              logStep("Error finding profile", { error: profileError.message });
            } else if (profiles) {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ 
                  plan,
                  subscription_plan: plan,
                  subscription_status: 'active',
                  updated_at: new Date().toISOString()
                })
                .eq('id', profiles.id);

              if (updateError) {
                logStep("Error updating profile", { error: updateError.message });
              } else {
                logStep("Profile updated successfully", { plan });
              }
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { status: subscription.status });

        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if ('email' in customer && customer.email) {
          const productId = subscription.items.data[0].price.product as string;
          
          const planMap: Record<string, string> = {
            "prod_TuImodwMnB71NS": "standard",
            "prod_TuImFSanPs0svj": "pro",
            "prod_T3RTMipVwUA7Ud": "ultra_pro"
          };
          
          const plan = planMap[productId] || "standard";
          const status = subscription.status === "active" ? "active" : subscription.status;

          const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', customer.email)
            .maybeSingle();

          if (profiles) {
            const isActive = subscription.status === "active" || subscription.status === "trialing";
            await supabase
              .from('profiles')
              .update({ 
                plan: isActive ? plan : "free",
                subscription_plan: isActive ? plan : "free",
                subscription_status: status,
                updated_at: new Date().toISOString()
              })
              .eq('id', profiles.id);

            logStep("Profile updated", { plan, status });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription cancelled");

        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if ('email' in customer && customer.email) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', customer.email)
            .maybeSingle();

          if (profiles) {
            await supabase
              .from('profiles')
              .update({ 
                plan: "free",
                subscription_plan: "free",
                subscription_status: 'cancelled',
                updated_at: new Date().toISOString()
              })
              .eq('id', profiles.id);

            logStep("Profile downgraded to free");
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { customerId: (invoice.customer as string)?.slice(0, 10) });
        
        // Suspend user on payment failure
        const failedCustomer = await stripe.customers.retrieve(invoice.customer as string);
        if ('email' in failedCustomer && failedCustomer.email) {
          const { data: failedProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', failedCustomer.email)
            .maybeSingle();

          if (failedProfile) {
            await supabase
              .from('profiles')
              .update({ 
                subscription_status: 'past_due',
                updated_at: new Date().toISOString()
              })
              .eq('id', failedProfile.id);

            logStep("User marked as past_due", { email: '***' });
            
            // Log security event
            await supabase.from('security_events').insert({
              user_id: failedProfile.id,
              event_type: 'payment_failed',
              severity: 'warn',
              description: 'Invoice payment failed - account marked past_due',
              metadata: { invoice_id: invoice.id }
            }).catch(() => {});
          }
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: webhookHeaders,
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      headers: webhookHeaders,
      status: 500,
    });
  }
});
