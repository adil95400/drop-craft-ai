import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShopifyProduct {
  title: string
  body_html: string
  vendor?: string
  product_type?: string
  tags?: string[]
  variants: Array<{
    price: string
    sku?: string
    inventory_quantity?: number
  }>
  images?: Array<{
    src: string
    alt?: string
  }>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { product, storeId } = await req.json()

    // Récupérer les credentials Shopify
    const { data: integration } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform_name', 'shopify')
      .eq('id', storeId)
      .single()

    if (!integration) {
      throw new Error('Shopify integration not found')
    }

    const shopDomain = integration.shop_domain
    const accessToken = integration.access_token

    if (!shopDomain || !accessToken) {
      throw new Error('Shopify credentials incomplete')
    }

    // Préparer le produit pour l'API Shopify
    const shopifyProduct: ShopifyProduct = {
      title: product.title || product.name,
      body_html: product.description || '',
      vendor: product.vendor || product.brand || '',
      product_type: product.product_type || product.category || '',
      tags: product.tags || [],
      variants: product.variants?.length > 0 
        ? product.variants.map((v: any) => ({
            price: v.price?.toString() || product.price?.toString() || '0',
            sku: v.sku || product.sku,
            inventory_quantity: v.inventory_quantity || product.stock_quantity || 0
          }))
        : [{
            price: product.price?.toString() || '0',
            sku: product.sku || '',
            inventory_quantity: product.stock_quantity || 0
          }],
      images: product.images?.map((img: any) => ({
        src: typeof img === 'string' ? img : img.src || img.url,
        alt: product.title || product.name
      })) || []
    }

    // Appel à l'API Shopify
    const shopifyResponse = await fetch(
      `https://${shopDomain}/admin/api/2024-01/products.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        },
        body: JSON.stringify({ product: shopifyProduct })
      }
    )

    if (!shopifyResponse.ok) {
      const errorText = await shopifyResponse.text()
      console.error('Shopify API error:', errorText)
      throw new Error(`Shopify API error: ${shopifyResponse.status} - ${errorText}`)
    }

    const result = await shopifyResponse.json()
    
    return new Response(
      JSON.stringify({
        success: true,
        productId: result.product.id,
        handle: result.product.handle,
        url: `https://${shopDomain}/products/${result.product.handle}`,
        shopifyData: result.product
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating Shopify product:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
