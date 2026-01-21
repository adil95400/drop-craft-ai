import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DelayAlert {
  orderId: string;
  orderNumber: string;
  customerId?: string;
  customerEmail?: string;
  expectedDelivery: string;
  daysLate: number;
  carrier?: string;
  trackingNumber?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    
    // Get orders that should have been delivered
    const { data: delayedOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number, customer_id, customer_email, estimated_delivery, carrier, tracking_number, status, shipped_at')
      .in('status', ['shipped', 'in_transit', 'out_for_delivery'])
      .lt('estimated_delivery', now.toISOString())
      .order('estimated_delivery', { ascending: true })
      .limit(200);

    if (fetchError) {
      throw new Error(`Failed to fetch delayed orders: ${fetchError.message}`);
    }

    const results = {
      total: delayedOrders?.length || 0,
      alerts: [] as DelayAlert[],
      criticalDelays: 0,
      moderateDelays: 0,
      minorDelays: 0,
      notificationsCreated: 0,
    };

    for (const order of (delayedOrders || [])) {
      const expectedDate = new Date(order.estimated_delivery);
      const daysLate = Math.floor((now.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const alert: DelayAlert = {
        orderId: order.id,
        orderNumber: order.order_number,
        customerId: order.customer_id,
        customerEmail: order.customer_email,
        expectedDelivery: order.estimated_delivery,
        daysLate,
        carrier: order.carrier,
        trackingNumber: order.tracking_number,
      };

      results.alerts.push(alert);

      // Categorize delay severity
      if (daysLate >= 7) {
        results.criticalDelays++;
      } else if (daysLate >= 3) {
        results.moderateDelays++;
      } else {
        results.minorDelays++;
      }

      // Create notification for delays > 2 days
      if (daysLate >= 2) {
        const severity = daysLate >= 7 ? 'critical' : daysLate >= 3 ? 'warning' : 'info';
        
        // Check if we already have an active alert for this order
        const { data: existingAlert } = await supabase
          .from('active_alerts')
          .select('id')
          .eq('alert_type', 'delivery_delay')
          .eq('metadata->orderId', order.id)
          .eq('status', 'active')
          .single();

        if (!existingAlert) {
          await supabase.from('active_alerts').insert({
            alert_type: 'delivery_delay',
            title: `Retard de livraison: Commande ${order.order_number}`,
            message: `La commande devait être livrée il y a ${daysLate} jour(s). Client: ${order.customer_email || 'N/A'}`,
            severity,
            status: 'active',
            metadata: {
              orderId: order.id,
              orderNumber: order.order_number,
              daysLate,
              expectedDelivery: order.estimated_delivery,
              carrier: order.carrier,
              trackingNumber: order.tracking_number,
            },
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          });
          results.notificationsCreated++;
        }
      }
    }

    // Update orders with delay flags
    for (const alert of results.alerts) {
      await supabase
        .from('orders')
        .update({ 
          is_delayed: true,
          delay_days: alert.daysLate,
        })
        .eq('id', alert.orderId);
    }

    // Log execution
    await supabase.from('api_logs').insert({
      endpoint: '/check-delivery-delays',
      method: 'CRON',
      status_code: 200,
      response_body: {
        total: results.total,
        critical: results.criticalDelays,
        moderate: results.moderateDelays,
        minor: results.minorDelays,
        notifications: results.notificationsCreated,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      ...results,
      message: `Found ${results.total} delayed orders: ${results.criticalDelays} critical, ${results.moderateDelays} moderate, ${results.minorDelays} minor`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Check delivery delays error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
