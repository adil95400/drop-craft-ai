import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface BTSProduct {
  id: string
  ean: string
  categories: string
  manufacturer_name: string
  name: string
  description: string
  recommended_price: number
  price: number
  stock: number
  image: string
  leadtime_to_ship?: string
  gender?: string
  flammable?: string
}

interface SyncRequest {
  userId: string
  supplierId: string
  jwtToken: string
  format?: 'json' | 'xml' | 'csv'
  language?: 'en-US' | 'en-GB' | 'it-IT' | 'es-ES' | 'fr-FR' | 'de-DE'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { userId, supplierId, jwtToken, format = 'json', language = 'fr-FR' } = await req.json() as SyncRequest

    console.log('🔄 Starting BTSWholesaler sync...')
    console.log(`Format: ${format}, Language: ${language}`)

    // Fetch products from BTSWholesaler API
    const apiUrl = `https://api.btswholesaler.com/v1/api/getListProducts`
    
    console.log('📡 Fetching products from BTSWholesaler API...')
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`BTSWholesaler API error: ${response.status} ${response.statusText}`)
    }

    const productsData = await response.json() as BTSProduct[]
    console.log(`✅ Fetched ${productsData.length} products from BTSWholesaler`)

    // Transform BTSWholesaler products to our format
    const transformedProducts = productsData.slice(0, 500).map((product) => {
      // Calculate profit margin (30% markup by default)
      const costPrice = product.price
      const sellPrice = product.recommended_price || (costPrice * 1.3)
      const profitMargin = ((sellPrice - costPrice) / sellPrice) * 100

      return {
        supplier_id: supplierId,
        external_id: product.id,
        ean: product.ean,
        name: product.name,
        description: product.description || '',
        price: sellPrice,
        cost_price: costPrice,
        currency: 'EUR',
        stock_quantity: product.stock,
        is_active: product.stock > 0,
        images: product.image ? [product.image] : [],
        category: product.categories?.split('/')[0] || 'Général',
        brand: product.manufacturer_name,
        profit_margin: profitMargin,
        sku: product.ean,
        metadata: {
          gender: product.gender,
          flammable: product.flammable === '1',
          leadtime_to_ship: product.leadtime_to_ship,
          categories_path: product.categories
        }
      }
    })

    console.log(`🔄 Importing ${transformedProducts.length} products to database...`)

    // Insert products in batches
    const batchSize = 100
    let imported = 0
    let errors = 0

    for (let i = 0; i < transformedProducts.length; i += batchSize) {
      const batch = transformedProducts.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('premium_products')
        .upsert(batch, {
          onConflict: 'supplier_id,external_id',
          ignoreDuplicates: false
        })
        .select()

      if (error) {
        console.error(`❌ Batch ${i}-${i + batchSize} error:`, error)
        errors += batch.length
      } else {
        imported += data?.length || 0
        console.log(`✅ Imported batch ${i}-${i + batchSize}`)
      }
    }

    // Update connection status
    await supabase
      .from('premium_supplier_connections')
      .update({
        status: 'connected',
        last_sync_at: new Date().toISOString(),
        sync_stats: {
          products_synced: imported,
          errors: errors,
          last_sync: new Date().toISOString()
        }
      })
      .eq('supplier_id', supplierId)
      .eq('user_id', userId)

    // Log sync activity
    await supabase
      .from('platform_sync_logs')
      .insert({
        user_id: userId,
        platform: 'BTSWholesaler',
        sync_type: 'products',
        status: errors > 0 ? 'partial' : 'success',
        items_synced: imported,
        items_failed: errors,
        duration_ms: 5000,
        sync_details: {
          format,
          language,
          total_fetched: productsData.length,
          imported,
          errors
        },
        completed_at: new Date().toISOString()
      })

    console.log(`✅ BTSWholesaler sync completed: ${imported} products imported, ${errors} errors`)

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        errors,
        message: `Successfully imported ${imported} products from BTSWholesaler`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ BTSWholesaler sync error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Failed to sync BTSWholesaler products'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
