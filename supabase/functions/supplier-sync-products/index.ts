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
    const { data: credentialData, error: credError } = await supabase
      .from('supplier_credentials_vault')
      .select('*')
      .eq('user_id', user.id)
      .eq('supplier_id', supplierId)
      .single()
    
    if (credError || !credentialData) {
      throw new Error('Supplier not connected')
    }
    
    // Extract credentials from oauth_data or direct fields
    const credentials = credentialData.oauth_data || {}
    const connectorId = credentials.connectorId || supplierId
    
    let products: any[] = []
    let syncStats = {
      fetched: 0,
      imported: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[]
    }
    
    // Fetch products based on supplier
    switch (connectorId) {
      case 'bigbuy': {
        try {
          const apiKey = credentials.apiKey || credentialData.api_key_encrypted
          const response = await fetch(`https://api.bigbuy.eu/rest/catalog/products.json?page=1&pageSize=${limit}`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
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
          const apiKey = credentials.apiKey || credentialData.api_key_encrypted
          const response = await fetch(`https://api.vidaxl.com/v1/products?limit=${limit}`, {
            headers: {
              'X-API-Key': apiKey,
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
      
      case 'btswholesaler': {
        try {
          const apiKey = credentials.apiKey || credentials.username
          
          // API v2.0: Use pagination
          const pageSize = Math.min(limit, 500)
          const params = new URLSearchParams({
            page: '1',
            page_size: pageSize.toString(),
            format_file: 'json',
            language_code: 'fr-FR'
          })

          const response = await fetch(
            `https://api.btswholesaler.com/v1/api/getListProducts?${params}`,
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
              }
            }
          )
          
          if (response.ok) {
            const data = await response.json()
            const productsData = data.products || []
            
            products = productsData.map((p: any) => ({
              supplier_id: supplierId,
              external_id: p.id.toString(),
              sku: p.ean,
              name: p.name,
              description: p.description || '',
              price: p.recommended_price || (p.price * 1.3),
              cost_price: p.price,
              currency: 'EUR',
              stock_quantity: p.stock || 0,
              images: p.image ? [p.image] : [],
              category: p.categories?.split('/')[0] || 'General',
              attributes: {
                brand: p.manufacturer_name,
                gender: p.gender,
                ean: p.ean
              },
              status: p.stock > 0 ? 'active' : 'inactive'
            }))
            syncStats.fetched = products.length
            
            console.log(`BTSWholesaler v2.0: Fetched ${syncStats.fetched} products (page 1/${data.pagination?.total_pages || 1})`)
          }
        } catch (error) {
          console.error('BTSWholesaler sync failed:', error)
          syncStats.errors.push(`BTSWholesaler: ${error.message}`)
        }
        break
      }
      
      case 'matterhorn': {
        try {
          const apiKey = credentials.apiKey || credentialData.api_key_encrypted
          
          if (!apiKey) {
            throw new Error('Missing Matterhorn API key')
          }
          
          // Pagination pour récupérer tous les produits
          let page = 1
          let hasMore = true
          const allProducts: any[] = []
          
          while (hasMore && page <= 10) { // Max 10 pages = 1000 produits
            console.log(`Matterhorn: Fetching page ${page}...`)
            
            const response = await fetch(
              `https://matterhorn-wholesale.com/B2BAPI/ITEMS/?page=${page}&limit=100`,
              {
                headers: {
                  'Authorization': apiKey,
                  'accept': 'application/json'
                }
              }
            )
            
            if (!response.ok) {
              throw new Error(`API error: ${response.status} - ${await response.text()}`)
            }
            
            const data = await response.json()
            const items = Array.isArray(data) ? data : []
            
            if (items.length === 0) {
              hasMore = false
            } else {
              allProducts.push(...items)
              page++
            }
          }
          
          // Normaliser les produits
          products = allProducts.map((p: any) => ({
            supplier_id: supplierId,
            external_id: p.id?.toString() || `MATTERHORN-${Math.random()}`,
            sku: `MATTERHORN-${p.id}`,
            name: p.name_without_number || p.name || 'Produit Matterhorn',
            description: p.description || '',
            price: p.prices?.EUR || 0,
            cost_price: (p.prices?.EUR || 0) * 0.7,
            currency: 'EUR',
            stock_quantity: parseInt(p.stock_total) || 0,
            images: Array.isArray(p.images) ? p.images : [],
            category: p.category_name || 'Uncategorized',
            attributes: {
              color: p.color,
              category_path: p.category_path,
              new_collection: p.new_collection,
              brand: p.brand,
              variants: p.variants
            },
            status: (parseInt(p.stock_total) || 0) > 0 ? 'active' : 'inactive'
          }))
          
          syncStats.fetched = products.length
          console.log(`Matterhorn: Fetched ${products.length} products`)
          
        } catch (error) {
          console.error('Matterhorn sync failed:', error)
          syncStats.errors.push(`Matterhorn: ${error.message}`)
        }
        break
      }
      
      case 'cjdropshipping': {
        try {
          const apiKey = credentials.apiKey || credentialData.api_key_encrypted
          const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/list', {
            method: 'POST',
            headers: {
              'CJ-Access-Token': apiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              pageNum: 1,
              pageSize: Math.min(limit, 100)
            })
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.code === 200 && data.data?.list) {
              products = data.data.list.map((p: any) => ({
                supplier_id: supplierId,
                external_id: p.pid,
                sku: p.productSku,
                name: p.productNameEn,
                description: p.productNameEn,
                price: p.sellPrice,
                cost_price: p.sellPrice * 0.8,
                currency: 'USD',
                stock_quantity: 999,
                images: [p.productImage],
                category: p.categoryName || 'General',
                attributes: {
                  categoryId: p.categoryId,
                  productType: p.productType
                },
                status: 'active'
              }))
              syncStats.fetched = products.length
            }
          }
        } catch (error) {
          console.error('CJ Dropshipping sync failed:', error)
          syncStats.errors.push(`CJ Dropshipping: ${error.message}`)
        }
        break
      }
      
      default: {
        throw new Error(`Supplier connector "${connectorId}" is not implemented yet. Please implement the API integration for this supplier.`)
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
      .update({ last_validation_at: new Date().toISOString() })
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
