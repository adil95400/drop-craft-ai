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

    const metadata = connection.metadata as any || {}
    const jwtToken = metadata.jwt_token
    const format = metadata.format || 'json'
    const language = metadata.language || 'en-US'

    if (!jwtToken) {
      throw new Error('JWT token not configured in connection metadata')
    }

    console.log(`📡 Fetching products from BTS Wholesaler API...`)

    // 3. Appeler l'API BTS Wholesaler
    const apiUrl = `https://www.btswholesaler.com/generatefeedbts?token=${jwtToken}&format=${format}&lang=${language}`
    
    let apiProducts = []
    try {
      const apiResponse = await fetch(apiUrl)
      
      if (!apiResponse.ok) {
        throw new Error(`API returned ${apiResponse.status}: ${apiResponse.statusText}`)
      }

      const apiData = await apiResponse.json()
      apiProducts = Array.isArray(apiData) ? apiData : apiData.products || []
      
      console.log(`✅ Fetched ${apiProducts.length} products from API`)
    } catch (apiError) {
      console.error('API fetch error:', apiError)
      throw new Error(`Failed to fetch from BTS Wholesaler: ${apiError.message}`)
    }

    // 4. Importer les produits dans la table imported_products
    let importedCount = 0
    if (apiProducts.length > 0) {
      const productsToImport = apiProducts.slice(0, 100).map((product: any) => ({
        user_id: userId,
        name: product.name || product.title || 'Unnamed Product',
        description: product.description || '',
        price: parseFloat(product.price) || 0,
        cost_price: parseFloat(product.cost_price || product.wholesale_price) || 0,
        sku: product.sku || product.id || `BTS-${Date.now()}`,
        category: product.category || 'General',
        stock_quantity: parseInt(product.stock || product.quantity) || 0,
        status: 'active' as const,
        supplier: supplier.name,
        supplier_id: supplierId,
        image_url: product.image_url || product.image || product.images?.[0] || null,
        tags: ['premium', 'BTS Wholesaler', product.category].filter(Boolean),
        profit_margin: product.price && product.cost_price 
          ? Math.round(((parseFloat(product.price) - parseFloat(product.cost_price)) / parseFloat(product.cost_price)) * 100)
          : 0
      }))

      const { data: imported, error: importError } = await supabase
        .from('imported_products')
        .insert(productsToImport)
        .select()

      if (importError) {
        console.error('Import error:', importError)
        throw new Error(`Failed to import products: ${importError.message}`)
      }

      importedCount = imported?.length || 0
      console.log(`✅ Imported ${importedCount} products`)
    }

    // 5. Mettre à jour le statut de la connexion
    await supabase
      .from('premium_supplier_connections')
      .update({
        status: 'active',
        last_sync_at: new Date().toISOString()
      })
      .eq('id', connection.id)

    // 6. Créer un log de synchronisation
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
          initial_import: true,
          products_available: apiProducts.length,
          products_imported: importedCount
        },
        completed_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully connected to premium supplier',
        data: {
          connection_id: connection.id,
          supplier_name: supplier.name,
          products_imported: importedCount,
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
