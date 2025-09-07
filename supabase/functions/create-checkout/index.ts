import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Create Supabase client using anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get request body for plan selection
    const { plan = "pro", mode = "subscription" } = await req.json();
    logStep("Plan and mode received", { plan, mode });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    // Define pricing based on plan
    const pricingConfig = {
      standard: { amount: 999, name: "Standard Plan" }, // €9.99
      pro: { amount: 1999, name: "Pro Plan" }, // €19.99
      ultra_pro: { amount: 3999, name: "Ultra Pro Plan" } // €39.99
    };

    const selectedPricing = pricingConfig[plan as keyof typeof pricingConfig] || pricingConfig.pro;
    logStep("Pricing selected", selectedPricing);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { 
              name: selectedPricing.name,
              description: `Abonnement ${selectedPricing.name} - Drop Craft AI`
            },
            unit_amount: selectedPricing.amount,
            ...(mode === "subscription" ? {
              recurring: { interval: "month" }
            } : {})
          },
          quantity: 1,
        },
      ],
      mode: mode as "subscription" | "payment",
      success_url: `${req.headers.get("origin")}/dashboard?checkout=success&plan=${plan}`,
      cancel_url: `${req.headers.get("origin")}/dashboard?checkout=cancel`,
      metadata: {
        user_id: user.id,
        plan: plan
      },
      // Add customer portal access for subscriptions
      ...(mode === "subscription" ? {
        subscription_data: {
          metadata: {
            user_id: user.id,
            plan: plan
          }
        }
      } : {})
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});