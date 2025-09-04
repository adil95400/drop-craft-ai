import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      user_id, 
      title, 
      body, 
      data, 
      type = 'general',
      priority = 5,
      scheduled_for 
    } = await req.json();

    console.log('Mobile notification request received:', {
      user_id,
      title,
      type,
      priority
    });

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Store notification in database
    const { data: notification, error: notificationError } = await supabase
      .from('user_notifications')
      .insert([{
        user_id,
        title,
        description: body,
        type,
        priority,
        scheduled_for,
        data: data || {},
        delivery_channel: 'push',
        sent: false
      }])
      .select()
      .single();

    if (notificationError) {
      console.error('Error storing notification:', notificationError);
      throw notificationError;
    }

    // Get user's device tokens (simulate for now)
    const { data: deviceTokens, error: tokenError } = await supabase
      .from('device_tokens')
      .select('token, platform')
      .eq('user_id', user_id)
      .eq('active', true);

    if (tokenError) {
      console.error('Error fetching device tokens:', tokenError);
    }

    // Simulate push notification sending
    const results = [];
    
    if (deviceTokens && deviceTokens.length > 0) {
      for (const device of deviceTokens) {
        try {
          // Here you would integrate with FCM, APNs, etc.
          // For simulation, we'll just log and mark as sent
          console.log(`Sending push notification to ${device.platform} device:`, {
            token: device.token.substring(0, 10) + '...',
            title,
            body,
            data
          });
          
          // Simulate API call to push service
          const pushResult = {
            platform: device.platform,
            token: device.token,
            success: Math.random() > 0.1, // 90% success rate
            timestamp: new Date().toISOString()
          };
          
          results.push(pushResult);
        } catch (error) {
          console.error(`Error sending to ${device.platform}:`, error);
          results.push({
            platform: device.platform,
            token: device.token,
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    // Update notification status
    const successfulSends = results.filter(r => r.success).length;
    const { error: updateError } = await supabase
      .from('user_notifications')
      .update({
        sent: successfulSends > 0,
        sent_at: successfulSends > 0 ? new Date().toISOString() : null,
        delivery_status: {
          total_devices: deviceTokens?.length || 0,
          successful_sends: successfulSends,
          failed_sends: results.length - successfulSends,
          results: results
        }
      })
      .eq('id', notification.id);

    if (updateError) {
      console.error('Error updating notification status:', updateError);
    }

    // Log analytics
    await supabase
      .from('notification_analytics')
      .insert([{
        notification_id: notification.id,
        user_id,
        type,
        priority,
        devices_targeted: deviceTokens?.length || 0,
        devices_reached: successfulSends,
        sent_at: new Date().toISOString()
      }]);

    return new Response(
      JSON.stringify({
        success: true,
        notification_id: notification.id,
        devices_targeted: deviceTokens?.length || 0,
        devices_reached: successfulSends,
        results: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in mobile-notifications function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to send mobile notification'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});