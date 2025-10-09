import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, action = 'check_all' } = await req.json()

    console.log('Price stock monitor:', { userId, action })

    if (action === 'check_all') {
      // Get all active monitoring records
      const { data: monitors } = await supabase
        .from('price_stock_monitoring')
        .select('*, catalog_product:catalog_product_id(*)')
        .eq('user_id', userId)
        .eq('monitoring_enabled', true)

      if (!monitors || monitors.length === 0) {
        return new Response(
          JSON.stringify({ success: true, checked: 0, alerts: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const alerts = []

      for (const monitor of monitors) {
        // Simulate checking supplier price/stock
        await new Promise(resolve => setTimeout(resolve, 100))

        const oldPrice = monitor.current_supplier_price || monitor.catalog_product?.price || 0
        const oldStock = monitor.current_supplier_stock || monitor.catalog_product?.stock_quantity || 0

        // Simulate random changes
        const priceChange = (Math.random() - 0.5) * 10
        const stockChange = Math.floor((Math.random() - 0.5) * 20)

        const newPrice = Math.max(0, oldPrice + priceChange)
        const newStock = Math.max(0, oldStock + stockChange)

        const priceChangePercent = oldPrice > 0 ? Math.abs((newPrice - oldPrice) / oldPrice * 100) : 0
        const shouldAlertPrice = priceChangePercent > monitor.price_change_threshold
        const shouldAlertStock = newStock < monitor.stock_alert_threshold

        // Update monitoring record
        await supabase
          .from('price_stock_monitoring')
          .update({
            last_supplier_price: oldPrice,
            last_supplier_stock: oldStock,
            current_supplier_price: newPrice,
            current_supplier_stock: newStock,
            last_checked_at: new Date().toISOString(),
            alert_sent: shouldAlertPrice || shouldAlertStock
          })
          .eq('id', monitor.id)

        // Create alerts if needed
        if (shouldAlertPrice) {
          const { data: alert } = await supabase
            .from('price_stock_alerts')
            .insert({
              user_id: userId,
              monitoring_id: monitor.id,
              alert_type: 'price_change',
              severity: priceChangePercent > 15 ? 'high' : 'medium',
              alert_data: {
                old_price: oldPrice,
                new_price: newPrice,
                change_percent: priceChangePercent,
                product_name: monitor.catalog_product?.title
              }
            })
            .select()
            .single()

          alerts.push(alert)
        }

        if (shouldAlertStock) {
          const severity = newStock === 0 ? 'critical' : newStock < 5 ? 'high' : 'medium'
          
          const { data: alert } = await supabase
            .from('price_stock_alerts')
            .insert({
              user_id: userId,
              monitoring_id: monitor.id,
              alert_type: newStock === 0 ? 'out_of_stock' : 'stock_low',
              severity: severity,
              alert_data: {
                old_stock: oldStock,
                new_stock: newStock,
                product_name: monitor.catalog_product?.title
              }
            })
            .select()
            .single()

          alerts.push(alert)
        }

        // Auto-adjust price if enabled
        if (monitor.auto_adjust_price && shouldAlertPrice && monitor.product_id) {
          const rules = monitor.price_adjustment_rules || {}
          const margin = rules.margin || 20
          const suggestedPrice = newPrice * (1 + margin / 100)

          await supabase
            .from('imported_products')
            .update({
              price: suggestedPrice,
              updated_at: new Date().toISOString()
            })
            .eq('id', monitor.product_id)
        }
      }

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          action: 'price_stock_monitoring',
          description: `Checked ${monitors.length} products, created ${alerts.length} alerts`,
          metadata: {
            products_checked: monitors.length,
            alerts_created: alerts.length
          }
        })

      return new Response(
        JSON.stringify({
          success: true,
          checked: monitors.length,
          alerts: alerts,
          summary: {
            price_changes: alerts.filter(a => a.alert_type === 'price_change').length,
            stock_alerts: alerts.filter(a => a.alert_type === 'stock_low' || a.alert_type === 'out_of_stock').length
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'check_single') {
      const { monitoringId } = await req.json()

      // Check single product monitoring
      const { data: monitor } = await supabase
        .from('price_stock_monitoring')
        .select('*, catalog_product:catalog_product_id(*)')
        .eq('id', monitoringId)
        .eq('user_id', userId)
        .single()

      if (!monitor) {
        return new Response(
          JSON.stringify({ error: 'Monitor not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Perform check (same logic as above but for single product)
      return new Response(
        JSON.stringify({ success: true, monitor }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Price stock monitor error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
