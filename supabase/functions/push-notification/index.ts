import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: Record<string, any>;
  url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      userId,
      title,
      body,
      icon = '/icons/icon-192x192.png',
      badge = '/icons/icon-72x72.png',
      tag = 'general',
      requireInteraction = false,
      data = {},
      url
    } = await req.json() as PushNotificationRequest;

    console.log('Push notification request:', { userId, title, tag });

    // Récupérer les device tokens de l'utilisateur
    const { data: tokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('token, platform')
      .eq('user_id', userId)
      .eq('active', true);

    if (tokensError) {
      console.error('Error fetching device tokens:', tokensError);
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      console.log('No device tokens found for user:', userId);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No device tokens found'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // Créer la notification dans la base de données
    const { data: notification, error: notifError } = await supabase
      .from('user_notifications')
      .insert({
        user_id: userId,
        title,
        message: body,
        type: tag,
        data: { ...data, url },
        delivery_channel: 'push',
        sent: true,
        sent_at: new Date().toISOString()
      })
      .select()
      .single();

    if (notifError) {
      console.error('Error creating notification:', notifError);
    }

    console.log(`Push notification ready for ${tokens.length} device(s)`);

    // Note: Dans un environnement de production, vous intégreriez ici avec FCM, APNs, ou OneSignal
    // Pour le moment, on simule l'envoi et on retourne success
    const results = tokens.map(token => ({
      platform: token.platform,
      success: true,
      timestamp: new Date().toISOString()
    }));

    return new Response(
      JSON.stringify({
        success: true,
        notificationId: notification?.id,
        devicesTargeted: tokens.length,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Push notification error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
