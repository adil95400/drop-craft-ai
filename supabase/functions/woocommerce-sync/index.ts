import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WooCommerceConfig {
  siteUrl: string;
  consumerKey: string;
  consumerSecret: string;
  version: string;
  syncProducts: boolean;
  syncOrders: boolean;
  syncCategories: boolean;
}

interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_created: string;
  date_modified: string;
  type: string;
  status: string;
  featured: boolean;
  catalog_visibility: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  date_on_sale_from: string;
  date_on_sale_to: string;
  price_html: string;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  downloads: any[];
  download_limit: number;
  download_expiry: number;
  external_url: string;
  button_text: string;
  tax_status: string;
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number;
  stock_status: string;
  backorders: string;
  backorders_allowed: boolean;
  backordered: boolean;
  sold_individually: boolean;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  shipping_required: boolean;
  shipping_taxable: boolean;
  shipping_class: string;
  shipping_class_id: number;
  reviews_allowed: boolean;
  average_rating: string;
  rating_count: number;
  related_ids: number[];
  upsell_ids: number[];
  cross_sell_ids: number[];
  parent_id: number;
  purchase_note: string;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  images: Array<{
    id: number;
    date_created: string;
    date_modified: string;
    src: string;
    name: string;
    alt: string;
    position: number;
  }>;
  attributes: any[];
  default_attributes: any[];
  variations: number[];
  grouped_products: number[];
  menu_order: number;
  meta_data: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { integrationId, action = 'sync_products' } = await req.json()

    // Get integration config
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('platform_name', 'WooCommerce')
      .single()

    if (integrationError || !integration) {
      throw new Error('Integration not found')
    }

    const config = integration.sync_settings as WooCommerceConfig
    
    if (!config.siteUrl || !config.consumerKey || !config.consumerSecret) {
      throw new Error('Invalid WooCommerce configuration')
    }

    // Clean and prepare API URL
    const baseUrl = config.siteUrl.replace(/\/$/, '')
    const apiVersion = config.version || 'v3'
    const wooApiUrl = `${baseUrl}/wp-json/wc/${apiVersion}`
    
    // Prepare authentication
    const auth = btoa(`${config.consumerKey}:${config.consumerSecret}`)
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    }

    let result: any = {}

    switch (action) {
      case 'test_connection':
        result = await testWooCommerceConnection(wooApiUrl, headers)
        break
      
      case 'sync_products':
        if (config.syncProducts) {
          result = await syncWooCommerceProducts(wooApiUrl, headers, supabaseClient, integration.user_id)
        }
        break
      
      case 'sync_orders':
        if (config.syncOrders) {
          result = await syncWooCommerceOrders(wooApiUrl, headers, supabaseClient, integration.user_id)
        }
        break
      
      case 'sync_categories':
        if (config.syncCategories) {
          result = await syncWooCommerceCategories(wooApiUrl, headers, supabaseClient, integration.user_id)
        }
        break

      case 'push_products':
        result = await pushProductsToWooCommerce(wooApiUrl, headers, supabaseClient, integration.user_id, config)
        break
      
      default:
        throw new Error('Unknown action')
    }

    // Update integration status
    await supabaseClient
      .from('integrations')
      .update({
        connection_status: 'connected',
        last_sync_at: new Date().toISOString(),
        last_error: null
      })
      .eq('id', integrationId)

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: integration.user_id,
        action: `woocommerce_${action}`,
        description: `WooCommerce ${action} completed successfully`,
        entity_type: 'integration',
        entity_id: integrationId,
        metadata: result
      })

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('WooCommerce sync error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function testWooCommerceConnection(apiUrl: string, headers: Record<string, string>) {
  const response = await fetch(`${apiUrl}/system_status`, { headers })
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid API credentials')
    }
    throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`)
  }
  
  const data = await response.json()
  return {
    connected: true,
    version: data.version,
    environment: data.environment
  }
}

async function syncWooCommerceProducts(
  apiUrl: string, 
  headers: Record<string, string>, 
  supabaseClient: any, 
  userId: string
) {
  let page = 1
  let totalSynced = 0
  const errors: string[] = []
  const perPage = 100

  while (true) {
    const response = await fetch(
      `${apiUrl}/products?per_page=${perPage}&page=${page}`, 
      { headers }
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`)
    }

    const products: WooCommerceProduct[] = await response.json()
    
    if (products.length === 0) {
      break // No more products
    }

    for (const product of products) {
      try {
        const transformedProduct = transformWooCommerceProduct(product, userId)
        
        const { error } = await supabaseClient
          .from('imported_products')
          .upsert(transformedProduct, { 
            onConflict: 'external_id,user_id',
            ignoreDuplicates: false 
          })

        if (error) {
          errors.push(`Product ${product.id}: ${error.message}`)
        } else {
          totalSynced++
        }
      } catch (err) {
        errors.push(`Product ${product.id}: ${err.message}`)
      }
    }

    page++
    
    // Check if this was the last page
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1')
    if (page > totalPages) {
      break
    }
  }

  return {
    totalSynced,
    errors: errors.slice(0, 10),
    hasErrors: errors.length > 0
  }
}

