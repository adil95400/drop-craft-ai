import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) throw new Error('Unauthorized');

    const { action, product_id, source_table = 'supplier_products' } = await req.json();

    console.log(`[CROSS-SYNC] Action: ${action}, Product: ${product_id}, User: ${user.id}`);

    if (action === 'sync_product') {
      // Get source product
      const { data: sourceProduct, error: sourceError } = await supabaseClient
        .from(source_table)
        .select('*')
        .eq('id', product_id)
        .eq('user_id', user.id)
        .single();

      if (sourceError) throw sourceError;

      const results = {
        shopify: { success: false, message: '' },
        amazon: { success: false, message: '' },
        ebay: { success: false, message: '' },
        etsy: { success: false, message: '' }
      };

      // 1. Sync to Shopify (if connected)
      const { data: shopifyProducts } = await supabaseClient
        .from('shopify_products')
        .select('*')
        .eq('user_id', user.id)
        .eq('source_sku', sourceProduct.sku)
        .single();

      if (shopifyProducts) {
        try {
          // Update Shopify product stock
          const { data: integration } = await supabaseClient
            .from('integrations')
            .select('*')
            .eq('user_id', user.id)
            .eq('platform_type', 'shopify')
            .eq('is_active', true)
            .single();

          if (integration) {
            const shopifyResponse = await fetch(
              `https://${integration.shop_domain}/admin/api/2024-01/products/${shopifyProducts.shopify_product_id}.json`,
              {
                method: 'PUT',
                headers: {
                  'X-Shopify-Access-Token': integration.access_token!,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  product: {
                    variants: [{
                      inventory_quantity: sourceProduct.stock_quantity
                    }]
                  }
                })
              }
            );

            if (shopifyResponse.ok) {
              results.shopify = { success: true, message: 'Stock updated' };
            }
          }
        } catch (error) {
          results.shopify.message = error.message;
        }
      }

      // 2. Sync to Amazon (if connected)
      const { data: amazonMappings } = await supabaseClient
        .from('marketplace_product_mappings')
        .select('*')
        .eq('user_id', user.id)
        .eq('source_product_id', product_id)
        .eq('marketplace_platform', 'amazon')
        .single();

      if (amazonMappings) {
        try {
          const { data: amazonCreds } = await supabaseClient
            .from('marketplace_connections')
            .select('*')
            .eq('user_id', user.id)
            .eq('platform', 'amazon')
            .eq('is_active', true)
            .single();

          if (amazonCreds) {
            const response = await supabaseClient.functions.invoke('amazon-seller-api', {
              body: {
                action: 'update_inventory',
                credentials: amazonCreds.credentials,
                sku: amazonMappings.marketplace_sku,
                quantity: sourceProduct.stock_quantity
              }
            });

            if (response.data?.success) {
              results.amazon = { success: true, message: 'Stock updated' };
            }
          }
        } catch (error) {
          results.amazon.message = error.message;
        }
      }

      // 3. Sync to eBay (if connected)
      const { data: ebayMappings } = await supabaseClient
        .from('marketplace_product_mappings')
        .select('*')
        .eq('user_id', user.id)
        .eq('source_product_id', product_id)
        .eq('marketplace_platform', 'ebay')
        .single();

      if (ebayMappings) {
        try {
          const { data: ebayCreds } = await supabaseClient
            .from('marketplace_connections')
            .select('*')
            .eq('user_id', user.id)
            .eq('platform', 'ebay')
            .eq('is_active', true)
            .single();

          if (ebayCreds) {
            const response = await supabaseClient.functions.invoke('ebay-trading-api', {
              body: {
                action: 'update_inventory',
                credentials: ebayCreds.credentials,
                itemId: amazonMappings.marketplace_product_id,
                quantity: sourceProduct.stock_quantity
              }
            });

            if (response.data?.success) {
              results.ebay = { success: true, message: 'Stock updated' };
            }
          }
        } catch (error) {
          results.ebay.message = error.message;
        }
      }

      // 4. Sync to Etsy (if connected)
      const { data: etsyMappings } = await supabaseClient
        .from('marketplace_product_mappings')
        .select('*')
        .eq('user_id', user.id)
        .eq('source_product_id', product_id)
        .eq('marketplace_platform', 'etsy')
        .single();

      if (etsyMappings) {
        try {
          const { data: etsyCreds } = await supabaseClient
            .from('marketplace_connections')
            .select('*')
            .eq('user_id', user.id)
            .eq('platform', 'etsy')
            .eq('is_active', true)
            .single();

          if (etsyCreds) {
            const response = await supabaseClient.functions.invoke('etsy-open-api', {
              body: {
                action: 'update_inventory',
                credentials: etsyCreds.credentials,
                listingId: etsyMappings.marketplace_product_id,
                quantity: sourceProduct.stock_quantity
              }
            });

            if (response.data?.success) {
              results.etsy = { success: true, message: 'Stock updated' };
            }
          }
        } catch (error) {
          results.etsy.message = error.message;
        }
      }

      // Log sync event
      await supabaseClient
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action: 'cross_marketplace_sync',
          entity_type: 'product',
          entity_id: product_id,
          description: `Synchronized stock across marketplaces for ${sourceProduct.name}`,
          metadata: results
        });

      return new Response(JSON.stringify({
        success: true,
        product_name: sourceProduct.name,
        stock_quantity: sourceProduct.stock_quantity,
        sync_results: results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'sync_all_products') {
      // Sync all products for user across all marketplaces
      const { data: products } = await supabaseClient
        .from(source_table)
        .select('*')
        .eq('user_id', user.id)
        .limit(100);

      const syncResults = [];
      for (const product of products || []) {
        const result = await supabaseClient.functions.invoke('stock-sync-cross-marketplace', {
          body: {
            action: 'sync_product',
            product_id: product.id,
            source_table
          }
        });
        syncResults.push(result.data);
      }

      return new Response(JSON.stringify({
        success: true,
        products_synced: syncResults.length,
        results: syncResults
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('[CROSS-SYNC] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
