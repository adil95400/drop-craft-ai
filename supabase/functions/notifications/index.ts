import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    const { action, user_id, notification_data } = await req.json()

    switch (action) {
      case 'create_notification':
        const { data, error } = await supabaseClient
          .from('notifications')
          .insert([{
            user_id: user_id,
            type: notification_data.type || 'info',
            title: notification_data.title,
            message: notification_data.message,
            action_url: notification_data.action_url,
            action_label: notification_data.action_label,
            read: false
          }])
          .select()

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, notification: data[0] }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'bulk_notify':
        // Send notifications to multiple users
        const notifications = notification_data.users.map((userId: string) => ({
          user_id: userId,
          type: notification_data.type || 'info',
          title: notification_data.title,
          message: notification_data.message,
          action_url: notification_data.action_url,
          action_label: notification_data.action_label,
          read: false
        }))

        const { data: bulkData, error: bulkError } = await supabaseClient
          .from('notifications')
          .insert(notifications)
          .select()

        if (bulkError) throw bulkError

        return new Response(
          JSON.stringify({ success: true, notifications: bulkData }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'mark_read':
        const { error: markError } = await supabaseClient
          .from('notifications')
          .update({ read: true })
          .eq('id', notification_data.notification_id)

        if (markError) throw markError

        return new Response(
          JSON.stringify({ success: true }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'get_notifications':
        const { data: userNotifications, error: getError } = await supabaseClient
          .from('notifications')
          .select('*')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (getError) throw getError

        return new Response(
          JSON.stringify({ success: true, notifications: userNotifications }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
    }

  } catch (error) {
    console.error('Notification function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})