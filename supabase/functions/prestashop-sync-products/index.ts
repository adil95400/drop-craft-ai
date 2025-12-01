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

    const { userId } = await req.json()
    const effectiveUserId = userId || user.id

    console.log('Syncing PrestaShop products for user:', effectiveUserId)

    // Get credentials from vault
    const { data: credentials, error: credError } = await supabase
      .from('supplier_credentials_vault')
      .select('oauth_data')
      .eq('user_id', effectiveUserId)
      .eq('supplier_name', 'PrestaShop')
      .single()

    if (credError || !credentials) {
      throw new Error('PrestaShop credentials not found')
    }

    const { shop_url, api_key } = credentials.oauth_data as any

    // Fetch products from PrestaShop API with pagination
    let allProducts: any[] = []
    let page = 1
    const limit = 50

    while (true) {
      const url = `${shop_url}/api/products?output_format=JSON&display=full&limit=${limit}&page=${page}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${btoa(api_key + ':')}`,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('PrestaShop API error:', response.status)
        break
      }

      const data = await response.json()
      const products = data.products || []

      if (!products.length) break

      allProducts = allProducts.concat(products)
      console.log(`Fetched page ${page}, total products: ${allProducts.length}`)

      if (products.length < limit) break
      page++
    }

    console.log(`Total PrestaShop products fetched: ${allProducts.length}`)

    // Map and insert products
    const mappedProducts = allProducts.map(product => ({
      user_id: effectiveUserId,
      supplier_name: 'PrestaShop',
      external_id: product.id?.toString(),
      name: product.name || 'Unnamed Product',
      description: product.description || product.description_short || '',
      price: parseFloat(product.price || '0'),
      compare_at_price: parseFloat(product.price || '0') * 1.2,
      currency: 'EUR',
      image_url: product.images?.[0]?.url || product.id_default_image,
      images: product.images?.map((img: any) => img.url) || [],
      sku: product.reference || product.ean13 || product.upc,
      barcode: product.ean13 || product.upc,
      stock_quantity: parseInt(product.quantity || '0'),
      category: product.category_name || 'Uncategorized',
      tags: product.tags ? product.tags.split(',') : [],
      variants: [],
      supplier_url: `${shop_url}/index.php?controller=product&id_product=${product.id}`,
      is_active: product.active === '1',
      weight: parseFloat(product.weight || '0'),
      dimensions: {
        length: parseFloat(product.depth || '0'),
        width: parseFloat(product.width || '0'),
        height: parseFloat(product.height || '0')
      }
    }))

    // Batch insert
    const { error: insertError } = await supabase
      .from('supplier_products')
      .upsert(mappedProducts, {
        onConflict: 'user_id,supplier_name,external_id',
        ignoreDuplicates: false
      })

    if (insertError) {
      console.error('Error inserting products:', insertError)
      throw insertError
    }

    // Update supplier stats
    await supabase
      .from('suppliers')
      .update({
        products_imported: allProducts.length,
        last_sync_at: new Date().toISOString()
      })
      .eq('user_id', effectiveUserId)
      .eq('name', 'PrestaShop')

    console.log('PrestaShop products synced successfully')

    return new Response(
      JSON.stringify({
        success: true,
        products_synced: allProducts.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('PrestaShop sync error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
