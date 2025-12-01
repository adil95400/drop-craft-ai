import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/**
 * Auto-update stock levels for all connected suppliers
 * Runs periodically to sync stock from supplier APIs
 */
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

    const { supplierId, productIds } = await req.json()

    console.log(`Auto-updating stock for supplier: ${supplierId}`)

    // Get supplier credentials
    const { data: credentials } = await supabase
      .from('supplier_credentials_vault')
      .select('*')
      .eq('user_id', user.id)
      .eq('supplier_id', supplierId)
      .single()

    if (!credentials) {
      throw new Error('Supplier credentials not found')
    }

    const oauthData = credentials.oauth_data as any
    const updates: Array<{ productId: string; stock: number; price?: number }> = []

    // Fetch stock from supplier API
    switch (supplierId) {
      case 'bigbuy': {
        for (const productId of productIds) {
          const response = await fetch(`https://api.bigbuy.eu/rest/catalog/product/${productId}.json`, {
            headers: { 'Authorization': `Bearer ${oauthData.apiKey}` }
          })

          if (response.ok) {
            const data = await response.json()
            updates.push({
              productId,
              stock: data.stock || 0,
              price: data.retailPrice
            })
          }
        }
        break
      }

      case 'cj-dropshipping': {
        const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CJ-Access-Token': oauthData.accessToken
          },
          body: JSON.stringify({ pid: productIds.join(',') })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.result && data.data) {
            data.data.forEach((product: any) => {
              updates.push({
                productId: product.pid,
                stock: product.variants?.[0]?.inStock || 0,
                price: product.variants?.[0]?.sellPrice
              })
            })
          }
        }
        break
      }

      case 'bts-wholesaler': {
        for (const productId of productIds) {
          const response = await fetch(`https://api.btswholesaler.nl/v2.0/product/${productId}`, {
            headers: { 'Authorization': `Bearer ${oauthData.token}` }
          })

          if (response.ok) {
            const data = await response.json()
            updates.push({
              productId,
              stock: data.stock || 0,
              price: data.price
            })
          }
        }
        break
      }
    }

    // Update products in database
    let updatedCount = 0
    for (const update of updates) {
      const { error } = await supabase
        .from('supplier_products')
        .update({
          stock_quantity: update.stock,
          ...(update.price && { price: update.price }),
          last_stock_check: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('supplier_id', supplierId)
        .eq('external_product_id', update.productId)

      if (!error) updatedCount++
    }

    // Update last sync timestamp
    await supabase
      .from('supplier_credentials_vault')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('supplier_id', supplierId)

    console.log(`Stock update completed: ${updatedCount}/${updates.length} products updated`)

    return new Response(
      JSON.stringify({
        success: true,
        updated: updatedCount,
        total: updates.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Stock update error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
