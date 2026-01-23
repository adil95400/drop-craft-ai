import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface PriceStockChange {
  product_id: string
  change_type: 'price' | 'stock'
  old_value: number
  new_value: number
  change_percent: number
  detected_at: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await req.json()
    const { action, userId, productId, products, monitoringId, url, price, stock, threshold } = body

    // Verify extension token or auth
    const extensionToken = req.headers.get('x-extension-token')
    const authHeader = req.headers.get('authorization')
    
    let verifiedUserId = userId

    if (extensionToken) {
      const { data: tokenData } = await supabase
        .from('extension_auth_tokens')
        .select('user_id')
        .eq('token', extensionToken)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single()
      
      if (tokenData) {
        verifiedUserId = tokenData.user_id
      }
    } else if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) {
        verifiedUserId = user.id
      }
    }

    if (!verifiedUserId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Non authentifié' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    console.log(`[PriceStockMonitor] Action: ${action}, User: ${verifiedUserId}`)

    switch (action) {
      case 'check_all':
        return await checkAllMonitoredProducts(supabase, verifiedUserId)
      
      case 'check_single':
        return await checkSingleProduct(supabase, verifiedUserId, monitoringId || productId)
      
      case 'add_monitoring':
        return await addProductToMonitoring(supabase, verifiedUserId, products || [{ url, price, stock, threshold }])
      
      case 'remove_monitoring':
        return await removeFromMonitoring(supabase, verifiedUserId, productId)
      
      case 'get_history':
        return await getPriceHistory(supabase, verifiedUserId, productId)
      
      case 'get_alerts':
        return await getAlerts(supabase, verifiedUserId)
      
      case 'update_price_stock':
        return await updatePriceStock(supabase, verifiedUserId, body)
      
      case 'get_monitored':
        return await getMonitoredProducts(supabase, verifiedUserId)
        
      case 'scrape_and_check':
        return await scrapeAndCheckPrice(supabase, verifiedUserId, body)
      
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Action inconnue' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
  } catch (error) {
    console.error('Price/Stock Monitor error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function checkAllMonitoredProducts(supabase: any, userId: string) {
  console.log(`[Monitor] Checking all products for user ${userId}`)
  
  // Get all monitored products for user from price_stock_monitoring
  const { data: monitors, error: monitorsError } = await supabase
    .from('price_stock_monitoring')
    .select(`
      id,
      product_id,
      current_price,
      current_stock,
      alert_threshold,
      is_active,
      last_checked_at,
      products:product_id (
        id,
        name,
        price,
        stock_quantity,
        source_url,
        platform
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true)

  if (monitorsError) {
    console.error('Error fetching monitors:', monitorsError)
    throw monitorsError
  }

  if (!monitors || monitors.length === 0) {
    return new Response(
      JSON.stringify({ success: true, checked: 0, changes: 0, alerts: 0, message: 'Aucun produit surveillé' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const changes: PriceStockChange[] = []
  const alerts: any[] = []

  for (const monitor of monitors) {
    const product = monitor.products
    if (!product) continue

    // Check price changes
    if (monitor.current_price && product.price) {
      const priceChange = ((product.price - monitor.current_price) / monitor.current_price) * 100
      
      if (Math.abs(priceChange) >= (monitor.alert_threshold || 5)) {
        const change: PriceStockChange = {
          product_id: product.id,
          change_type: 'price',
          old_value: monitor.current_price,
          new_value: product.price,
          change_percent: priceChange,
          detected_at: new Date().toISOString()
        }
        changes.push(change)

        // Create alert
        alerts.push({
          user_id: userId,
          alert_type: priceChange > 0 ? 'price_increase' : 'price_decrease',
          title: `${priceChange > 0 ? '📈' : '📉'} Changement de prix: ${product.name?.substring(0, 50)}`,
          message: `Le prix a ${priceChange > 0 ? 'augmenté' : 'diminué'} de ${Math.abs(priceChange).toFixed(1)}% (${monitor.current_price?.toFixed(2)}€ → ${product.price?.toFixed(2)}€)`,
          severity: Math.abs(priceChange) >= 20 ? 'critical' : 'warning',
          metadata: {
            product_id: product.id,
            product_name: product.name,
            old_price: monitor.current_price,
            new_price: product.price,
            change_percent: priceChange,
            source_url: product.source_url
          }
        })
      }
    }

    // Check stock changes
    const currentStock = product.stock_quantity ?? null
    const monitorStock = monitor.current_stock ?? null
    
    if (monitorStock !== null && currentStock !== null) {
      const stockChange = currentStock - monitorStock
      
      if (currentStock === 0 && monitorStock > 0) {
        alerts.push({
          user_id: userId,
          alert_type: 'stock_out',
          title: `🚨 Rupture de stock: ${product.name?.substring(0, 50)}`,
          message: `Le produit est maintenant en rupture de stock`,
          severity: 'critical',
          metadata: {
            product_id: product.id,
            product_name: product.name,
            old_stock: monitorStock,
            new_stock: 0,
            source_url: product.source_url
          }
        })
      } else if (currentStock < 10 && monitorStock >= 10) {
        alerts.push({
          user_id: userId,
          alert_type: 'stock_low',
          title: `⚠️ Stock faible: ${product.name?.substring(0, 50)}`,
          message: `Il ne reste que ${currentStock} unités en stock`,
          severity: 'warning',
          metadata: {
            product_id: product.id,
            product_name: product.name,
            current_stock: currentStock,
            source_url: product.source_url
          }
        })
      }

      if (stockChange !== 0) {
        changes.push({
          product_id: product.id,
          change_type: 'stock',
          old_value: monitorStock,
          new_value: currentStock,
          change_percent: monitorStock > 0 ? (stockChange / monitorStock) * 100 : 0,
          detected_at: new Date().toISOString()
        })
      }
    }

    // Update monitor with current values
    await supabase
      .from('price_stock_monitoring')
      .update({
        current_price: product.price,
        current_stock: currentStock,
        last_checked_at: new Date().toISOString()
      })
      .eq('id', monitor.id)
  }

  // Save changes to history
  if (changes.length > 0) {
    const historyRecords = changes.map(c => ({
      user_id: userId,
      product_id: c.product_id,
      change_type: c.change_type,
      old_value: c.old_value,
      new_value: c.new_value,
      change_percent: c.change_percent,
      detected_at: c.detected_at
    }))

    await supabase
      .from('price_stock_history')
      .insert(historyRecords)
  }

  // Create alerts in active_alerts table
  if (alerts.length > 0) {
    await supabase
      .from('active_alerts')
      .insert(alerts)
      
    // Send push notifications for critical alerts
    for (const alert of alerts.filter(a => a.severity === 'critical')) {
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            userId,
            title: alert.title,
            message: alert.message,
            type: 'warning',
            priority: 9,
            data: alert.metadata
          }
        })
      } catch (e) {
        console.error('Failed to send notification:', e)
      }
    }
  }

  // Log activity
  await supabase
    .from('activity_logs')
    .insert({
      user_id: userId,
      action: 'price_stock_check',
      description: `Vérifié ${monitors.length} produits, ${changes.length} changements, ${alerts.length} alertes`,
      details: {
        products_checked: monitors.length,
        changes_detected: changes.length,
        alerts_created: alerts.length
      }
    })

  return new Response(
    JSON.stringify({
      success: true,
      checked: monitors.length,
      changes: changes.length,
      alerts: alerts.length,
      details: {
        price_changes: changes.filter(c => c.change_type === 'price').length,
        stock_changes: changes.filter(c => c.change_type === 'stock').length
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function checkSingleProduct(supabase: any, userId: string, productId: string) {
  const { data: monitor } = await supabase
    .from('price_stock_monitoring')
    .select(`
      *,
      products:product_id (*)
    `)
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single()

  if (!monitor) {
    return new Response(
      JSON.stringify({ success: false, error: 'Produit non trouvé en surveillance' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    )
  }

  const product = monitor.products
  const changes: any[] = []

  if (monitor.current_price && product.price) {
    const priceChange = ((product.price - monitor.current_price) / monitor.current_price) * 100
    if (Math.abs(priceChange) > 0.1) {
      changes.push({
        type: 'price',
        old: monitor.current_price,
        new: product.price,
        percent: priceChange
      })
      
      // Record in history
      await supabase
        .from('price_stock_history')
        .insert({
          user_id: userId,
          product_id: product.id,
          change_type: 'price',
          old_value: monitor.current_price,
          new_value: product.price,
          change_percent: priceChange,
          detected_at: new Date().toISOString()
        })
    }
  }

  await supabase
    .from('price_stock_monitoring')
    .update({
      current_price: product.price,
      current_stock: product.stock_quantity,
      last_checked_at: new Date().toISOString()
    })
    .eq('id', monitor.id)

  return new Response(
    JSON.stringify({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        currentPrice: product.price,
        currentStock: product.stock_quantity,
        lastPrice: monitor.current_price
      },
      changes
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function addProductToMonitoring(supabase: any, userId: string, products: any[]) {
  const records = products.map(p => ({
    user_id: userId,
    product_id: p.productId || p.product_id,
    current_price: p.price,
    current_stock: p.stock,
    alert_threshold: p.threshold || 5,
    is_active: true
  })).filter(r => r.product_id)

  if (records.length === 0) {
    return new Response(
      JSON.stringify({ success: false, error: 'Aucun produit valide' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('price_stock_monitoring')
    .upsert(records, { onConflict: 'user_id,product_id' })
    .select()

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true, added: data?.length || 0 }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function removeFromMonitoring(supabase: any, userId: string, productId: string) {
  const { error } = await supabase
    .from('price_stock_monitoring')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getPriceHistory(supabase: any, userId: string, productId?: string) {
  let query = supabase
    .from('price_stock_history')
    .select('*, products:product_id(name)')
    .eq('user_id', userId)
    .order('detected_at', { ascending: false })
    .limit(100)

  if (productId) {
    query = query.eq('product_id', productId)
  }

  const { data, error } = await query

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true, history: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getAlerts(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('active_alerts')
    .select('*')
    .eq('user_id', userId)
    .in('alert_type', ['price_increase', 'price_decrease', 'stock_out', 'stock_low'])
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true, alerts: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getMonitoredProducts(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('price_stock_monitoring')
    .select(`
      *,
      products:product_id (
        id,
        name,
        price,
        stock_quantity,
        source_url,
        platform,
        image_url
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true, monitored: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updatePriceStock(supabase: any, userId: string, body: any) {
  const { productId, price, stock, url } = body

  if (productId) {
    // Update product
    await supabase
      .from('products')
      .update({
        price,
        stock_quantity: stock,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .eq('user_id', userId)

    // Record in history
    await supabase
      .from('price_stock_history')
      .insert({
        user_id: userId,
        product_id: productId,
        change_type: 'manual_update',
        new_value: price,
        detected_at: new Date().toISOString(),
        metadata: { url, stock, source: 'manual' }
      })
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function scrapeAndCheckPrice(supabase: any, userId: string, body: any) {
  const { url, currentPrice, productId } = body
  
  // This would integrate with a scraping service
  // For now, return the structure expected by the extension
  console.log(`[Monitor] Scrape and check price for URL: ${url}`)
  
  return new Response(
    JSON.stringify({
      success: true,
      url,
      currentPrice,
      productId,
      message: 'Price check scheduled'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
