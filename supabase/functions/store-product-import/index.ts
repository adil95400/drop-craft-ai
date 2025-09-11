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
  action: 'import'
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeId, platform, product, action }: RequestBody = await req.json();

    if (action !== 'import') {
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

    // Préparer les données du produit pour l'import
    const productData = {
      external_id: `${platform}_${product.id}`,
      name: product.name,
      description: product.description || '',
      price: product.price || 0,
      currency: 'EUR',
      category: product.category || '',
      brand: store.name || platform,
      sku: product.sku || '',
      image_url: product.images?.[0] || null,
      image_urls: product.images || [],
      tags: product.tags || [],
      supplier_id: storeId,
      supplier_name: store.name,
      supplier_url: store.shop_domain ? `https://${store.shop_domain}` : null,
      availability_status: (product.inventory_quantity || 0) > 0 ? 'in_stock' : 'out_of_stock',
      stock_quantity: product.inventory_quantity || 0,
      cost_price: product.price ? product.price * 0.7 : 0, // 30% de marge par défaut
      profit_margin: 30.0,
      seo_data: {
        title: product.name,
        description: product.description?.substring(0, 160) || '',
        keywords: product.tags || []
      }
    };

    // Insérer le produit dans catalog_products
    const { data: insertedProduct, error: insertError } = await supabase
      .from('catalog_products')
      .insert(productData)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting product:', insertError);
      throw new Error(`Failed to import product: ${insertError.message}`);
    }

    // Logger l'import
    await supabase
      .from('activity_logs')
      .insert({
        user_id: store.user_id,
        action: 'product_imported',
        entity_type: 'product',
        entity_id: insertedProduct.id,
        description: `Imported product "${product.name}" from ${platform}`,
        metadata: { 
          platform, 
          store_id: storeId,
          external_id: product.id,
          price: product.price
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        product: insertedProduct
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in store-product-import:', error);
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