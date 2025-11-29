import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ConnectRequest {
  userId: string
  supplierId: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { userId, supplierId } = await req.json() as ConnectRequest

    console.log(`🔗 Connecting user ${userId} to supplier ${supplierId}`)

    // 1. Vérifier si le fournisseur existe
    const { data: supplier, error: supplierError } = await supabase
      .from('premium_suppliers')
      .select('*')
      .eq('id', supplierId)
      .single()

    if (supplierError || !supplier) {
      throw new Error('Supplier not found')
    }

    // 2. Récupérer la connexion existante avec les metadata (JWT token)
    const { data: connection, error: connectionError } = await supabase
      .from('premium_supplier_connections')
      .select('*, metadata')
      .eq('user_id', userId)
      .eq('supplier_id', supplierId)
      .single()

    if (connectionError || !connection) {
      console.error('Connection not found:', connectionError)
      throw new Error('Connection not found. Please configure the connection first.')
    }

    // 3. Récupérer les informations de connexion
    const metadata = connection.metadata as any || {}
    const jwtToken = metadata.jwt_token || metadata.api_password
    const format = metadata.format || 'json'
    const language = metadata.language || 'fr-FR'

    if (!jwtToken) {
      throw new Error('JWT Token not configured in connection metadata')
    }

    console.log(`📡 Fetching products from BTS Wholesaler API v2.0 with pagination...`)

    // 4. Appeler l'API BTS Wholesaler v2.0 avec pagination obligatoire
    let allProducts: any[] = []
    let page = 1
    let hasMore = true
    
    while (hasMore) {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '500', // Maximum autorisé par l'API v2.0
        format_file: format,
        language_code: language
      })

      const apiUrl = `https://api.btswholesaler.com/v1/api/getListProducts?${params}`
      
      try {
        const apiResponse = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Accept': 'application/json'
          }
        })
        
        if (!apiResponse.ok) {
          const errorText = await apiResponse.text()
          console.error(`API Error Response (${apiResponse.status}):`, errorText.substring(0, 500))
          throw new Error(`API returned ${apiResponse.status}: ${apiResponse.statusText}`)
        }

        const apiData = await apiResponse.json()
        const pageProducts = apiData.products || []
        allProducts.push(...pageProducts)
        
        console.log(`✅ Page ${page}/${apiData.pagination?.total_pages || page}: Fetched ${pageProducts.length} products`)
        
        // Vérifier s'il y a d'autres pages
        hasMore = apiData.pagination?.has_next_page || false
        page++
        
        // Respecter les limites de taux - pause d'1 seconde entre les pages
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (apiError) {
        console.error(`API fetch error on page ${page}:`, apiError)
        throw new Error(`Failed to fetch from BTS Wholesaler: ${apiError.message}`)
      }
    }
    
    console.log(`✅ Total fetched: ${allProducts.length} products from BTSWholesaler`)

    // 5. Importer les produits dans la table imported_products
    let importedCount = 0
    if (allProducts.length > 0) {
      // Importer par batch de 100 produits
      const batchSize = 100
      
      for (let i = 0; i < allProducts.length; i += batchSize) {
        const batch = allProducts.slice(i, i + batchSize)
        
        const productsToImport = batch.map((product: any) => ({
          user_id: userId,
          name: product.name || product.title || 'Unnamed Product',
          description: product.description || '',
          price: parseFloat(product.recommended_price || product.price) || 0,
          cost_price: parseFloat(product.price || product.wholesale_price) || 0,
          currency: 'EUR',
          sku: product.ean || product.sku || product.id || `BTS-${Date.now()}-${i}`,
          category: product.categories?.split('/')[0] || 'General',
          stock_quantity: parseInt(product.stock || product.quantity) || 0,
          status: (parseInt(product.stock) > 0 ? 'active' : 'inactive') as const,
          supplier_name: supplier.name,
          supplier_product_id: product.id || product.sku,
          image_urls: product.image ? [product.image] : (product.images || []),
          tags: ['premium', 'BTS Wholesaler', product.categories?.split('/')[0]].filter(Boolean),
          brand: product.manufacturer_name || null,
          ean: product.ean || null
        }))

        const { data: imported, error: importError } = await supabase
          .from('imported_products')
          .upsert(productsToImport, {
            onConflict: 'user_id,sku',
            ignoreDuplicates: false
          })
          .select()

        if (importError) {
          console.error(`Import error for batch ${i}-${i + batchSize}:`, importError)
        } else {
          importedCount += imported?.length || 0
          console.log(`✅ Imported batch ${i}-${i + batchSize}: ${imported?.length || 0} products`)
        }
      }
    }

    // 6. Mettre à jour le statut de la connexion
    await supabase
      .from('premium_supplier_connections')
      .update({
        status: 'active',
        last_sync_at: new Date().toISOString(),
        metadata: {
          ...metadata,
          products_imported: importedCount,
          last_product_count: allProducts.length
        }
      })
      .eq('id', connection.id)

    // 7. Créer un log de synchronisation
    await supabase
      .from('premium_sync_logs')
      .insert({
        connection_id: connection.id,
        user_id: userId,
        supplier_id: supplierId,
        sync_type: 'full',
        status: 'completed',
        items_synced: importedCount,
        items_failed: 0,
        sync_details: {
          api_version: 'v2.0',
          initial_import: true,
          products_available: allProducts.length,
          products_imported: importedCount,
          pages_fetched: page - 1,
          format,
          language
        },
        completed_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully connected to BTSWholesaler',
        data: {
          connection_id: connection.id,
          supplier_name: supplier.name,
          products_fetched: allProducts.length,
          products_imported: importedCount,
          pages_fetched: page - 1,
          status: 'active'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Connection error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
