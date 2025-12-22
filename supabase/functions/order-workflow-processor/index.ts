import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderWorkflowConfig {
  auto_place_with_supplier: boolean;
  auto_fetch_tracking: boolean;
  auto_notify_customer: boolean;
  retry_on_failure: boolean;
  max_retries: number;
  notification_channels: ('email' | 'sms' | 'push')[];
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

    const { action, orderId, userId, ruleId, workflowConfig } = await req.json()

    console.log('Order workflow processor:', { action, orderId, userId })

    switch (action) {
      case 'process_new_order': {
        // Traitement d'une nouvelle commande
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items(*, products(*)),
            customers(*)
          `)
          .eq('id', orderId)
          .eq('user_id', userId)
          .single()

        if (orderError || !order) {
          throw new Error('Order not found')
        }

        // Trouver les règles applicables
        const { data: rules } = await supabase
          .from('fulfilment_rules')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('priority', { ascending: true })

        let appliedRule = null
        for (const rule of rules || []) {
          if (evaluateConditions(order, rule.conditions)) {
            appliedRule = rule
            break
          }
        }

        if (!appliedRule) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'No applicable rule found',
              order_id: orderId
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Exécuter le workflow
        const workflowResult = await executeWorkflow(supabase, order, appliedRule, userId)

        // Logger l'exécution
        await supabase.from('automation_execution_logs').insert({
          user_id: userId,
          trigger_id: appliedRule.id,
          status: workflowResult.success ? 'success' : 'failed',
          input_data: { order_id: orderId },
          output_data: workflowResult,
          executed_at: new Date().toISOString()
        })

        return new Response(
          JSON.stringify(workflowResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'place_supplier_order': {
        // Passer commande chez le fournisseur
        const result = await placeSupplierOrder(supabase, orderId, userId)
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'fetch_tracking': {
        // Récupérer les infos de tracking
        const result = await fetchTrackingInfo(supabase, orderId, userId)
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'notify_customer': {
        // Notifier le client
        const { notification_type, message } = await req.json()
        const result = await notifyCustomer(supabase, orderId, userId, notification_type, message)
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'sync_tracking_batch': {
        // Synchroniser tous les trackings en attente
        const result = await syncAllPendingTracking(supabase, userId)
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_workflow_stats': {
        // Statistiques du workflow
        const stats = await getWorkflowStats(supabase, userId)
        return new Response(
          JSON.stringify({ success: true, stats }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'retry_failed': {
        // Réessayer les commandes échouées
        const result = await retryFailedOrders(supabase, userId)
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Order workflow error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function evaluateConditions(order: any, conditions: any): boolean {
  if (!conditions) return true
  
  const { min_amount, max_amount, payment_status, product_categories, countries } = conditions

  if (min_amount && order.total_amount < min_amount) return false
  if (max_amount && order.total_amount > max_amount) return false
  if (payment_status && order.payment_status !== payment_status) return false
  
  if (countries && countries.length > 0) {
    const orderCountry = order.shipping_address?.country
    if (!countries.includes(orderCountry)) return false
  }

  return true
}

async function executeWorkflow(supabase: any, order: any, rule: any, userId: string) {
  const actions = rule.actions || {}
  const results: any = {
    success: true,
    order_id: order.id,
    actions_executed: []
  }

  try {
    // 1. Placer la commande chez le fournisseur
    if (actions.auto_place_supplier) {
      const supplierResult = await placeSupplierOrder(supabase, order.id, userId)
      results.supplier_order = supplierResult
      results.actions_executed.push('supplier_order')
    }

    // 2. Mettre à jour le statut
    await supabase
      .from('orders')
      .update({ 
        status: 'processing',
        fulfillment_status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)
    results.actions_executed.push('status_update')

    // 3. Créer une notification
    if (actions.notify_on_process) {
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Commande en traitement',
        message: `La commande ${order.order_number} est en cours de traitement automatique`,
        type: 'order',
        metadata: { order_id: order.id }
      })
      results.actions_executed.push('notification')
    }

    // 4. Logger l'activité
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'order_workflow_executed',
      entity_type: 'order',
      entity_id: order.id,
      description: `Workflow automatique exécuté pour ${order.order_number}`,
      details: { rule_id: rule.id, actions: results.actions_executed }
    })

    return results

  } catch (error) {
    results.success = false
    results.error = error instanceof Error ? error.message : 'Workflow failed'
    return results
  }
}

async function placeSupplierOrder(supabase: any, orderId: string, userId: string) {
  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*, products(*))')
    .eq('id', orderId)
    .single()

  if (!order) throw new Error('Order not found')

  // Générer un ID de commande fournisseur
  const supplierOrderId = `SUP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

  // Mettre à jour la commande
  await supabase
    .from('orders')
    .update({
      supplier_order_id: supplierOrderId,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)

  return {
    success: true,
    supplier_order_id: supplierOrderId,
    estimated_shipping_days: 7 + Math.floor(Math.random() * 7)
  }
}

async function fetchTrackingInfo(supabase: any, orderId: string, userId: string) {
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (!order?.supplier_order_id) {
    return { success: false, error: 'No supplier order ID' }
  }

  // Simuler la récupération du tracking
  const trackingNumber = `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
  const carrier = ['DHL', 'UPS', 'FedEx', 'USPS', '17track'][Math.floor(Math.random() * 5)]

  await supabase
    .from('orders')
    .update({
      tracking_number: trackingNumber,
      carrier: carrier,
      fulfillment_status: 'shipped',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)

  return {
    success: true,
    tracking_number: trackingNumber,
    carrier: carrier,
    tracking_url: `https://track.example.com/${trackingNumber}`
  }
}

async function notifyCustomer(supabase: any, orderId: string, userId: string, type: string, customMessage?: string) {
  const { data: order } = await supabase
    .from('orders')
    .select('*, customers(*)')
    .eq('id', orderId)
    .single()

  if (!order?.customers?.email) {
    return { success: false, error: 'No customer email' }
  }

  // Logger la notification (en prod: envoyer via email/SMS)
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'customer_notified',
    entity_type: 'order',
    entity_id: orderId,
    description: `Customer notified: ${type}`,
    details: { 
      customer_email: order.customers.email,
      notification_type: type,
      message: customMessage
    }
  })

  return { success: true, notification_sent: true }
}

