import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { withErrorHandler, ValidationError } from '../_shared/error-handler.ts'
import { parseJsonValidated, z } from '../_shared/validators.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const B2B_API_BASE = 'https://b2bsportswholesale.net/api/'
const SUPPLIER_NAME = 'B2B Sports Wholesale'

interface B2BProduct {
  id: string
  sku: string
  name: string
  description?: string
  price: number
  stock: number
  category?: string
  brand?: string
  images?: string[]
  weight?: number
  ean?: string
}

const BodySchema = z.object({
  action: z.enum(['sync', 'test']).optional().default('sync'),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(250).optional().default(50),
})

async function fetchB2BProducts(userKey: string, authKey: string, page = 1, limit = 100): Promise<any> {
  const url = `${B2B_API_BASE}products?page=${page}&limit=${limit}`

  console.log(`Fetching B2B Sports products from: ${url}`)

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Key': userKey,
      'X-Auth-Key': authKey,
      'Authorization': `Bearer ${authKey}`,
    },
  })

  if (!response.ok) {
    const altResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'UID': userKey,
        'UAC': authKey,
      },
    })

    if (!altResponse.ok) {
      const errorText = await altResponse.text()
      console.error('B2B API Error:', errorText)
      throw new Error(`B2B API error: ${altResponse.status} - ${errorText}`)
    }

    return await altResponse.json()
  }

  return await response.json()
}

serve(
  withErrorHandler(async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const userKey = Deno.env.get('B2B_SPORTS_USER_KEY')
    const authKey = Deno.env.get('B2B_SPORTS_AUTH_KEY')

    if (!userKey || !authKey) {
      throw new ValidationError('Identifiants B2B Sports non configurés. Veuillez ajouter B2B_SPORTS_USER_KEY et B2B_SPORTS_AUTH_KEY dans les secrets.')
    }

    const { action, limit } = await parseJsonValidated(req, BodySchema)

    console.log(`B2B Sports Import - Action: ${action}`)

    if (action === 'test') {
      try {
        const testResult = await fetchB2BProducts(userKey, authKey, 1, 1)
        return new Response(
          JSON.stringify({ success: true, message: 'API connection successful', sample: testResult }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `API connection failed: ${error.message}`,
            hint: 'Vérifiez vos identifiants B2B Sports dans les secrets du projet'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Sync products to shared catalog
    let allProducts: B2BProduct[] = []
    let currentPage = 1
    let hasMore = true
    const maxPages = 10

    while (hasMore && currentPage <= maxPages) {
      console.log(`Fetching page ${currentPage}...`)

      try {
        const result = await fetchB2BProducts(userKey, authKey, currentPage, limit)
        const products = result.products || result.data || result.items || []

        if (Array.isArray(products) && products.length > 0) {
          allProducts = [...allProducts, ...products]
          currentPage++
          const totalPages = result.total_pages || result.pages || Math.ceil((result.total || 0) / limit)
          hasMore = currentPage <= totalPages
        } else {
          hasMore = false
        }
      } catch (error) {
        console.error(`Error fetching page ${currentPage}:`, error)
        hasMore = false
      }
    }

    console.log(`Total products fetched from API: ${allProducts.length}`)

    // If no products from API, return error - NO DEMO DATA IN PRODUCTION
    if (allProducts.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Aucun produit récupéré depuis l\'API B2B Sports',
          hint: 'Vérifiez que votre compte B2B Sports a accès au catalogue et que les identifiants sont corrects'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get supplier ID from premium_suppliers
    const { data: supplier, error: supplierError } = await supabase
      .from('premium_suppliers')
      .select('id')
      .eq('slug', 'b2b-sports-wholesale')
      .maybeSingle()

    if (supplierError) throw supplierError

    // Transform and insert into shared catalog
    const catalogProducts = allProducts.map((product: any) => ({
      supplier_id: supplier?.id || null,
      supplier_name: SUPPLIER_NAME,
      external_product_id: String(product.id),
      sku: product.sku || product.reference || `B2B-${product.id}`,
      title: product.name || product.title || 'Product',
      description: product.description || product.short_description || '',
      price: parseFloat(product.price || product.retail_price || '0'),
      cost_price: parseFloat(product.wholesale_price || product.cost || product.price || '0') * 0.7,
      compare_at_price: product.compare_at_price ? parseFloat(product.compare_at_price) : null,
      currency: 'EUR',
      stock_quantity: parseInt(product.stock || product.quantity || '0'),
      category: product.category || product.category_name || 'Sports',
      brand: product.brand || product.manufacturer || null,
      image_url:
        Array.isArray(product.images) && product.images.length > 0
          ? product.images[0]
          : (product.image || null),
      images: product.images || [],
      weight: product.weight ? parseFloat(product.weight) : null,
      weight_unit: 'kg',
      barcode: product.ean || product.barcode || null,
      source_url: `https://b2bsportswholesale.net/product/${product.id}`,
      is_active: true,
      last_synced_at: new Date().toISOString(),
    }))

    // Upsert products in batches
    const batchSize = 50
    let insertedCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (let i = 0; i < catalogProducts.length; i += batchSize) {
      const batch = catalogProducts.slice(i, i + batchSize)

      const { error } = await supabase
        .from('supplier_catalog')
        .upsert(batch, {
          onConflict: 'supplier_name,external_product_id',
          ignoreDuplicates: false,
        })

      if (error) {
        console.error('Batch upsert error:', error)
        errorCount += batch.length
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
      } else {
        insertedCount += batch.length
      }
    }

    console.log(`Catalog sync complete: ${insertedCount} products synced, ${errorCount} errors`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `${insertedCount} produits synchronisés dans le catalogue`,
        synced: insertedCount,
        errors: errorCount,
        error_details: errors.length > 0 ? errors : undefined,
        total_fetched: allProducts.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }, corsHeaders)
)
