/**
 * Unified Sync Orchestrator — SECURED (JWT-first, RLS-enforced)
 * Orchestrates sync across all modules for all active integrations
 */
import { requireAuth, handlePreflight, successResponse, errorResponse } from '../_shared/jwt-auth.ts'

interface SyncRequest {
  sync_types?: string[]
  platforms?: string[]
  force_full_sync?: boolean
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)
    const authHeader = req.headers.get('Authorization')!

    const { sync_types, platforms, force_full_sync } = await req.json() as SyncRequest

    console.log(`🔄 Unified Sync for user ${userId.slice(0, 8)}...`)

    // Get active sync configurations (RLS-scoped)
    const { data: configs, error: configError } = await supabase
      .from('sync_configurations')
      .select('*')
      .eq('is_active', true)

    if (configError) throw configError

    if (!configs || configs.length === 0) {
      return successResponse({ message: 'Aucune configuration de sync active', synced: 0, results: [] }, corsHeaders)
    }

    const integrationIds = configs.map((c: any) => c.integration_id).filter(Boolean)

    const { data: integrations } = await supabase
      .from('integrations')
      .select('id, platform, store_url, is_active')
      .in('id', integrationIds.length > 0 ? integrationIds : ['00000000-0000-0000-0000-000000000000'])

    const integrationMap = new Map((integrations || []).map((i: any) => [i.id, i]))

    const results: any[] = []
    const allSyncTypes = sync_types || ['products', 'prices', 'stock', 'orders', 'customers', 'tracking']

    const functionMap: Record<string, string> = {
      products: 'channel-sync-bidirectional',
      prices: 'process-price-sync-queue',
      stock: 'channel-sync-bidirectional',
      orders: 'sync-orders-to-channels',
      customers: 'channel-sync-bidirectional',
      tracking: 'channel-sync-bidirectional',
    }

    for (const config of configs) {
      const integration = integrationMap.get(config.integration_id)
      if (!integration?.is_active) continue

      const platform = integration.platform
      if (platforms && !platforms.includes(platform)) continue

      const syncResult: any = { platform, integration_id: integration.id, syncs: {} }

      for (const syncType of allSyncTypes) {
        const configKey = `sync_${syncType}` as string
        if (!(config as any)[configKey]) continue

        try {
          const fnName = functionMap[syncType] || 'channel-sync-bidirectional'
          const { data, error } = await supabase.functions.invoke(fnName, {
            body: { integration_id: integration.id, sync_type: syncType, direction: config.sync_direction || 'bidirectional' },
            headers: { Authorization: authHeader }
          })
          syncResult.syncs[syncType] = { success: !error, data, error: error?.message }
        } catch (e) {
          syncResult.syncs[syncType] = { success: false, error: (e as Error).message }
        }
      }

      if (force_full_sync) {
        await supabase
          .from('sync_configurations')
          .update({ last_full_sync_at: new Date().toISOString() })
          .eq('id', config.id)
      }

      // Log
      await supabase.from('unified_sync_logs').insert({
        user_id: userId,
        sync_type: 'full',
        platform,
        entity_type: 'all',
        action: force_full_sync ? 'full_sync' : 'incremental_sync',
        status: Object.values(syncResult.syncs).every((s: any) => s.success) ? 'success' : 'partial',
        metadata: syncResult
      })

      results.push(syncResult)
    }

    return successResponse({
      message: `Synchronisation terminée pour ${results.length} intégration(s)`,
      results
    }, corsHeaders)

  } catch (err) {
    if (err instanceof Response) return err
    console.error('[unified-sync-orchestrator] Error:', err)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse((err as Error).message || 'Erreur interne', getSecureCorsHeaders(origin), 500)
  }
})
