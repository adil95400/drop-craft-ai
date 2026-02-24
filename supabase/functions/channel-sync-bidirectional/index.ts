/**
 * Channel Sync Bidirectional — SECURED (JWT-first, RLS-enforced)
 * Queues sync jobs for active integrations
 */

import { requireAuth, handlePreflight, successResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const body = await req.json()
    const { sync_type, direction, integration_id } = body

    const { data: integrations } = await supabase
      .from('integrations')
      .select('id, platform_type, store_name, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (!integrations || integrations.length === 0) {
      return successResponse({
        message: 'Aucune boutique connectée',
        synced: 0,
        results: []
      }, corsHeaders)
    }

    const targets = integration_id
      ? integrations.filter((i: any) => i.id === integration_id)
      : integrations

    const queueItems = targets.map((integration: any) => ({
      user_id: userId,
      sync_type: sync_type || 'products',
      entity_type: sync_type || 'products',
      entity_id: integration.id,
      action: direction || 'bidirectional',
      status: 'pending',
      priority: 5,
      channels: JSON.stringify([{ integration_id: integration.id, platform: integration.platform_type }]),
      payload: { store_name: integration.store_name, platform: integration.platform_type }
    }))

    if (queueItems.length > 0) {
      await supabase.from('unified_sync_queue').insert(queueItems)
    }

    return successResponse({
      message: `Synchronisation ${sync_type || 'products'} planifiée pour ${targets.length} boutique(s)`,
      queued: targets.length,
      stores: targets.map((i: any) => i.store_name)
    }, corsHeaders)

  } catch (err) {
    if (err instanceof Response) return err
    console.error('[channel-sync-bidirectional] Error:', err)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Erreur interne' }),
      { status: 400, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})
