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
    const { action, integration_id, products } = await req.json()

    console.log(`Instagram Shopping action: ${action}`)

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

    switch (action) {
      case 'sync_catalog': {
        console.log('Syncing Instagram catalog...')
        
        // Simulate syncing products to Instagram catalog
        const syncedProducts = products?.length || 0
        
        // Update integration stats
        await supabase
          .from('marketplace_integrations')
          .update({
            last_sync_at: new Date().toISOString(),
            total_products_synced: integration.total_products_synced + syncedProducts,
            total_sync_count: integration.total_sync_count + 1
          })
          .eq('id', integration_id)

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Instagram catalog synced successfully',
            products_synced: syncedProducts
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'publish_products': {
        console.log('Publishing products to Instagram Shopping...')
        
        const publishedCount = products?.length || 0
        
        return new Response(
          JSON.stringify({
            success: true,
            message: `${publishedCount} products published to Instagram Shopping`,
            published_count: publishedCount
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_insights': {
        console.log('Getting Instagram Shopping insights...')
        
        // Simulate Instagram Shopping insights
        const insights = {
          product_views: Math.floor(Math.random() * 10000) + 1000,
          product_clicks: Math.floor(Math.random() * 1000) + 100,
          purchases: Math.floor(Math.random() * 100) + 10,
          revenue: Math.floor(Math.random() * 5000) + 500,
          top_products: [
            { name: 'Product 1', views: 1250, clicks: 85, purchases: 12 },
            { name: 'Product 2', views: 980, clicks: 65, purchases: 8 },
            { name: 'Product 3', views: 750, clicks: 45, purchases: 5 }
          ]
        }

        return new Response(
          JSON.stringify({
            success: true,
            insights
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Instagram Shopping error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
