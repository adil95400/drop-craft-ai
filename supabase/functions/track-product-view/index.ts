import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { productId, userId, source } = await req.json()

    if (!productId || !userId) {
      throw new Error('productId and userId are required')
    }

    console.log('Tracking product view:', { productId, userId, source })

    // Check if product is in products or imported_products
    const { data: product } = await supabaseClient
      .from('products')
      .select('id, view_count')
      .eq('id', productId)
      .single()

    const { data: importedProduct } = await supabaseClient
      .from('imported_products')
      .select('id, view_count')
      .eq('id', productId)
      .single()

    const isImported = !product && importedProduct
    const tableName = isImported ? 'imported_products' : 'products'
    const currentViews = (product?.view_count || importedProduct?.view_count || 0)

    // Update view count
    const { error: updateError } = await supabaseClient
      .from(tableName)
      .update({ 
        view_count: currentViews + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)

    if (updateError) throw updateError

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'product_view',
        description: `Viewed product ${productId}`,
        entity_type: 'product',
        entity_id: productId,
        metadata: { source, table: tableName }
      })

    console.log('View tracked successfully:', { productId, newCount: currentViews + 1 })

    return new Response(
      JSON.stringify({ 
        success: true, 
        viewCount: currentViews + 1 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error tracking product view:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
