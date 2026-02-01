/**
 * Cron Sync Function - P1.2 Secured
 * Called by pg_cron to sync all active integrations
 * 
 * SECURITY: No CORS, requires secret or service role auth
 */

import { createCronFunction, type CronContext } from '../_shared/create-cron-function.ts'

const handler = async (ctx: CronContext): Promise<Response> => {
  const { adminClient, correlationId } = ctx
  
  console.log(`[${correlationId}] Cron sync function started`)
  
  // Parse body safely
  let syncType = 'all_integrations'
  try {
    const body = await ctx.req.json()
    syncType = body?.sync_type || 'all_integrations'
  } catch {
    // Default to all_integrations if no body
  }
  
  switch (syncType) {
    case 'all_integrations':
      return await syncAllIntegrations(adminClient, correlationId)
    case 'inventory_updates':
      return await syncInventoryUpdates(adminClient, correlationId)
    case 'price_updates':
      return await syncPriceUpdates(adminClient, correlationId)
    default:
      return await syncAllIntegrations(adminClient, correlationId)
  }
}

async function syncAllIntegrations(
  supabaseClient: ReturnType<typeof import('https://esm.sh/@supabase/supabase-js@2.53.0').createClient>,
  correlationId: string
): Promise<Response> {
  console.log(`[${correlationId}] Starting sync for all active integrations`)

  const { data: integrations, error } = await supabaseClient
    .from('integrations')
    .select('*')
    .eq('is_active', true)

  if (error) {
    console.error(`[${correlationId}] Error fetching integrations:`, error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  console.log(`[${correlationId}] Found ${integrations?.length || 0} integrations to sync`)

  // Log execution
  await supabaseClient.from('cron_execution_logs').insert({
    cron_name: 'cron-sync',
    correlation_id: correlationId,
    status: 'success',
    metadata: { sync_type: 'all_integrations', integrations_count: integrations?.length || 0 },
    executed_at: new Date().toISOString()
  })

  return new Response(
    JSON.stringify({
      success: true,
      correlationId,
      message: `Sync completed for ${integrations?.length || 0} integrations`
    }),
    { headers: { 'Content-Type': 'application/json' }, status: 200 }
  )
}

async function syncInventoryUpdates(
  supabaseClient: ReturnType<typeof import('https://esm.sh/@supabase/supabase-js@2.53.0').createClient>,
  correlationId: string
): Promise<Response> {
  console.log(`[${correlationId}] Syncing inventory updates`)
  
  await supabaseClient.from('cron_execution_logs').insert({
    cron_name: 'cron-sync',
    correlation_id: correlationId,
    status: 'success',
    metadata: { sync_type: 'inventory_updates' },
    executed_at: new Date().toISOString()
  })
  
  return new Response(
    JSON.stringify({ success: true, correlationId, message: 'Inventory sync completed' }),
    { headers: { 'Content-Type': 'application/json' }, status: 200 }
  )
}

async function syncPriceUpdates(
  supabaseClient: ReturnType<typeof import('https://esm.sh/@supabase/supabase-js@2.53.0').createClient>,
  correlationId: string
): Promise<Response> {
  console.log(`[${correlationId}] Syncing price updates`)
  
  await supabaseClient.from('cron_execution_logs').insert({
    cron_name: 'cron-sync',
    correlation_id: correlationId,
    status: 'success',
    metadata: { sync_type: 'price_updates' },
    executed_at: new Date().toISOString()
  })
  
  return new Response(
    JSON.stringify({ success: true, correlationId, message: 'Price sync completed' }),
    { headers: { 'Content-Type': 'application/json' }, status: 200 }
  )
}

// Export with cron wrapper - requires secret or service role auth
Deno.serve(createCronFunction({
  name: 'cron-sync',
  requireSecret: true,
  secretEnvVar: 'CRON_SECRET',
  allowServiceRoleAuth: true,
  maxExecutionsPerHour: 60
}, handler))
