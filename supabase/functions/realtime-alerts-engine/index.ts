import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface AlertConfig {
  id: string
  user_id: string
  alert_type: string
  is_enabled: boolean
  threshold_value?: number
  threshold_percent?: number
  channels: string[]
  priority: number
  conditions?: Record<string, any>
}

interface Alert {
  type: 'stock_low' | 'stock_out' | 'price_change' | 'delivery_delay' | 'negative_margin' | 'winning_product' | 'supplier_issue'
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  data: Record<string, any>
  product_id?: string
  order_id?: string
  supplier_id?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { action, userId, ...params } = await req.json()

    console.log(`Realtime Alerts Engine - Action: ${action}`, { userId })

    switch (action) {
      case 'check_all_alerts':
        return await checkAllAlerts(supabase, userId)
      
      case 'check_stock_alerts':
        return await checkStockAlerts(supabase, userId, params.threshold || 10)
      
      case 'check_price_alerts':
        return await checkPriceAlerts(supabase, userId, params.threshold_percent || 5)
      
      case 'check_margin_alerts':
        return await checkMarginAlerts(supabase, userId, params.min_margin || 0)
      
      case 'check_delivery_alerts':
        return await checkDeliveryAlerts(supabase, userId, params.delay_days || 3)
      
      case 'detect_winning_products':
        return await detectWinningProducts(supabase, userId)
      
      case 'get_alert_configs':
        return await getAlertConfigs(supabase, userId)
      
      case 'update_alert_config':
        return await updateAlertConfig(supabase, userId, params.config)
      
      case 'create_alert_config':
        return await createAlertConfig(supabase, userId, params.config)
      
      case 'get_active_alerts':
        return await getActiveAlerts(supabase, userId, params.limit || 50)
      
      case 'dismiss_alert':
        return await dismissAlert(supabase, params.alertId)
      
      case 'dismiss_all_alerts':
        return await dismissAllAlerts(supabase, userId, params.type)

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Realtime Alerts Engine error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function checkAllAlerts(supabase: any, userId: string) {
  console.log('Running full alert check for user:', userId)
  
  const results = {
    stock: await runStockCheck(supabase, userId),
    price: await runPriceCheck(supabase, userId),
    margin: await runMarginCheck(supabase, userId),
    delivery: await runDeliveryCheck(supabase, userId),
    winning: await runWinningCheck(supabase, userId),
  }

  const totalAlerts = Object.values(results).reduce((sum: number, r: any) => sum + (r.alertsCreated || 0), 0)

  return new Response(
    JSON.stringify({
      success: true,
      summary: {
        totalAlertsCreated: totalAlerts,
        stockAlerts: results.stock.alertsCreated,
        priceAlerts: results.price.alertsCreated,
        marginAlerts: results.margin.alertsCreated,
        deliveryAlerts: results.delivery.alertsCreated,
        winningProducts: results.winning.detected,
      },
      details: results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function runStockCheck(supabase: any, userId: string, threshold: number = 10) {
  // Get user's alert config for stock
  const { data: config } = await supabase
    .from('alert_configurations')
    .select('*')
    .eq('user_id', userId)
    .eq('alert_type', 'stock_low')
    .single()

  const stockThreshold = config?.threshold_value || threshold

  // Find products with low stock
  const { data: lowStockProducts } = await supabase
    .from('products')
    .select('id, title, sku, stock_quantity, supplier_id')
    .eq('user_id', userId)
    .lte('stock_quantity', stockThreshold)
    .gt('stock_quantity', 0)

  // Find out of stock products
  const { data: outOfStockProducts } = await supabase
    .from('products')
    .select('id, title, sku, stock_quantity, supplier_id')
    .eq('user_id', userId)
    .eq('stock_quantity', 0)

  let alertsCreated = 0

  // Create alerts for out of stock (critical)
  for (const product of outOfStockProducts || []) {
    await createAlert(supabase, userId, {
      type: 'stock_out',
      severity: 'critical',
      title: `Rupture de stock: ${product.title}`,
      message: `Le produit ${product.sku || product.title} est en rupture de stock (0 unités)`,
      data: { productId: product.id, sku: product.sku, currentStock: 0 },
      product_id: product.id,
      supplier_id: product.supplier_id
    })
    alertsCreated++
  }

  // Create alerts for low stock (warning)
  for (const product of lowStockProducts || []) {
    await createAlert(supabase, userId, {
      type: 'stock_low',
      severity: 'warning',
      title: `Stock bas: ${product.title}`,
      message: `Le produit ${product.sku || product.title} n'a plus que ${product.stock_quantity} unités`,
      data: { productId: product.id, sku: product.sku, currentStock: product.stock_quantity, threshold: stockThreshold },
      product_id: product.id,
      supplier_id: product.supplier_id
    })
    alertsCreated++
  }

  return {
    alertsCreated,
    outOfStock: outOfStockProducts?.length || 0,
    lowStock: lowStockProducts?.length || 0
  }
}

async function runPriceCheck(supabase: any, userId: string, thresholdPercent: number = 5) {
  // Get products with recent price changes from suppliers
  const { data: priceChanges } = await supabase
    .from('supplier_product_mappings')
    .select(`
      id,
      product_id,
      supplier_id,
      supplier_sku,
      last_sync_data,
      products!inner(id, title, sku, cost_price, price, user_id)
    `)
    .eq('products.user_id', userId)
    .not('last_sync_data', 'is', null)

  let alertsCreated = 0

  for (const mapping of priceChanges || []) {
    const syncData = mapping.last_sync_data
    if (!syncData?.previous_price || !syncData?.current_price) continue

    const priceChange = ((syncData.current_price - syncData.previous_price) / syncData.previous_price) * 100

    if (Math.abs(priceChange) >= thresholdPercent) {
      const severity = priceChange > 10 ? 'critical' : 'warning'
      const direction = priceChange > 0 ? 'augmenté' : 'diminué'

      await createAlert(supabase, userId, {
        type: 'price_change',
        severity,
        title: `Prix fournisseur ${direction}: ${mapping.products.title}`,
        message: `Le prix fournisseur a ${direction} de ${Math.abs(priceChange).toFixed(1)}% (${syncData.previous_price}€ → ${syncData.current_price}€)`,
        data: {
          productId: mapping.product_id,
          previousPrice: syncData.previous_price,
          currentPrice: syncData.current_price,
          changePercent: priceChange,
          supplierId: mapping.supplier_id
        },
        product_id: mapping.product_id,
        supplier_id: mapping.supplier_id
      })
      alertsCreated++
    }
  }

  return { alertsCreated, priceChangesDetected: priceChanges?.length || 0 }
}

async function runMarginCheck(supabase: any, userId: string, minMargin: number = 0) {
  // Find products with negative or very low margins
  const { data: products } = await supabase
    .from('products')
    .select('id, title, sku, price, cost_price, supplier_id')
    .eq('user_id', userId)
    .not('price', 'is', null)
    .not('cost_price', 'is', null)

  let alertsCreated = 0
  const negativeMarginProducts = []

  for (const product of products || []) {
    if (!product.price || !product.cost_price) continue

    const margin = ((product.price - product.cost_price) / product.price) * 100

    if (margin <= minMargin) {
      negativeMarginProducts.push({
        ...product,
        margin
      })

      await createAlert(supabase, userId, {
        type: 'negative_margin',
        severity: margin < 0 ? 'critical' : 'warning',
        title: `Marge ${margin < 0 ? 'négative' : 'nulle'}: ${product.title}`,
        message: `Le produit ${product.sku || product.title} a une marge de ${margin.toFixed(1)}% (Prix: ${product.price}€, Coût: ${product.cost_price}€)`,
        data: {
          productId: product.id,
          price: product.price,
          costPrice: product.cost_price,
          margin,
          sku: product.sku
        },
        product_id: product.id,
        supplier_id: product.supplier_id
      })
      alertsCreated++
    }
  }

  return { alertsCreated, negativeMarginProducts: negativeMarginProducts.length }
}

async function runDeliveryCheck(supabase: any, userId: string, delayDays: number = 3) {
  // Find orders with delayed delivery
  const delayThreshold = new Date()
  delayThreshold.setDate(delayThreshold.getDate() - delayDays)

  const { data: delayedOrders } = await supabase
    .from('orders')
    .select('id, order_number, status, delivery_status, created_at, estimated_delivery, customer_name, customer_email')
    .eq('user_id', userId)
    .in('status', ['processing', 'shipped', 'in_transit'])
    .lt('estimated_delivery', delayThreshold.toISOString())

  let alertsCreated = 0

  for (const order of delayedOrders || []) {
    const estimatedDate = new Date(order.estimated_delivery)
    const daysLate = Math.ceil((Date.now() - estimatedDate.getTime()) / (1000 * 60 * 60 * 24))

    await createAlert(supabase, userId, {
      type: 'delivery_delay',
      severity: daysLate > 7 ? 'critical' : 'warning',
      title: `Retard livraison: Commande ${order.order_number}`,
      message: `La commande ${order.order_number} pour ${order.customer_name} a ${daysLate} jours de retard`,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        estimatedDelivery: order.estimated_delivery,
        daysLate,
        currentStatus: order.delivery_status
      },
      order_id: order.id
    })
    alertsCreated++
  }

  return { alertsCreated, delayedOrders: delayedOrders?.length || 0 }
}

async function runWinningCheck(supabase: any, userId: string) {
  // Detect potential winning products based on recent performance
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: orderItems } = await supabase
    .from('order_items')
    .select(`
      product_id,
      quantity,
      total,
      orders!inner(user_id, created_at)
    `)
    .eq('orders.user_id', userId)
    .gte('orders.created_at', thirtyDaysAgo.toISOString())

  // Aggregate sales by product
  const productSales: Record<string, { quantity: number; revenue: number }> = {}
  
  for (const item of orderItems || []) {
    if (!item.product_id) continue
    if (!productSales[item.product_id]) {
      productSales[item.product_id] = { quantity: 0, revenue: 0 }
    }
    productSales[item.product_id].quantity += item.quantity || 1
    productSales[item.product_id].revenue += item.total || 0
  }

  // Find top performers
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10)

  let detected = 0

  for (const [productId, stats] of topProducts) {
    if (stats.quantity >= 10 || stats.revenue >= 500) {
      const { data: product } = await supabase
        .from('products')
        .select('id, title, sku')
        .eq('id', productId)
        .single()

      if (product) {
        await createAlert(supabase, userId, {
          type: 'winning_product',
          severity: 'info',
          title: `🏆 Produit gagnant détecté: ${product.title}`,
          message: `${product.sku || product.title} a généré ${stats.revenue.toFixed(2)}€ avec ${stats.quantity} ventes ce mois`,
          data: {
            productId,
            sku: product.sku,
            sales: stats.quantity,
            revenue: stats.revenue,
            period: '30_days'
          },
          product_id: productId
        })
        detected++
      }
    }
  }

  return { detected, topProducts: topProducts.length }
}

async function createAlert(supabase: any, userId: string, alert: Alert) {
  // Check if similar alert exists recently (avoid duplicates)
  const oneHourAgo = new Date()
  oneHourAgo.setHours(oneHourAgo.getHours() - 1)

  const { data: existing } = await supabase
    .from('active_alerts')
    .select('id')
    .eq('user_id', userId)
    .eq('alert_type', alert.type)
    .eq('metadata->productId', alert.data?.productId || null)
    .eq('metadata->orderId', alert.data?.orderId || null)
    .gte('created_at', oneHourAgo.toISOString())
    .limit(1)

  if (existing && existing.length > 0) {
    console.log(`Alert already exists for ${alert.type}, skipping`)
    return null
  }

  const { data: newAlert, error } = await supabase
    .from('active_alerts')
    .insert({
      user_id: userId,
      alert_type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      metadata: {
        ...alert.data,
        productId: alert.product_id,
        orderId: alert.order_id,
        supplierId: alert.supplier_id
      },
      status: 'active',
      acknowledged: false
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating alert:', error)
    return null
  }

  // Send notification through notification system
  await supabase.functions.invoke('send-notification', {
    body: {
      userId,
      title: alert.title,
      message: alert.message,
      type: alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info',
      category: 'alert',
      priority: alert.severity === 'critical' ? 9 : alert.severity === 'warning' ? 6 : 3,
      data: alert.data
    }
  })

  console.log(`Alert created: ${alert.type} - ${alert.title}`)
  return newAlert
}

async function checkStockAlerts(supabase: any, userId: string, threshold: number) {
  const result = await runStockCheck(supabase, userId, threshold)
  return new Response(
    JSON.stringify({ success: true, ...result }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function checkPriceAlerts(supabase: any, userId: string, thresholdPercent: number) {
  const result = await runPriceCheck(supabase, userId, thresholdPercent)
  return new Response(
    JSON.stringify({ success: true, ...result }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function checkMarginAlerts(supabase: any, userId: string, minMargin: number) {
  const result = await runMarginCheck(supabase, userId, minMargin)
  return new Response(
    JSON.stringify({ success: true, ...result }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function checkDeliveryAlerts(supabase: any, userId: string, delayDays: number) {
  const result = await runDeliveryCheck(supabase, userId, delayDays)
  return new Response(
    JSON.stringify({ success: true, ...result }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function detectWinningProducts(supabase: any, userId: string) {
  const result = await runWinningCheck(supabase, userId)
  return new Response(
    JSON.stringify({ success: true, ...result }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getAlertConfigs(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('alert_configurations')
    .select('*')
    .eq('user_id', userId)
    .order('alert_type')

  if (error) throw error

  // Return defaults if none exist
  if (!data || data.length === 0) {
    const defaults = [
      { alert_type: 'stock_low', is_enabled: true, threshold_value: 10, channels: ['push', 'email'], priority: 7 },
      { alert_type: 'stock_out', is_enabled: true, threshold_value: 0, channels: ['push', 'email'], priority: 9 },
      { alert_type: 'price_change', is_enabled: true, threshold_percent: 5, channels: ['push'], priority: 6 },
      { alert_type: 'negative_margin', is_enabled: true, threshold_value: 0, channels: ['push', 'email'], priority: 8 },
      { alert_type: 'delivery_delay', is_enabled: true, threshold_value: 3, channels: ['push', 'email'], priority: 7 },
      { alert_type: 'winning_product', is_enabled: true, threshold_value: 10, channels: ['push'], priority: 4 },
    ]

    return new Response(
      JSON.stringify({ success: true, configs: defaults, isDefault: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, configs: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateAlertConfig(supabase: any, userId: string, config: Partial<AlertConfig>) {
  const { data, error } = await supabase
    .from('alert_configurations')
    .update({
      is_enabled: config.is_enabled,
      threshold_value: config.threshold_value,
      threshold_percent: config.threshold_percent,
      channels: config.channels,
      priority: config.priority,
      conditions: config.conditions,
      updated_at: new Date().toISOString()
    })
    .eq('id', config.id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true, config: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createAlertConfig(supabase: any, userId: string, config: Partial<AlertConfig>) {
  const { data, error } = await supabase
    .from('alert_configurations')
    .insert({
      user_id: userId,
      alert_type: config.alert_type,
      is_enabled: config.is_enabled ?? true,
      threshold_value: config.threshold_value,
      threshold_percent: config.threshold_percent,
      channels: config.channels || ['push'],
      priority: config.priority || 5,
      conditions: config.conditions
    })
    .select()
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true, config: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getActiveAlerts(supabase: any, userId: string, limit: number) {
  const { data, error } = await supabase
    .from('active_alerts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true, alerts: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function dismissAlert(supabase: any, alertId: string) {
  const { error } = await supabase
    .from('active_alerts')
    .update({
      status: 'dismissed',
      acknowledged: true,
      acknowledged_at: new Date().toISOString()
    })
    .eq('id', alertId)

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function dismissAllAlerts(supabase: any, userId: string, type?: string) {
  let query = supabase
    .from('active_alerts')
    .update({
      status: 'dismissed',
      acknowledged: true,
      acknowledged_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('status', 'active')

  if (type) {
    query = query.eq('alert_type', type)
  }

  const { error } = await query

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
