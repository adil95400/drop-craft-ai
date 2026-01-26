import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  supplierId: string;
  connectorType: 'cdiscount' | 'eprolo' | 'vidaxl' | 'syncee' | 'printful' | 'bigbuy' | 'cjdropshipping';
  credentials: {
    apiKey?: string;
    apiSecret?: string;
    endpoint?: string;
  };
  options?: {
    fullSync?: boolean;
    category?: string;
    limit?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: userData } = await supabase.auth.getUser(token);
    
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    const { supplierId, connectorType, credentials, options }: SyncRequest = await req.json();

    console.log(`Starting sync for supplier ${supplierId} using ${connectorType}`);

    // Create sync job record
    const { data: syncJob, error: syncJobError } = await supabase
      .from('sync_jobs')
      .insert({
        user_id: userData.user.id,
        supplier_id: supplierId,
        connector_type: connectorType,
        status: 'running',
        started_at: new Date().toISOString(),
        total_products: 0,
        processed_products: 0,
        successful_imports: 0,
        failed_imports: 0,
      })
      .select()
      .single();

    if (syncJobError) throw syncJobError;

    let products: any[] = [];
    let errors: string[] = [];

    try {
      // Fetch products based on connector type
      switch (connectorType) {
        case 'bigbuy':
          products = await fetchBigBuyProducts(credentials, options);
          break;
        case 'cjdropshipping':
          products = await fetchCJDropshippingProducts(credentials, options);
          break;
        case 'eprolo':
          products = await fetchEproloProducts(credentials, options);
          break;
        case 'printful':
          products = await fetchPrintfulProducts(credentials, options);
          break;
        default:
          // For unsupported connectors, fetch from existing supplier_products
          products = await fetchFromDatabase(supabase, userData.user.id, supplierId, options);
      }

      console.log(`Fetched ${products.length} products from ${connectorType}`);

      // Update sync job with total
      await supabase
        .from('sync_jobs')
        .update({ total_products: products.length })
        .eq('id', syncJob.id);

      let successCount = 0;
      let failCount = 0;

      // Process and import products
      for (const product of products) {
        try {
          // Deduplicate based on SKU and supplier
          const { data: existingProduct } = await supabase
            .from('supplier_products')
            .select('id')
            .eq('user_id', userData.user.id)
            .eq('sku', product.sku)
            .eq('supplier_id', supplierId)
            .single();

          const productData = {
            user_id: userData.user.id,
            supplier_id: supplierId,
            title: product.title,
            sku: product.sku,
            description: product.description,
            selling_price: product.price,
            cost_price: product.costPrice,
            currency: product.currency || 'EUR',
            stock_quantity: product.stock,
            category: product.category,
            brand: product.brand,
            images: product.images,
            ean: product.attributes?.ean,
            weight: product.weight,
            external_id: product.id,
            updated_at: new Date().toISOString()
          };

          if (existingProduct?.id) {
            // Update existing product
            const { error } = await supabase
              .from('supplier_products')
              .update(productData)
              .eq('id', existingProduct.id);
            
            if (error) throw error;
          } else {
            // Insert new product
            const { error } = await supabase
              .from('supplier_products')
              .insert({
                ...productData,
                created_at: new Date().toISOString()
              });
            
            if (error) throw error;
          }

          successCount++;
          
          // Update progress every 10 products
          if (successCount % 10 === 0) {
            await supabase
              .from('sync_jobs')
              .update({ 
                processed_products: successCount + failCount,
                successful_imports: successCount,
                failed_imports: failCount 
              })
              .eq('id', syncJob.id);
          }

        } catch (error) {
          console.error(`Failed to import product ${product.sku}:`, error);
          errors.push(`${product.sku}: ${error.message}`);
          failCount++;
        }
      }

      // Complete sync job
      await supabase
        .from('sync_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          processed_products: successCount + failCount,
          successful_imports: successCount,
          failed_imports: failCount,
          error_details: errors.length > 0 ? errors : null,
        })
        .eq('id', syncJob.id);

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: userData.user.id,
        action: 'supplier_sync',
        entity_type: 'supplier',
        entity_id: supplierId,
        description: `Synchronized ${successCount} products from ${connectorType}`,
        details: {
          connector_type: connectorType,
          total_products: products.length,
          successful_imports: successCount,
          failed_imports: failCount,
          sync_job_id: syncJob.id,
        },
      });

      return new Response(JSON.stringify({
        success: true,
        syncJobId: syncJob.id,
        results: {
          total: products.length,
          imported: successCount,
          failed: failCount,
          errors: errors.slice(0, 10),
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      await supabase
        .from('sync_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_details: [error.message],
        })
        .eq('id', syncJob.id);

      throw error;
    }

  } catch (error) {
    console.error('Supplier sync error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Fetch products from database for unsupported connectors
async function fetchFromDatabase(supabase: any, userId: string, supplierId: string, options: any = {}): Promise<any[]> {
  const { data: products } = await supabase
    .from('supplier_products')
    .select('*')
    .eq('user_id', userId)
    .eq('supplier_id', supplierId)
    .limit(options.limit || 100);

  return (products || []).map((p: any) => ({
    id: p.external_id || p.id,
    sku: p.sku,
    title: p.title,
    description: p.description,
    price: p.selling_price,
    costPrice: p.cost_price,
    currency: p.currency,
    stock: p.stock_quantity,
    images: p.images || [],
    category: p.category,
    brand: p.brand,
    attributes: { ean: p.ean },
    weight: p.weight
  }));
}

// Real BigBuy API integration
async function fetchBigBuyProducts(credentials: any, options: any = {}): Promise<any[]> {
  const apiKey = credentials?.apiKey || Deno.env.get('BIGBUY_API_KEY');
  
  if (!apiKey) {
    console.log('BigBuy API key not configured');
    return [];
  }

  try {
    const response = await fetch('https://api.bigbuy.eu/rest/catalog/products.json', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`BigBuy API error: ${response.status}`);
      return [];
    }

    const products = await response.json();
    
    return products.slice(0, options.limit || 50).map((p: any) => ({
      id: p.id || p.sku,
      sku: p.sku,
      title: p.name || p.title,
      description: p.description,
      price: parseFloat(p.retailPrice || p.price) || 0,
      costPrice: parseFloat(p.wholesalePrice || p.cost) || 0,
      currency: 'EUR',
      stock: parseInt(p.stock) || 0,
      images: p.images || [],
      category: p.category,
      brand: p.brand,
      weight: p.weight,
      attributes: { ean: p.ean }
    }));
  } catch (error) {
    console.error('BigBuy fetch error:', error);
    return [];
  }
}

// Real CJ Dropshipping API integration
async function fetchCJDropshippingProducts(credentials: any, options: any = {}): Promise<any[]> {
  const apiKey = credentials?.apiKey || Deno.env.get('CJ_API_KEY');
  
  if (!apiKey) {
    console.log('CJ Dropshipping API key not configured');
    return [];
  }

  try {
    const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/list', {
      method: 'POST',
      headers: {
        'CJ-Access-Token': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageNum: 1,
        pageSize: options.limit || 50
      }),
    });

    if (!response.ok) {
      console.error(`CJ API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const products = data.data?.list || [];
    
    return products.map((p: any) => ({
      id: p.pid,
      sku: p.productSku || p.pid,
      title: p.productName || p.productNameEn,
      description: p.description,
      price: parseFloat(p.sellPrice) || 0,
      costPrice: parseFloat(p.sourcePrice) || 0,
      currency: 'USD',
      stock: parseInt(p.stock) || 0,
      images: p.productImage ? [p.productImage] : [],
      category: p.categoryName,
      brand: p.brand || 'CJ',
      weight: p.productWeight,
      attributes: {}
    }));
  } catch (error) {
    console.error('CJ Dropshipping fetch error:', error);
    return [];
  }
}

// Real Eprolo API integration
async function fetchEproloProducts(credentials: any, options: any = {}): Promise<any[]> {
  const apiKey = credentials?.apiKey || Deno.env.get('EPROLO_API_KEY');
  
  if (!apiKey) {
    console.log('Eprolo API key not configured');
    return [];
  }

  try {
    const response = await fetch('https://api.eprolo.com/api/products/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Eprolo API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const products = data.products || [];
    
    return products.slice(0, options.limit || 50).map((p: any) => ({
      id: p.id,
      sku: p.sku || p.id,
      title: p.title,
      description: p.description,
      price: parseFloat(p.price) || 0,
      costPrice: parseFloat(p.cost) || 0,
      currency: 'USD',
      stock: parseInt(p.inventory) || 0,
      images: p.images || [],
      category: p.category,
      brand: 'Eprolo',
      attributes: {}
    }));
  } catch (error) {
    console.error('Eprolo fetch error:', error);
    return [];
  }
}

// Real Printful API integration
async function fetchPrintfulProducts(credentials: any, options: any = {}): Promise<any[]> {
  const apiKey = credentials?.apiKey || Deno.env.get('PRINTFUL_API_KEY');
  
  if (!apiKey) {
    console.log('Printful API key not configured');
    return [];
  }

  try {
    const response = await fetch('https://api.printful.com/store/products', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Printful API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const products = data.result || [];
    
    return products.slice(0, options.limit || 25).map((p: any) => ({
      id: p.id,
      sku: p.external_id || String(p.id),
      title: p.name,
      description: '',
      price: 0, // Printful prices are variant-specific
      costPrice: 0,
      currency: 'EUR',
      stock: 999, // POD = unlimited
      images: p.thumbnail_url ? [p.thumbnail_url] : [],
      category: 'Print-on-Demand',
      brand: 'Printful',
      attributes: { printable: true }
    }));
  } catch (error) {
    console.error('Printful fetch error:', error);
    return [];
  }
}
