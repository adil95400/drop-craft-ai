import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { integration_id, sync_type, product_data, variants_data } = await req.json();

    console.log(`Starting advanced sync for integration ${integration_id}, type: ${sync_type}`);

    // Get integration details
    const { data: integration, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integration_id)
      .single();

    if (error || !integration) {
      throw new Error('Integration not found');
    }

    let syncResult;
    
    switch (integration.platform_name.toLowerCase()) {
      case 'shopify':
        syncResult = await syncShopifyAdvanced(integration, sync_type, product_data, variants_data);
        break;
      case 'woocommerce':
        syncResult = await syncWooCommerceAdvanced(integration, sync_type, product_data, variants_data);
        break;
      default:
        throw new Error('Platform not supported for advanced sync');
    }

    return new Response(JSON.stringify({
      success: true,
      ...syncResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in advanced sync:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function syncShopifyAdvanced(integration: any, syncType: string, productData: any, variantsData: any[]) {
  const baseUrl = `https://${integration.shop_domain}/admin/api/2023-10`;
  const headers = {
    'X-Shopify-Access-Token': integration.access_token,
    'Content-Type': 'application/json',
  };

  switch (syncType) {
    case 'create_product_with_variants':
      return await createShopifyProductWithVariants(baseUrl, headers, productData, variantsData);
    
    case 'update_inventory_levels':
      return await updateShopifyInventoryLevels(baseUrl, headers, productData);
    
    case 'sync_product_variants':
      return await syncShopifyProductVariants(baseUrl, headers, productData, variantsData);
    
    default:
      throw new Error(`Advanced sync type ${syncType} not supported for Shopify`);
  }
}

async function createShopifyProductWithVariants(baseUrl: string, headers: any, productData: any, variantsData: any[]) {
  // Create product with variants
  const shopifyProduct = {
    product: {
      title: productData.name,
      body_html: productData.description,
      vendor: productData.brand || 'Default',
      product_type: productData.category,
      tags: productData.tags?.join(',') || '',
      options: [
        { name: 'Size' },
        { name: 'Color' }
      ],
      variants: variantsData.map((variant, index) => ({
        price: variant.price.toString(),
        compare_at_price: variant.compare_at_price?.toString(),
        sku: variant.variant_sku,
        inventory_quantity: variant.stock_quantity,
        option1: variant.options?.size || 'Default',
        option2: variant.options?.color || 'Default',
        weight: variant.weight || 0,
        weight_unit: 'kg'
      }))
    }
  };

  const response = await fetch(`${baseUrl}/products.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify(shopifyProduct)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Shopify API error: ${JSON.stringify(errorData)}`);
  }

  const result = await response.json();
  
  return {
    processed: 1,
    succeeded: 1,
    failed: 0,
    data: {
      shopify_product_id: result.product.id,
      variants: result.product.variants.map((v: any) => ({
        variant_id: v.id,
        sku: v.sku,
        inventory_item_id: v.inventory_item_id
      }))
    }
  };
}

async function updateShopifyInventoryLevels(baseUrl: string, headers: any, inventoryData: any) {
  const results = [];
  
  for (const item of inventoryData.items) {
    try {
      // Get inventory levels first
      const levelsResponse = await fetch(
        `${baseUrl}/inventory_levels.json?inventory_item_ids=${item.inventory_item_id}`,
        { headers }
      );
      
      if (!levelsResponse.ok) continue;
      
      const levelsData = await levelsResponse.json();
      const locationId = levelsData.inventory_levels[0]?.location_id;
      
      if (!locationId) continue;

      // Update inventory level
      const updateResponse = await fetch(`${baseUrl}/inventory_levels/set.json`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          location_id: locationId,
          inventory_item_id: item.inventory_item_id,
          available: item.quantity
        })
      });

      if (updateResponse.ok) {
        results.push({ 
          inventory_item_id: item.inventory_item_id,
          success: true,
          new_quantity: item.quantity
        });
      }
    } catch (error) {
      results.push({
        inventory_item_id: item.inventory_item_id,
        success: false,
        error: error.message
      });
    }
  }

  return {
    processed: inventoryData.items.length,
    succeeded: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    data: { inventory_updates: results }
  };
}

