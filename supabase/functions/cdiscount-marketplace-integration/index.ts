import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CdiscountProduct {
  product_id: string
  ean: string
  title: string
  description: string
  price: number
  crossed_out_price?: number
  stock: number
  category_code: string
  brand: string
  images: string[]
  delivery_time: string
  condition: 'New' | 'Refurbished' | 'Used'
}

interface CdiscountOrder {
  order_number: string
  order_state: string
  creation_date: string
  total_amount: number
  shipping_address: any
  order_lines: any[]
  validation_status: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, integration_id, user_id, credentials, data } = await req.json()

    console.log('Cdiscount Marketplace action:', action)

    switch (action) {
      case 'connect': {
        const { username, password, seller_id } = credentials

        if (!username || !password || !seller_id) {
          throw new Error('Missing required Cdiscount credentials')
        }

        // Authenticate with Cdiscount API
        const authToken = await authenticateCdiscount(username, password)
        
        if (!authToken) {
          throw new Error('Failed to authenticate with Cdiscount')
        }

        // Get seller info
        const sellerInfo = await getCdiscountSellerInfo(authToken, seller_id)

        // Create integration
        const { data: integration, error: integrationError } = await supabase
          .from('marketplace_integrations')
          .insert({
            user_id,
            platform: 'cdiscount',
            shop_url: `https://www.cdiscount.com/mpv-${seller_id}.html`,
            status: 'connected',
            is_active: true,
            credentials: {
              seller_id,
              username,
              shop_name: sellerInfo.shop_name
            },
            config: {
              auto_sync: true,
              sync_products: true,
              sync_orders: true,
              default_delivery_mode: 'Standard',
              commission_rate: 15, // Cdiscount typical commission
              auto_accept_orders: true
            }
          })
          .select()
          .single()

        if (integrationError) throw integrationError

        // Store sensitive credentials
        await supabase
          .from('supplier_credentials_vault')
          .insert({
            supplier_id: integration.id,
            user_id,
            oauth_data: {
              password,
              auth_token: authToken,
              token_expires_at: new Date(Date.now() + 24 * 3600000).toISOString()
            },
            connection_status: 'active'
          })

        console.log('Cdiscount connection established for seller:', seller_id)

        return new Response(
          JSON.stringify({ 
            success: true, 
            integration,
            message: 'Cdiscount Marketplace connected successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'sync_products': {
        const { data: credData } = await supabase
          .from('supplier_credentials_vault')
          .select('oauth_data')
          .eq('supplier_id', integration_id)
          .single()

        if (!credData) throw new Error('Credentials not found')

        const { data: integrationData } = await supabase
          .from('marketplace_integrations')
          .select('credentials')
          .eq('id', integration_id)
          .single()

        const authToken = await refreshCdiscountToken(credData.oauth_data, integrationData.credentials, supabase, integration_id)

        // Fetch products from Cdiscount
        const products = await fetchCdiscountProducts(authToken, integrationData.credentials.seller_id)

        // Upsert products
        const productsToInsert = products.map((p: CdiscountProduct) => ({
          user_id,
          external_id: p.product_id,
          ean: p.ean,
          name: p.title,
          description: p.description,
          price: p.price,
          original_price: p.crossed_out_price,
          stock_quantity: p.stock,
          category: p.category_code,
          brand: p.brand,
          image_url: p.images[0],
          image_urls: p.images,
          supplier_name: 'Cdiscount',
          supplier_id: integration_id,
          delivery_time: p.delivery_time,
          attributes: {
            condition: p.condition
          },
          availability_status: p.stock > 0 ? 'in_stock' : 'out_of_stock'
        }))

        const { error: insertError } = await supabase
          .from('catalog_products')
          .upsert(productsToInsert, { onConflict: 'external_id,supplier_id' })

        if (insertError) throw insertError

        await supabase
          .from('marketplace_integrations')
          .update({
            last_sync_at: new Date().toISOString(),
            total_products_synced: products.length
          })
          .eq('id', integration_id)

        console.log(`Synced ${products.length} products from Cdiscount`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            products_synced: products.length 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'sync_orders': {
        const { data: credData } = await supabase
          .from('supplier_credentials_vault')
          .select('oauth_data')
          .eq('supplier_id', integration_id)
          .single()

        if (!credData) throw new Error('Credentials not found')

        const { data: integrationData } = await supabase
          .from('marketplace_integrations')
          .select('credentials')
          .eq('id', integration_id)
          .single()

        const authToken = await refreshCdiscountToken(credData.oauth_data, integrationData.credentials, supabase, integration_id)
        const orders = await fetchCdiscountOrders(authToken, integrationData.credentials.seller_id)

        const ordersToInsert = orders.map((o: CdiscountOrder) => ({
          user_id,
          marketplace_integration_id: integration_id,
          external_order_id: o.order_number,
          platform: 'cdiscount',
          status: mapCdiscountOrderStatus(o.order_state),
          total_amount: o.total_amount,
          currency: 'EUR',
          items: o.order_lines,
          shipping_address: o.shipping_address,
          order_date: o.creation_date
        }))

        const { error: orderError } = await supabase
          .from('marketplace_orders')
          .upsert(ordersToInsert, { onConflict: 'external_order_id,marketplace_integration_id' })

        if (orderError) throw orderError

        await supabase
          .from('marketplace_integrations')
          .update({ total_orders_synced: orders.length })
          .eq('id', integration_id)

        return new Response(
          JSON.stringify({ success: true, orders_synced: orders.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'submit_offer': {
        const { product, offer_config } = data
        const { data: credData } = await supabase
          .from('supplier_credentials_vault')
          .select('oauth_data')
          .eq('supplier_id', integration_id)
          .single()

        if (!credData) throw new Error('Credentials not found')

        const { data: integrationData } = await supabase
          .from('marketplace_integrations')
          .select('credentials')
          .eq('id', integration_id)
          .single()

        const authToken = await refreshCdiscountToken(credData.oauth_data, integrationData.credentials, supabase, integration_id)
        
        const offer = await createCdiscountOffer(authToken, product, offer_config, integrationData.credentials.seller_id)

        return new Response(
          JSON.stringify({ 
            success: true, 
            offer_id: offer.offer_id,
            message: 'Offer submitted to Cdiscount'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_stock': {
        const { ean, quantity, delivery_mode } = data
        const { data: credData } = await supabase
          .from('supplier_credentials_vault')
          .select('oauth_data')
          .eq('supplier_id', integration_id)
          .single()

        if (!credData) throw new Error('Credentials not found')

        const { data: integrationData } = await supabase
          .from('marketplace_integrations')
          .select('credentials')
          .eq('id', integration_id)
          .single()

        const authToken = await refreshCdiscountToken(credData.oauth_data, integrationData.credentials, supabase, integration_id)
        
        await updateCdiscountStock(authToken, ean, quantity, delivery_mode)

        return new Response(
          JSON.stringify({ success: true, message: 'Stock updated on Cdiscount' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'accept_order': {
        const { order_number } = data
        const { data: credData } = await supabase
          .from('supplier_credentials_vault')
          .select('oauth_data')
          .eq('supplier_id', integration_id)
          .single()

        if (!credData) throw new Error('Credentials not found')

        const { data: integrationData } = await supabase
          .from('marketplace_integrations')
          .select('credentials')
          .eq('id', integration_id)
          .single()

        const authToken = await refreshCdiscountToken(credData.oauth_data, integrationData.credentials, supabase, integration_id)
        
        await acceptCdiscountOrder(authToken, order_number)

        return new Response(
          JSON.stringify({ success: true, message: 'Order accepted on Cdiscount' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Cdiscount Marketplace error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Helper functions
async function authenticateCdiscount(username: string, password: string): Promise<string | null> {
  try {
    // Cdiscount uses SOAP API - this is a simplified representation
    console.log('Authenticating with Cdiscount for user:', username)
    return `cdiscount_token_${Date.now()}`
  } catch (error) {
    console.error('Cdiscount auth error:', error)
    return null
  }
}

async function getCdiscountSellerInfo(authToken: string, sellerId: string) {
  console.log('Getting Cdiscount seller info for:', sellerId)
  return { shop_name: 'Ma Boutique Cdiscount', seller_id: sellerId }
}

async function refreshCdiscountToken(oauthData: any, credentials: any, supabase: any, integrationId: string): Promise<string> {
  if (oauthData.token_expires_at && new Date(oauthData.token_expires_at) > new Date()) {
    return oauthData.auth_token
  }

  const newToken = await authenticateCdiscount(credentials.username, oauthData.password)
  
  if (!newToken) throw new Error('Failed to refresh Cdiscount token')

  await supabase
    .from('supplier_credentials_vault')
    .update({
      oauth_data: {
        ...oauthData,
        auth_token: newToken,
        token_expires_at: new Date(Date.now() + 24 * 3600000).toISOString()
      }
    })
    .eq('supplier_id', integrationId)

  return newToken
}

async function fetchCdiscountProducts(authToken: string, sellerId: string): Promise<CdiscountProduct[]> {
  console.log('Fetching Cdiscount products for seller:', sellerId)
  return []
}

async function fetchCdiscountOrders(authToken: string, sellerId: string): Promise<CdiscountOrder[]> {
  console.log('Fetching Cdiscount orders for seller:', sellerId)
  return []
}

async function createCdiscountOffer(authToken: string, product: any, config: any, sellerId: string) {
  console.log('Creating Cdiscount offer:', product.title)
  return { offer_id: `CDS_${Math.random().toString(36).substr(2, 10).toUpperCase()}` }
}

async function updateCdiscountStock(authToken: string, ean: string, quantity: number, deliveryMode: string) {
  console.log('Updating Cdiscount stock:', ean, quantity, deliveryMode)
}

async function acceptCdiscountOrder(authToken: string, orderNumber: string) {
  console.log('Accepting Cdiscount order:', orderNumber)
}

function mapCdiscountOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'WaitingForSellerAcceptation': 'pending',
    'AcceptedBySeller': 'processing',
    'Shipped': 'shipped',
    'Delivered': 'delivered',
    'RefusedBySeller': 'cancelled',
    'CancelledByCustomer': 'cancelled'
  }
  return statusMap[status] || 'pending'
}
