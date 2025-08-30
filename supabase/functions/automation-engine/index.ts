import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AUTOMATION-ENGINE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { action, jobId, jobType, userId, inputData } = await req.json();
    logStep('Automation request', { action, jobType, userId });

    switch (action) {
      case 'create_job':
        return await createAutomationJob(supabase, { jobType, userId, inputData });
      case 'process_job':
        return await processAutomationJob(supabase, jobId);
      case 'schedule_jobs':
        return await scheduleAutomationJobs(supabase);
      case 'get_status':
        return await getJobStatus(supabase, jobId);
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    logStep('Automation error', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function createAutomationJob(supabase: any, { jobType, userId, inputData }: any) {
  logStep('Creating automation job', { jobType, userId });

  const { data: job, error } = await supabase
    .from('automation_jobs')
    .insert({
      user_id: userId,
      job_type: jobType,
      status: 'pending',
      input_data: inputData || {},
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  // Start processing immediately for manual jobs
  if (inputData?.immediate) {
    setTimeout(() => processAutomationJob(supabase, job.id), 1000);
  }

  return new Response(JSON.stringify({ success: true, jobId: job.id }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
}

async function processAutomationJob(supabase: any, jobId: string) {
  logStep('Processing automation job', { jobId });

  const { data: job, error: fetchError } = await supabase
    .from('automation_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (fetchError || !job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  // Update job status to running
  await supabase
    .from('automation_jobs')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
      progress: 0
    })
    .eq('id', jobId);

  try {
    let result;
    switch (job.job_type) {
      case 'sync_inventory':
        result = await syncInventoryAutomation(supabase, job);
        break;
      case 'update_prices':
        result = await updatePricesAutomation(supabase, job);
        break;
      case 'import_catalog':
        result = await importCatalogAutomation(supabase, job);
        break;
      case 'sync_orders':
        result = await syncOrdersAutomation(supabase, job);
        break;
      case 'cleanup_data':
        result = await cleanupDataAutomation(supabase, job);
        break;
      default:
        throw new Error(`Unknown job type: ${job.job_type}`);
    }

    // Mark job as completed
    await supabase
      .from('automation_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress: 100,
        output_data: result
      })
      .eq('id', jobId);

    logStep('Job completed', { jobId, result });

  } catch (error) {
    logStep('Job failed', { jobId, error: error.message });
    
    await supabase
      .from('automation_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message
      })
      .eq('id', jobId);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
}

async function syncInventoryAutomation(supabase: any, job: any) {
  logStep('Running inventory sync automation', { userId: job.user_id });

  // Get user's integrations
  const { data: integrations } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', job.user_id)
    .eq('is_active', true);

  let syncedCount = 0;
  const results = [];

  for (const integration of integrations || []) {
    try {
      // Get products to sync
      const { data: products } = await supabase
        .from('imported_products')
        .select('*')
        .eq('user_id', job.user_id)
        .eq('status', 'active')
        .limit(100);

      for (const product of products || []) {
        // Sync inventory for each product
        await syncProductInventory(supabase, integration, product);
        syncedCount++;

        // Update progress
        const progress = Math.floor((syncedCount / (products?.length || 1)) * 100);
        await supabase
          .from('automation_jobs')
          .update({ progress })
          .eq('id', job.id);
      }

      results.push({
        integration: integration.platform_name,
        syncedProducts: products?.length || 0
      });

    } catch (error) {
      results.push({
        integration: integration.platform_name,
        error: error.message
      });
    }
  }

  return { syncedCount, results };
}

async function updatePricesAutomation(supabase: any, job: any) {
  logStep('Running price update automation', { userId: job.user_id });

  // Get products with price alerts or competitive pricing rules
  const { data: products } = await supabase
    .from('imported_products')
    .select('*')
    .eq('user_id', job.user_id)
    .not('cost_price', 'is', null);

  let updatedCount = 0;
  const results = [];

  for (const product of products || []) {
    try {
      // Calculate optimal price based on cost and market data
      const newPrice = await calculateOptimalPrice(product);
      
      if (newPrice !== product.price) {
        await supabase
          .from('imported_products')
          .update({ 
            price: newPrice,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);

        // Log price change
        await supabase
          .from('inventory_sync_log')
          .insert({
            user_id: job.user_id,
            product_id: product.id,
            platform: 'automation',
            sync_type: 'price',
            old_value: { price: product.price },
            new_value: { price: newPrice },
            status: 'completed',
            synced_at: new Date().toISOString()
          });

        updatedCount++;
        results.push({
          productId: product.id,
          oldPrice: product.price,
          newPrice: newPrice
        });
      }

    } catch (error) {
      results.push({
        productId: product.id,
        error: error.message
      });
    }
  }

  return { updatedCount, results };
}

async function importCatalogAutomation(supabase: any, job: any) {
  logStep('Running catalog import automation', { userId: job.user_id });

  const { supplierId, maxProducts = 1000 } = job.input_data;

  // This would integrate with supplier APIs to import new products
  // For now, we'll simulate the process
  
  let importedCount = 0;
  const results = [];

  try {
    // Simulate catalog import
    for (let i = 0; i < Math.min(maxProducts, 50); i++) {
      const mockProduct = {
        user_id: job.user_id,
        name: `Auto-imported Product ${i + 1}`,
        price: Math.floor(Math.random() * 100) + 10,
        cost_price: Math.floor(Math.random() * 50) + 5,
        supplier_name: 'Automated Supplier',
        status: 'draft',
        review_status: 'pending'
      };

      const { data: product, error } = await supabase
        .from('imported_products')
        .insert(mockProduct)
        .select()
        .single();

      if (error) throw error;

      importedCount++;
      results.push({ productId: product.id, name: product.name });

      // Update progress
      const progress = Math.floor((i / Math.min(maxProducts, 50)) * 100);
      await supabase
        .from('automation_jobs')
        .update({ progress })
        .eq('id', job.id);
    }

  } catch (error) {
    logStep('Import error', error.message);
    throw error;
  }

  return { importedCount, results };
}

async function syncOrdersAutomation(supabase: any, job: any) {
  logStep('Running orders sync automation', { userId: job.user_id });

  // Get orders that need tracking updates
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', job.user_id)
    .in('status', ['processing', 'shipped']);

  let syncedCount = 0;
  const results = [];

  for (const order of orders || []) {
    try {
      if (order.tracking_number) {
        // This would call 17Track API to get status updates
        const trackingInfo = await getMockTrackingInfo(order.tracking_number);
        
        if (trackingInfo.status !== order.status) {
          await supabase
            .from('orders')
            .update({
              status: trackingInfo.status,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);

          syncedCount++;
          results.push({
            orderId: order.id,
            oldStatus: order.status,
            newStatus: trackingInfo.status
          });
        }
      }
    } catch (error) {
      results.push({
        orderId: order.id,
        error: error.message
      });
    }
  }

  return { syncedCount, results };
}

async function cleanupDataAutomation(supabase: any, job: any) {
  logStep('Running data cleanup automation');

  const results = [];

  // Cleanup old security events
  const { error: cleanupError } = await supabase.rpc('cleanup_old_security_events');
  if (cleanupError) {
    results.push({ task: 'security_events_cleanup', error: cleanupError.message });
  } else {
    results.push({ task: 'security_events_cleanup', status: 'completed' });
  }

  // Cleanup processed webhook events older than 30 days
  const { error: webhookError } = await supabase
    .from('webhook_events')
    .delete()
    .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .eq('processed', true);

  if (webhookError) {
    results.push({ task: 'webhook_events_cleanup', error: webhookError.message });
  } else {
    results.push({ task: 'webhook_events_cleanup', status: 'completed' });
  }

  // Cleanup failed import jobs older than 7 days
  const { error: jobsError } = await supabase
    .from('automation_jobs')
    .delete()
    .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .eq('status', 'failed');

  if (jobsError) {
    results.push({ task: 'failed_jobs_cleanup', error: jobsError.message });
  } else {
    results.push({ task: 'failed_jobs_cleanup', status: 'completed' });
  }

  return { cleanupTasks: results };
}

async function scheduleAutomationJobs(supabase: any) {
  logStep('Scheduling automation jobs');

  // Get all scheduled jobs that need to run
  const now = new Date().toISOString();
  const { data: scheduledJobs } = await supabase
    .from('automation_jobs')
    .select('*')
    .neq('schedule_type', 'manual')
    .or(`next_run_at.is.null,next_run_at.lte.${now}`)
    .eq('status', 'pending');

  const scheduledCount = scheduledJobs?.length || 0;

  for (const job of scheduledJobs || []) {
    // Calculate next run time
    const nextRunAt = calculateNextRunTime(job.schedule_type, job.schedule_config);
    
    // Update job with next run time
    await supabase
      .from('automation_jobs')
      .update({ next_run_at: nextRunAt })
      .eq('id', job.id);

    // Process the job
    setTimeout(() => processAutomationJob(supabase, job.id), 1000);
  }

  return new Response(JSON.stringify({ 
    success: true, 
    scheduledJobs: scheduledCount 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
}

async function getJobStatus(supabase: any, jobId: string) {
  const { data: job, error } = await supabase
    .from('automation_jobs')
    .select('id, status, progress, error_message, created_at, started_at, completed_at')
    .eq('id', jobId)
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, job }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
}

// Helper functions
async function syncProductInventory(supabase: any, integration: any, product: any) {
  // Simulate inventory sync
  logStep('Syncing inventory', { product: product.name, platform: integration.platform_name });
}

async function calculateOptimalPrice(product: any): Promise<number> {
  // Simple pricing algorithm: cost price + 40% margin
  const costPrice = product.cost_price || 0;
  const margin = 0.4;
  return Math.round((costPrice * (1 + margin)) * 100) / 100;
}

async function getMockTrackingInfo(trackingNumber: string) {
  // Mock tracking info
  const statuses = ['processing', 'shipped', 'in_transit', 'delivered'];
  return {
    trackingNumber,
    status: statuses[Math.floor(Math.random() * statuses.length)]
  };
}

function calculateNextRunTime(scheduleType: string, config: any): string {
  const now = new Date();
  
  switch (scheduleType) {
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  }
}