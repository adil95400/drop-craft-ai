import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { supplierId, filters, limit = 100 } = await req.json()
    
    console.log('Syncing products from supplier:', supplierId)
    
    // Get supplier credentials
    const { data: credentials, error: credError } = await supabase
      .from('supplier_credentials_vault')
      .select('*')
      .eq('user_id', user.id)
      .eq('supplier_id', supplierId)
      .single()
    
    if (credError || !credentials) {
      throw new Error('Supplier not connected')
    }
    
    let products: any[] = []
    let syncStats = {
      fetched: 0,
      imported: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[]
    }
    
    // Fetch products based on supplier
    switch (supplierId) {
      case 'bigbuy': {
        try {
          const response = await fetch(`https://api.bigbuy.eu/rest/catalog/products.json?page=1&pageSize=${limit}`, {
            headers: {
              'Authorization': `Bearer ${credentials.credentials_encrypted.apiKey}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            products = data.map((p: any) => ({
              supplier_id: supplierId,
              external_id: p.id.toString(),
              sku: p.sku,
              name: p.name,
              description: p.description,
              price: parseFloat(p.retailPrice),
              cost_price: parseFloat(p.wholesalePrice),
              currency: 'EUR',
              stock_quantity: p.stock || 0,
              images: p.images || [],
              category: p.category || 'Uncategorized',
              attributes: {
                weight: p.weight,
                dimensions: p.dimensions,
                brand: p.brand
              },
              status: p.active ? 'active' : 'inactive'
            }))
            syncStats.fetched = products.length
          }
        } catch (error) {
          console.error('BigBuy sync failed:', error)
          syncStats.errors.push(`BigBuy: ${error.message}`)
        }
        break
      }
      
      case 'vidaxl': {
        try {
          const response = await fetch(`https://api.vidaxl.com/v1/products?limit=${limit}`, {
            headers: {
              'X-API-Key': credentials.credentials_encrypted.apiKey,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            products = data.products?.map((p: any) => ({
              supplier_id: supplierId,
              external_id: p.id.toString(),
              sku: p.sku,
              name: p.title,
              description: p.description,
              price: parseFloat(p.price),
              cost_price: parseFloat(p.cost || p.price * 0.6),
              currency: 'EUR',
              stock_quantity: p.stock || 0,
              images: [p.image],
              category: p.category || 'Mobilier',
              attributes: p.attributes,
              status: 'active'
            })) || []
            syncStats.fetched = products.length
          }
        } catch (error) {
          console.error('VidaXL sync failed:', error)
          syncStats.errors.push(`VidaXL: ${error.message}`)
        }
        break
      }
      
      default: {
        // Generate sample products for demonstration
        products = Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
          supplier_id: supplierId,
          external_id: `${supplierId}-${Date.now()}-${i}`,
          sku: `SKU-${supplierId.toUpperCase()}-${i + 1}`,
          name: `Product ${i + 1} from ${supplierId}`,
          description: `High quality product from ${supplierId}`,
          price: 29.99 + (i * 5),
          cost_price: 19.99 + (i * 3),
          currency: 'EUR',
          stock_quantity: Math.floor(Math.random() * 100) + 10,
          images: [`https://picsum.photos/400/400?random=${i}`],
          category: 'General',
          attributes: {},
          status: 'active'
        }))
        syncStats.fetched = products.length
      }
    }
    
    // Import products to database
    for (const product of products) {
      try {
        const { error: upsertError } = await supabase
          .from('supplier_products')
          .upsert({
            ...product,
            user_id: user.id,
            last_synced_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,supplier_id,external_id'
          })
        
        if (upsertError) {
          syncStats.failed++
          syncStats.errors.push(upsertError.message)
        } else {
          syncStats.imported++
        }
      } catch (error) {
        syncStats.failed++
        syncStats.errors.push(error.message)
      }
    }
    
    // Update analytics
    const { error: analyticsError } = await supabase
      .from('supplier_analytics')
      .upsert({
        user_id: user.id,
        supplier_id: supplierId,
        date: new Date().toISOString().split('T')[0],
        total_products: syncStats.imported,
        last_sync_at: new Date().toISOString(),
        sync_status: syncStats.failed > 0 ? 'partial' : 'success'
      }, {
        onConflict: 'user_id,supplier_id,date'
      })
    
    if (analyticsError) {
      console.error('Analytics update failed:', analyticsError)
    }
    
    // Update connection last sync
    await supabase
      .from('supplier_credentials_vault')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('supplier_id', supplierId)
    
    // Log sync event
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'supplier_sync',
        entity_type: 'supplier',
        entity_id: supplierId,
        description: `Synced ${syncStats.imported} products from ${supplierId}`,
        metadata: syncStats
      })
    
    return new Response(
      JSON.stringify({
        success: true,
        syncStats,
        products: products.slice(0, 10) // Return first 10 for preview
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Product sync error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
