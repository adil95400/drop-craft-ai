import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHOPIFY_API_VERSION = '2025-07';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { action, product_ids, job_id, import_settings } = await req.json();
    console.log('🚀 Import to Shopify action:', action);

    switch (action) {
      case 'import_single': {
        const { product_id } = await req.json();
        
        // Fetch supplier product
        const { data: product, error: productError } = await supabaseClient
          .from('supplier_products')
          .select('*')
          .eq('id', product_id)
          .single();

        if (productError) throw productError;

        // Get Shopify credentials from config
        const shopifyDomain = Deno.env.get('SHOPIFY_STORE_PERMANENT_DOMAIN');
        const shopifyToken = Deno.env.get('SHOPIFY_ADMIN_ACCESS_TOKEN');

        if (!shopifyDomain || !shopifyToken) {
          throw new Error('Shopify credentials not configured');
        }

        // Create product in Shopify via Admin API
        const shopifyProduct = {
          product: {
            title: product.name,
            body_html: product.description,
            vendor: product.supplier_name || 'Unknown',
            product_type: product.category || '',
            tags: product.tags?.join(', ') || '',
            variants: [{
              price: product.price?.toString() || '0',
              compare_at_price: product.compare_at_price?.toString(),
              sku: product.sku || '',
              inventory_quantity: product.stock_quantity || 0,
              inventory_management: 'shopify'
            }],
            images: product.images?.map((img: string) => ({ src: img })) || []
          }
        };

        const shopifyResponse = await fetch(
          `https://${shopifyDomain}/admin/api/${SHOPIFY_API_VERSION}/products.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': shopifyToken
            },
            body: JSON.stringify(shopifyProduct)
          }
        );

        if (!shopifyResponse.ok) {
          const error = await shopifyResponse.text();
          throw new Error(`Shopify API error: ${error}`);
        }

        const createdProduct = await shopifyResponse.json();

        // Create mapping
        await supabaseClient
          .from('supplier_product_mappings')
          .insert({
            user_id: user.id,
            supplier_product_id: product_id,
            shopify_product_id: createdProduct.product.id.toString(),
            shopify_variant_ids: createdProduct.product.variants.map((v: any) => v.id),
            mapping_status: 'mapped',
            last_synced_at: new Date().toISOString()
          });

        // Record import history
        await supabaseClient
          .from('import_history')
          .insert({
            user_id: user.id,
            supplier_product_id: product_id,
            shopify_product_id: createdProduct.product.id.toString(),
            action_type: 'create',
            status: 'success',
            import_data: { shopify_product: createdProduct.product }
          });

        return new Response(
          JSON.stringify({
            success: true,
            shopify_product: createdProduct.product,
            message: 'Product imported successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'import_bulk': {
        // Create import job
        const { data: job, error: jobError } = await supabaseClient
          .from('import_jobs')
          .insert({
            user_id: user.id,
            job_type: 'bulk',
            product_ids,
            total_products: product_ids.length,
            status: 'processing',
            import_settings,
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (jobError) throw jobError;

        // Process products asynchronously
        let successful = 0;
        let failed = 0;
        const errors: any[] = [];

        for (const productId of product_ids) {
          try {
            // Import logic similar to import_single
            const { data: product } = await supabaseClient
              .from('supplier_products')
              .select('*')
              .eq('id', productId)
              .single();

            if (!product) {
              failed++;
              errors.push({ product_id: productId, error: 'Product not found' });
              continue;
            }

            // Check if already mapped
            const { data: existingMapping } = await supabaseClient
              .from('supplier_product_mappings')
              .select('*')
              .eq('supplier_product_id', productId)
              .single();

            if (existingMapping && import_settings?.skip_existing) {
              await supabaseClient
                .from('import_history')
                .insert({
                  user_id: user.id,
                  import_job_id: job.id,
                  supplier_product_id: productId,
                  action_type: 'skip',
                  status: 'skipped'
                });
              continue;
            }

            // Create in Shopify (simplified for bulk)
            const shopifyDomain = Deno.env.get('SHOPIFY_STORE_PERMANENT_DOMAIN');
            const shopifyToken = Deno.env.get('SHOPIFY_ADMIN_ACCESS_TOKEN');

            const shopifyProduct = {
              product: {
                title: product.name,
                body_html: product.description,
                vendor: product.supplier_name || 'Unknown',
                variants: [{
                  price: product.price?.toString() || '0',
                  sku: product.sku || '',
                  inventory_quantity: product.stock_quantity || 0
                }],
                images: product.images?.slice(0, 3).map((img: string) => ({ src: img })) || []
              }
            };

            const shopifyResponse = await fetch(
              `https://${shopifyDomain}/admin/api/${SHOPIFY_API_VERSION}/products.json`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Shopify-Access-Token': shopifyToken
                },
                body: JSON.stringify(shopifyProduct)
              }
            );

            if (!shopifyResponse.ok) {
              failed++;
              const error = await shopifyResponse.text();
              errors.push({ product_id: productId, error });
              await supabaseClient
                .from('import_history')
                .insert({
                  user_id: user.id,
                  import_job_id: job.id,
                  supplier_product_id: productId,
                  action_type: 'error',
                  status: 'failed',
                  error_message: error
                });
              continue;
            }

            const createdProduct = await shopifyResponse.json();

            // Create mapping
            await supabaseClient
              .from('supplier_product_mappings')
              .insert({
                user_id: user.id,
                supplier_product_id: productId,
                shopify_product_id: createdProduct.product.id.toString(),
                shopify_variant_ids: createdProduct.product.variants.map((v: any) => v.id),
                mapping_status: 'mapped',
                last_synced_at: new Date().toISOString()
              });

            // Record success
            await supabaseClient
              .from('import_history')
              .insert({
                user_id: user.id,
                import_job_id: job.id,
                supplier_product_id: productId,
                shopify_product_id: createdProduct.product.id.toString(),
                action_type: 'create',
                status: 'success'
              });

            successful++;

          } catch (error: any) {
            failed++;
            errors.push({ product_id: productId, error: error.message });
          }

          // Update job progress
          const processed = successful + failed;
          await supabaseClient
            .from('import_jobs')
            .update({
              processed_products: processed,
              successful_imports: successful,
              failed_imports: failed,
              progress_percentage: Math.round((processed / product_ids.length) * 100),
              error_log: errors
            })
            .eq('id', job.id);
        }

        // Mark job as completed
        await supabaseClient
          .from('import_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);

        return new Response(
          JSON.stringify({
            success: true,
            job_id: job.id,
            successful_imports: successful,
            failed_imports: failed,
            errors: errors.length > 0 ? errors : undefined,
            message: `Bulk import completed: ${successful} success, ${failed} failed`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'check_job_status': {
        const { data: job, error: jobError } = await supabaseClient
          .from('import_jobs')
          .select('*')
          .eq('id', job_id)
          .eq('user_id', user.id)
          .single();

        if (jobError) throw jobError;

        return new Response(
          JSON.stringify({ success: true, job }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync_mapping': {
        const { mapping_id } = await req.json();

        // Get mapping and supplier product
        const { data: mapping, error: mappingError } = await supabaseClient
          .from('supplier_product_mappings')
          .select('*, supplier_products(*)')
          .eq('id', mapping_id)
          .single();

        if (mappingError) throw mappingError;

        const product = (mapping as any).supplier_products;
        const shopifyDomain = Deno.env.get('SHOPIFY_STORE_PERMANENT_DOMAIN');
        const shopifyToken = Deno.env.get('SHOPIFY_ADMIN_ACCESS_TOKEN');

        // Update Shopify product
        const updateData = {
          product: {
            id: mapping.shopify_product_id,
            variants: [{
              id: mapping.shopify_variant_ids[0],
              price: product.price?.toString(),
              inventory_quantity: product.stock_quantity
            }]
          }
        };

        const shopifyResponse = await fetch(
          `https://${shopifyDomain}/admin/api/${SHOPIFY_API_VERSION}/products/${mapping.shopify_product_id}.json`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': shopifyToken
            },
            body: JSON.stringify(updateData)
          }
        );

        if (!shopifyResponse.ok) {
          throw new Error(`Shopify sync failed: ${await shopifyResponse.text()}`);
        }

        // Update mapping
        await supabaseClient
          .from('supplier_product_mappings')
          .update({
            mapping_status: 'syncing',
            last_synced_at: new Date().toISOString()
          })
          .eq('id', mapping_id);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Product synced to Shopify'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error: any) {
    console.error('❌ Import to Shopify error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
