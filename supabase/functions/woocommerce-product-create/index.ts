import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WooCommerceProduct {
  name: string
  type: 'simple' | 'variable'
  description: string
  short_description?: string
  sku?: string
  regular_price: string
  sale_price?: string
  manage_stock: boolean
  stock_quantity?: number
  categories?: Array<{ id: number }>
  images?: Array<{ src: string; alt?: string }>
  attributes?: any[]
  variations?: any[]
  tags?: Array<{ name: string }>
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

    // Récupérer les credentials WooCommerce
    const { data: integration } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform_name', 'woocommerce')
      .eq('id', storeId)
      .single()

    if (!integration) {
      throw new Error('WooCommerce integration not found')
    }

    const storeUrl = integration.platform_url
    const consumerKey = integration.api_key
    const consumerSecret = integration.api_secret

    if (!storeUrl || !consumerKey || !consumerSecret) {
      throw new Error('WooCommerce credentials incomplete')
    }

    // Préparer le produit pour l'API WooCommerce
    const wooProduct: WooCommerceProduct = {
      name: product.title || product.name,
      type: product.variants?.length > 1 ? 'variable' : 'simple',
      description: product.description || '',
      short_description: product.short_description || '',
      sku: product.sku || '',
      regular_price: product.price?.toString() || '0',
      sale_price: product.sale_price?.toString() || undefined,
      manage_stock: true,
      stock_quantity: product.stock_quantity || 0,
      images: product.images?.map((img: any) => ({
        src: typeof img === 'string' ? img : img.src || img.url,
        alt: product.title || product.name
      })) || [],
      tags: product.tags?.map((tag: string) => ({ name: tag })) || []
    }

    // Construire l'URL avec authentification
    const auth = btoa(`${consumerKey}:${consumerSecret}`)
    const apiUrl = `${storeUrl.replace(/\/$/, '')}/wp-json/wc/v3/products`

    // Appel à l'API WooCommerce
    const wooResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(wooProduct)
    })

    if (!wooResponse.ok) {
      const errorText = await wooResponse.text()
      console.error('WooCommerce API error:', errorText)
      throw new Error(`WooCommerce API error: ${wooResponse.status} - ${errorText}`)
    }

    const result = await wooResponse.json()
    
    return new Response(
      JSON.stringify({
        success: true,
        productId: result.id,
        slug: result.slug,
        url: result.permalink,
        wooData: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating WooCommerce product:', error)
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
