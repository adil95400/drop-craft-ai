/**
 * Supplier Sync - Secure Implementation
 * P1.1: Uses unified wrapper with auth + validation + rate limit + secure CORS
 */

import { createEdgeFunction, z } from '../_shared/create-edge-function.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

// Input schema for supplier sync
const syncRequestSchema = z.object({
  supplierId: z.string().uuid(),
  connectorType: z.enum(['cdiscount', 'eprolo', 'vidaxl', 'syncee', 'printful', 'bigbuy', 'cjdropshipping']),
  credentials: z.object({
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    endpoint: z.string().url().optional()
  }).optional(),
  options: z.object({
    fullSync: z.boolean().optional(),
    category: z.string().max(100).optional(),
    limit: z.number().int().positive().max(500).optional()
  }).optional()
})

type SyncRequest = z.infer<typeof syncRequestSchema>

interface ProductData {
  id: string
  sku: string
  title: string
  description: string
  price: number
  costPrice: number
  currency: string
  stock: number
  images: string[]
  category?: string
  brand?: string
  weight?: number
  attributes?: Record<string, unknown>
}

const handler = createEdgeFunction<SyncRequest>({
  requireAuth: true,
  inputSchema: syncRequestSchema,
  rateLimit: { maxRequests: 10, windowMinutes: 60, action: 'supplier_sync' }
}, async (ctx) => {
  const { user, adminClient, input, correlationId } = ctx
  const { supplierId, connectorType, credentials, options } = input

  console.log(`[${correlationId}] Starting sync for supplier ${supplierId} using ${connectorType}`)

  // Create sync job record
  const { data: syncJob, error: syncJobError } = await adminClient
    .from('sync_jobs')
    .insert({
      user_id: user.id,
      supplier_id: supplierId,
      connector_type: connectorType,
      status: 'running',
      started_at: new Date().toISOString(),
      total_products: 0,
      processed_products: 0,
      successful_imports: 0,
      failed_imports: 0,
    })
    .select()
    .single()

  if (syncJobError) throw syncJobError

  let products: ProductData[] = []
  const errors: string[] = []

  try {
    // Fetch products based on connector type
    switch (connectorType) {
      case 'bigbuy':
        products = await fetchBigBuyProducts(credentials, options)
        break
      case 'cjdropshipping':
        products = await fetchCJDropshippingProducts(credentials, options)
        break
      case 'eprolo':
        products = await fetchEproloProducts(credentials, options)
        break
      case 'printful':
        products = await fetchPrintfulProducts(credentials, options)
        break
      default:
        products = await fetchFromDatabase(adminClient, user.id, supplierId, options)
    }

    console.log(`[${correlationId}] Fetched ${products.length} products from ${connectorType}`)

    // Update sync job with total
    await adminClient
      .from('sync_jobs')
      .update({ total_products: products.length })
      .eq('id', syncJob.id)

    let successCount = 0
    let failCount = 0

    // Process and import products
    for (const product of products) {
      try {
        // Deduplicate based on SKU and supplier
        const { data: existingProduct } = await adminClient
          .from('supplier_products')
          .select('id')
          .eq('user_id', user.id)
          .eq('sku', product.sku)
          .eq('supplier_id', supplierId)
          .single()

        const productData = {
          user_id: user.id,
          supplier_id: supplierId,
          title: product.title,
          sku: product.sku,
          description: product.description,
          selling_price: product.price,
          cost_price: product.costPrice,
          currency: product.currency || 'EUR',
          stock_quantity: product.stock,
          category: product.category,
          brand: product.brand,
          images: product.images,
          ean: product.attributes?.ean as string | undefined,
          weight: product.weight,
          external_id: product.id,
          updated_at: new Date().toISOString()
        }

        if (existingProduct?.id) {
          const { error } = await adminClient
            .from('supplier_products')
            .update(productData)
            .eq('id', existingProduct.id)
          
          if (error) throw error
        } else {
          const { error } = await adminClient
            .from('supplier_products')
            .insert({
              ...productData,
              created_at: new Date().toISOString()
            })
          
          if (error) throw error
        }

        successCount++
        
        // Update progress every 10 products
        if (successCount % 10 === 0) {
          await adminClient
            .from('sync_jobs')
            .update({ 
              processed_products: successCount + failCount,
              successful_imports: successCount,
              failed_imports: failCount 
            })
            .eq('id', syncJob.id)
        }

      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Failed to import product ${product.sku}:`, errMsg)
        errors.push(`${product.sku}: ${errMsg}`)
        failCount++
      }
    }

    // Complete sync job
    await adminClient
      .from('sync_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        processed_products: successCount + failCount,
        successful_imports: successCount,
        failed_imports: failCount,
        error_details: errors.length > 0 ? errors : null,
      })
      .eq('id', syncJob.id)

    // Log activity
    await adminClient.from('activity_logs').insert({
      user_id: user.id,
      action: 'supplier_sync',
      entity_type: 'supplier',
      entity_id: supplierId,
      description: `Synchronized ${successCount} products from ${connectorType}`,
      details: {
        connector_type: connectorType,
        total_products: products.length,
        successful_imports: successCount,
        failed_imports: failCount,
        sync_job_id: syncJob.id,
      },
    })

    return new Response(JSON.stringify({
      success: true,
      syncJobId: syncJob.id,
      results: {
        total: products.length,
        imported: successCount,
        failed: failCount,
        errors: errors.slice(0, 10),
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    
    await adminClient
      .from('sync_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_details: [errMsg],
      })
      .eq('id', syncJob.id)

    throw error
  }
})

// Helper functions for fetching products from various suppliers

async function fetchFromDatabase(
  supabase: SupabaseClient, 
  userId: string, 
  supplierId: string, 
  options: { limit?: number } = {}
): Promise<ProductData[]> {
  const { data: products } = await supabase
    .from('supplier_products')
    .select('*')
    .eq('user_id', userId)
    .eq('supplier_id', supplierId)
    .limit(options.limit || 100)

  return (products || []).map((p: Record<string, unknown>) => ({
    id: (p.external_id || p.id) as string,
    sku: p.sku as string,
    title: p.title as string,
    description: p.description as string,
    price: p.selling_price as number,
    costPrice: p.cost_price as number,
    currency: p.currency as string,
    stock: p.stock_quantity as number,
    images: (p.images || []) as string[],
    category: p.category as string,
    brand: p.brand as string,
    attributes: { ean: p.ean },
    weight: p.weight as number
  }))
}

async function fetchBigBuyProducts(
  credentials: { apiKey?: string } | undefined, 
  options: { limit?: number } = {}
): Promise<ProductData[]> {
  const apiKey = credentials?.apiKey || Deno.env.get('BIGBUY_API_KEY')
  
  if (!apiKey) {
    console.log('BigBuy API key not configured')
    return []
  }

  try {
    const response = await fetch('https://api.bigbuy.eu/rest/catalog/products.json', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`BigBuy API error: ${response.status}`)
      return []
    }

    const products = await response.json()
    
    return products.slice(0, options.limit || 50).map((p: Record<string, unknown>) => ({
      id: (p.id || p.sku) as string,
      sku: p.sku as string,
      title: (p.name || p.title) as string,
      description: p.description as string,
      price: parseFloat(String(p.retailPrice || p.price)) || 0,
      costPrice: parseFloat(String(p.wholesalePrice || p.cost)) || 0,
      currency: 'EUR',
      stock: parseInt(String(p.stock)) || 0,
      images: (p.images || []) as string[],
      category: p.category as string,
      brand: p.brand as string,
      weight: p.weight as number,
      attributes: { ean: p.ean }
    }))
  } catch (error) {
    console.error('BigBuy fetch error:', error)
    return []
  }
}

async function fetchCJDropshippingProducts(
  credentials: { apiKey?: string } | undefined, 
  options: { limit?: number } = {}
): Promise<ProductData[]> {
  const apiKey = credentials?.apiKey || Deno.env.get('CJ_API_KEY')
  
  if (!apiKey) {
    console.log('CJ Dropshipping API key not configured')
    return []
  }

  try {
    const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/list', {
      method: 'POST',
      headers: {
        'CJ-Access-Token': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageNum: 1,
        pageSize: options.limit || 50
      }),
    })

    if (!response.ok) {
      console.error(`CJ API error: ${response.status}`)
      return []
    }

    const data = await response.json()
    const products = data.data?.list || []
    
    return products.map((p: Record<string, unknown>) => ({
      id: p.pid as string,
      sku: (p.productSku || p.pid) as string,
      title: (p.productName || p.productNameEn) as string,
      description: p.description as string,
      price: parseFloat(String(p.sellPrice)) || 0,
      costPrice: parseFloat(String(p.sourcePrice)) || 0,
      currency: 'USD',
      stock: parseInt(String(p.stock)) || 0,
      images: p.productImage ? [p.productImage as string] : [],
      category: p.categoryName as string,
      brand: (p.brand || 'CJ') as string,
      weight: p.productWeight as number,
      attributes: {}
    }))
  } catch (error) {
    console.error('CJ Dropshipping fetch error:', error)
    return []
  }
}

async function fetchEproloProducts(
  credentials: { apiKey?: string } | undefined, 
  options: { limit?: number } = {}
): Promise<ProductData[]> {
  const apiKey = credentials?.apiKey || Deno.env.get('EPROLO_API_KEY')
  
  if (!apiKey) {
    console.log('Eprolo API key not configured')
    return []
  }

  try {
    const response = await fetch('https://api.eprolo.com/api/products/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`Eprolo API error: ${response.status}`)
      return []
    }

    const data = await response.json()
    const products = data.products || []
    
    return products.slice(0, options.limit || 50).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      sku: (p.sku || p.id) as string,
      title: p.title as string,
      description: p.description as string,
      price: parseFloat(String(p.price)) || 0,
      costPrice: parseFloat(String(p.cost)) || 0,
      currency: 'USD',
      stock: parseInt(String(p.inventory)) || 0,
      images: (p.images || []) as string[],
      category: p.category as string,
      brand: 'Eprolo',
      attributes: {}
    }))
  } catch (error) {
    console.error('Eprolo fetch error:', error)
    return []
  }
}

async function fetchPrintfulProducts(
  credentials: { apiKey?: string } | undefined, 
  options: { limit?: number } = {}
): Promise<ProductData[]> {
  const apiKey = credentials?.apiKey || Deno.env.get('PRINTFUL_API_KEY')
  
  if (!apiKey) {
    console.log('Printful API key not configured')
    return []
  }

  try {
    const response = await fetch('https://api.printful.com/store/products', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`Printful API error: ${response.status}`)
      return []
    }

    const data = await response.json()
    const products = data.result || []
    
    return products.slice(0, options.limit || 25).map((p: Record<string, unknown>) => ({
      id: String(p.id),
      sku: (p.external_id || String(p.id)) as string,
      title: p.name as string,
      description: '',
      price: 0,
      costPrice: 0,
      currency: 'EUR',
      stock: 999,
      images: p.thumbnail_url ? [p.thumbnail_url as string] : [],
      category: 'Print-on-Demand',
      brand: 'Printful',
      attributes: { printable: true }
    }))
  } catch (error) {
    console.error('Printful fetch error:', error)
    return []
  }
}

Deno.serve(handler)
