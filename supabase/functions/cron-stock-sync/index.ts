import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : ''
  console.log(`[CRON-STOCK-SYNC] ${step}${detailsStr}`)
}

interface ProductSource {
  id: string
  product_id: string
  user_id: string
  source_platform: string
  external_product_id: string
  external_variant_id?: string
  source_url: string
  last_sync_at?: string
  sync_enabled: boolean
}

interface SyncResult {
  product_id: string
  success: boolean
  old_stock?: number
  new_stock?: number
  old_price?: number
  new_price?: number
  error?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    logStep('Cron stock sync started')

    // Get all products that need sync
    const { data: productSources, error: fetchError } = await supabaseClient
      .from('product_sources')
      .select('*')
      .eq('sync_enabled', true)
      .or('last_sync_at.is.null,last_sync_at.lt.' + new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
      .limit(50) // Process in batches

    if (fetchError) throw fetchError

    if (!productSources || productSources.length === 0) {
      logStep('No products to sync')
      return new Response(JSON.stringify({
        success: true,
        message: 'No products requiring sync',
        synced: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    logStep('Products to sync', { count: productSources.length })

    const results: SyncResult[] = []
    const syncLogs: unknown[] = []

    // Process each product
    for (const source of productSources as ProductSource[]) {
      try {
        const syncResult = await syncProductStock(supabaseClient, source)
        results.push(syncResult)

        // Create sync log
        syncLogs.push({
          user_id: source.user_id,
          product_source_id: source.id,
          product_id: source.product_id,
          sync_type: 'stock',
          status: syncResult.success ? 'success' : 'failed',
          changes: syncResult.success ? {
            stock_changed: syncResult.old_stock !== syncResult.new_stock,
            price_changed: syncResult.old_price !== syncResult.new_price,
            old_stock: syncResult.old_stock,
            new_stock: syncResult.new_stock,
            old_price: syncResult.old_price,
            new_price: syncResult.new_price
          } : null,
          error_message: syncResult.error,
          synced_at: new Date().toISOString()
        })

        // Update last sync time
        await supabaseClient
          .from('product_sources')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', source.id)

      } catch (error) {
        results.push({
          product_id: source.product_id,
          success: false,
          error: error.message
        })
      }
    }

    // Insert sync logs
    if (syncLogs.length > 0) {
      await supabaseClient
        .from('stock_sync_logs')
        .insert(syncLogs)
    }

    // Count results
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    const stockChanges = results.filter(r => r.success && r.old_stock !== r.new_stock).length

    const duration = Date.now() - startTime

    logStep('Sync completed', { 
      total: results.length,
      success: successCount,
      failed: failCount,
      stockChanges,
      duration: `${duration}ms`
    })

    // Create summary job record
    await supabaseClient
      .from('stock_sync_jobs')
      .insert({
        job_type: 'scheduled_sync',
        status: 'completed',
        total_products: productSources.length,
        synced_count: successCount,
        failed_count: failCount,
        changes_detected: stockChanges,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        metadata: { duration, results_summary: results.slice(0, 10) }
      })

    return new Response(JSON.stringify({
      success: true,
      synced: successCount,
      failed: failCount,
      stock_changes: stockChanges,
      duration: `${duration}ms`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    logStep('ERROR', { message: error.message })
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

async function syncProductStock(
  supabase: ReturnType<typeof createClient>,
  source: ProductSource
): Promise<SyncResult> {
  
  // Get current product data
  const { data: product } = await supabase
    .from('imported_products')
    .select('id, stock_quantity, price')
    .eq('id', source.product_id)
    .single()

  if (!product) {
    return { product_id: source.product_id, success: false, error: 'Product not found' }
  }

  const oldStock = product.stock_quantity || 0
  const oldPrice = product.price || 0

  // Fetch stock from source based on platform
  let newStock = oldStock
  let newPrice = oldPrice
  
  try {
    const stockData = await fetchStockFromSource(source)
    
    if (stockData) {
      newStock = stockData.stock ?? oldStock
      newPrice = stockData.price ?? oldPrice
    }
  } catch (error) {
    logStep('Failed to fetch stock from source', { 
      productId: source.product_id, 
      platform: source.source_platform,
      error: error.message 
    })
    // Continue with sync even if fetch fails - just don't update
    return { 
      product_id: source.product_id, 
      success: false, 
      error: `Failed to fetch from ${source.source_platform}: ${error.message}`
    }
  }

  // Update product if stock or price changed
  if (newStock !== oldStock || newPrice !== oldPrice) {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    
    if (newStock !== oldStock) {
      updates.stock_quantity = newStock
      
      // Auto-disable product if stock is 0
      if (newStock === 0) {
        updates.status = 'out_of_stock'
      } else if (oldStock === 0 && newStock > 0) {
        updates.status = 'active'
      }
    }
    
    if (newPrice !== oldPrice) {
      updates.supplier_price = newPrice
    }

    await supabase
      .from('imported_products')
      .update(updates)
      .eq('id', source.product_id)

    logStep('Product updated', { 
      productId: source.product_id,
      stockChange: newStock !== oldStock,
      priceChange: newPrice !== oldPrice
    })
  }

  return {
    product_id: source.product_id,
    success: true,
    old_stock: oldStock,
    new_stock: newStock,
    old_price: oldPrice,
    new_price: newPrice
  }
}

async function fetchStockFromSource(source: ProductSource): Promise<{ stock?: number, price?: number } | null> {
  const { source_platform, source_url, external_product_id } = source
  
  // Platform-specific stock fetching
  switch (source_platform) {
    case 'aliexpress':
      return fetchAliExpressStock(source_url, external_product_id)
    
    case 'amazon':
      return fetchAmazonStock(source_url, external_product_id)
    
    case 'shopify':
      return fetchShopifyStock(source_url, external_product_id)
    
    default:
      // Generic scraping fallback
      return fetchGenericStock(source_url)
  }
}

async function fetchAliExpressStock(url: string, productId: string): Promise<{ stock?: number, price?: number } | null> {
  // AliExpress API simulation - in production use real API
  // For MVP, we use page scraping approach
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) return null
    
    const html = await response.text()
    
    // Extract stock from page data
    const stockMatch = html.match(/"availQuantity":(\d+)/) || html.match(/"stock":(\d+)/)
    const priceMatch = html.match(/"formatedActivityPrice":"[^"]*?([\d.]+)"/) || 
                       html.match(/"minPrice":"([\d.]+)"/)
    
    return {
      stock: stockMatch ? parseInt(stockMatch[1]) : undefined,
      price: priceMatch ? parseFloat(priceMatch[1]) : undefined
    }
  } catch {
    return null
  }
}

async function fetchAmazonStock(url: string, productId: string): Promise<{ stock?: number, price?: number } | null> {
  // Amazon stock check - simplified
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) return null
    
    const html = await response.text()
    
    // Check availability
    const inStock = html.includes('In Stock') || html.includes('En stock')
    const outOfStock = html.includes('Currently unavailable') || html.includes('Actuellement indisponible')
    
    // Extract price
    const priceMatch = html.match(/class="a-price-whole"[^>]*>(\d+)/)
    
    return {
      stock: outOfStock ? 0 : (inStock ? 999 : undefined),
      price: priceMatch ? parseFloat(priceMatch[1]) : undefined
    }
  } catch {
    return null
  }
}

async function fetchShopifyStock(url: string, productId: string): Promise<{ stock?: number, price?: number } | null> {
  try {
    // Try Shopify JSON endpoint
    const jsonUrl = url.replace(/\.html?$/, '') + '.json'
    const response = await fetch(jsonUrl)
    
    if (response.ok) {
      const data = await response.json()
      const variant = data.product?.variants?.[0]
      
      if (variant) {
        return {
          stock: variant.inventory_quantity ?? (variant.available ? 999 : 0),
          price: parseFloat(variant.price) || undefined
        }
      }
    }
    
    return null
  } catch {
    return null
  }
}

async function fetchGenericStock(url: string): Promise<{ stock?: number, price?: number } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) return null
    
    const html = await response.text()
    
    // Generic stock detection
    const outOfStock = /out.?of.?stock|sold.?out|unavailable|épuisé|indisponible/i.test(html)
    const inStock = /in.?stock|available|en stock|disponible/i.test(html)
    
    return {
      stock: outOfStock ? 0 : (inStock ? 999 : undefined)
    }
  } catch {
    return null
  }
}
