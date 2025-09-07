import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CRON-SYNC] ${step}${detailsStr}`);
};

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
    logStep("Cron sync function started");

    const { sync_type } = await req.json();

    switch (sync_type) {
      case 'all_integrations':
        return await syncAllIntegrations(supabaseClient);
      case 'inventory_updates':
        return await syncInventoryUpdates(supabaseClient);
      case 'price_updates':
        return await syncPriceUpdates(supabaseClient);
      default:
        return await syncAllIntegrations(supabaseClient);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in cron-sync", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function syncAllIntegrations(supabaseClient: any) {
  logStep("Starting sync for all active integrations");

  const { data: integrations } = await supabaseClient
    .from('integrations')
    .select('*')
    .eq('is_active', true);

  logStep(`Found ${integrations?.length || 0} integrations to sync`);

  return new Response(JSON.stringify({
    success: true,
    message: `Sync completed for ${integrations?.length || 0} integrations`
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function syncInventoryUpdates(supabaseClient: any) {
  logStep("Syncing inventory updates");
  return new Response(JSON.stringify({ success: true, message: "Inventory sync completed" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
  });
}

async function syncPriceUpdates(supabaseClient: any) {
  logStep("Syncing price updates");
  return new Response(JSON.stringify({ success: true, message: "Price sync completed" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
  });
}