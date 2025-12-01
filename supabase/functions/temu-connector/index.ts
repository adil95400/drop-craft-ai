import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TemuProduct {
  product_id: string
  title: string
  description: string
  price: number
  original_price: number
  images: string[]
  category: string
  rating: number
  reviews_count: number
  stock_quantity: number
  shipping_time: string
  variants: any[]
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

    const { action, supplier_id, user_id, credentials } = await req.json()

    console.log('Temu connector action:', action)

    if (action === 'connect') {
      // Store Temu API credentials
      const { error: credError } = await supabase
        .from('supplier_credentials_vault')
        .insert({
          supplier_id,
          user_id,
          oauth_data: {
            apiKey: credentials.apiKey,
            sellerId: credentials.sellerId,
            environment: credentials.environment || 'production'
          },
          connection_status: 'active'
        })

      if (credError) throw credError

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Temu connector configured successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'sync') {
      // Fetch Temu credentials
      const { data: credData, error: credError } = await supabase
        .from('supplier_credentials_vault')
        .select('oauth_data')
        .eq('supplier_id', supplier_id)
        .eq('user_id', user_id)
        .single()

      if (credError || !credData) {
        throw new Error('Temu credentials not found')
      }

      const { apiKey, sellerId } = credData.oauth_data as any

      // Call Temu API to fetch products
      const temuApiUrl = 'https://api.temu.com/v1/products/list'
      const response = await fetch(temuApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-Seller-Id': sellerId
        },
        body: JSON.stringify({
          page: 1,
          page_size: 100,
          include_variants: true
        })
      })

      if (!response.ok) {
        throw new Error(`Temu API error: ${response.status}`)
      }

      const { products } = await response.json()

      // Insert products into supplier_products table
      const productsToInsert = products.map((p: TemuProduct) => ({
        supplier_id,
        user_id,
        external_id: p.product_id,
        name: p.title,
        description: p.description,
        price: p.price,
        compare_at_price: p.original_price,
        image_url: p.images[0],
        images: p.images,
        category: p.category,
        stock_quantity: p.stock_quantity,
        rating: p.rating,
        reviews_count: p.reviews_count,
        metadata: {
          shipping_time: p.shipping_time,
          variants: p.variants
        },
        is_active: true
      }))

      const { error: insertError } = await supabase
        .from('supplier_products')
        .upsert(productsToInsert, { 
          onConflict: 'supplier_id,external_id',
          ignoreDuplicates: false 
        })

      if (insertError) throw insertError

      // Update supplier sync status
      await supabase
        .from('suppliers')
        .update({ 
          last_sync_at: new Date().toISOString(),
          products_imported: productsToInsert.length
        })
        .eq('id', supplier_id)

      console.log(`Synced ${productsToInsert.length} products from Temu`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          products_synced: productsToInsert.length,
          message: `Successfully synced ${productsToInsert.length} products from Temu`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Invalid action')

  } catch (error) {
    console.error('Temu connector error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
