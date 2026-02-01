/**
 * Stripe Customer Portal - Secure Edge Function
 * SECURITY: JWT authentication + origin validation
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { corsHeaders } from '../_shared/cors.ts';
import { withErrorHandler, ValidationError } from '../_shared/error-handler.ts';

const logStep = (step: string, details?: Record<string, unknown>) => {
  const safeDetails = details ? { ...details } : undefined;
  if (safeDetails?.email && typeof safeDetails.email === 'string') {
    safeDetails.email = '***@***';
  }
  console.log(`[STRIPE-PORTAL] ${step}${safeDetails ? ` - ${JSON.stringify(safeDetails)}` : ''}`);
};

serve(
  withErrorHandler(async (req) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

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

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      throw new ValidationError("Aucun compte client Stripe trouvé. Veuillez d'abord souscrire à un abonnement.");
    }
    
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId: customerId.slice(0, 8) });

    // SECURITY: Validate return URL origin
    const origin = req.headers.get("origin");
    const allowedOrigins = [
      Deno.env.get("SITE_URL"),
      "https://drop-craft-ai.lovable.app",
      "https://id-preview--7af4654f-dfc7-42c6-900f-b9ac682ca5ec.lovable.app"
    ].filter(Boolean);
    
    const returnUrl = allowedOrigins.includes(origin || '') 
      ? origin 
      : allowedOrigins[0] || 'https://drop-craft-ai.lovable.app';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${returnUrl}/subscription`,
    });

    logStep("Customer portal session created");

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'portal_accessed',
      entity_type: 'subscription',
      description: 'Accessed billing portal',
      source: 'stripe-portal'
    }).catch(() => {});

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }, corsHeaders)
);
