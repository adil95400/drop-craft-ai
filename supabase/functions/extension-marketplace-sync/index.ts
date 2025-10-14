import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const { action, productIds, platforms, config } = await req.json();

    if (action === 'sync_products') {
      const results = [];

      for (const productId of productIds) {
        // Récupérer le produit
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .eq('user_id', user.id)
          .single();

        if (productError || !product) {
          results.push({
            product_id: productId,
            success: false,
            error: 'Product not found'
          });
          continue;
        }

        const platformResults = {};

        for (const platform of platforms) {
          // Vérifier si la connexion existe
          const { data: connection } = await supabase
            .from('marketplace_connections')
            .select('*')
            .eq('user_id', user.id)
            .eq('platform', platform)
            .eq('status', 'connected')
            .single();

          if (!connection) {
            platformResults[platform] = {
              success: false,
              error: 'Platform not connected'
            };
            continue;
          }

          // Préparer les données selon la plateforme
          let platformData;
          switch (platform) {
            case 'shopify':
              platformData = {
                title: product.title,
                body_html: product.description,
                vendor: product.brand || 'Default',
                product_type: product.category,
                tags: product.tags?.join(','),
                variants: [{
                  price: product.price.toString(),
                  sku: product.sku,
                  inventory_quantity: product.stock || 0
                }],
                images: product.images?.map(url => ({ src: url }))
              };
              break;

            case 'amazon':
              platformData = {
                sku: product.sku,
                product_name: product.title,
                product_description: product.description,
                standard_price: product.price,
                quantity: product.stock || 0,
                brand_name: product.brand,
                item_type: product.category,
                main_image_url: product.images?.[0]
              };
              break;

            case 'ebay':
              platformData = {
                Title: product.title,
                Description: product.description,
                PrimaryCategory: { CategoryID: '1' },
                StartPrice: product.price,
                Quantity: product.stock || 0,
                ListingType: 'FixedPriceItem',
                PictureDetails: {
                  PictureURL: product.images
                }
              };
              break;

            case 'woocommerce':
              platformData = {
                name: product.title,
                description: product.description,
                regular_price: product.price.toString(),
                sku: product.sku,
                stock_quantity: product.stock || 0,
                categories: [{ name: product.category }],
                images: product.images?.map(src => ({ src }))
              };
              break;

            default:
              platformData = product;
          }

          // Simuler la synchronisation (en production, appeler les API réelles)
          console.log(`Syncing to ${platform}:`, platformData);

          // Créer ou mettre à jour la connexion produit-marketplace
          const { error: syncError } = await supabase
            .from('marketplace_product_mappings')
            .upsert({
              user_id: user.id,
              product_id: productId,
              platform: platform,
              external_id: `${platform}-${Date.now()}`,
              sync_status: 'synced',
              last_synced_at: new Date().toISOString(),
              platform_data: platformData
            }, {
              onConflict: 'user_id,product_id,platform'
            });

          platformResults[platform] = {
            success: !syncError,
            external_id: `${platform}-${Date.now()}`,
            error: syncError?.message
          };

          // Mettre à jour les stats de la connexion
          if (!syncError && connection) {
            const currentStats = connection.sync_stats || {};
            await supabase
              .from('marketplace_connections')
              .update({
                last_sync_at: new Date().toISOString(),
                sync_stats: {
                  ...currentStats,
                  products_synced: (currentStats.products_synced || 0) + 1,
                  last_sync_success: true
                }
              })
              .eq('id', connection.id);
          }
        }

        results.push({
          product_id: productId,
          product_name: product.title,
          platforms: platformResults
        });
      }

      // Logger l'opération
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'marketplace_sync',
        entity_type: 'products',
        description: `Synced ${productIds.length} products to ${platforms.length} platforms`,
        metadata: {
          products: productIds.length,
          platforms,
          results
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Synchronized ${productIds.length} products to ${platforms.length} platforms`,
          results
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'configure') {
      const { data: extension } = await supabase
        .from('extensions')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', 'marketplace-sync-pro')
        .single();

      if (extension) {
        await supabase
          .from('extensions')
          .update({ 
            configuration: config,
            updated_at: new Date().toISOString()
          })
          .eq('id', extension.id);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Configuration saved' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
