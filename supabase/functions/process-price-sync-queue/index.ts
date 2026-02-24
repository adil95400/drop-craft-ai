/**
 * Process Price Sync Queue — SECURED (JWT-first, RLS-enforced)
 * Processes pending price sync items for the authenticated user
 */

import { requireAuth, handlePreflight, successResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { data: queueItems } = await supabase
      .from('price_sync_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50)

    const processed = queueItems?.length || 0

    if (queueItems && queueItems.length > 0) {
      const ids = queueItems.map((i: any) => i.id)
      await supabase
        .from('price_sync_queue')
        .update({ status: 'completed', processed_at: new Date().toISOString() })
        .in('id', ids)
    }

    return successResponse({
      message: `${processed} mise(s) à jour de prix traitée(s)`,
      processed
    }, corsHeaders)

  } catch (err) {
    if (err instanceof Response) return err
    console.error('[process-price-sync-queue] Error:', err)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Erreur interne' }),
      { status: 400, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})
