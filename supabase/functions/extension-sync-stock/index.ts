import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

/**
 * Stock Sync Job - Checks and updates stock/availability from source
 * Can be triggered manually or by cron
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const body = await req.json().catch(() => ({}))
    const { action, productIds, userId: requestUserId } = body

    // For manual triggers, validate token
    let userId = requestUserId
    if (!userId) {
      const token = req.headers.get('x-extension-token')?.replace(/[^a-zA-Z0-9-_]/g, '')
      
      if (token) {
        const { data: authData } = await supabase
          .from('extension_auth_tokens')
          .select('user_id')
          .eq('token', token)
          .eq('is_active', true)
          .single()
        
        userId = authData?.user_id
      }
    }

    // If no userId, this is a cron job - process all users
    const isCronJob = !userId

    console.log('[extension-sync-stock] Starting sync', { 
      action, 
      isCronJob, 
      userId,
      productIds: productIds?.length || 'all'
    })

    // Get products to sync
    let query = supabase
      .from('product_sources')
      .select(`
        id,
        user_id,
        product_id,
        source_platform,
        external_product_id,
        source_url,
        last_synced_at,
        sync_status
      `)
      .eq('sync_status', 'synced')
      .not('source_url', 'is', null)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (productIds?.length > 0) {
      query = query.in('product_id', productIds)
    }

    // Limit to prevent overload
    query = query.limit(100)

    const { data: sources, error: sourcesError } = await query

    if (sourcesError) {
      console.error('[extension-sync-stock] Sources query error:', sourcesError)
      throw sourcesError
    }

    if (!sources || sources.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Aucun produit à synchroniser',
          synced: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[extension-sync-stock] Found ${sources.length} products to sync`)

    const results = {
      synced: 0,
      failed: 0,
      outOfStock: 0,
      priceChanged: 0,
      errors: [] as { productId: string; error: string }[]
    }

    // Process each source
    for (const source of sources) {
      try {
        // Create sync job record
        const { data: syncJob } = await supabase
          .from('stock_sync_jobs')
          .insert({
            user_id: source.user_id,
            product_id: source.product_id,
            source_id: source.id,
            status: 'pending',
            started_at: new Date().toISOString()
          })
          .select('id')
          .single()

        // Attempt to fetch current data from source
        const stockData = await fetchStockFromSource(source.source_url, source.source_platform)

        if (stockData.error) {
          // Log error but continue
          await supabase
            .from('stock_sync_jobs')
            .update({
              status: 'failed',
              error_message: stockData.error,
              completed_at: new Date().toISOString()
            })
            .eq('id', syncJob?.id)

          results.failed++
          results.errors.push({ productId: source.product_id, error: stockData.error })
          continue
        }

        // Get current product data
        const { data: currentProduct } = await supabase
          .from('imported_products')
          .select('price, stock_quantity, status')
          .eq('id', source.product_id)
          .single()

        const updates: Record<string, unknown> = {
          sync_status: 'synced',
          last_synced_at: new Date().toISOString()
        }

        // Track changes
        const changes: string[] = []

        // Update stock if changed
        if (stockData.stock !== undefined && stockData.stock !== currentProduct?.stock_quantity) {
          updates.stock_quantity = stockData.stock
          changes.push(`stock: ${currentProduct?.stock_quantity} → ${stockData.stock}`)

          // If out of stock, mark product
          if (stockData.stock === 0 || stockData.inStock === false) {
            updates.status = 'out_of_stock'
            results.outOfStock++
          }
        }

        // Optionally update source price (for monitoring)
        if (stockData.price !== undefined) {
          updates.metadata = {
            ...(currentProduct as any)?.metadata,
            source_price: stockData.price,
            last_price_check: new Date().toISOString()
          }

          if (stockData.price !== currentProduct?.price) {
            changes.push(`source_price: ${currentProduct?.price} → ${stockData.price}`)
            results.priceChanged++
          }
        }

        // Apply updates if any
        if (Object.keys(updates).length > 0) {
          await supabase
            .from('imported_products')
            .update(updates)
            .eq('id', source.product_id)
        }

        // Update source record
        await supabase
          .from('product_sources')
          .update({
            last_synced_at: new Date().toISOString(),
            sync_status: 'synced',
            source_data: {
              ...(source as any).source_data,
              last_stock: stockData.stock,
              last_price: stockData.price,
              last_availability: stockData.inStock
            }
          })
          .eq('id', source.id)

        // Log sync result
        await supabase
          .from('stock_sync_logs')
          .insert({
            user_id: source.user_id,
            product_id: source.product_id,
            source_id: source.id,
            sync_type: isCronJob ? 'cron' : 'manual',
            previous_stock: currentProduct?.stock_quantity,
            new_stock: stockData.stock,
            previous_price: currentProduct?.price,
            new_price: stockData.price,
            changes: changes.length > 0 ? changes : null,
            status: 'success'
          })

        // Complete sync job
        await supabase
          .from('stock_sync_jobs')
          .update({
            status: 'completed',
            result: { stock: stockData.stock, price: stockData.price, changes },
            completed_at: new Date().toISOString()
          })
          .eq('id', syncJob?.id)

        results.synced++

      } catch (err) {
        console.error(`[extension-sync-stock] Error syncing product ${source.product_id}:`, err)
        results.failed++
        results.errors.push({ productId: source.product_id, error: err.message })
      }
    }

    console.log('[extension-sync-stock] Sync complete:', results)

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `Synchronisation terminée: ${results.synced} produits mis à jour, ${results.failed} erreurs, ${results.outOfStock} ruptures de stock détectées`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[extension-sync-stock] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Fetch stock/availability from source URL
 * This is a simplified version - in production, would use platform-specific scrapers
 */
async function fetchStockFromSource(url: string, platform: string): Promise<{
  stock?: number
  price?: number
  inStock?: boolean
  error?: string
}> {
  try {
    // For now, use a simple fetch to check if product page is accessible
    // In production, this would use proper scraping or APIs

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ShopoptiBot/1.0)',
        'Accept': 'text/html'
      }
    })

    clearTimeout(timeout)

    if (!response.ok) {
      // If 404, product might be unavailable
      if (response.status === 404) {
        return { stock: 0, inStock: false }
      }
      return { error: `HTTP ${response.status}` }
    }

    const html = await response.text()

    // Basic availability detection from HTML
    const lowerHtml = html.toLowerCase()

    // Check for out of stock indicators
    const outOfStockPatterns = [
      'out of stock',
      'rupture de stock',
      'épuisé',
      'non disponible',
      'unavailable',
      'sold out',
      'plus disponible'
    ]

    const isOutOfStock = outOfStockPatterns.some(p => lowerHtml.includes(p))

    if (isOutOfStock) {
      return { stock: 0, inStock: false }
    }

    // Check for in stock indicators
    const inStockPatterns = [
      'in stock',
      'en stock',
      'disponible',
      'available',
      'add to cart'
    ]

    const isInStock = inStockPatterns.some(p => lowerHtml.includes(p))

    return {
      inStock: isInStock,
      stock: isInStock ? undefined : 0 // Unknown exact quantity if in stock
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      return { error: 'Timeout - source inaccessible' }
    }
    return { error: error.message }
  }
}
