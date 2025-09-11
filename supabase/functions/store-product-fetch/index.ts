import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  storeId: string
  platform: string
  action: 'fetch'
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fetchShopifyProducts(storeConfig: any) {
  try {
    const credentials = storeConfig.credentials || storeConfig;
    const { shop_domain, access_token } = credentials;
    
    if (!shop_domain || !access_token) {
      throw new Error('Missing Shopify credentials: shop_domain and access_token required');
    }

    const response = await fetch(
      `https://${shop_domain}/admin/api/2023-10/products.json?limit=50`,
      {
        headers: {
          'X-Shopify-Access-Token': access_token,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.products.map((product: any) => ({
      id: product.id.toString(),
      name: product.title,
      description: product.body_html,
      price: product.variants?.[0]?.price ? parseFloat(product.variants[0].price) : 0,
      sku: product.variants?.[0]?.sku || '',
      images: product.images?.map((img: any) => img.src) || [],
      category: product.product_type,
      inventory_quantity: product.variants?.[0]?.inventory_quantity || 0,
      tags: product.tags.split(',').map((tag: string) => tag.trim()),
      status: product.status,
    }));
  } catch (error) {
    console.error('Error fetching Shopify products:', error);
    throw error;
  }
}

async function fetchWooCommerceProducts(storeConfig: any) {
  try {
    const credentials = storeConfig.credentials || storeConfig;
    const { shop_domain, consumer_key, consumer_secret } = credentials;
    
    if (!shop_domain || !consumer_key || !consumer_secret) {
      throw new Error('Missing WooCommerce credentials: shop_domain, consumer_key and consumer_secret required');
    }

    const authHeader = btoa(`${consumer_key}:${consumer_secret}`);
    
    const response = await fetch(
      `${shop_domain}/wp-json/wc/v3/products?per_page=50`,
      {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.statusText}`);
    }

    const products = await response.json();
    
    return products.map((product: any) => ({
      id: product.id.toString(),
      name: product.name,
      description: product.description,
      price: parseFloat(product.price) || 0,
      sku: product.sku || '',
      images: product.images?.map((img: any) => img.src) || [],
      category: product.categories?.[0]?.name || '',
      inventory_quantity: product.stock_quantity || 0,
      tags: product.tags?.map((tag: any) => tag.name) || [],
      status: product.status,
    }));
  } catch (error) {
    console.error('Error fetching WooCommerce products:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeId, platform, action }: RequestBody = await req.json();

    if (action !== 'fetch') {
      throw new Error('Invalid action');
    }

    // Récupérer la configuration du store
    const { data: store, error: storeError } = await supabase
      .from('store_integrations')
      .select('*')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      throw new Error('Store not found');
    }

    let products = [];

    switch (platform.toLowerCase()) {
      case 'shopify':
        products = await fetchShopifyProducts(store);
        break;
      case 'woocommerce':
        products = await fetchWooCommerceProducts(store);
        break;
      case 'prestashop':
        // Simulation pour PrestaShop
        products = [
          {
            id: 'ps1',
            name: 'Produit PrestaShop 1',
            price: 29.99,
            sku: 'PS-001',
            images: [],
            category: 'Vêtements',
            inventory_quantity: 50,
          }
        ];
        break;
      default:
        throw new Error(`Platform ${platform} not supported`);
    }

    // Logger l'action
    await supabase
      .from('activity_logs')
      .insert({
        user_id: store.user_id,
        action: 'products_fetched',
        entity_type: 'store',
        entity_id: storeId,
        description: `Fetched ${products.length} products from ${platform}`,
        metadata: { platform, count: products.length }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        products,
        count: products.length 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in store-product-fetch:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});