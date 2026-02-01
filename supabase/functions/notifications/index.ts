import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticateUser } from '../_shared/secure-auth.ts'
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts'
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from '../_shared/rate-limit.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

// Input validation schemas
const NotificationDataSchema = z.object({
  type: z.enum(['info', 'success', 'warning', 'error']).optional().default('info'),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  action_url: z.string().url().optional(),
  action_label: z.string().max(50).optional(),
  notification_id: z.string().uuid().optional(),
})

const ActionSchema = z.enum(['create_notification', 'mark_read', 'get_notifications', 'mark_all_read'])

serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req)
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightSecure(req)
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. Auth obligatoire - userId provient du token uniquement
    const { user } = await authenticateUser(req, supabaseClient)
    const userId = user.id

    // 2. Rate limiting
    const rateCheck = await checkRateLimit(supabaseClient, userId, 'notifications', RATE_LIMITS.API_GENERAL)
    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck, corsHeaders)
    }

    // 3. Parse and validate input
    const body = await req.json()
    const { action, notification_data } = body
    
    const actionResult = ActionSchema.safeParse(action)
    if (!actionResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid action',
          valid_actions: ['create_notification', 'mark_read', 'get_notifications', 'mark_all_read']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    switch (action) {
      case 'create_notification': {
        const dataResult = NotificationDataSchema.safeParse(notification_data)
        if (!dataResult.success) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid notification data', details: dataResult.error.flatten() }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // SECURE: user_id provient du token, pas du body
        const { data, error } = await supabaseClient
          .from('notifications')
          .insert([{
            user_id: userId, // CRITICAL: from token only
            type: dataResult.data.type,
            title: dataResult.data.title,
            message: dataResult.data.message,
            action_url: dataResult.data.action_url,
            action_label: dataResult.data.action_label,
            read: false
          }])
          .select()

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, notification: data[0] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      case 'mark_read': {
        if (!notification_data?.notification_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'notification_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // SECURE: scope to user_id
        const { error } = await supabaseClient
          .from('notifications')
          .update({ read: true })
          .eq('id', notification_data.notification_id)
          .eq('user_id', userId) // CRITICAL: scope to user

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      case 'mark_all_read': {
        // SECURE: scope to user_id
        const { error } = await supabaseClient
          .from('notifications')
          .update({ read: true })
          .eq('user_id', userId) // CRITICAL: scope to user
          .eq('read', false)

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      case 'get_notifications': {
        // SECURE: scope to user_id
        const { data: userNotifications, error } = await supabaseClient
          .from('notifications')
          .select('*')
          .eq('user_id', userId) // CRITICAL: scope to user
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, notifications: userNotifications }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

  } catch (error) {
    console.error('Notification function error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...getSecureCorsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
