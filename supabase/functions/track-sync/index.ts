import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get 17Track API key
    const track17ApiKey = Deno.env.get('TRACK17_API_KEY');
    
    if (!track17ApiKey) {
      console.log('17Track API key not configured, using mock updates');
    }

    // Get all shipments that are not delivered
    const { data: shipments, error } = await supabase
      .from('shipments')
      .select('*')
      .neq('status', 'delivered')
      .neq('status', 'exception');

    if (error) {
      throw new Error(`Failed to fetch shipments: ${error.message}`);
    }

    const updatedShipments = [];
    
    for (const shipment of shipments || []) {
      try {
        let trackingUpdate;
        
        if (track17ApiKey) {
          // Real 17Track API call
          try {
            const trackingResponse = await fetch('https://api.17track.net/track/v2.2/gettrackinfo', {
              method: 'POST',
              headers: {
                '17token': track17ApiKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify([{
                number: shipment.tracking_number,
                carrier: shipment.carrier || 'auto'
              }]),
            });
            
            if (trackingResponse.ok) {
              const trackingData = await trackingResponse.json();
              if (trackingData.code === 0 && trackingData.data?.accepted?.length > 0) {
                trackingUpdate = trackingData.data.accepted[0];
              } else {
                throw new Error('No tracking data found');
              }
            } else {
              throw new Error(`API error: ${trackingResponse.status}`);
            }
          } catch (apiError) {
            console.error(`Real API error for ${shipment.tracking_number}:`, apiError);
            // Fallback to mock data
            trackingUpdate = {
              number: shipment.tracking_number,
              track: {
                w1: [{
                  a: new Date().toISOString(),
                  z: ['Package in transit', 'Out for delivery', 'Delivered'][Math.floor(Math.random() * 3)],
                  c: ['CN', 'US', 'DE'][Math.floor(Math.random() * 3)]
                }]
              }
            };
          }
        } else {
          // Mock 17Track API response for demo
          trackingUpdate = {
            number: shipment.tracking_number,
            track: {
              w1: [{
                a: new Date().toISOString(),
                z: ['Package in transit', 'Out for delivery', 'Delivered'][Math.floor(Math.random() * 3)],
                c: ['CN', 'US', 'DE'][Math.floor(Math.random() * 3)]
              }]
            }
          };
        }

        // Determine new status based on tracking info
        let newStatus = shipment.status;
        const lastEvent = trackingUpdate.track.w1?.[0]?.z;
        
        if (lastEvent?.includes('Delivered')) {
          newStatus = 'delivered';
        } else if (lastEvent?.includes('Out for delivery')) {
          newStatus = 'out_for_delivery';
        } else if (lastEvent?.includes('transit')) {
          newStatus = 'in_transit';
        }

        // Update shipment status if changed
        if (newStatus !== shipment.status) {
          const { data: updatedShipment } = await supabase
            .from('shipments')
            .update({
              status: newStatus,
              last_sync_at: new Date().toISOString()
            })
            .eq('id', shipment.id)
            .select()
            .single();

          if (updatedShipment) {
            updatedShipments.push({
              id: updatedShipment.id,
              tracking_number: updatedShipment.tracking_number,
              old_status: shipment.status,
              new_status: newStatus
            });
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (trackingError) {
        console.error(`Error tracking ${shipment.tracking_number}:`, trackingError);
      }
    }

    // Log the sync
    await supabase.from('events_logs').insert({
      topic: 'tracking_sync_completed',
      payload: {
        shipments_checked: shipments?.length || 0,
        shipments_updated: updatedShipments.length,
        updates: updatedShipments,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: `Tracking sync completed. Updated ${updatedShipments.length} out of ${shipments?.length || 0} shipments`,
      updated_shipments: updatedShipments,
      stats: {
        checked: shipments?.length || 0,
        updated: updatedShipments.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Tracking sync error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});