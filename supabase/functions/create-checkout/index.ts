/**
 * Stripe Create Checkout - Secured Implementation
 * P0.1: JWT authentication required
 * P0.4: Secure CORS with allowlist
 * P0.5: Input validation
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getSecureCorsHeaders, isAllowedOrigin } from '../_shared/secure-cors.ts';
import { z } from 'https://esm.sh/zod@3.22.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

// Input validation
const InputSchema = z.object({
  priceId: z.string().regex(/^price_[a-zA-Z0-9]+$/, 'Invalid Stripe price ID format')
});

const logStep = (step: string, details?: any) => {
  // Don't log sensitive data
  const safeDetails = details ? { ...details } : undefined;
  if (safeDetails?.email) safeDetails.email = '***@***';
  const detailsStr = safeDetails ? ` - ${JSON.stringify(safeDetails)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    const origin = req.headers.get('Origin');
    if (!origin || !isAllowedOrigin(origin)) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // P0.1: Authenticate user via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const user = userData.user;
    if (!user.email) {
      return new Response(
        JSON.stringify({ error: "User email not available" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    logStep("User authenticated", { userId: user.id.slice(0, 8) });

    // Validate input
    const body = await req.json();
    const parseResult = InputSchema.safeParse(body);
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid price ID format" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { priceId } = parseResult.data;
    logStep("Price ID validated", { priceId: priceId.slice(0, 15) });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer");
    }

    // Validate origin for redirect URLs
    const origin = req.headers.get("origin");
    if (!origin || !isAllowedOrigin(origin)) {
      return new Response(
        JSON.stringify({ error: "Invalid origin" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create checkout session with promotion code support
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      client_reference_id: user.id, // Track user ID for webhook
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      allow_promotion_codes: true, // Enable promo codes at checkout
      success_url: `${origin}/subscription?success=true`,
      cancel_url: `${origin}/subscription?canceled=true`,
      metadata: {
        user_id: user.id
      }
    });

    logStep("Checkout session created", { sessionId: session.id.slice(0, 15) });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    
    // Don't expose internal errors
    const status = errorMessage.includes('Authentication') ? 401 : 500;
    const clientMessage = status === 401 ? errorMessage : 'Checkout creation failed';
    
    return new Response(JSON.stringify({ error: clientMessage }), {
      headers: { ...getSecureCorsHeaders(req), "Content-Type": "application/json" },
      status,
    });
  }
});
