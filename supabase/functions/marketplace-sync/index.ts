import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handlePreflight, requireAuth, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

const MARKETPLACE_APIS = {
  aliexpress: {
    sampleProducts: [
      { itemId: '1005006123456789', title: 'Smartphone Android 12 6.7" 8GB RAM 256GB', price: { min: '89.99', max: '129.99' }, originalPrice: '199.99', discount: '35%', rating: '4.5', orders: '1,234', supplier: 'Global Tech Store', shippingFrom: 'China', deliveryTime: '15-25 days' },
      { itemId: '1005006987654321', title: 'Montre Connectée Fitness Tracker IP68', price: { min: '24.99', max: '39.99' }, originalPrice: '79.99', discount: '50%', rating: '4.3', orders: '3,567', supplier: 'Smart Watch Pro', shippingFrom: 'China', deliveryTime: '10-20 days' }
    ]
  },
  amazon: {
    sampleProducts: [
      { asin: 'B0BDJ12345', title: 'Apple AirPods Pro (2nd Generation)', price: '$249.00', originalPrice: '$279.00', rating: '4.6', reviewsCount: '12,456', prime: true, category: 'Electronics > Headphones', brand: 'Apple' },
      { asin: 'B0C1H67890', title: 'Kindle Paperwhite (11th Generation)', price: '$139.99', originalPrice: '$149.99', rating: '4.7', reviewsCount: '8,923', prime: true, category: 'Electronics > E-readers', brand: 'Amazon' }
    ]
  },
  shopify: {
    sampleProducts: [
      { id: '7891234567890', title: 'Premium Organic Cotton T-Shirt', handle: 'premium-organic-cotton-tshirt', images: ['https://cdn.shopify.com/example.jpg'], price: '29.99', compareAtPrice: '39.99', vendor: 'EcoFashion Co', productType: 'Apparel', tags: ['organic', 'cotton'] }
    ]
  }
}

serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { marketplace, category, keywords, limit = 50 } = await req.json()

    let products: any[] = []
    switch (marketplace) {
      case 'aliexpress': products = generateProducts('aliexpress', category, keywords, limit); break
      case 'amazon': products = generateProducts('amazon', category, keywords, limit); break
      case 'shopify': products = generateProducts('shopify', category, keywords, limit); break
      case 'all':
        products = [
          ...generateProducts('aliexpress', category, keywords, Math.floor(limit / 3)),
          ...generateProducts('amazon', category, keywords, Math.floor(limit / 3)),
          ...generateProducts('shopify', category, keywords, Math.floor(limit / 3))
        ]; break
      default: return errorResponse('Unknown marketplace', corsHeaders)
    }

    const transformedProducts = products.map(p => transformToStandardFormat(p, marketplace === 'all' ? p.marketplace : marketplace))

    // RLS-scoped insert
    const { data: insertedProducts, error } = await supabase
      .from('catalog_products')
      .upsert(transformedProducts, { onConflict: 'external_id', ignoreDuplicates: false })
      .select()

    if (error) throw error

    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: `marketplace_sync_${marketplace}`,
      description: `Synchronized ${insertedProducts?.length || 0} products from ${marketplace}`,
      entity_type: 'marketplace_sync',
      metadata: { marketplace, category, keywords, products_synced: insertedProducts?.length || 0 }
    })

    return successResponse({
      data: {
        marketplace,
        products_synced: insertedProducts?.length || 0,
        products: insertedProducts?.slice(0, 10),
        total_available: products.length
      }
    }, corsHeaders)
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('Marketplace sync error:', error)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(error.message || 'Internal error', getSecureCorsHeaders(origin))
  }
})

function generateProducts(marketplace: string, category?: string, keywords?: string, limit = 50) {
  const base = MARKETPLACE_APIS[marketplace as keyof typeof MARKETPLACE_APIS]?.sampleProducts || []
  const products = []
  for (let i = 0; i < limit; i++) {
    const bp = base[i % base.length]
    products.push({ ...bp, marketplace, category: category || 'General', keywords: keywords?.split(',') || [] })
  }
  return products
}

function transformToStandardFormat(product: any, marketplace: string) {
  const base = {
    external_id: `${marketplace}_${product.itemId || product.asin || product.id}_${Date.now()}`,
    name: product.title,
    description: product.title,
    price: 0, cost_price: 0, original_price: 0, currency: 'EUR',
    category: product.category || 'General', brand: product.brand || product.supplier || product.vendor || '',
    sku: '', image_url: '', rating: 0, reviews_count: 0,
    stock_quantity: Math.floor(Math.random() * 100) + 10,
    availability_status: 'in_stock', tags: [marketplace],
    is_trending: Math.random() > 0.7, supplier_name: marketplace,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  }

  if (marketplace === 'aliexpress') {
    const p = parseFloat(product.price?.min || '0')
    Object.assign(base, { price: p * 1.15, cost_price: p * 0.7, sku: `ALI-${product.itemId}`, rating: parseFloat(product.rating || '0') })
  } else if (marketplace === 'amazon') {
    const p = parseFloat((product.price || '0').replace('$', ''))
    Object.assign(base, { price: p * 0.92, cost_price: p * 0.6, sku: `AMZ-${product.asin}`, rating: parseFloat(product.rating || '0') })
  } else if (marketplace === 'shopify') {
    const p = parseFloat(product.price || '0')
    Object.assign(base, { price: p, cost_price: p * 0.65, sku: `SHP-${product.id}`, rating: 4.0 + Math.random() })
  }

  return base
}
