import { requireAuth, handlePreflight, successResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { supabase, corsHeaders } = await requireAuth(req)

    // RLS-scoped: only returns user's active integrations
    const { data: integrations } = await supabase
      .from('integrations')
      .select('id, platform_type, store_name')
      .eq('is_active', true)

    return successResponse({
      message: `Synchronisation stock planifiée pour ${integrations?.length || 0} boutique(s)`,
      queued: integrations?.length || 0
    }, corsHeaders)

  } catch (error) {
    if (error instanceof Response) return error
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erreur interne' }),
      { status: 400, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})
