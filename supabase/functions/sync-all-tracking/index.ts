import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackingUpdate {
  orderId: string;
  trackingNumber: string;
  carrier: string;
  status: string;
  estimatedDelivery?: string;
  lastUpdate: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get orders with tracking numbers that need sync
    const { data: orders, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number, tracking_number, carrier, status, tracking_status, tracking_updated_at')
      .not('tracking_number', 'is', null)
      .in('status', ['shipped', 'in_transit', 'out_for_delivery'])
      .order('tracking_updated_at', { ascending: true, nullsFirst: true })
      .limit(100);

    if (fetchError) {
      throw new Error(`Failed to fetch orders: ${fetchError.message}`);
    }

    const results = {
      total: orders?.length || 0,
      updated: 0,
      unchanged: 0,
      errors: 0,
      delivered: 0,
      updates: [] as TrackingUpdate[],
    };

    for (const order of (orders || [])) {
      try {
        // Simulate tracking API call (replace with real carrier APIs)
        const trackingInfo = await fetchTrackingInfo(order.tracking_number, order.carrier);
        
        if (trackingInfo.status !== order.tracking_status) {
          // Update order with new tracking status
          const updateData: Record<string, unknown> = {
            tracking_status: trackingInfo.status,
            tracking_updated_at: new Date().toISOString(),
          };

          // Update order status based on tracking
          if (trackingInfo.status === 'delivered') {
            updateData.status = 'delivered';
            updateData.delivered_at = trackingInfo.deliveredAt || new Date().toISOString();
            results.delivered++;
          } else if (trackingInfo.status === 'in_transit') {
            updateData.status = 'in_transit';
          } else if (trackingInfo.status === 'out_for_delivery') {
            updateData.status = 'out_for_delivery';
          }

          if (trackingInfo.estimatedDelivery) {
            updateData.estimated_delivery = trackingInfo.estimatedDelivery;
          }

          await supabase
            .from('orders')
            .update(updateData)
            .eq('id', order.id);

          results.updated++;
          results.updates.push({
            orderId: order.id,
            trackingNumber: order.tracking_number,
            carrier: order.carrier || 'unknown',
            status: trackingInfo.status,
            estimatedDelivery: trackingInfo.estimatedDelivery,
            lastUpdate: new Date().toISOString(),
          });
        } else {
          // Just update the check timestamp
          await supabase
            .from('orders')
            .update({ tracking_updated_at: new Date().toISOString() })
            .eq('id', order.id);
          results.unchanged++;
        }
      } catch (err) {
        console.error(`Tracking sync error for order ${order.id}:`, err);
        results.errors++;
      }
    }

    // Log execution
    await supabase.from('api_logs').insert({
      endpoint: '/sync-all-tracking',
      method: 'CRON',
      status_code: 200,
      response_body: { 
        total: results.total,
        updated: results.updated,
        unchanged: results.unchanged,
        delivered: results.delivered,
        errors: results.errors
      },
    });

    return new Response(JSON.stringify({
      success: true,
      ...results,
      message: `Synced ${results.total} orders: ${results.updated} updated, ${results.delivered} delivered, ${results.unchanged} unchanged`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Sync tracking error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Simulated tracking fetch - replace with real carrier API integration
async function fetchTrackingInfo(trackingNumber: string, carrier?: string) {
  // In production, integrate with:
  // - 17Track API
  // - AfterShip API
  // - Carrier-specific APIs (UPS, FedEx, DHL, etc.)
  
  const statuses = ['in_transit', 'out_for_delivery', 'delivered', 'exception'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    status: randomStatus,
    estimatedDelivery: randomStatus !== 'delivered' 
      ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() 
      : undefined,
    deliveredAt: randomStatus === 'delivered' ? new Date().toISOString() : undefined,
    carrier: carrier || 'unknown',
    events: [
      { timestamp: new Date().toISOString(), description: 'Package status updated' }
    ]
  };
}
