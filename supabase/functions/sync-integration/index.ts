import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"
import { withErrorHandler, ValidationError } from "../_shared/error-handler.ts"
import { parseJsonValidated, z } from "../_shared/validators.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BodySchema = z.object({
  integration_id: z.string().uuid('integration_id invalide'),
  sync_type: z.enum(['full', 'products', 'inventory', 'orders']).optional().default('full'),
})

serve(
  withErrorHandler(async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { integration_id, sync_type } = await parseJsonValidated(req, BodySchema)

    console.log(`🔄 Sync: ${integration_id} (${sync_type})`)

    // Get integration
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('id', integration_id)
      .maybeSingle()

    if (integrationError) throw integrationError
    if (!integration) throw new ValidationError('Intégration introuvable')

    // Update status to syncing
    await supabaseClient
      .from('integrations')
      .update({
        sync_status: 'syncing',
        store_config: {
          ...(integration.store_config || {}),
          sync_in_progress: true,
          last_products_synced: 0,
          sync_started_at: new Date().toISOString(),
        },
      })
      .eq('id', integration_id)

    // Return immediately
    const response = new Response(
      JSON.stringify({
        success: true,
        message: 'Synchronisation démarrée',
        integration_id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 202,
      }
    )

    // Background sync with cursor-based pagination
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          const creds = integration.encrypted_credentials || integration.credentials || {}
          const domain = integration.shop_domain || integration.store_config?.domain || creds.shop_domain
          const token = creds.access_token || creds.accessToken

          if (!domain || !token) {
            console.error('Missing credentials - domain:', !!domain, 'token:', !!token)
            throw new ValidationError('Identifiants Shopify manquants')
          }

          console.log(`✅ Credentials found for domain: ${domain}`)
          console.log(`📦 Syncing ALL products from ${domain} using cursor pagination`)

          let total = 0
          let pageInfo: string | null = null
          let hasNextPage = true

          while (hasNextPage) {
            // Build URL with cursor-based pagination
            let url = `https://${domain}/admin/api/2024-01/products.json?limit=250`
            if (pageInfo) {
              url += `&page_info=${pageInfo}`
            }

            console.log(`   Fetching: ${url}`)

            const res = await fetch(url, {
              headers: {
                'X-Shopify-Access-Token': token,
                'Content-Type': 'application/json',
              },
            })

            if (!res.ok) {
              const errorText = await res.text()
              console.error(`❌ Shopify API error: ${res.status} - ${errorText}`)
              throw new Error(`Shopify API error: ${res.status}`)
            }

            const data = await res.json()
            const products = data.products || []

            if (products.length === 0) {
              hasNextPage = false
              break
            }

            // Parse Link header for cursor pagination
            const linkHeader = res.headers.get('Link')
            pageInfo = null
            hasNextPage = false

            if (linkHeader) {
              const links = linkHeader.split(',')
              for (const link of links) {
                if (link.includes('rel="next"')) {
                  const match = link.match(/page_info=([^>&]+)/)
                  if (match) {
                    pageInfo = match[1]
                    hasNextPage = true
                  }
                }
              }
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
              stock_quantity:
                p.variants?.reduce((s: number, v: any) => s + (v.inventory_quantity || 0), 0) || 0,
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
              console.log(`   ✅ ${total} products synced so far`)

              // Update progress in real-time
              await supabaseClient
                .from('integrations')
                .update({
                  store_config: {
                    ...(integration.store_config || {}),
                    last_products_synced: total,
                    sync_in_progress: true,
                  },
                })
                .eq('id', integration_id)
            } else {
              console.error('Upsert error:', error)
            }

            // Rate limiting - wait 500ms between pages
            if (hasNextPage) {
              await new Promise((resolve) => setTimeout(resolve, 500))
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
                sync_in_progress: false,
                sync_completed_at: new Date().toISOString(),
              },
            })
            .eq('id', integration_id)

          console.log(`✅ Sync completed: ${total} products imported`)
        } catch (error) {
          console.error('❌ Sync error:', error)
          await supabaseClient
            .from('integrations')
            .update({
              sync_status: 'error',
              store_config: {
                ...(integration.store_config || {}),
                sync_in_progress: false,
                sync_error: error instanceof Error ? error.message : String(error),
              },
            })
            .eq('id', integration_id)
        }
      })()
    )

    return response
  }, corsHeaders)
)

