import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PublishRequest {
  productId: string
  marketplaceIds: string[]
  publishOptions?: {
    autoPublish?: boolean
    syncInventory?: boolean
    overridePrice?: number
  }
}

interface PublishResult {
  marketplace: string
  success: boolean
  message: string
  listingId?: string
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { productId, marketplaceIds, publishOptions = {} }: PublishRequest = await req.json()

    console.log(`Publishing product ${productId} to marketplaces:`, marketplaceIds)

    // Récupérer le produit
    const { data: product, error: productError } = await supabase
      .from('imported_products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single()

    if (productError || !product) {
      throw new Error('Product not found')
    }

    // Récupérer les intégrations marketplace
    const { data: integrations, error: integrationsError } = await supabase
      .from('supplier_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('supplier_id', marketplaceIds)

    if (integrationsError || !integrations || integrations.length === 0) {
      throw new Error('No active marketplace integrations found')
    }

    const results: PublishResult[] = []

    // Publier sur chaque marketplace
    for (const integration of integrations) {
      try {
        console.log(`Publishing to ${integration.supplier_id}...`)

        // Transformation du produit selon la marketplace
        const transformedProduct = await transformProduct(product, integration.supplier_id, publishOptions)

// Real API publication to marketplace
        const listingResult = await publishToMarketplaceReal(
          integration,
          transformedProduct,
          product
        )

        results.push({
          marketplace: integration.supplier_id,
          success: true,
          message: 'Product published successfully',
          listingId: listingResult.listingId
        })

        // Enregistrer dans published_products
        await supabase.from('published_products').insert({
          user_id: user.id,
          product_id: productId,
          marketplace_id: integration.supplier_id,
          external_listing_id: listingResult.listingId,
          status: 'active',
          published_at: new Date().toISOString(),
          sync_status: publishOptions.syncInventory ? 'synced' : 'manual'
        })

        // Logger l'activité
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'publish_product',
          description: `Published product ${product.name} to ${integration.supplier_id}`,
          metadata: {
            product_id: productId,
            marketplace: integration.supplier_id,
            listing_id: listingResult.listingId
          }
        })

      } catch (error) {
        console.error(`Error publishing to ${integration.supplier_id}:`, error)
        results.push({
          marketplace: integration.supplier_id,
          success: false,
          message: 'Failed to publish product',
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        totalMarketplaces: marketplaceIds.length,
        successCount,
        failCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Publish error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Transform product according to marketplace requirements
async function transformProduct(product: any, marketplaceId: string, options: any): Promise<any> {
  const baseProduct = {
    sku: product.sku,
    title: product.name,
    description: product.description,
    price: options.overridePrice || product.price,
    quantity: product.stock_quantity,
    images: product.image_urls || [],
    category: product.category,
    brand: product.brand,
    weight: product.weight
  }

  // Marketplace-specific transformations
  const transformations: Record<string, (p: any) => any> = {
    amazon: (p) => ({
      ...p,
      asin: p.sku,
      fulfillment_channel: 'DEFAULT',
      condition: 'New',
      seller_sku: p.sku
    }),
    ebay: (p) => ({
      ...p,
      item_id: p.sku,
      listing_type: 'FixedPriceItem',
      duration: 'GTC',
      start_price: p.price
    }),
    etsy: (p) => ({
      ...p,
      listing_id: p.sku,
      taxonomy_id: 1,
      who_made: 'i_did',
      when_made: '2020_2023',
      is_supply: false
    }),
    shopify: (p) => ({
      ...p,
      product_type: p.category,
      vendor: p.brand,
      variants: [{
        sku: p.sku,
        price: p.price,
        inventory_quantity: p.quantity
      }]
    }),
    woocommerce: (p) => ({
      ...p,
      type: 'simple',
      regular_price: p.price.toString(),
      manage_stock: true,
      stock_quantity: p.quantity
    })
  }

  const transformer = transformations[marketplaceId]
  return transformer ? transformer(baseProduct) : baseProduct
}

// Real marketplace publication using dedicated API functions
async function publishToMarketplaceReal(integration: any, transformedProduct: any, originalProduct: any): Promise<any> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const marketplaceId = integration.supplier_id.toLowerCase()
  
  console.log(`Publishing to real ${marketplaceId} API...`)

  try {
    switch (marketplaceId) {
      case 'amazon': {
        const { data, error } = await supabase.functions.invoke('amazon-seller-api', {
          body: {
            action: 'publish_product',
            credentials: integration.api_credentials || {},
            product: {
              sku: transformedProduct.sku || transformedProduct.seller_sku,
              title: transformedProduct.title,
              description: transformedProduct.description,
              price: transformedProduct.price,
              quantity: transformedProduct.quantity,
              images: transformedProduct.images || [],
              category: transformedProduct.category,
              brand: transformedProduct.brand,
              asin: transformedProduct.asin
            }
          }
        })

        if (error) throw new Error(`Amazon API error: ${error.message}`)
        
        return {
          listingId: data.submissionId || data.sku,
          status: 'active',
          url: `https://sellercentral.amazon.com/inventory?q=${data.sku}`
        }
      }

      case 'ebay': {
        const { data, error } = await supabase.functions.invoke('ebay-trading-api', {
          body: {
            action: 'publish_product',
            credentials: integration.api_credentials || {},
            product: {
              sku: transformedProduct.sku || transformedProduct.item_id,
              title: transformedProduct.title,
              description: transformedProduct.description,
              price: transformedProduct.start_price || transformedProduct.price,
              quantity: transformedProduct.quantity,
              images: transformedProduct.images || [],
              category_id: transformedProduct.category_id || '1',
              condition: 'NEW',
              shipping_policy_id: integration.api_credentials?.shipping_policy_id,
              return_policy_id: integration.api_credentials?.return_policy_id,
              payment_policy_id: integration.api_credentials?.payment_policy_id
            }
          }
        })

        if (error) throw new Error(`eBay API error: ${error.message}`)
        
        return {
          listingId: data.listingId,
          status: 'active',
          url: `https://www.ebay.com/itm/${data.listingId}`
        }
      }

      case 'etsy': {
        const { data, error } = await supabase.functions.invoke('etsy-open-api', {
          body: {
            action: 'publish_product',
            credentials: integration.api_credentials || {},
            product: {
              sku: transformedProduct.sku || transformedProduct.listing_id,
              title: transformedProduct.title,
              description: transformedProduct.description,
              price: transformedProduct.price,
              quantity: transformedProduct.quantity,
              images: transformedProduct.images || [],
              taxonomy_id: transformedProduct.taxonomy_id || 1,
              who_made: transformedProduct.who_made || 'i_did',
              when_made: transformedProduct.when_made || '2020_2023',
              is_supply: transformedProduct.is_supply || false,
              tags: transformedProduct.tags || [],
              materials: transformedProduct.materials || []
            }
          }
        })

        if (error) throw new Error(`Etsy API error: ${error.message}`)
        
        return {
          listingId: data.listingId,
          status: 'active',
          url: data.listingUrl
        }
      }

      case 'shopify': {
        const { data: shopifyResult, error: shopifyError } = await supabase.functions.invoke('shopify-product-create', {
          body: { 
            product: transformedProduct,
            storeId: integration.api_credentials?.storeId
          }
        })

        if (shopifyError) throw new Error(`Shopify error: ${shopifyError.message}`)
        
        return {
          listingId: shopifyResult?.productId?.toString() || transformedProduct.sku,
          status: 'active',
          url: shopifyResult?.url || ''
        }
      }

      case 'woocommerce': {
        const { data: wooResult, error: wooError } = await supabase.functions.invoke('woocommerce-product-create', {
          body: { 
            product: transformedProduct,
            storeId: integration.api_credentials?.storeId
          }
        })

        if (wooError) throw new Error(`WooCommerce error: ${wooError.message}`)
        
        return {
          listingId: wooResult?.productId?.toString() || transformedProduct.sku,
          status: 'active',
          url: wooResult?.url || ''
        }
      }

      default:
        throw new Error(`Unsupported marketplace: ${marketplaceId}`)
    }
  } catch (error) {
    console.error(`Error publishing to ${marketplaceId}:`, error)
    throw error
  }
}
