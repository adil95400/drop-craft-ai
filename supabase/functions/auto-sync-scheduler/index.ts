/**
 * Auto-Sync Scheduler - P1.2 Secured
 * Scheduled job to trigger marketplace syncs
 * 
 * SECURITY: No CORS, requires secret or service role auth
 */

import { createCronFunction, type CronContext } from '../_shared/create-cron-function.ts'

const handler = async (ctx: CronContext): Promise<Response> => {
  const { adminClient, correlationId } = ctx
  
  console.log(`[${correlationId}] 🔄 Auto-sync scheduler running...`)

  // Get all active integrations with auto-sync enabled
  const { data: integrations, error: integrationsError } = await adminClient
    .from('marketplace_integrations')
    .select('*')
    .eq('is_active', true)
    .eq('auto_sync_enabled', true)
    .lte('next_sync_at', new Date().toISOString())

  if (integrationsError) {
    console.error(`[${correlationId}] Error fetching integrations:`, integrationsError)
    return new Response(
      JSON.stringify({ success: false, error: integrationsError.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  console.log(`[${correlationId}] Found ${integrations?.length || 0} integrations to sync`)

  const results = []

  for (const integration of integrations || []) {
    try {
      console.log(`[${correlationId}] Syncing ${integration.platform} for user ${integration.user_id}`)

      // Trigger sync based on platform
      const syncFunction = getSyncFunctionForPlatform(integration.platform)
      
      const { data: syncResult, error: syncError } = await adminClient.functions.invoke(syncFunction, {
        body: {
          integration_id: integration.id,
          sync_type: 'full',
          auto_sync: true,
          _internal_cron_call: true  // Flag for internal calls
        }
      })

      if (syncError) {
        console.error(`[${correlationId}] Sync error for ${integration.platform}:`, syncError)
        results.push({
          integration_id: integration.id,
          platform: integration.platform,
          success: false,
          error: syncError.message
        })
        
        // Update failed sync count
        await adminClient
          .from('marketplace_integrations')
          .update({
            failed_sync_count: (integration.failed_sync_count || 0) + 1,
            last_sync_at: new Date().toISOString()
          })
          .eq('id', integration.id)
        
        continue
      }

      // Calculate next sync time based on frequency
      const nextSyncAt = calculateNextSync(integration.sync_frequency || 'hourly')

      // Update integration with next sync time
      await adminClient
        .from('marketplace_integrations')
        .update({
          last_sync_at: new Date().toISOString(),
          next_sync_at: nextSyncAt,
          total_sync_count: (integration.total_sync_count || 0) + 1,
          failed_sync_count: 0  // Reset on success
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
      console.error(`[${correlationId}] Error syncing integration ${integration.id}:`, error)
      results.push({
        integration_id: integration.id,
        platform: integration.platform,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  // Log execution
  await adminClient.from('cron_execution_logs').insert({
    cron_name: 'auto-sync-scheduler',
    correlation_id: correlationId,
    status: 'success',
    metadata: { 
      integrations_processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    },
    executed_at: new Date().toISOString()
  })

  return new Response(
    JSON.stringify({
      success: true,
      correlationId,
      message: `Processed ${results.length} integrations`,
      results
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

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

// Export with cron wrapper
Deno.serve(createCronFunction({
  name: 'auto-sync-scheduler',
  requireSecret: true,
  secretEnvVar: 'CRON_SECRET',
  allowServiceRoleAuth: true,
  maxExecutionsPerHour: 12  // Max every 5 minutes
}, handler))
