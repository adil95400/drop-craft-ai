import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) throw new Error('Unauthorized');

    const { action, ...params } = await req.json();
    console.log('📦 Tracking auto-sync action:', action);

    switch (action) {
      case 'sync_all': {
        // Get all orders with tracking numbers that need update
        const { data: trackingUpdates } = await supabaseClient
          .from('tracking_auto_updates')
          .select('*, order:orders(*)')
          .eq('user_id', user.id)
          .eq('auto_sync_enabled', true);

        let synced = 0;
        for (const track of trackingUpdates || []) {
          // Simulate tracking API call
          const newEvent = {
            timestamp: new Date().toISOString(),
            status: 'In Transit',
            location: 'Distribution Center',
            description: 'Package scanned at distribution center'
          };

          const updatedEvents = [...(track.tracking_events as any || []), newEvent];

          await supabaseClient
            .from('tracking_auto_updates')
            .update({
              tracking_events: updatedEvents,
              current_status: 'in_transit',
              last_synced_at: new Date().toISOString()
            })
            .eq('id', track.id);

          synced++;
        }

        return new Response(
          JSON.stringify({ success: true, synced, message: `${synced} tracking numbers synced` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'enable_auto_tracking': {
        const { order_id, tracking_number, carrier } = params;
        
        await supabaseClient
          .from('tracking_auto_updates')
          .insert({
            user_id: user.id,
            order_id,
            tracking_number,
            carrier,
            auto_sync_enabled: true,
            sync_frequency_minutes: 60,
            notification_events: ['shipped', 'out_for_delivery', 'delivered']
          });

        return new Response(
          JSON.stringify({ success: true, message: 'Auto-tracking enabled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('❌ Tracking auto-sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
