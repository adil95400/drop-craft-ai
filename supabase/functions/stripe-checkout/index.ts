/**
 * Stripe Checkout - Secure Edge Function
 * SECURITY: JWT authentication + rate limiting + input validation
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from '../_shared/cors.ts';
import { withErrorHandler, ValidationError } from '../_shared/error-handler.ts';
import { parseJsonValidated, z } from '../_shared/validators.ts';
import { checkRateLimit } from '../_shared/rate-limiter.ts';

const BodySchema = z.object({
  plan: z.enum(['pro', 'ultra_pro'], {
    errorMap: () => ({ message: 'Plan must be pro or ultra_pro' })
  })
});

const logStep = (step: string, details?: Record<string, unknown>) => {
  const safeDetails = details ? { ...details } : undefined;
  // Never log email in full
  if (safeDetails?.email && typeof safeDetails.email === 'string') {
    safeDetails.email = safeDetails.email.slice(0, 3) + '***';
  }
  console.log(`[STRIPE-CHECKOUT] ${step}${safeDetails ? ` - ${JSON.stringify(safeDetails)}` : ''}`);
};

serve(
  withErrorHandler(async (req) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    logStep("Function started");

    // SECURITY: Authenticate user via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ValidationError("Authorization required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new ValidationError("Invalid authentication");
    }
    
    const user = userData.user;
    if (!user.email) {
      throw new ValidationError("User email required");
    }

    logStep("User authenticated", { userId: user.id });

    // SECURITY: Rate limiting - 5 checkout attempts per hour
    const rateLimitOk = await checkRateLimit(
      supabase,
      `checkout:${user.id}`,
      5,
      3600000 // 1 hour
    );
    if (!rateLimitOk) {
      throw new ValidationError("Too many checkout attempts. Please try again later.");
    }

    // Validate input
    const { plan } = await parseJsonValidated(req, BodySchema);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Define pricing
    const priceData = {
      pro: {
        unit_amount: 999, // $9.99
        product_name: "Plan Pro"
      },
      ultra_pro: {
        unit_amount: 1999, // $19.99
        product_name: "Plan Ultra Pro"
      }
    };

    // SECURITY: Validate origin
    const origin = req.headers.get("origin");
    const allowedOrigins = [
      Deno.env.get("SITE_URL"),
      "https://drop-craft-ai.lovable.app",
      "https://id-preview--7af4654f-dfc7-42c6-900f-b9ac682ca5ec.lovable.app"
    ].filter(Boolean);
    
    const returnUrl = allowedOrigins.includes(origin || '') 
      ? origin 
      : allowedOrigins[0] || 'https://drop-craft-ai.lovable.app';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      client_reference_id: user.id, // Link to our user
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: priceData[plan].product_name,
              description: `Abonnement ${plan === 'pro' ? 'Pro' : 'Ultra Pro'} mensuel`
            },
            unit_amount: priceData[plan].unit_amount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${returnUrl}/modern/billing?success=true`,
      cancel_url: `${returnUrl}/modern/billing?canceled=true`,
      metadata: {
        user_id: user.id,
        plan: plan
      }
    });

    logStep("Checkout session created", { sessionId: session.id?.slice(0, 10), plan });

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'checkout_started',
      entity_type: 'subscription',
      description: `Checkout started for ${plan} plan`,
      source: 'stripe-checkout'
    }).catch(() => {});

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }, corsHeaders)
);
