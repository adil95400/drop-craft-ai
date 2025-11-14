import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('🔄 Auto-sync scheduler running...')

    // Get all active integrations with auto-sync enabled
    const { data: integrations, error: integrationsError } = await supabase
      .from('marketplace_integrations')
      .select('*')
      .eq('is_active', true)
      .eq('auto_sync_enabled', true)
      .lte('next_sync_at', new Date().toISOString())

    if (integrationsError) throw integrationsError

    console.log(`Found ${integrations?.length || 0} integrations to sync`)

    const results = []

    for (const integration of integrations || []) {
      try {
        console.log(`Syncing ${integration.platform} for user ${integration.user_id}`)

        // Trigger sync based on platform
        const syncFunction = getSyncFunctionForPlatform(integration.platform)
        
        const { data: syncResult, error: syncError } = await supabase.functions.invoke(syncFunction, {
          body: {
            integration_id: integration.id,
            sync_type: 'full',
            auto_sync: true
          }
        })

        if (syncError) {
          console.error(`Sync error for ${integration.platform}:`, syncError)
          results.push({
            integration_id: integration.id,
            platform: integration.platform,
            success: false,
            error: syncError.message
          })
          
          // Update failed sync count
          await supabase
            .from('marketplace_integrations')
            .update({
              failed_sync_count: integration.failed_sync_count + 1,
              last_sync_at: new Date().toISOString()
            })
            .eq('id', integration.id)
          
          continue
        }

        // Calculate next sync time based on frequency
        const nextSyncAt = calculateNextSync(integration.sync_frequency || 'hourly')

        // Update integration with next sync time
        await supabase
          .from('marketplace_integrations')
          .update({
            last_sync_at: new Date().toISOString(),
            next_sync_at: nextSyncAt,
            total_sync_count: integration.total_sync_count + 1
          })
          .eq('id', integration.id)

        results.push({
          integration_id: integration.id,
          platform: integration.platform,
          success: true,
          products_synced: syncResult?.products_synced || 0,
          orders_synced: syncResult?.orders_synced || 0
        })

      } catch (error) {
        console.error(`Error syncing integration ${integration.id}:`, error)
        results.push({
          integration_id: integration.id,
          platform: integration.platform,
          success: false,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} integrations`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Auto-sync scheduler error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function getSyncFunctionForPlatform(platform: string): string {
  const functionMap: Record<string, string> = {
    'shopify': 'shopify-sync',
    'woocommerce': 'woocommerce-sync',
    'prestashop': 'prestashop-sync',
    'bigbuy': 'bigbuy-sync',
    'aliexpress': 'aliexpress-integration',
    'tiktok_shop': 'tiktok-shop-integration',
    'instagram_shopping': 'instagram-shopping',
    'facebook_shops': 'facebook-shops',
    'amazon': 'marketplace-sync',
    'etsy': 'marketplace-sync',
    'cdiscount': 'marketplace-sync',
    'ebay': 'marketplace-sync'
  }

  return functionMap[platform] || 'marketplace-sync'
}

function calculateNextSync(frequency: string): string {
  const now = new Date()
  
  switch (frequency) {
    case '15min':
      return new Date(now.getTime() + 15 * 60 * 1000).toISOString()
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString()
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    default:
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString()
  }
}