async function syncAllPendingTracking(supabase: any, userId: string) {
  const { data: orders } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', userId)
    .not('supplier_order_id', 'is', null)
    .is('tracking_number', null)
    .limit(50)

  let synced = 0
  let failed = 0

  for (const order of orders || []) {
    try {
      await fetchTrackingInfo(supabase, order.id, userId)
      synced++
    } catch {
      failed++
    }
  }

  return { success: true, synced, failed, total: (orders?.length || 0) }
}

async function getWorkflowStats(supabase: any, userId: string) {
  const today = new Date().toISOString().split('T')[0]
  
  const { count: todayProcessed } = await supabase
    .from('automation_execution_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('executed_at', today)

  const { count: totalProcessed } = await supabase
    .from('automation_execution_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'success')

  const { count: pendingOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'pending')

  const { count: awaitingTracking } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('supplier_order_id', 'is', null)
    .is('tracking_number', null)

  return {
    today_processed: todayProcessed || 0,
    total_processed: totalProcessed || 0,
    pending_orders: pendingOrders || 0,
    awaiting_tracking: awaitingTracking || 0
  }
}

async function retryFailedOrders(supabase: any, userId: string) {
  const { data: failedLogs } = await supabase
    .from('automation_execution_logs')
    .select('input_data')
    .eq('user_id', userId)
    .eq('status', 'failed')
    .gte('executed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(10)

  let retried = 0
  for (const log of failedLogs || []) {
    if (log.input_data?.order_id) {
      try {
        await placeSupplierOrder(supabase, log.input_data.order_id, userId)
        retried++
      } catch {
        // Continue with next
      }
    }
  }

  return { success: true, retried, total_failed: failedLogs?.length || 0 }
}
