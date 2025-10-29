import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { action, alert_id, new_stock } = await req.json()

    if (action === 'check_stock') {
      const { data: alerts } = await supabase
        .from('stock_alerts')
        .select('*')
        .eq('alert_enabled', true)

      let notifications = 0

      for (const alert of alerts || []) {
        let stockStatus = 'in_stock'
        if (new_stock === 0) stockStatus = 'out_of_stock'
        else if (new_stock <= alert.min_stock_threshold) stockStatus = 'low_stock'

        if (stockStatus !== alert.stock_status) {
          // Status changed - send notification
          await supabase.from('extension_notifications').insert({
            user_id: alert.user_id,
            notification_type: 'stock_alert',
            title: stockStatus === 'out_of_stock' ? '❌ Out of Stock' : '⚠️ Low Stock Alert',
            message: `Stock ${stockStatus === 'out_of_stock' ? 'depleted' : `dropped to ${new_stock} units`}`,
            data: {
              product_id: alert.product_id,
              old_stock: alert.current_stock,
              new_stock: new_stock,
              status: stockStatus
            },
            priority: stockStatus === 'out_of_stock' ? 'urgent' : 'high'
          })

          notifications++
        }

        const stockHistory = [...(alert.stock_history || []), {
          stock: new_stock,
          date: new Date().toISOString()
        }]

        await supabase
          .from('stock_alerts')
          .update({
            current_stock: new_stock,
            stock_status: stockStatus,
            stock_history: stockHistory,
            last_checked_at: new Date().toISOString()
          })
          .eq('id', alert.id)
      }

      return new Response(
        JSON.stringify({ success: true, notifications_sent: notifications }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'update_stock') {
      const { data: alert } = await supabase
        .from('stock_alerts')
        .select('*')
        .eq('id', alert_id)
        .single()

      if (!alert) throw new Error('Alert not found')

      const stockHistory = [...(alert.stock_history || []), {
        stock: new_stock,
        date: new Date().toISOString()
      }]

      let stockStatus = 'in_stock'
      if (new_stock === 0) stockStatus = 'out_of_stock'
      else if (new_stock <= alert.min_stock_threshold) stockStatus = 'low_stock'

      await supabase
        .from('stock_alerts')
        .update({
          current_stock: new_stock,
          stock_status: stockStatus,
          stock_history: stockHistory,
          last_checked_at: new Date().toISOString()
        })
        .eq('id', alert_id)

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Invalid action')

  } catch (error) {
    console.error('Stock alert error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
