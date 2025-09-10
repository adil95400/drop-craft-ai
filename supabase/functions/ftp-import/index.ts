import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { connectorId } = await req.json()

    console.log('Starting FTP import for connector:', connectorId)

    // Get connector details
    const { data: connector, error: connectorError } = await supabaseClient
      .from('import_connectors')
      .select('*')
      .eq('id', connectorId)
      .eq('user_id', user.id)
      .single()

    if (connectorError || !connector) {
      throw new Error('Connector not found or access denied')
    }

    // Simulate FTP import
    const simulatedProducts = []
    const productCount = Math.floor(Math.random() * 20) + 10

    for (let i = 1; i <= productCount; i++) {
      simulatedProducts.push({
        name: `Produit FTP ${i}`,
        description: `Description du produit importé depuis FTP ${connector.name}`,
        price: (Math.random() * 100 + 10).toFixed(2),
        cost_price: (Math.random() * 50 + 5).toFixed(2),
        sku: `FTP-${connector.id.substring(0, 8)}-${String(i).padStart(3, '0')}`,
        category: ['Electronics', 'Clothing', 'Home', 'Sports'][Math.floor(Math.random() * 4)],
        brand: 'FTP Brand',
        stock_quantity: Math.floor(Math.random() * 100),
        external_id: `ftp_product_${i}`,
        image_url: `https://via.placeholder.com/400x400?text=FTP+Product+${i}`
      })
    }

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const product of simulatedProducts) {
      try {
        const { error } = await supabaseClient
          .from('imported_products')
          .insert({
            user_id: user.id,
            name: product.name,
            description: product.description || '',
            price: parseFloat(product.price) || 0,
            cost_price: parseFloat(product.cost_price) || 0,
            sku: product.sku || '',
            category: product.category || '',
            brand: product.brand || '',
            image_url: product.image_url || '',
            stock_quantity: parseInt(product.stock_quantity) || 0,
            status: 'draft',
            review_status: 'pending',
            source_url: connector.config?.url || 'ftp://unknown',
            external_id: product.external_id || product.sku,
            supplier_name: connector.name
          })

        if (error) {
          errorCount++
          errors.push(`Produit ${product.name}: ${error.message}`)
        } else {
          successCount++
        }
      } catch (error) {
        errorCount++
        errors.push(`Produit ${product.name}: ${error}`)
      }
    }

    console.log('FTP import completed:', { successCount, errorCount })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Import FTP réussi',
        data: {
          products_imported: successCount,
          total_processed: simulatedProducts.length,
          errors: errorCount,
          connector_id: connectorId,
          error_details: errors
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('FTP import error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})