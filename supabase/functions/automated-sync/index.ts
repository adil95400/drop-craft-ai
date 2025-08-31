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
  
  // Get user's suppliers
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
      // Simulate supplier API call (replace with actual API integration)
      const mockProducts = generateMockProducts(supplier.id, 10);
      
      // Insert/update products
      for (const product of mockProducts) {
        try {
          await supabase.from('imported_products').upsert({
            user_id: job.user_id,
            supplier_name: supplier.name,
            ...product,
            updated_at: new Date().toISOString()
          });
          totalProcessed++;
        } catch (error) {
          console.error(`Error upserting product: ${error.message}`);
          totalErrors++;
        }
      }

      console.log(`✅ Processed ${mockProducts.length} products from ${supplier.name}`);

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
  
  // Get products that need inventory updates
  const { data: products, error: productsError } = await supabase
    .from('imported_products')
    .select('*')
    .eq('user_id', job.user_id)
    .lt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Older than 24h
    .limit(100);

  if (productsError) throw productsError;

  let updated = 0;
  
  for (const product of products || []) {
    // Simulate inventory check (replace with actual API call)
    const newStock = Math.floor(Math.random() * 100);
    
    await supabase
      .from('imported_products')
      .update({ 
        stock_quantity: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id);
    
    updated++;
  }

  return {
    type: 'inventory_sync',
    products_updated: updated
  };
}

async function processPriceSync(job: any, supabase: any) {
  console.log(`💰 Updating prices for job ${job.id}`);
  
  // Get products for price updates
  const { data: products, error: productsError } = await supabase
    .from('imported_products')
    .select('*')
    .eq('user_id', job.user_id)
    .limit(50);

  if (productsError) throw productsError;

  let updated = 0;
  
  for (const product of products || []) {
    // Simulate price update (replace with actual API call)
    const priceVariation = 0.9 + Math.random() * 0.2; // ±10%
    const newPrice = Math.round(product.price * priceVariation * 100) / 100;
    
    await supabase
      .from('imported_products')
      .update({ 
        price: newPrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id);
    
    updated++;
  }

  return {
    type: 'price_sync',
    products_updated: updated
  };
}

async function processOrderSync(job: any, supabase: any) {
  console.log(`📋 Syncing orders for job ${job.id}`);
  
  // Get recent orders for tracking updates
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', job.user_id)
    .in('status', ['pending', 'processing', 'shipped'])
    .limit(20);

  if (ordersError) throw ordersError;

  let updated = 0;
  
  for (const order of orders || []) {
    // Simulate order status update
    const statuses = ['processing', 'shipped', 'delivered'];
    const currentIndex = statuses.indexOf(order.status);
    
    if (currentIndex < statuses.length - 1 && Math.random() > 0.7) {
      const newStatus = statuses[currentIndex + 1];
      
      await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);
      
      updated++;
    }
  }

  return {
    type: 'order_sync',
    orders_updated: updated
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

function generateMockProducts(supplierId: string, count: number) {
  const categories = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Beauty'];
  const brands = ['TechPro', 'StyleMax', 'HomeComfort', 'SportElite', 'BeautyPlus'];
  
  return Array.from({ length: count }, (_, i) => ({
    external_id: `${supplierId}_${Date.now()}_${i}`,
    name: `Product ${i + 1} from Supplier ${supplierId}`,
    description: `High-quality product with excellent features. Perfect for daily use.`,
    price: Math.round((Math.random() * 200 + 10) * 100) / 100,
    currency: 'EUR',
    sku: `SKU${supplierId}${i}${Date.now()}`,
    category: categories[Math.floor(Math.random() * categories.length)],
    brand: brands[Math.floor(Math.random() * brands.length)],
    stock_quantity: Math.floor(Math.random() * 100),
    status: 'draft',
    supplier_name: `Supplier ${supplierId}`
  }));
}