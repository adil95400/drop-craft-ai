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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { user_id, products } = await req.json()

    console.log('Generating ChatGPT Shopping feed for user:', user_id)

    // Transform products to ChatGPT Shopping format
    const chatgptProducts = products.map((product: any) => ({
      id: product.id,
      title: product.name,
      description: product.description,
      link: `https://shopopti.io/products/${product.id}`,
      image_link: product.image_url,
      price: `${product.price} ${product.currency || 'EUR'}`,
      brand: product.brand || 'ShopOpti',
      condition: 'new',
      availability: product.stock_quantity > 0 ? 'in stock' : 'out of stock',
      gtin: product.gtin,
      mpn: product.sku,
      google_product_category: product.category,
      product_type: product.category,
      custom_label_0: product.tags?.join(',') || '',
      ai_generated: product.ai_generated || false,
      optimization_score: product.audit_score || 0
    }))

    // Store feed in database
    const { data: feedData, error: feedError } = await supabase
      .from('marketplace_feeds')
      .upsert({
        user_id,
        marketplace: 'chatgpt_shopping',
        feed_type: 'product_catalog',
        feed_url: `https://shopopti.io/feeds/${user_id}/chatgpt-shopping.json`,
        product_count: chatgptProducts.length,
        feed_data: chatgptProducts,
        status: 'active',
        last_generated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,marketplace',
        ignoreDuplicates: false
      })

    if (feedError) throw feedError

    // Log feed generation
    await supabase.from('activity_logs').insert({
      user_id,
      action: 'feed_generated',
      description: `Generated ChatGPT Shopping feed with ${chatgptProducts.length} products`,
      entity_type: 'marketplace_feed',
      entity_id: feedData?.id,
      metadata: {
        marketplace: 'chatgpt_shopping',
        product_count: chatgptProducts.length
      }
    })

    console.log(`Generated ChatGPT Shopping feed with ${chatgptProducts.length} products`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        feed_url: `https://shopopti.io/feeds/${user_id}/chatgpt-shopping.json`,
        product_count: chatgptProducts.length,
        message: 'ChatGPT Shopping feed generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('ChatGPT Shopping feed error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
