import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-PLAN] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      logStep("Authentication failed", userError);
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const body = await req.json();
    const { requiredPlan, feature } = body;

    if (!requiredPlan && !feature) {
      return new Response(
        JSON.stringify({ error: "Required plan or feature must be specified" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's current plan
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logStep("Error fetching profile", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPlan = profile?.plan || 'free';
    logStep("User plan retrieved", { userPlan });

    // Check plan access
    const planHierarchy = { free: 0, pro: 1, ultra_pro: 2 };
    
    let hasAccess = false;
    
    if (requiredPlan) {
      hasAccess = planHierarchy[userPlan as keyof typeof planHierarchy] >= 
                 planHierarchy[requiredPlan as keyof typeof planHierarchy];
    } else if (feature) {
      // Feature-based access control
      const featureRequirements: Record<string, string> = {
        'ai-import': 'ultra_pro',
        'bulk-import': 'ultra_pro',
        'scheduled-import': 'ultra_pro',
        'advanced-analytics': 'ultra_pro',
        'predictive-analytics': 'ultra_pro',
        'marketing-automation': 'ultra_pro',
        'advanced-automation': 'ultra_pro',
        'crm-prospects': 'ultra_pro',
        'advanced-seo': 'ultra_pro',
        'security-monitoring': 'ultra_pro',
        'premium-integrations': 'ultra_pro',
        'advanced-tracking': 'ultra_pro',
        'ai-insights': 'pro',
        'advanced-import': 'pro',
        'workflow-builder': 'pro',
        'advanced-crm': 'pro',
        'seo-automation': 'pro',
        'advanced-security': 'pro',
        'advanced-integrations': 'pro',
        'real-time-tracking': 'pro'
      };
      
      const requiredPlanForFeature = featureRequirements[feature] || 'free';
      hasAccess = planHierarchy[userPlan as keyof typeof planHierarchy] >= 
                 planHierarchy[requiredPlanForFeature as keyof typeof planHierarchy];
    }

    logStep("Access check completed", { 
      userPlan, 
      requiredPlan: requiredPlan || featureRequirements[feature], 
      hasAccess 
    });

    return new Response(
      JSON.stringify({
        hasAccess,
        userPlan,
        requiredPlan: requiredPlan || featureRequirements[feature],
        feature
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-plan", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});