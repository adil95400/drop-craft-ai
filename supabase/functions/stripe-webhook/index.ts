import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No stripe-signature header");

    const body = await req.text();
    logStep("Verifying webhook signature");

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(JSON.stringify({ error: "Webhook signature verification failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Event type", { type: event.type });

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { sessionId: session.id, customer: session.customer });

        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const productId = subscription.items.data[0].price.product as string;
          
          // Map product ID to plan type
          const planMap: Record<string, string> = {
            "prod_T3RS5DA7XYPWBP": "standard",
            "prod_T3RTReiXnCg9hy": "pro",
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
              logStep("Error finding profile", { error: profileError });
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
                logStep("Error updating profile", { error: updateError });
              } else {
                logStep("Profile updated successfully", { userId: profiles.id, plan });
              }
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { subscriptionId: subscription.id, status: subscription.status });

        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if ('email' in customer && customer.email) {
          const productId = subscription.items.data[0].price.product as string;
          
          const planMap: Record<string, string> = {
            "prod_T3RS5DA7XYPWBP": "standard",
            "prod_T3RTReiXnCg9hy": "pro",
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
            await supabase
              .from('profiles')
              .update({ 
                plan: subscription.status === "active" ? plan : "standard",
                subscription_status: status,
                updated_at: new Date().toISOString()
              })
              .eq('id', profiles.id);

            logStep("Profile updated", { userId: profiles.id, plan, status });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription cancelled", { subscriptionId: subscription.id });

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
                plan: "standard",
                subscription_status: 'cancelled',
                updated_at: new Date().toISOString()
              })
              .eq('id', profiles.id);

            logStep("Profile downgraded to standard", { userId: profiles.id });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { invoiceId: invoice.id });
        
        // Could send notification to user here
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
