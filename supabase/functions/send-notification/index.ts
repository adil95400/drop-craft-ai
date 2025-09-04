import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface NotificationRequest {
  userId: string
  title: string
  message: string
  type?: 'info' | 'warning' | 'success' | 'error'
  category?: string
  priority?: number
  data?: any
  expiresAt?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const {
      userId,
      title,
      message,
      type = 'info',
      category = 'general',
      priority = 5,
      data = {},
      expiresAt
    } = await req.json() as NotificationRequest

    console.log(`Sending notification to user ${userId}: ${title}`)

    // Créer la notification dans la base de données
    const { data: notification, error } = await supabase
      .from('user_notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        category,
        priority,
        data,
        expires_at: expiresAt || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      throw new Error('Failed to create notification')
    }

    // Si c'est une notification critique, on peut aussi envoyer une notification push
    if (priority >= 8) {
      console.log('High priority notification, could send push notification')
      // Ici on pourrait intégrer avec Firebase Cloud Messaging, OneSignal, etc.
    }

    console.log(`Notification sent successfully: ${notification.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        notification,
        message: 'Notification sent successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Send notification error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})