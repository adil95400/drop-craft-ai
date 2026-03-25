import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
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
        const { data: trackingUpdates } = await supabaseClient
          .from('tracking_auto_updates')
          .select('*, order:orders(*)')
          .eq('user_id', user.id)
          .eq('auto_sync_enabled', true);

        const apiKey = Deno.env.get('SEVENTEENTRACK_API_KEY');
        let synced = 0;

        for (const track of trackingUpdates || []) {
          if (!track.tracking_number) continue;

          let newEvents: any[] = [];

          if (apiKey) {
            // Real 17Track API v2.2 call
            try {
              const response = await fetch('https://api.17track.net/track/v2.2/gettrackinfo', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  '17token': apiKey,
                },
                body: JSON.stringify([{
                  number: track.tracking_number,
                  carrier: track.carrier ? parseInt(track.carrier) : undefined,
                }]),
              });

              if (response.ok) {
                const result = await response.json();
                const trackData = result?.data?.accepted?.[0];
                if (trackData?.track?.z1) {
                  newEvents = trackData.track.z1.map((evt: any) => ({
                    timestamp: evt.a,
                    status: evt.z,
                    location: evt.c || '',
                    description: evt.z,
                  }));
                }
              } else {
                console.warn(`17Track API error for ${track.tracking_number}: ${response.status}`);
              }
            } catch (apiErr) {
              console.error(`17Track API call failed for ${track.tracking_number}:`, apiErr);
            }
          } else {
            console.warn('SEVENTEENTRACK_API_KEY not configured — skipping real tracking sync');
            continue;
          }

          if (newEvents.length > 0) {
            // Determine current status from latest event
            const latestEvent = newEvents[0];
            const statusText = (latestEvent.description || '').toLowerCase();
            let currentStatus = 'in_transit';
            if (statusText.includes('delivered')) currentStatus = 'delivered';
            else if (statusText.includes('out for delivery')) currentStatus = 'out_for_delivery';
            else if (statusText.includes('picked up') || statusText.includes('accepted')) currentStatus = 'picked_up';

            await supabaseClient
              .from('tracking_auto_updates')
              .update({
                tracking_events: newEvents,
                current_status: currentStatus,
                last_synced_at: new Date().toISOString()
              })
              .eq('id', track.id);

            synced++;
          }
        }

        return new Response(
          JSON.stringify({ success: true, synced, message: `${synced} tracking numbers synced via 17Track API` }),
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
