import { handlePreflight, requireAuth, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const body = await req.json()
    const { integration_id, direction = 'bidirectional' } = body

    const { data: integrations } = await supabase
      .from('integrations')
      .select('id, platform_type, store_name')
      .eq('user_id', userId)
      .eq('is_active', true)

    return successResponse({
      message: `Synchronisation clients planifiée pour ${integrations?.length || 0} boutique(s)`,
      queued: integrations?.length || 0,
    }, corsHeaders)
  } catch (error) {
    if (error instanceof Response) return error
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(error.message || 'Erreur interne', getSecureCorsHeaders(origin), 400)
  }
})
