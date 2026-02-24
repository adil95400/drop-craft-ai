/**
 * BigBuy Integration — SECURED (JWT-first, RLS-enforced)
 */
import { requireAuth, handlePreflight, successResponse, errorResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const body = await req.json()
    const { action, api_key, ...data } = body

    const VALID_ACTIONS = ['fetch_products', 'get_products', 'get_categories', 'import_products', 'fetch_inventory', 'get_stock', 'fetch_pricing', 'create_order']
    if (!VALID_ACTIONS.includes(action)) {
      return errorResponse(`Action not supported: ${action}`, corsHeaders, 400)
    }

    const bigbuyApiKey = api_key || Deno.env.get('BIGBUY_API_KEY')
    if (!bigbuyApiKey) {
      return errorResponse('BigBuy API key not configured', corsHeaders, 400)
    }

    console.log(`[bigbuy] Action: ${action} by user ${userId}`)

    switch (action) {
      case 'fetch_products':
      case 'get_products': {
        const { limit = 100, page = 1, category_id } = data
        const params = new URLSearchParams({ page: String(page), pageSize: String(limit) })
        if (category_id) params.append('categoryId', String(category_id))

        const res = await fetch(`https://api.bigbuy.eu/rest/catalog/products.json?${params}`, {
          headers: { 'Authorization': `Bearer ${bigbuyApiKey}`, 'Content-Type': 'application/json' }
        })
        if (!res.ok) throw new Error(`BigBuy API Error: ${res.status}`)
        const products = await res.json()

        const transformed = products.map((p: any) => ({
          external_id: p.id?.toString(), sku: p.sku, title: p.name,
          price: parseFloat(p.retailPrice || 0), costPrice: parseFloat(p.wholesalePrice || 0),
          currency: 'EUR', stock: p.stock || 0,
          images: p.images?.map((img: any) => img.url) || [],
          category: p.category?.name, brand: p.brand?.name,
        }))

        return successResponse({ success: true, products: transformed, total: transformed.length, page }, corsHeaders)
      }

      case 'get_categories': {
        const res = await fetch('https://api.bigbuy.eu/rest/catalog/categories.json', {
          headers: { 'Authorization': `Bearer ${bigbuyApiKey}`, 'Content-Type': 'application/json' }
        })
        if (!res.ok) throw new Error(`BigBuy API Error: ${res.status}`)
        const categories = await res.json()
        return successResponse({ success: true, categories, total: categories.length }, corsHeaders)
      }

      case 'import_products': {
        const { products } = data
        if (!products?.length) return errorResponse('products array required', corsHeaders, 400)
        let imported = 0

        for (const product of products) {
          const { error } = await supabase.from('catalog_products').upsert({
            user_id: userId,
            external_id: product.id?.toString(),
            name: product.name,
            description: product.description,
            price: parseFloat(product.retailPrice || 0),
            cost_price: parseFloat(product.wholesalePrice || 0),
            image_url: product.images?.[0]?.url,
            supplier_id: 'bigbuy',
            supplier_name: 'BigBuy',
            stock_quantity: product.stock || 0,
            sku: product.sku,
          }, { onConflict: 'external_id,supplier_id' })
          if (!error) imported++
        }

        await supabase.from('activity_logs').insert({
          user_id: userId, action: 'bigbuy_import', entity_type: 'import',
          description: `Imported ${imported} products from BigBuy`,
        })

        return successResponse({ success: true, imported, total: products.length }, corsHeaders)
      }

      case 'fetch_inventory':
      case 'get_stock': {
        const { product_ids } = data
        if (!product_ids?.length) return errorResponse('product_ids array required', corsHeaders, 400)

        const res = await fetch('https://api.bigbuy.eu/rest/catalog/productsstocks.json', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${bigbuyApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: product_ids }),
        })
        if (!res.ok) throw new Error(`BigBuy API Error: ${res.status}`)
        const stockData = await res.json()
        const inventory = stockData.map((item: any) => ({
          product_id: item.id?.toString(), stock: item.stock || 0, available: (item.stock || 0) > 0,
        }))
        return successResponse({ success: true, inventory, total: inventory.length }, corsHeaders)
      }

      case 'fetch_pricing': {
        const { product_ids } = data
        if (!product_ids?.length) return errorResponse('product_ids array required', corsHeaders, 400)

        const results = await Promise.all(
          product_ids.slice(0, 20).map(async (pid: string) => {
            const res = await fetch(`https://api.bigbuy.eu/rest/catalog/product/${pid}.json`, {
              headers: { 'Authorization': `Bearer ${bigbuyApiKey}`, 'Content-Type': 'application/json' }
            })
            return res.ok ? await res.json() : null
          })
        )
        const pricing = results.filter(Boolean).map((p: any) => ({
          product_id: p.id?.toString(),
          retail_price: parseFloat(p.retailPrice || 0),
          wholesale_price: parseFloat(p.wholesalePrice || 0),
          currency: 'EUR',
        }))
        return successResponse({ success: true, pricing, total: pricing.length }, corsHeaders)
      }

      case 'create_order': {
        const res = await fetch('https://api.bigbuy.eu/rest/orders', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${bigbuyApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error(`BigBuy API Error: ${res.status}`)
        const order = await res.json()

        await supabase.from('activity_logs').insert({
          user_id: userId, action: 'bigbuy_order_created', entity_type: 'order',
          description: `Created BigBuy order ${order.id || 'N/A'}`,
        })
        return successResponse({ success: true, order }, corsHeaders)
      }

      default:
        return errorResponse('Unknown action', corsHeaders, 400)
    }

  } catch (err) {
    if (err instanceof Response) return err
    console.error('[bigbuy-integration] Error:', err)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})
