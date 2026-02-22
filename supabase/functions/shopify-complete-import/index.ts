import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  console.log('🚀 Shopify Complete Import Function called:', req.method)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) throw new Error('Authentication failed')

    const body = await req.json()
    const { historyId, includeVariants = true, filters = {} } = body

    console.log('📦 Import config:', { historyId, includeVariants, filters })

    // Get Shopify integration - use correct column names (platform, store_url)
    const { data: integrations, error: intError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Find a Shopify integration (by platform or by store_url containing 'myshopify')
    const integration = integrations?.find(i => 
      i.platform === 'shopify' || 
      (i.store_url && i.store_url.includes('myshopify.com'))
    )

    if (intError || !integration) {
      throw new Error('No active Shopify integration found')
    }

    // Get shop domain from store_url or config
    const configData = integration.config as Record<string, any> || {}
    const credentials = configData?.credentials as Record<string, any> || {}
    const shopifyUrl = integration.store_url || credentials?.shop_domain
    if (!shopifyUrl) throw new Error('Shopify URL not configured')

    // Try access_token from config credentials, fallback to env vars
    const accessToken = credentials?.access_token || 
      Deno.env.get('SHOPIFY_ADMIN_ACCESS_TOKEN') || 
      Deno.env.get('SHOPIFY_ACCESS_TOKEN')
    if (!accessToken) throw new Error('Shopify access token not found - please configure SHOPIFY_ADMIN_ACCESS_TOKEN in secrets')

    // Fetch products from Shopify Admin API
    console.log('🛍️ Fetching products from Shopify...')
    
    let allProducts: any[] = []
    let nextPageInfo: string | null = null
    let pageCount = 0
    const maxPages = 50 // Safety limit

    do {
      const url = nextPageInfo
        ? `https://${shopifyUrl}/admin/api/2024-01/products.json?limit=250&page_info=${nextPageInfo}`
        : `https://${shopifyUrl}/admin/api/2024-01/products.json?limit=250`

      const response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Shopify API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      allProducts = allProducts.concat(data.products || [])
      
      // Check for next page
      const linkHeader = response.headers.get('Link')
      nextPageInfo = null
      if (linkHeader) {
        const nextMatch = linkHeader.match(/<[^>]*page_info=([^>&]+)[^>]*>;\s*rel="next"/)
        if (nextMatch) {
          nextPageInfo = nextMatch[1]
        }
      }

      pageCount++
      console.log(`📄 Fetched page ${pageCount}, total products: ${allProducts.length}`)

      // Update progress
      if (historyId) {
        await supabase
          .from('import_history')
          .update({
            progress: Math.min((pageCount / maxPages) * 50, 50),
            processed_records: allProducts.length
          })
          .eq('id', historyId)
      }

    } while (nextPageInfo && pageCount < maxPages)

    console.log(`✅ Total products fetched: ${allProducts.length}`)

    // Transform and insert products
    let imported = 0
    let failed = 0
    let variantsImported = 0
    const errors: any[] = []

    const batchSize = 50
    for (let i = 0; i < allProducts.length; i += batchSize) {
      const batch = allProducts.slice(i, i + batchSize)
      
      try {
        const productsToInsert: any[] = []

        for (const product of batch) {
          if (includeVariants && product.variants && product.variants.length > 1) {
            // Import each variant as a separate product
            for (const variant of product.variants) {
              productsToInsert.push({
                user_id: user.id,
                name: `${product.title} - ${variant.title}`,
                description: product.body_html || product.description,
                price: parseFloat(variant.price || '0'),
                cost_price: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
                sku: variant.sku || `SHOPIFY-${product.id}-${variant.id}`,
                category: product.product_type || 'Non catégorisé',
                brand: product.vendor || 'Unknown',
                status: product.status === 'active' ? 'published' : 'draft',
                stock_quantity: variant.inventory_quantity || 0,
                supplier_name: 'Shopify',
                image_urls: product.images?.length > 0 ? [product.images[0].src] : [],
                tags: product.tags ? product.tags.split(',').map((t: string) => t.trim()) : [],
                variant_group: product.title,
                variant_name: variant.title,
                currency: 'USD'
              })
              variantsImported++
            }
          } else {
            // Import as single product
            const mainVariant = product.variants?.[0]
            productsToInsert.push({
              user_id: user.id,
              name: product.title,
              description: product.body_html || product.description,
              price: mainVariant ? parseFloat(mainVariant.price || '0') : 0,
              cost_price: mainVariant?.compare_at_price ? parseFloat(mainVariant.compare_at_price) : null,
              sku: mainVariant?.sku || `SHOPIFY-${product.id}`,
              category: product.product_type || 'Non catégorisé',
              brand: product.vendor || 'Unknown',
              status: product.status === 'active' ? 'published' : 'draft',
              stock_quantity: mainVariant?.inventory_quantity || 0,
              supplier_name: 'Shopify',
              image_urls: product.images?.length > 0 ? [product.images[0].src] : [],
              tags: product.tags ? product.tags.split(',').map((t: string) => t.trim()) : [],
              currency: 'USD'
            })
          }
        }

        const { error: insertError } = await supabase
          .from('imported_products')
          .insert(productsToInsert)

        if (insertError) {
          console.error('❌ Insert error:', insertError)
          failed += productsToInsert.length
          errors.push({
            batch: i / batchSize,
            error: insertError.message,
            count: productsToInsert.length
          })
        } else {
          imported += productsToInsert.length
        }

      } catch (error) {
        console.error('❌ Batch processing error:', error)
        failed += batch.length
        errors.push({
          batch: i / batchSize,
          error: error instanceof Error ? error.message : 'Unknown error',
          count: batch.length
        })
      }

      // Update progress
      if (historyId) {
        const progress = 50 + Math.floor(((i + batchSize) / allProducts.length) * 50)
        await supabase
          .from('import_history')
          .update({
            progress: Math.min(progress, 100),
            successful_records: imported,
            failed_records: failed
          })
          .eq('id', historyId)
      }
    }

    console.log(`✅ Import complete: ${imported} imported, ${failed} failed, ${variantsImported} variants`)

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        failed,
        total: allProducts.length,
        variantsImported: includeVariants ? variantsImported : 0,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
