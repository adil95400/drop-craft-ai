import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { requireAuth, handlePreflight, errorResponse } from '../_shared/jwt-auth.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

// Input validation schemas
const ActionSchema = z.enum(['check_prices', 'create_monitor', 'get_monitors', 'delete_monitor'])

const CreateMonitorSchema = z.object({
  productId: z.string().uuid(),
  supplierUrl: z.string().url().optional(),
  checkFrequency: z.number().int().min(15).max(1440).default(60),
  alertThreshold: z.number().min(0.1).max(100).default(5.0),
  alertOnIncrease: z.boolean().default(true),
  alertOnDecrease: z.boolean().default(true),
})

serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    // 3. Parse input
    const body = await req.json()
    const { action, monitoringId } = body

    const actionResult = ActionSchema.safeParse(action)
    if (!actionResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid action',
          valid_actions: ['check_prices', 'create_monitor', 'get_monitors', 'delete_monitor']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'check_prices') {
      // Get only user's monitors - SCOPED by user_id
      let query = supabase
        .from('price_monitoring')
        .select('*')
        .eq('user_id', userId) // CRITICAL: scope to user
        .eq('is_active', true)

      if (monitoringId) {
        query = query.eq('id', monitoringId)
      } else {
        query = query.or(`last_checked_at.is.null,last_checked_at.lt.${new Date(Date.now() - 60 * 60 * 1000).toISOString()}`)
      }

      const { data: monitors, error: fetchError } = await query.limit(50)

      if (fetchError) throw fetchError

      console.log(`[SECURE] Checking prices for ${monitors?.length || 0} products for user ${userId}`)

      const results = []
      for (const monitor of monitors || []) {
        try {
          // Simulate price scraping (in production, use real scraper)
          const newPrice = monitor.current_price * (0.95 + Math.random() * 0.1)
          const priceChange = newPrice - monitor.current_price
          const changePercentage = monitor.current_price > 0 
            ? (priceChange / monitor.current_price) * 100 
            : 0

          // Update monitoring - SCOPED by user_id
          await supabase
            .from('price_monitoring')
            .update({
              previous_price: monitor.current_price,
              current_price: newPrice,
              price_change_percentage: changePercentage,
              last_checked_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', monitor.id)
            .eq('user_id', userId) // CRITICAL: scope to user

          // Record history if significant change
          if (Math.abs(changePercentage) >= monitor.alert_threshold_percentage) {
            await supabase
              .from('price_history')
              .insert({
                monitoring_id: monitor.id,
                product_id: monitor.product_id,
                old_price: monitor.current_price,
                new_price: newPrice,
                price_change: priceChange,
                change_percentage: changePercentage
              })

            // Create alert if needed
            if (
              (changePercentage > 0 && monitor.alert_on_increase) ||
              (changePercentage < 0 && monitor.alert_on_decrease)
            ) {
              await supabase
                .from('activity_logs')
                .insert({
                  user_id: userId, // CRITICAL: from token only
                  action: 'price_alert',
                  entity_type: 'price_monitoring',
                  entity_id: monitor.id,
                  description: `Prix ${changePercentage > 0 ? 'augmenté' : 'diminué'} de ${Math.abs(changePercentage).toFixed(2)}%`,
                  metadata: {
                    old_price: monitor.current_price,
                    new_price: newPrice,
                    change: priceChange,
                    percentage: changePercentage
                  }
                })
            }
          }

          results.push({
            id: monitor.id,
            success: true,
            old_price: monitor.current_price,
            new_price: newPrice,
            change_percentage: changePercentage
          })
        } catch (error) {
          console.error(`Error checking price for monitor ${monitor.id}:`, error)
          results.push({
            id: monitor.id,
            success: false,
            error: error.message
          })
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          checked: results.length,
          results
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    if (action === 'create_monitor') {
      const parseResult = CreateMonitorSchema.safeParse(body)
      if (!parseResult.success) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid monitor data', details: parseResult.error.flatten() }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { productId, supplierUrl, checkFrequency, alertThreshold, alertOnIncrease, alertOnDecrease } = parseResult.data

      // Verify product belongs to user - SECURITY CHECK
      const { data: product, error: productError } = await supabase
        .from('imported_products')
        .select('id, price')
        .eq('id', productId)
        .eq('user_id', userId) // CRITICAL: verify ownership
        .single()

      if (productError || !product) {
        return new Response(
          JSON.stringify({ success: false, error: 'Product not found or unauthorized' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase
        .from('price_monitoring')
        .insert({
          user_id: userId, // CRITICAL: from token only
          product_id: productId,
          supplier_url: supplierUrl,
          current_price: product.price || 0,
          check_frequency_minutes: checkFrequency,
          alert_threshold_percentage: alertThreshold,
          alert_on_increase: alertOnIncrease,
          alert_on_decrease: alertOnDecrease
        })
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, monitor: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    if (action === 'get_monitors') {
      // SECURE: scope to user_id
      const { data: monitors, error } = await supabase
        .from('price_monitoring')
        .select('*, product:imported_products(name, sku, image_url)')
        .eq('user_id', userId) // CRITICAL: scope to user
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, monitors }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    if (action === 'delete_monitor') {
      if (!monitoringId) {
        return new Response(
          JSON.stringify({ success: false, error: 'monitoringId required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // SECURE: scope delete to user_id
      const { error } = await supabase
        .from('price_monitoring')
        .delete()
        .eq('id', monitoringId)
        .eq('user_id', userId) // CRITICAL: scope to user

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Price monitor error:', error)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
