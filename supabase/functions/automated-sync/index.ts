import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncJob {
  id: string;
  user_id: string;
  supplier_id: string;
  job_type: 'full_sync' | 'incremental' | 'inventory_only' | 'price_only';
  status: string;
  scheduled_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔄 Starting automated sync process...');

    // Get pending sync jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(10);

    if (jobsError) {
      console.error('❌ Error fetching sync jobs:', jobsError);
      throw jobsError;
    }

    console.log(`📋 Found ${jobs?.length || 0} pending sync jobs`);

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending sync jobs',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    // Process each job
    for (const job of jobs) {
      console.log(`🚀 Processing sync job: ${job.id}`);
      
      try {
        // Update job status to running
        await supabase
          .from('import_jobs')
          .update({ 
            status: 'running',
            started_at: new Date().toISOString()
          })
          .eq('id', job.id);

        // Process different job types
        const result = await processSyncJob(job, supabase);
        
        // Update job status to completed
        await supabase
          .from('import_jobs')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            result_data: result
          })
          .eq('id', job.id);

        results.push({ jobId: job.id, success: true, result });
        console.log(`✅ Completed sync job: ${job.id}`);

      } catch (error) {
        console.error(`❌ Error processing job ${job.id}:`, error);
        
        // Update job status to failed
        await supabase
          .from('import_jobs')
          .update({ 
            status: 'failed',
            completed_at: new Date().toISOString(),
            errors: [error.message]
          })
          .eq('id', job.id);

        results.push({ jobId: job.id, success: false, error: error.message });
      }
    }

    // Run additional maintenance tasks
    await runMaintenanceTasks(supabase);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${jobs.length} sync jobs`,
        results,
        processed: jobs.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Automated sync error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function processSyncJob(job: any, supabase: any) {
  const { source_type, mapping_config, source_url } = job;
  
  console.log(`📦 Processing ${source_type} sync for user ${job.user_id}`);

  switch (source_type) {
    case 'supplier_api':
      return await processSupplierSync(job, supabase);
    
    case 'inventory_update':
      return await processInventorySync(job, supabase);
    
    case 'price_update':
      return await processPriceSync(job, supabase);
    
    case 'order_sync':
      return await processOrderSync(job, supabase);
    
    default:
      throw new Error(`Unknown sync type: ${source_type}`);
  }
}

async function processSupplierSync(job: any, supabase: any) {
  console.log(`🔗 Syncing supplier products for job ${job.id}`);
  
  // Get user's suppliers with their integrations
  const { data: suppliers, error: suppliersError } = await supabase
    .from('suppliers')
    .select('*')
    .eq('user_id', job.user_id)
    .eq('status', 'active');

  if (suppliersError) throw suppliersError;

  let totalProcessed = 0;
  let totalErrors = 0;

  for (const supplier of suppliers || []) {
    try {
      console.log(`🔄 Fetching products from ${supplier.name} (${supplier.supplier_type})`);
      
      let products = [];
      
      // Call appropriate supplier connector based on type
      switch (supplier.supplier_type) {
        case 'bigbuy':
          const bigbuyResult = await supabase.functions.invoke('bigbuy-integration', {
            body: {
              action: 'fetch_products',
              supplier_id: supplier.id,
              api_key: supplier.api_credentials?.api_key,
              limit: job.batch_size || 100
            }
          });
          products = bigbuyResult.data?.products || [];
          break;
          
        case 'aliexpress':
          const aliexpressResult = await supabase.functions.invoke('aliexpress-integration', {
            body: {
              action: 'search_products',
              keywords: supplier.search_keywords || 'trending',
              api_key: supplier.api_credentials?.api_key,
              api_secret: supplier.api_credentials?.api_secret,
              limit: job.batch_size || 50
            }
          });
          products = aliexpressResult.data?.products || [];
          break;
          
        default:
          console.warn(`⚠️ Unknown supplier type: ${supplier.supplier_type}. Skipping.`);
          continue;
      }
      
      // Insert/update products
      for (const product of products) {
        try {
          await supabase.from('imported_products').upsert({
            user_id: job.user_id,
            supplier_name: supplier.name,
            supplier_id: supplier.id,
            external_id: product.external_id || product.sku,
            name: product.name || product.title,
            description: product.description,
            price: product.price,
            cost_price: product.cost_price || product.costPrice,
            currency: product.currency || 'EUR',
            sku: product.sku,
            category: product.category,
            brand: product.brand,
            stock_quantity: product.stock || product.stock_quantity || 0,
            image_urls: product.images || product.image_urls || [],
            status: 'draft',
            updated_at: new Date().toISOString()
          }, { onConflict: 'external_id,user_id' });
          totalProcessed++;
        } catch (error) {
          console.error(`Error upserting product ${product.sku}: ${error.message}`);
          totalErrors++;
        }
      }

      console.log(`✅ Processed ${products.length} products from ${supplier.name}`);

    } catch (error) {
      console.error(`❌ Error syncing supplier ${supplier.name}:`, error);
      totalErrors++;
    }
  }

  return {
    type: 'supplier_sync',
    suppliers_processed: suppliers?.length || 0,
    products_processed: totalProcessed,
    errors: totalErrors
  };
}

async function processInventorySync(job: any, supabase: any) {
  console.log(`📦 Updating inventory for job ${job.id}`);
  
  // Get products that need inventory updates (grouped by supplier)
  const { data: products, error: productsError } = await supabase
    .from('imported_products')
    .select('*, suppliers!inner(*)')
    .eq('user_id', job.user_id)
    .not('supplier_id', 'is', null)
    .lt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Older than 24h
    .limit(100);

  if (productsError) throw productsError;

  let updated = 0;
  let errors = 0;
  
  // Group products by supplier for batch API calls
  const productsBySupplier = (products || []).reduce((acc, product) => {
    const supplierId = product.supplier_id;
    if (!acc[supplierId]) acc[supplierId] = [];
    acc[supplierId].push(product);
    return acc;
  }, {} as Record<string, any[]>);
  
  for (const [supplierId, supplierProducts] of Object.entries(productsBySupplier)) {
    const supplier = supplierProducts[0].suppliers;
    
    try {
      // Fetch fresh inventory data from supplier API
      let inventoryData = [];
      
      switch (supplier.supplier_type) {
        case 'bigbuy':
          const bigbuyResult = await supabase.functions.invoke('bigbuy-integration', {
            body: {
              action: 'fetch_inventory',
              product_ids: supplierProducts.map(p => p.external_id),
              api_key: supplier.api_credentials?.api_key
            }
          });
          inventoryData = bigbuyResult.data?.inventory || [];
          break;
          
        case 'aliexpress':
          // AliExpress doesn't have direct inventory API, skip
          console.log(`⚠️ Inventory sync not supported for AliExpress`);
          continue;
          
        default:
          console.warn(`⚠️ Unknown supplier type: ${supplier.supplier_type}`);
          continue;
      }
      
      // Update products with fresh inventory data
      for (const inventoryItem of inventoryData) {
        const product = supplierProducts.find(p => p.external_id === inventoryItem.product_id);
        if (!product) continue;
        
        await supabase
          .from('imported_products')
          .update({ 
            stock_quantity: inventoryItem.stock || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);
        
        updated++;
      }
      
    } catch (error) {
      console.error(`❌ Error updating inventory for supplier ${supplier.name}:`, error);
      errors += supplierProducts.length;
    }
  }

  return {
    type: 'inventory_sync',
    products_updated: updated,
    errors
  };
}

async function processPriceSync(job: any, supabase: any) {
  console.log(`💰 Updating prices for job ${job.id}`);
  
  // Get products for price updates (grouped by supplier)
  const { data: products, error: productsError } = await supabase
    .from('imported_products')
    .select('*, suppliers!inner(*)')
    .eq('user_id', job.user_id)
    .not('supplier_id', 'is', null)
    .limit(50);

  if (productsError) throw productsError;

  let updated = 0;
  let errors = 0;
  
  // Group products by supplier for batch API calls
  const productsBySupplier = (products || []).reduce((acc, product) => {
    const supplierId = product.supplier_id;
    if (!acc[supplierId]) acc[supplierId] = [];
    acc[supplierId].push(product);
    return acc;
  }, {} as Record<string, any[]>);
  
  for (const [supplierId, supplierProducts] of Object.entries(productsBySupplier)) {
    const supplier = supplierProducts[0].suppliers;
    
    try {
      // Fetch fresh pricing data from supplier API
      let pricingData = [];
      
      switch (supplier.supplier_type) {
        case 'bigbuy':
          const bigbuyResult = await supabase.functions.invoke('bigbuy-integration', {
            body: {
              action: 'fetch_pricing',
              product_ids: supplierProducts.map(p => p.external_id),
              api_key: supplier.api_credentials?.api_key
            }
          });
          pricingData = bigbuyResult.data?.pricing || [];
          break;
          
        case 'aliexpress':
          const aliexpressResult = await supabase.functions.invoke('aliexpress-integration', {
            body: {
              action: 'get_product_details',
              product_ids: supplierProducts.map(p => p.external_id),
              api_key: supplier.api_credentials?.api_key,
              api_secret: supplier.api_credentials?.api_secret
            }
          });
          pricingData = aliexpressResult.data?.products || [];
          break;
          
        default:
          console.warn(`⚠️ Unknown supplier type: ${supplier.supplier_type}`);
          continue;
      }
      
      // Update products with fresh pricing data
      for (const priceItem of pricingData) {
        const product = supplierProducts.find(p => p.external_id === priceItem.product_id || p.external_id === priceItem.id);
        if (!product) continue;
        
        await supabase
          .from('imported_products')
          .update({ 
            price: priceItem.price || priceItem.retail_price,
            cost_price: priceItem.cost_price || priceItem.wholesale_price,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);
        
        updated++;
      }
      
    } catch (error) {
      console.error(`❌ Error updating prices for supplier ${supplier.name}:`, error);
      errors += supplierProducts.length;
    }
  }

  return {
    type: 'price_sync',
    products_updated: updated,
    errors
  };
}

async function processOrderSync(job: any, supabase: any) {
  console.log(`📋 Syncing orders for job ${job.id}`);
  
  // Get recent orders for tracking updates (with marketplace integration)
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*, marketplace_integrations!inner(*)')
    .eq('user_id', job.user_id)
    .not('platform_order_id', 'is', null)
    .in('status', ['pending', 'processing', 'shipped'])
    .limit(20);

  if (ordersError) throw ordersError;

  let updated = 0;
  let errors = 0;
  
  for (const order of orders || []) {
    try {
      const integration = order.marketplace_integrations;
      
      // Fetch order status from marketplace
      let orderStatus = null;
      
      switch (integration.platform) {
        case 'shopify':
          // Shopify order sync would go here
          console.log(`⚠️ Shopify order sync not yet implemented for order ${order.id}`);
          break;
          
        case 'woocommerce':
          // WooCommerce order sync would go here
          console.log(`⚠️ WooCommerce order sync not yet implemented for order ${order.id}`);
          break;
          
        case 'amazon':
          // Amazon order sync would go here
          console.log(`⚠️ Amazon order sync not yet implemented for order ${order.id}`);
          break;
          
        default:
          console.warn(`⚠️ Unknown marketplace platform: ${integration.platform}`);
          continue;
      }
      
      // Update order status if changed
      if (orderStatus && orderStatus !== order.status) {
        await supabase
          .from('orders')
          .update({ 
            status: orderStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);
        
        updated++;
        console.log(`✅ Updated order ${order.order_number} status: ${order.status} → ${orderStatus}`);
      }
      
    } catch (error) {
      console.error(`❌ Error syncing order ${order.id}:`, error);
      errors++;
    }
  }

  return {
    type: 'order_sync',
    orders_updated: updated,
    errors
  };
}

async function runMaintenanceTasks(supabase: any) {
  console.log('🧹 Running maintenance tasks...');
  
  try {
    // Clean up old logs (older than 30 days)
    await supabase
      .from('activity_logs')
      .delete()
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // Clean up old job records (older than 7 days and completed)
    await supabase
      .from('import_jobs')
      .delete()
      .eq('status', 'completed')
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Update product performance scores
    await updateProductPerformanceScores(supabase);

    console.log('✅ Maintenance tasks completed');
  } catch (error) {
    console.error('❌ Maintenance tasks error:', error);
  }
}

async function updateProductPerformanceScores(supabase: any) {
  const { data: products, error } = await supabase
    .from('imported_products')
    .select('id, stock_quantity, price, updated_at')
    .limit(100);

  if (error) throw error;

  for (const product of products || []) {
    // Calculate performance score based on various factors
    let score = 50; // Base score
    
    // Stock availability
    if (product.stock_quantity > 10) score += 20;
    else if (product.stock_quantity > 0) score += 10;
    
    // Price competitiveness (mock)
    if (product.price < 50) score += 10;
    else if (product.price < 100) score += 5;
    
    // Freshness of data
    const daysSinceUpdate = (Date.now() - new Date(product.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 1) score += 10;
    else if (daysSinceUpdate < 7) score += 5;
    
    // Random market factors
    score += Math.floor(Math.random() * 20) - 10;
    
    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));
    
    await supabase
      .from('imported_products')
      .update({ ai_score: score })
      .eq('id', product.id);
  }
}

// Mock product generation removed - now using real supplier APIs
// See processSupplierSync() for actual API integration with BigBuy and AliExpress