import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_PACKS = {
  small: { credits: 50, label: "50 crédits IA", price_amount: 499 },
  medium: { credits: 200, label: "200 crédits IA", price_amount: 1499 },
  large: { credits: 500, label: "500 crédits IA", price_amount: 2999 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { pack_id } = await req.json();
    const pack = CREDIT_PACKS[pack_id as keyof typeof CREDIT_PACKS];
    if (!pack) throw new Error("Invalid credit pack");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      // Fallback: direct DB insert without Stripe (dev mode)
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { error: insertError } = await supabaseAdmin
        .from("credit_addons")
        .insert({
          user_id: user.id,
          quota_key: "ai_generations",
          credits_purchased: pack.credits,
          credits_remaining: pack.credits,
          price_paid: pack.price_amount / 100,
          currency: "EUR",
          status: "active",
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (insertError) throw insertError;

      return new Response(JSON.stringify({ success: true, mode: "direct" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stripe mode
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: pack.price_amount,
            product_data: {
              name: pack.label,
              description: `Pack de ${pack.credits} crédits IA pour ShopOpti+`,
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        user_id: user.id,
        pack_id,
        credits: pack.credits.toString(),
      },
      success_url: `${req.headers.get("origin")}/dashboard/consumption?credits_purchased=${pack.credits}`,
      cancel_url: `${req.headers.get("origin")}/dashboard/consumption`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
