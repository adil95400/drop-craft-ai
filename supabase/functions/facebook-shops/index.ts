import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface FacebookCredentials {
  access_token: string
  page_id: string
  catalog_id?: string
  commerce_account_id?: string
}

// Call Facebook Graph API
async function callFacebookAPI(
  endpoint: string, 
  accessToken: string, 
  method: string = 'GET',
  body?: any
): Promise<any> {
  const url = `https://graph.facebook.com/v18.0/${endpoint}`
  const separator = url.includes('?') ? '&' : '?'
  const fullUrl = `${url}${separator}access_token=${accessToken}`
  
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' }
  }
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body)
  }
  
  const response = await fetch(fullUrl, options)
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Facebook API error: ${error}`)
  }
  
  return response.json()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { action, integration_id, products, collection_name, collection_description } = await req.json()

    console.log(`Facebook Shops action: ${action}`)

    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    )

    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get integration details
    const { data: integration, error: integrationError } = await supabase
      .from('marketplace_integrations')
      .select('*')
      .eq('id', integration_id)
      .eq('user_id', user.id)
      .single()

    if (integrationError) throw integrationError

    const credentials = integration.credentials as FacebookCredentials | null

    switch (action) {
      case 'sync_catalog': {
        console.log('Syncing Facebook catalog...')
        
        if (!credentials?.access_token || !credentials?.catalog_id) {
          throw new Error('Facebook credentials not configured. Please connect your Facebook Business account.')
        }

        let syncedCount = 0
        
        // Sync products to Facebook catalog via Catalog Batch API
        const batch = (products || []).map((product: any) => ({
          method: 'UPDATE',
          retailer_id: product.sku || product.id,
          data: {
            name: product.name,
            description: product.description || '',
            url: product.url || '',
            image_url: product.image_url || '',
            price: `${Math.round(product.price * 100)} EUR`,
            availability: product.stock_quantity > 0 ? 'in stock' : 'out of stock',
            brand: product.brand || '',
            condition: 'new'
          }
        }))

        if (batch.length > 0) {
          try {
            const response = await callFacebookAPI(
              `${credentials.catalog_id}/items_batch`,
              credentials.access_token,
              'POST',
              {
                requests: batch
              }
            )
            syncedCount = response.handles?.length || batch.length
          } catch (error) {
            console.error('Batch sync error:', error)
            throw error
          }
        }
        
        // Update integration stats
        await supabase
          .from('marketplace_integrations')
          .update({
            last_sync_at: new Date().toISOString(),
            total_products_synced: (integration.total_products_synced || 0) + syncedCount,
            total_sync_count: (integration.total_sync_count || 0) + 1
          })
          .eq('id', integration_id)

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Facebook catalog synced successfully',
            products_synced: syncedCount
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'create_collection': {
        console.log('Creating Facebook collection...')
        
        if (!credentials?.access_token || !credentials?.catalog_id) {
          throw new Error('Facebook credentials not configured')
        }

        const response = await callFacebookAPI(
          `${credentials.catalog_id}/product_sets`,
          credentials.access_token,
          'POST',
          {
            name: collection_name || 'New Collection',
            description: collection_description || ''
          }
        )
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Collection created on Facebook Shops',
            collection_id: response.id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'publish_products': {
        console.log('Publishing products to Facebook Shops...')
        
        if (!credentials?.access_token || !credentials?.page_id) {
          throw new Error('Facebook credentials not configured')
        }

        let publishedCount = 0
        
        // Publish products by adding them to the page's shop
        for (const product of (products || [])) {
          try {
            if (product.catalog_product_id) {
              await callFacebookAPI(
                `${credentials.page_id}/shop_product_publish`,
                credentials.access_token,
                'POST',
                {
                  product_id: product.catalog_product_id
                }
              )
              publishedCount++
            }
          } catch (error) {
            console.error(`Failed to publish product ${product.id}:`, error)
          }
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            message: `${publishedCount} products published to Facebook Shops`,
            published_count: publishedCount
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_analytics': {
        console.log('Getting Facebook Shops analytics...')
        
        if (!credentials?.access_token || !credentials?.commerce_account_id) {
          // Return real data from database if no API credentials
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          
          const { data: orders } = await supabase
            .from('orders')
            .select('id, total_amount, created_at')
            .eq('user_id', user.id)
            .eq('source', 'facebook')
            .gte('created_at', thirtyDaysAgo)

          const { data: productViews } = await supabase
            .from('product_views')
            .select('product_id')
            .eq('user_id', user.id)
            .eq('source', 'facebook')
            .gte('created_at', thirtyDaysAgo)

          const { data: cartEvents } = await supabase
            .from('conversion_events')
            .select('event_type')
            .eq('user_id', user.id)
            .in('event_type', ['add_to_cart', 'checkout_started'])
            .gte('created_at', thirtyDaysAgo)

          const revenue = orders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0
          const purchases = orders?.length || 0
          const views = productViews?.length || 0
          const addToCart = cartEvents?.filter(e => e.event_type === 'add_to_cart').length || 0
          const checkouts = cartEvents?.filter(e => e.event_type === 'checkout_started').length || 0

          const analytics = {
            total_reach: views * 10, // Estimate
            product_views: views,
            add_to_cart: addToCart,
            checkouts,
            purchases,
            revenue,
            conversion_rate: views > 0 ? ((purchases / views) * 100).toFixed(2) : '0',
            top_performing_products: [],
            source: 'database'
          }

          return new Response(
            JSON.stringify({ success: true, analytics }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Fetch real analytics from Facebook Commerce API
        try {
          const analyticsResponse = await callFacebookAPI(
            `${credentials.commerce_account_id}/commerce_insights?metric=total_sales,total_orders,conversion_rate&period=last_30_days`,
            credentials.access_token
          )

          const analytics = {
            total_sales: analyticsResponse.data?.[0]?.values?.[0]?.value || 0,
            total_orders: analyticsResponse.data?.[1]?.values?.[0]?.value || 0,
            conversion_rate: analyticsResponse.data?.[2]?.values?.[0]?.value || 0,
            source: 'facebook_api'
          }

          return new Response(
            JSON.stringify({ success: true, analytics }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (apiError) {
          console.error('Facebook API analytics error:', apiError)
          throw new Error('Failed to fetch Facebook analytics')
        }
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Facebook Shops error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
