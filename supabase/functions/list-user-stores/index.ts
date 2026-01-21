import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      
      // Check if it's an extension token
      if (token.startsWith("ext_")) {
        const { data: sessionData } = await supabase
          .from("extension_sessions")
          .select("user_id")
          .eq("session_token", token)
          .eq("is_active", true)
          .single();
        
        if (sessionData) {
          userId = sessionData.user_id;
        }
      } else {
        // Standard JWT
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized", stores: [] }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user's connected stores from integrations table
    const { data: integrations, error: intError } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .in("platform", [
        "shopify", "woocommerce", "prestashop", "magento", 
        "bigcommerce", "wix", "squarespace"
      ]);

    if (intError) {
      console.error("[list-user-stores] Error fetching integrations:", intError);
      throw intError;
    }

    // Transform integrations to store format
    const stores = (integrations || []).map((integration) => ({
      id: integration.id,
      name: integration.store_name || integration.store_url || integration.platform,
      domain: integration.store_url,
      platform: integration.platform,
      status: integration.connection_status,
      lastSync: integration.last_sync_at,
      productCount: integration.product_count || 0,
      color: getPlatformColor(integration.platform),
      config: integration.config
    }));

    // Also check for marketplace connections that can receive products
    const { data: marketplaces } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .in("platform", ["amazon", "ebay", "etsy", "tiktok-shop"]);

    const marketplaceStores = (marketplaces || []).map((mp) => ({
      id: mp.id,
      name: mp.seller_id || mp.platform,
      domain: mp.store_url,
      platform: mp.platform,
      type: "marketplace",
      status: mp.connection_status,
      lastSync: mp.last_sync_at,
      color: getPlatformColor(mp.platform)
    }));

    return new Response(
      JSON.stringify({
        success: true,
        stores: [...stores, ...marketplaceStores],
        total: stores.length + marketplaceStores.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[list-user-stores] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stores: []
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    shopify: "#96bf48",
    woocommerce: "#9b5c8f",
    prestashop: "#df0067",
    magento: "#f26322",
    bigcommerce: "#34313f",
    wix: "#0c6efc",
    squarespace: "#000000",
    amazon: "#ff9900",
    ebay: "#e53238",
    etsy: "#f56400",
    "tiktok-shop": "#00f2ea"
  };
  return colors[platform?.toLowerCase()] || "#6366f1";
}