async function syncShopifyProductVariants(baseUrl: string, headers: any, productData: any, variantsData: any[]) {
  const results = [];
  
  for (const variant of variantsData) {
    try {
      const updateData = {
        variant: {
          id: variant.shopify_variant_id,
          price: variant.price.toString(),
          inventory_quantity: variant.stock_quantity,
          sku: variant.variant_sku
        }
      };

      const response = await fetch(`${baseUrl}/variants/${variant.shopify_variant_id}.json`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        results.push({ variant_id: variant.shopify_variant_id, success: true });
      } else {
        results.push({ variant_id: variant.shopify_variant_id, success: false });
      }
    } catch (error) {
      results.push({ variant_id: variant.shopify_variant_id, success: false, error: error.message });
    }
  }

  return {
    processed: variantsData.length,
    succeeded: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    data: { variant_updates: results }
  };
}

async function syncWooCommerceAdvanced(integration: any, syncType: string, productData: any, variantsData: any[]) {
  const auth = btoa(`${integration.api_key}:${integration.api_secret}`);
  const headers = {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
  };

  switch (syncType) {
    case 'create_variable_product':
      return await createWooCommerceVariableProduct(integration.platform_url, headers, productData, variantsData);
    
    case 'update_product_variations':
      return await updateWooCommerceVariations(integration.platform_url, headers, productData, variantsData);
    
    default:
      throw new Error(`Advanced sync type ${syncType} not supported for WooCommerce`);
  }
}

async function createWooCommerceVariableProduct(baseUrl: string, headers: any, productData: any, variantsData: any[]) {
  // First create the variable product
  const wooProduct = {
    name: productData.name,
    type: 'variable',
    description: productData.description,
    short_description: productData.short_description || '',
    categories: productData.categories || [],
    tags: productData.tags || [],
    attributes: [
      {
        name: 'Size',
        options: [...new Set(variantsData.map(v => v.options?.size).filter(Boolean))],
        variation: true,
        visible: true
      },
      {
        name: 'Color',
        options: [...new Set(variantsData.map(v => v.options?.color).filter(Boolean))],
        variation: true,
        visible: true
      }
    ]
  };

  const productResponse = await fetch(`${baseUrl}/wp-json/wc/v3/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify(wooProduct)
  });

  if (!productResponse.ok) {
    const errorData = await productResponse.json();
    throw new Error(`WooCommerce API error: ${JSON.stringify(errorData)}`);
  }

  const product = await productResponse.json();

  // Now create variations
  const variationResults = [];
  for (const variant of variantsData) {
    const variationData = {
      regular_price: variant.price.toString(),
      manage_stock: true,
      stock_quantity: variant.stock_quantity,
      sku: variant.variant_sku,
      attributes: [
        {
          name: 'Size',
          option: variant.options?.size || 'Default'
        },
        {
          name: 'Color',
          option: variant.options?.color || 'Default'
        }
      ]
    };

    try {
      const variationResponse = await fetch(`${baseUrl}/wp-json/wc/v3/products/${product.id}/variations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(variationData)
      });

      if (variationResponse.ok) {
        const variation = await variationResponse.json();
        variationResults.push({ 
          variation_id: variation.id,
          sku: variant.variant_sku,
          success: true 
        });
      } else {
        variationResults.push({ 
          sku: variant.variant_sku,
          success: false 
        });
      }
    } catch (error) {
      variationResults.push({ 
        sku: variant.variant_sku,
        success: false,
        error: error.message 
      });
    }
  }

  return {
    processed: 1 + variantsData.length,
    succeeded: 1 + variationResults.filter(r => r.success).length,
    failed: variationResults.filter(r => !r.success).length,
    data: {
      woocommerce_product_id: product.id,
      variations: variationResults
    }
  };
}

async function updateWooCommerceVariations(baseUrl: string, headers: any, productData: any, variantsData: any[]) {
  const results = [];
  
  for (const variant of variantsData) {
    try {
      const updateData = {
        regular_price: variant.price.toString(),
        stock_quantity: variant.stock_quantity,
        sku: variant.variant_sku
      };

      const response = await fetch(
        `${baseUrl}/wp-json/wc/v3/products/${productData.woocommerce_product_id}/variations/${variant.woocommerce_variant_id}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(updateData)
        }
      );

      if (response.ok) {
        results.push({ variation_id: variant.woocommerce_variant_id, success: true });
      } else {
        results.push({ variation_id: variant.woocommerce_variant_id, success: false });
      }
    } catch (error) {
      results.push({ 
        variation_id: variant.woocommerce_variant_id, 
        success: false, 
        error: error.message 
      });
    }
  }

  return {
    processed: variantsData.length,
    succeeded: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    data: { variation_updates: results }
  };
}