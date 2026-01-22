import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ImportProductRequest {
  product: {
    external_id?: string
    title: string
    description?: string
    descriptionHtml?: string
    price: number
    salePrice?: number
    costPrice?: number
    compareAtPrice?: number
    currency?: string
    sku?: string
    vendor?: string
    brand?: string
    productType?: string
    category?: string
    tags?: string[]
    images?: string[]
    videos?: { url: string; type?: string }[]
    variants?: {
      id?: string
      sku?: string
      title?: string
      price?: number
      compareAtPrice?: number
      available?: boolean
      option1?: string
      option2?: string
      option3?: string
      image?: string
      inventory_quantity?: number
    }[]
    options?: { name: string; values: string[] }[]
    available?: boolean
    url: string
    platform: string
    source?: string
    metadata?: Record<string, unknown>
    // Sync tracking
    stockStatus?: string
    stockQuantity?: number
    inStock?: boolean
    shippingInfo?: Record<string, unknown>
    specifications?: Record<string, unknown>
  }
  options?: {
    targetStore?: string
    status?: 'draft' | 'active' | 'archived'
    applyRules?: boolean
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Validate token
    const token = req.headers.get('x-extension-token')?.replace(/[^a-zA-Z0-9-_]/g, '')

    if (!token || token.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token d\'extension requis' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify token
    const { data: authData, error: tokenError } = await supabase
      .from('extension_auth_tokens')
      .select('id, user_id, expires_at')
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (tokenError || !authData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token invalide ou expiré' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check expiration
    if (authData.expires_at && new Date(authData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token expiré' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = authData.user_id

    // Parse request
    const { product, options }: ImportProductRequest = await req.json()

    if (!product || !product.title) {
      return new Response(
        JSON.stringify({ success: false, error: 'Données produit manquantes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[extension-import-product] Importing:', {
      title: product.title.substring(0, 50),
      platform: product.platform,
      price: product.price,
      variants: product.variants?.length || 0
    })

    // Get user's import rules if applyRules is true
    let importRules = null
    if (options?.applyRules) {
      const { data: rules } = await supabase
        .from('user_settings')
        .select('import_rules')
        .eq('user_id', userId)
        .single()

      importRules = rules?.import_rules
    }

    // Apply pricing rules
    let finalPrice = product.salePrice || product.price
    let costPrice = product.costPrice || product.price

    if (importRules?.pricing?.enabled) {
      const markup = importRules.pricing.markupValue || 30
      if (importRules.pricing.markupType === 'percentage') {
        finalPrice = costPrice * (1 + markup / 100)
      } else {
        finalPrice = costPrice + markup
      }

      // Round to nearest
      if (importRules.pricing.roundToNearest) {
        const nearest = importRules.pricing.roundToNearest
        finalPrice = Math.ceil(finalPrice) - (1 - nearest)
      }
    }

    // Clean and validate images
    const cleanImages = (product.images || [])
      .filter(img => img && typeof img === 'string' && img.length > 20)
      .map(img => img.replace(/_\d+x\d*\./, '.').replace(/\?.*$/, ''))
      .slice(0, 20)

    // Process variants
    const variants = (product.variants || []).map(v => ({
      id: v.id,
      sku: v.sku || '',
      title: v.title || 'Default',
      price: v.price || finalPrice,
      compare_at_price: v.compareAtPrice,
      available: v.available !== false,
      option1: v.option1,
      option2: v.option2,
      option3: v.option3,
      image: v.image,
      inventory_quantity: v.inventory_quantity
    }))

    // Create product source record for sync tracking
    const { data: sourceRecord, error: sourceError } = await supabase
      .from('product_sources')
      .insert({
        user_id: userId,
        source_platform: product.platform,
        external_product_id: product.external_id || `ext_${Date.now()}`,
        source_url: product.url,
        source_data: {
          vendor: product.vendor,
          brand: product.brand,
          original_price: product.price,
          specifications: product.specifications,
          shipping_info: product.shippingInfo
        },
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced'
      })
      .select()
      .single()

    if (sourceError) {
      console.error('[extension-import-product] Source record error:', sourceError)
    }

    // Insert into imported_products
    const { data: importedProduct, error: productError } = await supabase
      .from('imported_products')
      .insert({
        user_id: userId,
        name: product.title.substring(0, 500),
        description: (product.description || '').substring(0, 10000),
        price: finalPrice,
        cost_price: costPrice,
        currency: product.currency || importRules?.currency || 'EUR',
        sku: product.sku || product.variants?.[0]?.sku || '',
        category: product.category || importRules?.defaultCategory || null,
        image_urls: cleanImages,
        video_urls: (product.videos || []).map(v => v.url).filter(Boolean),
        source_url: product.url,
        source_platform: product.platform,
        status: options?.status || importRules?.defaultStatus || 'draft',
        sync_status: 'synced',
        stock_quantity: product.stockQuantity || 100,
        brand: product.brand || product.vendor || null,
        variants: variants.length > 0 ? variants : null,
        specifications: product.specifications || null,
        shipping_info: product.shippingInfo || null,
        metadata: {
          external_id: product.external_id,
          source_id: sourceRecord?.id,
          original_price: product.price,
          compare_at_price: product.compareAtPrice,
          product_type: product.productType,
          tags: [...(product.tags || []), ...(importRules?.defaultTags || [])],
          options: product.options,
          vendor: product.vendor,
          stock_status: product.stockStatus,
          in_stock: product.inStock,
          imported_at: new Date().toISOString(),
          target_store: options?.targetStore,
          rules_applied: !!importRules
        }
      })
      .select()
      .single()

    if (productError) {
      console.error('[extension-import-product] Product insert error:', productError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erreur base de données: ${productError.message}`,
          code: productError.code
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update product source with product ID
    if (sourceRecord?.id) {
      await supabase
        .from('product_sources')
        .update({ product_id: importedProduct.id })
        .eq('id', sourceRecord.id)
    }

    // Log activity
    await supabase.from('extension_analytics').insert({
      user_id: userId,
      event_type: 'product_import',
      event_data: {
        product_id: importedProduct.id,
        title: product.title.substring(0, 100),
        platform: product.platform,
        price: finalPrice,
        variants_count: variants.length,
        images_count: cleanImages.length,
        rules_applied: !!importRules
      },
      source_url: product.url
    })

    // Update token usage
    await supabase
      .from('extension_auth_tokens')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: supabase.rpc('increment', { x: 1 })
      })
      .eq('id', authData.id)

    console.log('[extension-import-product] Success:', importedProduct.id)

    return new Response(
      JSON.stringify({
        success: true,
        product: {
          id: importedProduct.id,
          name: importedProduct.name,
          price: importedProduct.price,
          status: importedProduct.status
        },
        source_id: sourceRecord?.id,
        rules_applied: !!importRules
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[extension-import-product] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
