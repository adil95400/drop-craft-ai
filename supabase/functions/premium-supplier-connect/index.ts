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

    // 2. Créer ou mettre à jour la connexion
    const { data: connection, error: connectionError } = await supabase
      .from('premium_supplier_connections')
      .upsert({
        user_id: userId,
        supplier_id: supplierId,
        status: 'active', // En production, serait 'pending' avec validation
        approved_at: new Date().toISOString(),
        connection_config: {
          auto_sync: true,
          sync_frequency: 'daily',
          import_on_connect: true
        }
      }, {
        onConflict: 'user_id,supplier_id'
      })
      .select()
      .single()

    if (connectionError) {
      console.error('Connection error:', connectionError)
      throw connectionError
    }

    // 3. Importer les produits premium du fournisseur
    const { data: premiumProducts, error: productsError } = await supabase
      .from('premium_products')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('is_active', true)
      .limit(50)

    if (productsError) {
      console.error('Products fetch error:', productsError)
    }

    // 4. Importer les produits dans la table imported_products
    if (premiumProducts && premiumProducts.length > 0) {
      const productsToImport = premiumProducts.map(product => ({
        user_id: userId,
        name: product.name,
        description: product.description,
        price: product.price,
        cost_price: product.cost,
        sku: product.sku,
        category: product.category,
        stock_quantity: product.stock,
        status: 'active' as const,
        supplier: supplier.name,
        supplier_id: supplierId,
        image_url: product.image_url,
        tags: ['premium', supplier.country, product.category],
        profit_margin: Math.round(((product.price - product.cost) / product.cost) * 100)
      }))

      const { error: importError } = await supabase
        .from('imported_products')
        .insert(productsToImport)

      if (importError) {
        console.error('Import error:', importError)
      }
    }

    // 5. Créer un log de synchronisation
    await supabase
      .from('premium_sync_logs')
      .insert({
        connection_id: connection.id,
        user_id: userId,
        supplier_id: supplierId,
        sync_type: 'full',
        status: 'completed',
        items_synced: premiumProducts?.length || 0,
        items_failed: 0,
        sync_details: {
          initial_import: true,
          products_available: premiumProducts?.length || 0
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
          products_imported: premiumProducts?.length || 0,
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
