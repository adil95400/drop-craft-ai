import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Product IDs mapping - MUST match stripe-config.ts
const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_TuImodwMnB71NS": "standard",
  "prod_TuImFSanPs0svj": "pro",
  "prod_T3RTMipVwUA7Ud": "ultra_pro"
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Simple in-memory cache (per worker instance)
const cache: { [email: string]: { data: any; timestamp: number } } = {};
const CACHE_TTL = 60 * 1000; // 1 minute cache

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check cache first
    const cached = cache[user.email];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logStep("Returning cached response");
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    let customers;
    try {
      customers = await stripe.customers.list({ email: user.email, limit: 1 });
    } catch (stripeError: any) {
      if (stripeError.code === 'rate_limit') {
        logStep("Stripe rate limited, returning cached or default");
        // Return cached data if available, even if stale
        if (cached) {
          return new Response(JSON.stringify(cached.data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        // Return default free plan if no cache
        return new Response(JSON.stringify({ 
          subscribed: false, 
          product_id: null, 
          plan: 'free', 
          subscription_end: null 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      throw stripeError;
    }
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning free plan");
      const result = { 
        subscribed: false,
        product_id: null,
        plan: 'free',
        subscription_end: null
      };
      cache[user.email] = { data: result, timestamp: Date.now() };
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    let hasActiveSub = subscriptions.data.length > 0;
    let productId: string | null = null;
    let subscriptionEnd: string | null = null;
    let plan = 'free';

    // Also check for trialing subscriptions
    if (!hasActiveSub) {
      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });
      if (trialingSubscriptions.data.length > 0) {
        hasActiveSub = true;
        const subscription = trialingSubscriptions.data[0];
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        productId = subscription.items.data[0].price.product as string;
        plan = PRODUCT_TO_PLAN[productId] || 'standard';
        logStep("Trial subscription found", { productId, plan });
      }
    }

    if (hasActiveSub && !productId) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product as string;
      plan = PRODUCT_TO_PLAN[productId] || 'standard';
      logStep("Active subscription found", { subscriptionId: subscription.id, productId, plan, endDate: subscriptionEnd });
    }

    // Sync with profiles table
    if (hasActiveSub) {
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ 
          plan,
          subscription_plan: plan,
          subscription_status: 'active',
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        logStep("Error syncing profile", { error: updateError.message });
      } else {
        logStep("Profile synced successfully", { plan });
      }
    } else {
      logStep("No active subscription found");
      
      // Check current profile plan to avoid unnecessary updates
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('plan, subscription_status')
        .eq('id', user.id)
        .single();
      
      if (profile?.subscription_status === 'active') {
        const { error: resetError } = await supabaseClient
          .from('profiles')
          .update({ 
            plan: 'standard',
            subscription_status: 'inactive',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (resetError) {
          logStep("Error resetting profile", { error: resetError.message });
        }
      }
    }

    const result = {
      subscribed: hasActiveSub,
      product_id: productId,
      plan: plan,
      subscription_end: subscriptionEnd
    };
    
    // Cache the result
    cache[user.email] = { data: result, timestamp: Date.now() };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});