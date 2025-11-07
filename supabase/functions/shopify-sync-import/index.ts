import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHOPIFY_API_VERSION = '2025-07';

interface SyncRequest {
  config_id: string;
  sync_type?: 'manual' | 'automatic';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('User not authenticated');

    const { config_id, sync_type = 'manual' }: SyncRequest = await req.json();

    // Get sync config
    const { data: config, error: configError } = await supabase
      .from('shopify_sync_configs')
      .select('*, integrations(*)')
      .eq('id', config_id)
      .eq('user_id', user.id)
      .single();

    if (configError || !config) throw new Error('Sync config not found');

    // Create sync log
    const { data: syncLog, error: logError } = await supabase
      .from('shopify_sync_logs')
      .insert({
        user_id: user.id,
        config_id: config_id,
        sync_direction: 'import',
        sync_type: sync_type,
        status: 'started'
      })
      .select()
      .single();

    if (logError) throw new Error('Failed to create sync log');

    // Update config status
    await supabase
      .from('shopify_sync_configs')
      .update({ sync_status: 'running' })
      .eq('id', config_id);

    const integration = config.integrations;
    const shopDomain = integration.shop_domain;
    const accessToken = integration.encrypted_credentials?.access_token;

    if (!shopDomain || !accessToken) {
      throw new Error('Shopify credentials not found');
    }

    let allProducts: any[] = [];
    let hasNextPage = true;
    let cursor = null;
    let productsCreated = 0;
    let productsUpdated = 0;
    let productsSkipped = 0;
    const errors: string[] = [];

    // Fetch all products using pagination
    while (hasNextPage) {
      const query = `
        query GetProducts($first: Int!, $after: String) {
          products(first: $first, after: $after) {
            edges {
              cursor
              node {
                id
                title
                description
                handle
                vendor
                productType
                tags
                status
                priceRangeV2 {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
                images(first: 10) {
                  edges {
                    node {
                      url
                      altText
                    }
                  }
                }
                variants(first: 100) {
                  edges {
                    node {
                      id
                      title
                      sku
                      price
                      inventoryQuantity
                      availableForSale
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      const response = await fetch(
        `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
          },
          body: JSON.stringify({
            query,
            variables: { first: 50, after: cursor }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      const products = data.data.products.edges;
      allProducts = [...allProducts, ...products];
      
      hasNextPage = data.data.products.pageInfo.hasNextPage;
      cursor = data.data.products.pageInfo.endCursor;
    }

    console.log(`Fetched ${allProducts.length} products from Shopify`);

    // Import products to catalog
    for (const edge of allProducts) {
      const product = edge.node;
      
      try {
        const firstVariant = product.variants.edges[0]?.node;
        const totalStock = product.variants.edges.reduce(
          (sum: number, v: any) => sum + (v.node.inventoryQuantity || 0),
          0
        );

        const productData = {
          external_id: `shopify_${product.id}`,
          name: product.title,
          description: product.description || '',
          price: parseFloat(firstVariant?.price || product.priceRangeV2.minVariantPrice.amount),
          currency: product.priceRangeV2.minVariantPrice.currencyCode,
          category: product.productType || 'Uncategorized',
          brand: product.vendor || '',
          sku: firstVariant?.sku || product.handle,
          image_url: product.images.edges[0]?.node.url || null,
          image_urls: product.images.edges.map((img: any) => img.node.url),
          tags: product.tags,
          supplier_id: integration.id,
          supplier_name: 'Shopify',
          supplier_url: `https://${shopDomain}`,
          availability_status: product.status === 'ACTIVE' ? 'in_stock' : 'out_of_stock',
          stock_quantity: totalStock,
          cost_price: parseFloat(firstVariant?.price || '0') * 0.7,
          profit_margin: 30.0,
          seo_data: {
            title: product.title,
            description: product.description?.substring(0, 160) || '',
            keywords: product.tags || []
          },
          user_id: user.id
        };

        // Check if product exists
        const { data: existing } = await supabase
          .from('catalog_products')
          .select('id')
          .eq('external_id', productData.external_id)
          .eq('user_id', user.id)
          .single();

        if (existing) {
          // Update existing product
          const { error: updateError } = await supabase
            .from('catalog_products')
            .update(productData)
            .eq('id', existing.id);

          if (updateError) {
            errors.push(`Update failed for ${product.title}: ${updateError.message}`);
            productsSkipped++;
          } else {
            productsUpdated++;
          }
        } else {
          // Insert new product
          const { error: insertError } = await supabase
            .from('catalog_products')
            .insert(productData);

          if (insertError) {
            errors.push(`Insert failed for ${product.title}: ${insertError.message}`);
            productsSkipped++;
          } else {
            productsCreated++;
          }
        }
      } catch (error: any) {
        errors.push(`Error processing ${product.title}: ${error.message}`);
        productsSkipped++;
      }
    }

    const duration = Date.now() - startTime;

    // Update sync log
    await supabase
      .from('shopify_sync_logs')
      .update({
        status: 'success',
        products_synced: allProducts.length,
        products_created: productsCreated,
        products_updated: productsUpdated,
        products_skipped: productsSkipped,
        errors: errors.length > 0 ? errors : null,
        duration_ms: duration,
        completed_at: new Date().toISOString()
      })
      .eq('id', syncLog.id);

    // Update sync config
    await supabase
      .from('shopify_sync_configs')
      .update({
        sync_status: 'success',
        last_sync_at: new Date().toISOString(),
        last_sync_result: {
          total: allProducts.length,
          created: productsCreated,
          updated: productsUpdated,
          skipped: productsSkipped,
          errors: errors
        }
      })
      .eq('id', config_id);

    return new Response(
      JSON.stringify({
        success: true,
        products_synced: allProducts.length,
        products_created: productsCreated,
        products_updated: productsUpdated,
        products_skipped: productsSkipped,
        duration_ms: duration,
        errors: errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Sync import error:', error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
