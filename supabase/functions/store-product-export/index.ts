import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  storeId: string
  platform: string
  product: any
  action: 'export'
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function exportToShopify(storeConfig: any, product: any) {
  try {
    const { shop_domain, access_token } = storeConfig;
    
    const shopifyProduct = {
      product: {
        title: product.name,
        body_html: product.description || '',
        vendor: 'Import Hub',
        product_type: product.category || 'General',
        tags: product.tags?.join(',') || '',
        variants: [{
          price: product.price.toString(),
          inventory_quantity: product.inventory_quantity || 0,
          sku: product.sku || '',
          requires_shipping: true,
        }],
        images: product.images?.map((url: string) => ({ src: url })) || [],
        status: 'active'
      }
    };

    const response = await fetch(
      `https://${shop_domain}/admin/api/2023-10/products.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shopifyProduct),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Shopify API error: ${response.statusText} - ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error exporting to Shopify:', error);
    throw error;
  }
}

async function exportToWooCommerce(storeConfig: any, product: any) {
  try {
    const { shop_domain, consumer_key, consumer_secret } = storeConfig;
    
    const credentials = btoa(`${consumer_key}:${consumer_secret}`);
    
    const wooProduct = {
      name: product.name,
      description: product.description || '',
      short_description: product.description?.substring(0, 100) || '',
      regular_price: product.price.toString(),
      sku: product.sku || '',
      manage_stock: true,
      stock_quantity: product.inventory_quantity || 0,
      categories: product.category ? [{ name: product.category }] : [],
      tags: product.tags?.map((tag: string) => ({ name: tag })) || [],
      images: product.images?.map((url: string) => ({ src: url })) || [],
      status: 'publish'
    };

    const response = await fetch(
      `${shop_domain}/wp-json/wc/v3/products`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wooProduct),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`WooCommerce API error: ${response.statusText} - ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error exporting to WooCommerce:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeId, platform, product, action }: RequestBody = await req.json();

    if (action !== 'export') {
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

    let exportResult;

    switch (platform.toLowerCase()) {
      case 'shopify':
        exportResult = await exportToShopify(store, product);
        break;
      case 'woocommerce':
        exportResult = await exportToWooCommerce(store, product);
        break;
      case 'prestashop':
        // Simulation pour PrestaShop
        exportResult = {
          id: 'simulated_' + Date.now(),
          name: product.name,
          status: 'exported'
        };
        break;
      default:
        throw new Error(`Platform ${platform} not supported`);
    }

    // Logger l'export
    await supabase
      .from('activity_logs')
      .insert({
        user_id: store.user_id,
        action: 'product_exported',
        entity_type: 'product',
        entity_id: exportResult.product?.id || exportResult.id,
        description: `Exported product "${product.name}" to ${platform}`,
        metadata: { 
          platform, 
          store_id: storeId,
          export_id: exportResult.product?.id || exportResult.id,
          price: product.price
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        result: exportResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in store-product-export:', error);
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