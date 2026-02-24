/**
 * Notifications — SECURED (JWT-first, RLS-enforced)
 */
import { requireAuth, handlePreflight, successResponse, errorResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const body = await req.json()
    const { action, notification_data } = body

    const VALID_ACTIONS = ['create_notification', 'mark_read', 'get_notifications', 'mark_all_read']
    if (!VALID_ACTIONS.includes(action)) {
      return errorResponse('Invalid action', corsHeaders, 400)
    }

    switch (action) {
      case 'create_notification': {
        const title = notification_data?.title
        const message = notification_data?.message
        if (!title || !message) return errorResponse('title and message required', corsHeaders, 400)

        const { data, error } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: notification_data.type || 'info',
            title: title.slice(0, 200),
            message: message.slice(0, 2000),
            action_url: notification_data.action_url,
            action_label: notification_data.action_label?.slice(0, 50),
            read: false,
          })
          .select()

        if (error) throw error
        return successResponse({ success: true, notification: data?.[0] }, corsHeaders)
      }

      case 'mark_read': {
        const nid = notification_data?.notification_id
        if (!nid) return errorResponse('notification_id required', corsHeaders, 400)

        // RLS ensures user can only update their own
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', nid)

        if (error) throw error
        return successResponse({ success: true }, corsHeaders)
      }

      case 'mark_all_read': {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('read', false)

        if (error) throw error
        return successResponse({ success: true }, corsHeaders)
      }

      case 'get_notifications': {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        return successResponse({ success: true, notifications: data }, corsHeaders)
      }

      default:
        return errorResponse('Invalid action', corsHeaders, 400)
    }

  } catch (err) {
    if (err instanceof Response) return err
    console.error('[notifications] Error:', err)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})
