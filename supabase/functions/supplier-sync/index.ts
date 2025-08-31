import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  supplierId: string;
  connectorType: 'cdiscount' | 'eprolo' | 'vidaxl' | 'syncee' | 'printful';
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
        case 'cdiscount':
          products = await fetchCdiscountProducts(credentials, options);
          break;
        case 'eprolo':
          products = await fetchEproloProducts(credentials, options);
          break;
        case 'vidaxl':
          products = await fetchVidaXLProducts(credentials, options);
          break;
        case 'syncee':
          products = await fetchSynceeProducts(credentials, options);
          break;
        case 'printful':
          products = await fetchPrintfulProducts(credentials, options);
          break;
        default:
          throw new Error(`Unsupported connector type: ${connectorType}`);
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
          const existingProduct = await supabase
            .from('imported_products')
            .select('id')
            .eq('user_id', userData.user.id)
            .eq('sku', product.sku)
            .eq('supplier_name', product.supplier.name)
            .single();

          const productData = {
            user_id: userData.user.id,
            name: product.title,
            sku: product.sku,
            description: product.description,
            price: product.price,
            cost_price: product.costPrice,
            currency: product.currency,
            stock_quantity: product.stock,
            category: product.category,
            brand: product.brand,
            image_urls: product.images,
            supplier_name: product.supplier.name,
            supplier_sku: product.supplier.sku,
            weight: product.weight,
            ean: product.attributes?.ean,
            status: 'draft',
            supplier_product_id: product.id,
          };

          if (existingProduct.data) {
            // Update existing product
            const { error } = await supabase
              .from('imported_products')
              .update(productData)
              .eq('id', existingProduct.data.id);
            
            if (error) throw error;
          } else {
            // Insert new product
            const { error } = await supabase
              .from('imported_products')
              .insert(productData);
            
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
        metadata: {
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
          errors: errors.slice(0, 10), // Return first 10 errors
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      // Mark sync job as failed
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

// Connector implementations
async function fetchCdiscountProducts(credentials: any, options: any = {}): Promise<any[]> {
  // Mock implementation for Cdiscount API
  const mockProducts = Array.from({ length: options.limit || 50 }, (_, i) => ({
    id: `CDIS_${1000 + i}`,
    sku: `CDIS-${1000 + i}`,
    title: `Produit Cdiscount ${i + 1}`,
    description: `Description détaillée du produit Cdiscount ${i + 1}`,
    price: Math.round((Math.random() * 200 + 20) * 100) / 100,
    costPrice: Math.round((Math.random() * 100 + 10) * 100) / 100,
    currency: 'EUR',
    stock: Math.floor(Math.random() * 100) + 10,
    images: [`https://picsum.photos/400/400?random=${1000 + i}`],
    category: ['Électronique', 'Maison', 'Jardin', 'Mode'][i % 4],
    brand: ['Samsung', 'Sony', 'Apple', 'LG'][i % 4],
    attributes: { ean: `123456789${1000 + i}` },
    supplier: { id: 'cdiscount', name: 'Cdiscount Pro', sku: `CDIS-${1000 + i}` },
  }));

  return mockProducts;
}

async function fetchEproloProducts(credentials: any, options: any = {}): Promise<any[]> {
  // Mock implementation for Eprolo API
  const mockProducts = Array.from({ length: options.limit || 50 }, (_, i) => ({
    id: `EPR_${2000 + i}`,
    sku: `EPR-${2000 + i}`,
    title: `Eprolo Product ${i + 1}`,
    description: `High-quality dropshipping product ${i + 1}`,
    price: Math.round((Math.random() * 150 + 15) * 100) / 100,
    costPrice: Math.round((Math.random() * 75 + 8) * 100) / 100,
    currency: 'USD',
    stock: Math.floor(Math.random() * 500) + 50,
    images: [`https://picsum.photos/400/400?random=${2000 + i}`],
    category: ['Electronics', 'Fashion', 'Home & Living', 'Sports'][i % 4],
    brand: ['Generic', 'Eprolo', 'Premium', 'Quality'][i % 4],
    attributes: { ean: `234567890${2000 + i}` },
    supplier: { id: 'eprolo', name: 'Eprolo', sku: `EPR-${2000 + i}` },
  }));

  return mockProducts;
}

async function fetchVidaXLProducts(credentials: any, options: any = {}): Promise<any[]> {
  // Mock implementation for VidaXL API
  const mockProducts = Array.from({ length: options.limit || 30 }, (_, i) => ({
    id: `VXL_${3000 + i}`,
    sku: `VXL-${3000 + i}`,
    title: `VidaXL ${['Mobilier', 'Jardin', 'Décoration'][i % 3]} ${i + 1}`,
    description: `Produit VidaXL de qualité supérieure pour ${['la maison', 'le jardin', 'la décoration'][i % 3]}`,
    price: Math.round((Math.random() * 500 + 50) * 100) / 100,
    costPrice: Math.round((Math.random() * 250 + 25) * 100) / 100,
    currency: 'EUR',
    stock: Math.floor(Math.random() * 50) + 5,
    images: [`https://picsum.photos/400/400?random=${3000 + i}`],
    category: ['Mobilier', 'Jardin', 'Décoration'][i % 3],
    brand: 'VidaXL',
    weight: Math.round((Math.random() * 50 + 5) * 100) / 100,
    attributes: { ean: `345678901${3000 + i}` },
    supplier: { id: 'vidaxl', name: 'VidaXL', sku: `VXL-${3000 + i}` },
  }));

  return mockProducts;
}

async function fetchSynceeProducts(credentials: any, options: any = {}): Promise<any[]> {
  // Mock implementation for Syncee API
  const mockProducts = Array.from({ length: options.limit || 40 }, (_, i) => ({
    id: `SYN_${4000 + i}`,
    sku: `SYN-${4000 + i}`,
    title: `Syncee B2B Product ${i + 1}`,
    description: `Professional B2B product sourced through Syncee marketplace`,
    price: Math.round((Math.random() * 300 + 30) * 100) / 100,
    costPrice: Math.round((Math.random() * 150 + 15) * 100) / 100,
    currency: 'EUR',
    stock: Math.floor(Math.random() * 200) + 20,
    images: [`https://picsum.photos/400/400?random=${4000 + i}`],
    category: ['B2B Electronics', 'Professional Tools', 'Office Supplies'][i % 3],
    brand: ['Syncee', 'Professional', 'B2B Quality'][i % 3],
    attributes: { ean: `456789012${4000 + i}` },
    supplier: { id: 'syncee', name: 'Syncee', sku: `SYN-${4000 + i}` },
  }));

  return mockProducts;
}

async function fetchPrintfulProducts(credentials: any, options: any = {}): Promise<any[]> {
  // Mock implementation for Printful API
  const mockProducts = Array.from({ length: options.limit || 25 }, (_, i) => ({
    id: `PRT_${5000 + i}`,
    sku: `PRT-${5000 + i}`,
    title: `Custom ${['T-Shirt', 'Hoodie', 'Mug', 'Poster'][i % 4]} Design ${i + 1}`,
    description: `High-quality print-on-demand ${['apparel', 'accessories', 'home decor'][i % 3]}`,
    price: Math.round((Math.random() * 100 + 10) * 100) / 100,
    costPrice: Math.round((Math.random() * 50 + 5) * 100) / 100,
    currency: 'EUR',
    stock: 999, // Print-on-demand has unlimited stock
    images: [`https://picsum.photos/400/400?random=${5000 + i}`],
    category: 'Print-on-Demand',
    brand: 'Printful',
    attributes: { 
      printable: true,
      print_area: '297x210mm',
      material: ['Cotton', 'Polyester', 'Ceramic', 'Paper'][i % 4]
    },
    supplier: { id: 'printful', name: 'Printful', sku: `PRT-${5000 + i}` },
  }));

  return mockProducts;
}