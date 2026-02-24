import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { requireAuth, handlePreflight, errorResponse } from '../_shared/jwt-auth.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

// Input validation schemas
const ActionSchema = z.enum(['check_stock', 'create_alert', 'get_alerts', 'delete_alert'])

const CreateAlertSchema = z.object({
  productId: z.string().uuid(),
  supplierUrl: z.string().url().optional(),
  alertThreshold: z.number().int().min(0).max(10000).default(10),
  checkFrequency: z.number().int().min(5).max(1440).default(30),
})

serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    // 3. Parse input
    const body = await req.json()
    const { action, alertId } = body

    const actionResult = ActionSchema.safeParse(action)
    if (!actionResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid action',
          valid_actions: ['check_stock', 'create_alert', 'get_alerts', 'delete_alert']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'check_stock') {
      // Get only user's alerts - SCOPED by user_id
      let query = supabase
        .from('stock_alerts')
        .select('*')
        .eq('user_id', userId) // CRITICAL: scope to user
        .eq('is_active', true)

      if (alertId) {
        query = query.eq('id', alertId)
      } else {
        query = query.or(`last_checked_at.is.null,last_checked_at.lt.${new Date(Date.now() - 30 * 60 * 1000).toISOString()}`)
      }

      const { data: alerts, error: fetchError } = await query.limit(50)

      if (fetchError) throw fetchError

      console.log(`[SECURE] Checking stock for ${alerts?.length || 0} products for user ${userId}`)

      const results = []
      for (const alert of alerts || []) {
        try {
          // Simulate stock check (in production, scrape the supplier site)
          const newStock = Math.floor(Math.random() * 100)
          let stockStatus = 'in_stock'
          
          if (newStock === 0) {
            stockStatus = 'out_of_stock'
          } else if (newStock <= alert.alert_threshold) {
            stockStatus = 'low_stock'
          }

          const stockChanged = newStock !== alert.current_stock

          // Update alert - SCOPED by user_id
          await supabase
            .from('stock_alerts')
            .update({
              previous_stock: alert.current_stock,
              current_stock: newStock,
              stock_status: stockStatus,
              last_checked_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', alert.id)
            .eq('user_id', userId) // CRITICAL: scope to user

          // Create notification if critical change
          if (stockChanged && (stockStatus === 'out_of_stock' || stockStatus === 'low_stock')) {
            await supabase
              .from('activity_logs')
              .insert({
                user_id: userId, // CRITICAL: from token only
                action: 'stock_alert',
                entity_type: 'stock_alert',
                entity_id: alert.id,
                description: `Stock ${stockStatus === 'out_of_stock' ? 'épuisé' : 'faible'}: ${newStock} unités`,
                metadata: {
                  previous_stock: alert.current_stock,
                  current_stock: newStock,
                  status: stockStatus,
                  threshold: alert.alert_threshold
                }
              })

            // Check for auto-order rules - SCOPED by user_id
            const { data: rules } = await supabase
              .from('auto_order_rules')
              .select('*')
              .eq('product_id', alert.product_id)
              .eq('user_id', userId) // CRITICAL: scope to user
              .eq('is_enabled', true)
              .single()

            if (rules && newStock <= rules.min_stock_trigger) {
              console.log(`[SECURE] Triggering auto-order for product ${alert.product_id} for user ${userId}`)
              
              // Call auto-order with user context
              await supabase.functions.invoke('auto-order-processor', {
                body: {
                  action: 'create_order',
                  ruleId: rules.id,
                  reason: 'low_stock_trigger'
                },
                headers: {
                  Authorization: req.headers.get('Authorization') || ''
                }
              })
            }
          }

          results.push({
            id: alert.id,
            success: true,
            previous_stock: alert.current_stock,
            current_stock: newStock,
            status: stockStatus,
            changed: stockChanged
          })
        } catch (error) {
          console.error(`Error checking stock for alert ${alert.id}:`, error)
          results.push({
            id: alert.id,
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

    if (action === 'create_alert') {
      const parseResult = CreateAlertSchema.safeParse(body)
      if (!parseResult.success) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid alert data', details: parseResult.error.flatten() }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { productId, supplierUrl, alertThreshold, checkFrequency } = parseResult.data

      // Verify product belongs to user - SECURITY CHECK
      const { data: product, error: productError } = await supabase
        .from('imported_products')
        .select('id')
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
        .from('stock_alerts')
        .insert({
          user_id: userId, // CRITICAL: from token only
          product_id: productId,
          supplier_url: supplierUrl,
          alert_threshold: alertThreshold,
          check_frequency_minutes: checkFrequency
        })
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, alert: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    if (action === 'get_alerts') {
      // SECURE: scope to user_id
      const { data: alerts, error } = await supabase
        .from('stock_alerts')
        .select('*, product:imported_products(name, sku, image_url)')
        .eq('user_id', userId) // CRITICAL: scope to user
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, alerts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    if (action === 'delete_alert') {
      if (!alertId) {
        return new Response(
          JSON.stringify({ success: false, error: 'alertId required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // SECURE: scope delete to user_id
      const { error } = await supabase
        .from('stock_alerts')
        .delete()
        .eq('id', alertId)
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
    console.error('Stock monitor error:', error)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
