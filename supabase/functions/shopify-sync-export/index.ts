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
        sync_direction: 'export',
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

    // Get products from catalog
    const { data: products, error: productsError } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('user_id', user.id)
      .not('external_id', 'like', 'shopify_%'); // Only export non-Shopify products

    if (productsError) throw new Error('Failed to fetch products');

    let productsCreated = 0;
    let productsUpdated = 0;
    let productsSkipped = 0;
    const errors: string[] = [];

    console.log(`Exporting ${products.length} products to Shopify`);

    for (const product of products) {
      try {
        // Check if product exists in Shopify
        const searchQuery = `
          query SearchProducts($query: String!) {
            products(first: 1, query: $query) {
              edges {
                node {
                  id
                  title
                }
              }
            }
          }
        `;

        const searchResponse = await fetch(
          `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': accessToken,
            },
            body: JSON.stringify({
              query: searchQuery,
              variables: { query: `sku:${product.sku}` }
            }),
          }
        );

        const searchData = await searchResponse.json();
        const existingProduct = searchData.data?.products?.edges[0]?.node;

        if (existingProduct) {
          // Update existing product
          const updateMutation = `
            mutation UpdateProduct($input: ProductInput!) {
              productUpdate(input: $input) {
                product {
                  id
                  title
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `;

          const updateResponse = await fetch(
            `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
              },
              body: JSON.stringify({
                query: updateMutation,
                variables: {
                  input: {
                    id: existingProduct.id,
                    title: product.name,
                    descriptionHtml: product.description,
                    productType: product.category,
                    vendor: product.brand || 'DropCraft',
                    tags: product.tags || [],
                  }
                }
              }),
            }
          );

          const updateData = await updateResponse.json();
          
          if (updateData.data?.productUpdate?.userErrors?.length > 0) {
            errors.push(`Update failed for ${product.name}: ${updateData.data.productUpdate.userErrors[0].message}`);
            productsSkipped++;
          } else {
            productsUpdated++;
          }

        } else {
          // Create new product
          const createMutation = `
            mutation CreateProduct($input: ProductInput!) {
              productCreate(input: $input) {
                product {
                  id
                  title
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `;

          const createResponse = await fetch(
            `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
              },
              body: JSON.stringify({
                query: createMutation,
                variables: {
                  input: {
                    title: product.name,
                    descriptionHtml: product.description,
                    productType: product.category,
                    vendor: product.brand || 'DropCraft',
                    tags: product.tags || [],
                    variants: [{
                      sku: product.sku,
                      price: product.price.toString(),
                      inventoryQuantities: {
                        availableQuantity: product.stock_quantity || 0,
                        locationId: `gid://shopify/Location/1` // Default location
                      }
                    }]
                  }
                }
              }),
            }
          );

          const createData = await createResponse.json();
          
          if (createData.data?.productCreate?.userErrors?.length > 0) {
            errors.push(`Create failed for ${product.name}: ${createData.data.productCreate.userErrors[0].message}`);
            productsSkipped++;
          } else {
            productsCreated++;
            
            // Update catalog with Shopify ID
            await supabase
              .from('catalog_products')
              .update({ 
                external_id: `shopify_${createData.data.productCreate.product.id}`,
                supplier_name: 'Shopify'
              })
              .eq('id', product.id);
          }
        }

      } catch (error: any) {
        errors.push(`Error processing ${product.name}: ${error.message}`);
        productsSkipped++;
      }
    }

    const duration = Date.now() - startTime;

    // Update sync log
    await supabase
      .from('shopify_sync_logs')
      .update({
        status: 'success',
        products_synced: products.length,
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
          total: products.length,
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
        products_synced: products.length,
        products_created: productsCreated,
        products_updated: productsUpdated,
        products_skipped: productsSkipped,
        duration_ms: duration,
        errors: errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Sync export error:', error);

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
