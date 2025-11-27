import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { productId, userId } = await req.json()

    if (!productId || !userId) {
      throw new Error('productId and userId are required')
    }

    console.log('Comparing supplier prices for product:', productId)

    // Get product and its suppliers
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('*, supplier_ids, best_supplier_id')
      .eq('id', productId)
      .single()

    if (productError && productError.code !== 'PGRST116') {
      // Try imported_products
      const { data: importedProduct, error: importedError } = await supabaseClient
        .from('imported_products')
        .select('*, supplier_info')
        .eq('id', productId)
        .single()

      if (importedError) throw new Error('Product not found')

      // For imported products, extract supplier info
      const supplierInfo = importedProduct.supplier_info as any
      const comparison = [{
        supplierId: supplierInfo?.supplier_id || 'unknown',
        supplierName: supplierInfo?.name || 'Unknown Supplier',
        price: importedProduct.cost_price || importedProduct.price,
        stock: importedProduct.stock || 0,
        shippingTime: supplierInfo?.shipping_days || 7,
        isBestPrice: true,
        isFastest: true,
      }]

      return new Response(
        JSON.stringify({ 
          productId,
          comparisons: comparison,
          bestPrice: comparison[0],
          fastest: comparison[0]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supplierIds = product?.supplier_ids || []
    
    if (supplierIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          productId,
          comparisons: [],
          bestPrice: null,
          fastest: null,
          message: 'No suppliers found for this product'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get supplier products for all suppliers
    const { data: supplierProducts, error: suppliersError } = await supabaseClient
      .from('supplier_products')
      .select('*, supplier_id, supplier_name')
      .or(supplierIds.map(id => `supplier_id.eq.${id}`).join(','))
      .eq('external_product_id', product.sku)

    if (suppliersError) throw suppliersError

    // Build comparison data
    const comparisons = supplierProducts?.map(sp => ({
      supplierId: sp.supplier_id,
      supplierName: sp.supplier_name || sp.supplier_id,
      price: sp.price || 0,
      stock: sp.stock_quantity || 0,
      shippingTime: sp.shipping_time_days || 7,
      currency: sp.currency || 'EUR',
      lastSynced: sp.last_synced_at,
    })) || []

    // Find best price and fastest delivery
    const bestPrice = comparisons.reduce((best, current) => 
      current.price < best.price ? current : best
    , comparisons[0])

    const fastest = comparisons.reduce((fast, current) => 
      current.shippingTime < fast.shippingTime ? current : fast
    , comparisons[0])

    // Mark best options
    const enrichedComparisons = comparisons.map(c => ({
      ...c,
      isBestPrice: c.supplierId === bestPrice?.supplierId,
      isFastest: c.supplierId === fastest?.supplierId,
    }))

    console.log('Price comparison complete:', { 
      productId, 
      suppliersCompared: comparisons.length,
      bestPrice: bestPrice?.price,
      fastestDelivery: fastest?.shippingTime
    })

    return new Response(
      JSON.stringify({ 
        productId,
        comparisons: enrichedComparisons,
        bestPrice,
        fastest,
        recommendedSupplier: bestPrice?.supplierId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error comparing supplier prices:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
