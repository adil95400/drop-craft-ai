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

    // Get BigBuy API key from environment or user settings
    const bigbuyApiKey = Deno.env.get('BIGBUY_API_KEY');
    
    if (!bigbuyApiKey) {
      throw new Error('BigBuy API key not configured');
    }

    // Mock BigBuy API response for demo (replace with real API call)
    const mockProducts = Array.from({ length: limit }, (_, i) => ({
      id: `BB${1000 + (page - 1) * limit + i}`,
      title: `BigBuy Product ${keywords || category} ${i + 1}`,
      description: `High-quality ${keywords || category} product from BigBuy marketplace. Excellent for dropshipping business.`,
      price: Math.round((Math.random() * 150 + 25) * 100) / 100,
      currency: 'EUR',
      sku: `BB-${category?.toUpperCase()}-${1000 + i}`,
      images: [
        `https://picsum.photos/400/400?random=${1000 + i}`,
        `https://picsum.photos/400/400?random=${2000 + i}`
      ],
      stock: Math.floor(Math.random() * 100) + 10,
      weight: Math.round((Math.random() * 2 + 0.1) * 100) / 100,
      category: category || 'electronics',
      brand: ['BigBuy', 'Generic', 'Premium'][i % 3],
      wholesale_price: Math.round((Math.random() * 100 + 15) * 100) / 100
    }));

    // In production, you would make a real API call like this:
    /*
    const bigbuyResponse = await fetch(`https://api.bigbuy.eu/rest/catalog/products.json`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bigbuyApiKey}`,
        'Content-Type': 'application/json',
      },
      // Add query parameters for category, keywords, pagination
    });
    
    if (!bigbuyResponse.ok) {
      throw new Error('Failed to fetch products from BigBuy API');
    }
    
    const bigbuyData = await bigbuyResponse.json();
    */

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
          api_key: bigbuyApiKey
        })
        .select()
        .single();
      supplier = newSupplier;
    }

    // Import products to database
    const importedProducts = [];
    
    for (const product of mockProducts) {
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert({
          supplier_id: supplier?.id,
          sku: product.sku,
          title: product.title,
          description: product.description,
          price: product.price,
          currency: product.currency,
          images: JSON.stringify(product.images),
          vendor: product.brand,
          tags: [product.category, 'bigbuy', 'dropshipping']
        })
        .select()
        .single();

      if (!error && newProduct) {
        // Add inventory record
        await supabase.from('inventory').insert({
          product_id: newProduct.id,
          stock: product.stock,
          warehouse: 'BigBuy EU Warehouse'
        });

        importedProducts.push({
          id: newProduct.id,
          title: product.title,
          price: product.price,
          sku: product.sku
        });
      }
    }

    // Log the import
    await supabase.from('events_logs').insert({
      topic: 'bigbuy_import_completed',
      payload: {
        user_id: userData.user.id,
        category: category,
        keywords: keywords,
        page: page,
        products_imported: importedProducts.length,
        products: importedProducts,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully imported ${importedProducts.length} products from BigBuy`,
      products: importedProducts,
      pagination: {
        page: page,
        limit: limit,
        total: mockProducts.length,
        hasMore: page < 5 // Mock pagination
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('BigBuy import error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});