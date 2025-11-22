import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { product } = await req.json()

    console.log('Importing winning product:', { product_id: product.id, user_id: user.id })

    // Calculer le coût estimé (marge de 30%)
    const estimatedCost = product.price * 0.7
    const profitMargin = ((product.price - estimatedCost) / estimatedCost) * 100

    // Importer le produit
    const { data: importedProduct, error: importError } = await supabase
      .from('imported_products')
      .insert({
        user_id: user.id,
        name: product.title || product.name,
        description: product.description || `Produit gagnant importé depuis ${product.source || 'marketplace'}`,
        price: product.price,
        cost_price: estimatedCost,
        profit_margin: profitMargin,
        category: product.category || 'Winning Products',
        supplier_name: product.source || 'Winners Marketplace',
        supplier_url: product.url,
        image_url: product.image || product.image_url,
        tags: [...(product.tags || []), 'winner', 'imported'],
        status: 'active',
        sku: `WIN-${Date.now()}`,
        stock_quantity: 100,
        metadata: {
          virality_score: product.virality_score,
          trend_score: product.trend_score,
          imported_from: 'winners-marketplace',
          imported_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (importError) {
      throw importError
    }

    // Logger l'activité
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'winner_imported',
      description: `Produit gagnant importé: ${product.title || product.name}`,
      entity_type: 'product',
      entity_id: importedProduct.id,
      metadata: { 
        source: product.source,
        virality_score: product.virality_score
      }
    })

    return new Response(
      JSON.stringify({ success: true, product: importedProduct }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
