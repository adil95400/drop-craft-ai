import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, keywords, page = 1, limit = 20 } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth header to identify user
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: userData } = await supabase.auth.getUser(token);
    
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    // Get BigBuy API key from environment
    const bigbuyApiKey = Deno.env.get('BIGBUY_API_KEY');
    
    if (!bigbuyApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'BigBuy API key not configured. Please add BIGBUY_API_KEY in your secrets.',
        products: [],
        pagination: { page, limit, total: 0, hasMore: false }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Real BigBuy API call
    const queryParams = new URLSearchParams();
    if (category) queryParams.append('category', category);
    if (keywords) queryParams.append('search', keywords);
    queryParams.append('page', String(page));
    queryParams.append('limit', String(limit));

    const bigbuyResponse = await fetch(
      `https://api.bigbuy.eu/rest/catalog/products.json?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${bigbuyApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!bigbuyResponse.ok) {
      const errorText = await bigbuyResponse.text();
      console.error('BigBuy API error:', bigbuyResponse.status, errorText);
      return new Response(JSON.stringify({
        success: false,
        error: `BigBuy API error: ${bigbuyResponse.status} - ${errorText}`,
        products: [],
        pagination: { page, limit, total: 0, hasMore: false }
      }), {
        status: bigbuyResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const bigbuyData = await bigbuyResponse.json();
    const products = bigbuyData.products || bigbuyData || [];

    // Get or create BigBuy supplier
    let { data: supplier } = await supabase
      .from('suppliers')
      .select('*')
      .eq('slug', 'bigbuy')
      .single();

    if (!supplier) {
      const { data: newSupplier } = await supabase
        .from('suppliers')
        .insert({
          name: 'BigBuy',
          slug: 'bigbuy',
          api_key: bigbuyApiKey,
          user_id: userData.user.id
        })
        .select()
        .single();
      supplier = newSupplier;
    }

    // Import products to database
    const importedProducts = [];
    
    for (const product of products) {
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert({
          supplier_id: supplier?.id,
          user_id: userData.user.id,
          sku: product.sku || `BB-${product.id}`,
          title: product.name || product.title,
          description: product.description,
          price: product.retailPrice || product.price,
          cost_price: product.wholesalePrice || product.cost_price,
          currency: 'EUR',
          images: JSON.stringify(product.images || []),
          vendor: product.brand || 'BigBuy',
          tags: [product.category, 'bigbuy', 'dropshipping'].filter(Boolean),
          stock_quantity: product.stock || 0,
          status: 'active'
        })
        .select()
        .single();

      if (!error && newProduct) {
        // Add inventory record
        await supabase.from('inventory').insert({
          product_id: newProduct.id,
          stock: product.stock || 0,
          warehouse: 'BigBuy EU Warehouse'
        });

        importedProducts.push({
          id: newProduct.id,
          title: newProduct.title,
          price: newProduct.price,
          sku: newProduct.sku
        });
      }
    }

    // Log the import
    await supabase.from('activity_logs').insert({
      user_id: userData.user.id,
      action: 'bigbuy_import_completed',
      entity_type: 'import',
      description: `Imported ${importedProducts.length} products from BigBuy`,
      details: {
        category,
        keywords,
        page,
        products_imported: importedProducts.length
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully imported ${importedProducts.length} products from BigBuy`,
      products: importedProducts,
      pagination: {
        page: page,
        limit: limit,
        total: products.length,
        hasMore: products.length === limit
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('BigBuy import error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      products: [],
      pagination: { page: 1, limit: 20, total: 0, hasMore: false }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
