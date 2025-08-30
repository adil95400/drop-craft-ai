import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting scheduled sync operations...')

    // Récupérer toutes les intégrations actives avec sync automatique
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('is_active', true)
      .not('sync_frequency', 'eq', 'manual')

    if (error) {
      throw new Error(`Failed to fetch integrations: ${error.message}`)
    }

    console.log(`Found ${integrations?.length || 0} active integrations`)

    const syncResults = []

    // Traiter chaque intégration BigBuy
    for (const integration of integrations || []) {
      if (integration.platform_name === 'BigBuy') {
        try {
          const result = await syncBigBuy(integration, supabase)
          syncResults.push(result)
        } catch (error) {
          console.error(`Failed to sync BigBuy:`, error)
          syncResults.push({
            integration_id: integration.id,
            platform: 'BigBuy',
            success: false,
            error: error.message
          })
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sync operations completed',
        results: syncResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Cron sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Synchronisation BigBuy
async function syncBigBuy(integration: any, supabase: any) {
  console.log('Syncing BigBuy products...')

  const apiKey = Deno.env.get('BIGBUY_API_KEY')
  if (!apiKey) {
    return { success: false, error: 'BigBuy API key not configured' }
  }

  const { data, error } = await supabase.functions.invoke('bigbuy-integration', {
    body: {
      action: 'get_products',
      api_key: apiKey,
      limit: 50
    }
  })

  if (error) {
    throw new Error(`BigBuy sync failed: ${error.message}`)
  }

  return { 
    success: true, 
    products_processed: data?.products?.length || 0
  }
}