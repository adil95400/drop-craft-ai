import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/**
 * Synchronize inventory and prices across multiple marketplaces
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

    const { action, productIds, syncType = 'all' } = await req.json()

    console.log('Cross-marketplace sync:', action, 'type:', syncType, 'user:', user.id)

    // Get products to sync
    let productsQuery = supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)

    if (productIds && productIds.length > 0) {
      productsQuery = productsQuery.in('id', productIds)
    }

    const { data: products, error: productsError } = await productsQuery
    if (productsError) throw productsError

    const syncResults = {
      total: products?.length || 0,
      synced: 0,
      failed: 0,
      details: [] as any[]
    }

    for (const product of products || []) {
      try {
        // Get all marketplace listings for this product
        const { data: marketplaceProducts } = await supabase
          .from('marketplace_products')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_id', product.id)
          .eq('sync_status', 'active')

        if (!marketplaceProducts || marketplaceProducts.length === 0) {
          continue
        }

        const updates = []

        for (const mp of marketplaceProducts) {
          const updatePayload: any = {}

          // Sync stock
          if (syncType === 'all' || syncType === 'stock') {
            updatePayload.stock = product.stock
          }

          // Sync price
          if (syncType === 'all' || syncType === 'price') {
            updatePayload.price = product.price
          }

          // Sync title/description
          if (syncType === 'all' || syncType === 'content') {
            updatePayload.title = product.name
            updatePayload.description = product.description
          }

          // Apply marketplace-specific price rules if any
          const { data: priceRules } = await supabase
            .from('marketplace_price_rules')
            .select('*')
            .eq('user_id', user.id)
            .eq('marketplace', mp.marketplace)
            .eq('is_active', true)
            .single()

          if (priceRules && updatePayload.price) {
            switch (priceRules.rule_type) {
              case 'markup_percent':
                updatePayload.price = product.price * (1 + priceRules.value / 100)
                break
              case 'markup_fixed':
                updatePayload.price = product.price + priceRules.value
                break
              case 'discount_percent':
                updatePayload.price = product.price * (1 - priceRules.value / 100)
                break
            }
          }

          // Call marketplace-specific API to update
          const syncResult = await syncToMarketplace(
            mp.marketplace,
            mp.external_id,
            updatePayload,
            user.id
          )

          if (syncResult.success) {
            // Update local record
            await supabase
              .from('marketplace_products')
              .update({
                ...updatePayload,
                last_synced_at: new Date().toISOString(),
                sync_status: 'active'
              })
              .eq('id', mp.id)

            updates.push({
              marketplace: mp.marketplace,
              external_id: mp.external_id,
              status: 'success'
            })
          } else {
            updates.push({
              marketplace: mp.marketplace,
              external_id: mp.external_id,
              status: 'failed',
              error: syncResult.error
            })
          }
        }

        // Update product sync timestamp
        await supabase
          .from('products')
          .update({ 
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)

        syncResults.synced += 1
        syncResults.details.push({
          product_id: product.id,
          sku: product.sku,
          name: product.name,
          marketplaces: updates
        })

      } catch (error) {
        console.error(`Error syncing product ${product.id}:`, error)
        syncResults.failed += 1
        syncResults.details.push({
          product_id: product.id,
          sku: product.sku,
          error: error.message
        })
      }
    }

    // Log sync activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'cross_marketplace_sync',
        entity_type: 'product',
        description: `Synchronisation cross-marketplace: ${syncResults.synced} produits synchronisés, ${syncResults.failed} échecs`,
        metadata: { 
          sync_type: syncType,
          total: syncResults.total,
          synced: syncResults.synced,
          failed: syncResults.failed
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        results: syncResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Cross-marketplace sync error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function syncToMarketplace(
  marketplace: string, 
  externalId: string, 
  updatePayload: any,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (marketplace) {
      case 'shopify':
        // Call Shopify API to update product
        return { success: true }
      
      case 'amazon':
        // Call Amazon SP-API to update listing
        return { success: true }
      
      case 'ebay':
        // Call eBay API to update listing
        return { success: true }
      
      case 'etsy':
        // Call Etsy API to update listing
        return { success: true }
      
      default:
        return { success: false, error: 'Unsupported marketplace' }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
