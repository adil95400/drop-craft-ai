import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { integration_id, sync_type = 'full' } = await req.json()

    if (!integration_id) {
      throw new Error('Integration ID required')
    }

    console.log(`🔄 Sync: ${integration_id}`)

    // Get integration
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('id', integration_id)
      .single()

    if (integrationError) {
      throw new Error(`Integration not found`)
    }

    // Update status
    await supabaseClient
      .from('integrations')
      .update({ sync_status: 'syncing' })
      .eq('id', integration_id)

    // Return immediately
    const response = new Response(
      JSON.stringify({
        success: true,
        message: 'Synchronisation démarrée',
        integration_id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 202
      }
    )

    // Background sync
    EdgeRuntime.waitUntil((async () => {
      try {
        const creds = integration.encrypted_credentials || integration.credentials || {}
        const domain = creds.shop_domain
        const token = creds.access_token || creds.accessToken

        if (!domain || !token) {
          throw new Error('Missing credentials')
        }

        console.log(`📦 Syncing ALL products from ${domain}`)
        
        let total = 0
        let page = 1
        let hasMore = true

        while (hasMore) {
          console.log(`   Page ${page}...`)
          
          const res = await fetch(`https://${domain}/admin/api/2023-10/products.json?limit=250&page=${page}`, {
            headers: {
              'X-Shopify-Access-Token': token,
              'Content-Type': 'application/json'
            }
          })

          if (!res.ok) {
            console.log(`   ❌ Error fetching page ${page}: ${res.status}`)
            break
          }

          const data = await res.json()
          const products = data.products || []
          
          if (products.length === 0) {
            hasMore = false
            break
          }

          const items = products.map((p: any) => ({
            user_id: integration.user_id,
            supplier_name: 'Shopify',
            supplier_product_id: p.id.toString(),
            sku: p.variants?.[0]?.sku || `SHOP-${p.id}`,
            name: p.title,
            description: p.body_html || '',
            price: parseFloat(p.variants?.[0]?.price || '0'),
            cost_price: parseFloat(p.variants?.[0]?.compare_at_price || '0') || null,
            currency: 'EUR',
            stock_quantity: p.variants?.reduce((s: number, v: any) => s + (v.inventory_quantity || 0), 0) || 0,
            category: p.product_type || 'General',
            brand: p.vendor || '',
            tags: p.tags ? p.tags.split(',').map((t: string) => t.trim()) : [],
            image_urls: p.images?.map((img: any) => img.src) || [],
            status: p.status === 'active' ? 'published' : 'draft',
          }))

          const { error } = await supabaseClient
            .from('imported_products')
            .upsert(items, { onConflict: 'user_id,supplier_product_id' })

          if (!error) {
            total += items.length
            console.log(`   ✅ ${total} products synced`)
            
            // Update progress in real-time
            await supabaseClient
              .from('integrations')
              .update({
                store_config: {
                  ...(integration.store_config || {}),
                  last_products_synced: total,
                  sync_in_progress: true
                }
              })
              .eq('id', integration_id)
          }
          
          page++
          
          // Rate limiting - wait 500ms between pages
          if (hasMore && products.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }

        // Update final status
        await supabaseClient
          .from('integrations')
          .update({
            sync_status: 'synced',
            last_sync_at: new Date().toISOString(),
            store_config: {
              ...(integration.store_config || {}),
              last_products_synced: total,
              sync_in_progress: false
            }
          })
          .eq('id', integration_id)

        console.log(`✅ Sync completed: ${total} products imported`)
      } catch (error) {
        console.error('❌ Error:', error)
        await supabaseClient
          .from('integrations')
          .update({ sync_status: 'error' })
          .eq('id', integration_id)
      }
    })())

    return response

  } catch (error) {
    console.error('Request error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