async function syncWooCommerceOrders(
  apiUrl: string, 
  headers: Record<string, string>, 
  supabaseClient: any, 
  userId: string
) {
  const response = await fetch(`${apiUrl}/orders?per_page=100&page=1`, { headers })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.status}`)
  }

  const orders = await response.json()
  let totalSynced = 0
  const errors: string[] = []

  for (const order of orders) {
    try {
      const transformedOrder = {
        external_id: order.id.toString(),
        user_id: userId,
        order_number: order.number,
        email: order.billing?.email || '',
        total_price: parseFloat(order.total || '0'),
        currency: order.currency,
        financial_status: order.status,
        fulfillment_status: order.status,
        created_at: order.date_created,
        updated_at: order.date_modified,
        customer_data: {
          first_name: order.billing?.first_name,
          last_name: order.billing?.last_name,
          email: order.billing?.email
        },
        line_items: order.line_items,
        shipping_address: order.shipping,
        billing_address: order.billing,
        source: 'woocommerce'
      }

      const { error } = await supabaseClient
        .from('orders')
        .upsert(transformedOrder, { 
          onConflict: 'external_id,user_id',
          ignoreDuplicates: false 
        })

      if (error) {
        errors.push(`Order ${order.id}: ${error.message}`)
      } else {
        totalSynced++
      }
    } catch (err) {
      errors.push(`Order ${order.id}: ${err.message}`)
    }
  }

  return {
    totalSynced,
    errors: errors.slice(0, 10),
    hasErrors: errors.length > 0
  }
}

async function syncWooCommerceCategories(
  apiUrl: string, 
  headers: Record<string, string>, 
  supabaseClient: any, 
  userId: string
) {
  const response = await fetch(`${apiUrl}/products/categories?per_page=100`, { headers })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`)
  }

  const categories = await response.json()
  let totalSynced = 0
  const errors: string[] = []

  for (const category of categories) {
    try {
      const transformedCategory = {
        external_id: category.id.toString(),
        user_id: userId,
        name: category.name,
        description: category.description,
        parent_external_id: category.parent > 0 ? category.parent.toString() : null,
        image_url: category.image?.src || null,
        source: 'woocommerce',
        created_at: new Date().toISOString()
      }

      const { error } = await supabaseClient
        .from('categories')
        .upsert(transformedCategory, { 
          onConflict: 'external_id,user_id',
          ignoreDuplicates: false 
        })

      if (error) {
        errors.push(`Category ${category.id}: ${error.message}`)
      } else {
        totalSynced++
      }
    } catch (err) {
      errors.push(`Category ${category.id}: ${err.message}`)
    }
  }

  return {
    totalSynced,
    errors: errors.slice(0, 10),
    hasErrors: errors.length > 0
  }
}

async function pushProductsToWooCommerce(
  apiUrl: string, 
  headers: Record<string, string>, 
  supabaseClient: any, 
  userId: string,
  config: WooCommerceConfig
) {
  // Get products to push to WooCommerce
  const { data: products, error } = await supabaseClient
    .from('imported_products')
    .select('*')
    .eq('user_id', userId)
    .is('woocommerce_id', null)
    .limit(50)

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`)
  }

  let totalPushed = 0
  const errors: string[] = []

  for (const product of products || []) {
    try {
      const wooProduct = {
        name: product.name,
        type: 'simple',
        regular_price: product.price?.toString() || '0',
        description: product.description || '',
        short_description: product.description?.substring(0, 120) || '',
        sku: product.sku || '',
        manage_stock: true,
        stock_quantity: product.stock_quantity || 0,
        stock_status: product.stock_quantity > 0 ? 'instock' : 'outofstock',
        categories: product.category ? [{ name: product.category }] : [],
        images: product.image_urls?.map((url: string) => ({ src: url })) || [],
        status: 'draft'
      }

      const response = await fetch(`${apiUrl}/products`, {
        method: 'POST',
        headers,
        body: JSON.stringify(wooProduct)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`WooCommerce API error: ${JSON.stringify(errorData)}`)
      }

      const createdProduct = await response.json()
      
      // Update product with WooCommerce ID
      await supabaseClient
        .from('imported_products')
        .update({ 
          woocommerce_id: createdProduct.id,
          woocommerce_permalink: createdProduct.permalink
        })
        .eq('id', product.id)

      totalPushed++
    } catch (err) {
      errors.push(`Product ${product.id}: ${err.message}`)
    }
  }

  return {
    totalPushed,
    errors: errors.slice(0, 10),
    hasErrors: errors.length > 0
  }
}

function transformWooCommerceProduct(wooProduct: WooCommerceProduct, userId: string) {
  return {
    external_id: wooProduct.id.toString(),
    user_id: userId,
    name: wooProduct.name,
    description: wooProduct.description,
    price: parseFloat(wooProduct.regular_price || '0'),
    compare_at_price: parseFloat(wooProduct.sale_price || '0'),
    sku: wooProduct.sku || '',
    category: wooProduct.categories?.[0]?.name || '',
    brand: '', // WooCommerce doesn't have a standard brand field
    stock_quantity: wooProduct.stock_quantity || 0,
    image_url: wooProduct.images?.[0]?.src || null,
    image_urls: wooProduct.images?.map(img => img.src) || [],
    tags: wooProduct.tags?.map(tag => tag.name) || [],
    status: wooProduct.status === 'publish' ? 'active' : 'inactive',
    woocommerce_id: wooProduct.id,
    woocommerce_permalink: wooProduct.permalink,
    weight: parseFloat(wooProduct.weight || '0'),
    dimensions: wooProduct.dimensions,
    source: 'woocommerce',
    created_at: wooProduct.date_created,
    updated_at: wooProduct.date_modified
  }
}