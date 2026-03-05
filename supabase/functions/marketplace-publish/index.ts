import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) throw new Error('Unauthorized')

    const { productId, storeIds, publishOptions = {} } = await req.json()

    if (!productId || !storeIds?.length) {
      throw new Error('productId and storeIds are required')
    }

    console.log(`[marketplace-publish] User ${user.id} publishing product ${productId} to stores:`, storeIds)

    // 1. Fetch the product from `products` table
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single()

    if (productError || !product) {
      throw new Error(`Product not found: ${productError?.message || 'unknown'}`)
    }

    // 2. Fetch the target stores from both `stores` and `integrations` tables
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .in('id', storeIds)

    // Also check integrations table (for Shopify, etc.)
    const { data: integrationStores, error: intStoresError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .in('id', storeIds)

    // Merge both sources into a unified list
    const allStores: any[] = [
      ...(stores || []).map((s: any) => ({ ...s, _source: 'stores' })),
      ...(integrationStores || []).map((i: any) => ({
        id: i.id,
        name: i.platform_name || i.platform,
        platform: i.platform,
        store_url: i.store_url,
        user_id: i.user_id,
        _source: 'integrations',
      })),
    ]

    if (!allStores.length) {
      throw new Error(`No stores found: ${storesError?.message || intStoresError?.message || 'no matching stores'}`)
    }

    // 3. Fetch store_integrations for credentials (for stores-based entries)
    const storeOnlyIds = allStores.filter((s: any) => s._source === 'stores').map((s: any) => s.id)
    const integrationMap = new Map()
    if (storeOnlyIds.length > 0) {
      const { data: storeIntegrations } = await supabase
        .from('store_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .in('id', storeOnlyIds)

      for (const integ of (storeIntegrations || [])) {
        integrationMap.set(integ.id, integ)
      }
    }

    const results: Array<{
      storeId: string
      storeName: string
      platform: string
      success: boolean
      message: string
      externalProductId?: string
    }> = []

    // 4. Publish to each store
    for (const store of stores) {
      try {
        console.log(`[marketplace-publish] Publishing to store ${store.name} (${store.platform})`)

        const integration = integrationMap.get(store.id)

        // Build the product payload for the platform
        const productPayload = {
          title: product.name,
          description: product.description || '',
          price: publishOptions.overridePrice || product.price || 0,
          sku: product.sku || '',
          stock_quantity: product.stock_quantity || 0,
          images: product.image_urls || (product.image_url ? [product.image_url] : []),
          category: product.category || '',
          brand: product.brand || '',
          tags: product.tags || [],
        }

        let externalProductId: string | null = null

        // Route to platform-specific edge function if integration has credentials
        if (store.platform === 'woocommerce' && integration) {
          try {
            const { data: wooResult, error: wooError } = await supabase.functions.invoke('woocommerce-product-create', {
              body: {
                product: productPayload,
                storeId: store.id
              },
              headers: { Authorization: `Bearer ${token}` }
            })
            if (wooError) throw wooError
            externalProductId = wooResult?.productId?.toString() || null
          } catch (e) {
            console.warn(`WooCommerce API call failed, recording link anyway:`, e.message)
          }
        }
        // Add more platform handlers here (shopify, amazon, etc.) as needed

        // 5. Upsert product_store_links
        const { error: linkError } = await supabase
          .from('product_store_links')
          .upsert({
            product_id: productId,
            store_id: store.id,
            published: true,
            sync_status: externalProductId ? 'synced' : 'pending',
            external_product_id: externalProductId,
            last_sync_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'product_id,store_id'
          })

        if (linkError) {
          console.error(`Error upserting product_store_links:`, linkError)
        }

        // 6. Update product status to active
        await supabase
          .from('products')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', productId)

        // 7. Log activity
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'publish_product',
          entity_type: 'product',
          entity_id: productId,
          description: `Published "${product.name}" to ${store.name} (${store.platform})`,
          details: { store_id: store.id, platform: store.platform, external_product_id: externalProductId }
        })

        results.push({
          storeId: store.id,
          storeName: store.name,
          platform: store.platform,
          success: true,
          message: externalProductId
            ? `Published with external ID: ${externalProductId}`
            : 'Published (link recorded, awaiting sync)',
          externalProductId: externalProductId || undefined,
        })

      } catch (error) {
        console.error(`[marketplace-publish] Error for store ${store.id}:`, error)

        // Record failed link
        await supabase
          .from('product_store_links')
          .upsert({
            product_id: productId,
            store_id: store.id,
            published: false,
            sync_status: 'error',
            last_error: error.message,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'product_id,store_id'
          })

        results.push({
          storeId: store.id,
          storeName: store.name,
          platform: store.platform,
          success: false,
          message: error.message,
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        totalStores: storeIds.length,
        successCount,
        failCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[marketplace-publish] Fatal error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
