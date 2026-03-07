import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSecureCorsHeaders, handleCorsPreflightSecure, isAllowedOrigin } from "../_shared/secure-cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return handleCorsPreflightSecure(req);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { planType } = await req.json();

    const STRIPE_PRICES: Record<string, string> = {
      pro: Deno.env.get("STRIPE_PRICE_PRO") || "",
      ultra_pro: Deno.env.get("STRIPE_PRICE_ULTRA") || "",
    };

    const priceId = STRIPE_PRICES[planType];
    if (!priceId) {
      return new Response(JSON.stringify({ error: "Plan invalide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate origin for redirect URLs
    const origin = req.headers.get("origin") || "https://drop-craft-ai.lovable.app";
    const safeOrigin = isAllowedOrigin(origin) ? origin : "https://drop-craft-ai.lovable.app";

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mode: "subscription",
        "payment_method_types[]": "card",
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        success_url: `${safeOrigin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${safeOrigin}/payment-cancelled`,
        client_reference_id: user.id,
        customer_email: user.email || "",
      }).toString(),
    });

    const session = await response.json();

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[create-checkout-session] Error:", error.message);
    return new Response(JSON.stringify({ error: "Checkout session failed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
