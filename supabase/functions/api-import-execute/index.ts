import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let jobId: string | null = null;
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const body = await req.json();
    const { job_id, user_id, config } = body;

    console.log('[API-IMPORT] Starting import', { job_id, user_id, has_config: !!config });

    // Get or create import job
    let importJob: any;
    
    if (job_id) {
      // Fetch existing job (called by cron)
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('id', job_id)
        .single();
      
      if (error || !data) {
        throw new Error(`Import job ${job_id} not found`);
      }
      
      importJob = data;
      jobId = importJob.id;
      
      console.log('[API-IMPORT] Processing existing job', { 
        job_id: importJob.id, 
        source_type: importJob.source_type,
        status: importJob.status 
      });

      // Update status to processing
      await supabase
        .from('import_jobs')
        .update({ 
          status: 'processing',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
        
    } else {
      // Create new job (manual API call)
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        throw new Error('Authentication required');
      }
      
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        throw new Error('User not found');
      }

      if (!config || !config.url) {
        throw new Error('API URL is required');
      }

      const { data, error } = await supabase
        .from('import_jobs')
        .insert({
          user_id: user.id,
          source_type: 'api',
          source_url: config.url,
          configuration: config,
          status: 'processing',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      importJob = data;
      jobId = importJob.id;
      
      console.log('[API-IMPORT] Created new job', { job_id: importJob.id });
    }

    // Get config from job or from request
    const importConfig = config || importJob.configuration;
    if (!importConfig || !importConfig.url) {
      throw new Error('Invalid import configuration');
    }

    // Build API request headers
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json',
      ...importConfig.headers 
    };
    
    // Add authentication
    if (importConfig.authentication) {
      switch (importConfig.authentication.type) {
        case 'bearer':
          if (importConfig.authentication.token) {
            headers['Authorization'] = `Bearer ${importConfig.authentication.token}`;
          }
          break;
        case 'api_key':
          if (importConfig.authentication.api_key_header && importConfig.authentication.api_key_value) {
            headers[importConfig.authentication.api_key_header] = importConfig.authentication.api_key_value;
          }
          break;
        case 'basic':
          if (importConfig.authentication.username && importConfig.authentication.password) {
            const credentials = btoa(`${importConfig.authentication.username}:${importConfig.authentication.password}`);
            headers['Authorization'] = `Basic ${credentials}`;
          }
          break;
      }
    }

    console.log('[API-IMPORT] Fetching data from API', { url: importConfig.url });

    // Fetch data with pagination
    let allProducts: any[] = [];
    let currentPage = 1;
    const maxPages = importConfig.pagination?.max_pages || 1;
    const pageSize = importConfig.pagination?.page_size || 100;

    while (currentPage <= maxPages) {
      // Check for timeout (5 minutes max)
      const elapsed = Date.now() - startTime;
      if (elapsed > 300000) {
        console.warn('[API-IMPORT] Timeout warning, stopping fetch', { elapsed, currentPage });
        break;
      }

      let url = importConfig.url;
      
      if (importConfig.pagination?.enabled) {
        const separator = url.includes('?') ? '&' : '?';
        const pageParam = importConfig.pagination.page_param || 'page';
        const sizeParam = importConfig.pagination.size_param || 'limit';
        
        if (importConfig.pagination.type === 'page') {
          url += `${separator}${pageParam}=${currentPage}&${sizeParam}=${pageSize}`;
        } else if (importConfig.pagination.type === 'offset') {
          const offset = (currentPage - 1) * pageSize;
          url += `${separator}offset=${offset}&${sizeParam}=${pageSize}`;
        }
      }

      console.log('[API-IMPORT] Fetching page', { page: currentPage, url });

      const fetchOptions: RequestInit = {
        method: importConfig.method || 'GET',
        headers,
      };

      if (importConfig.method === 'POST' && importConfig.body) {
        fetchOptions.body = typeof importConfig.body === 'string' 
          ? importConfig.body 
          : JSON.stringify(importConfig.body);
      }

      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();

      // Extract products from response using data_path
      let products = data;
      if (importConfig.data_path && importConfig.data_path !== '$') {
        const path = importConfig.data_path.replace(/^\$\./, '').split('.');
        for (const key of path) {
          products = products?.[key];
          if (!products) {
            console.warn('[API-IMPORT] Data path not found', { path: importConfig.data_path, key });
            break;
          }
        }
      }

      if (!Array.isArray(products)) {
        products = [products];
      }

      console.log('[API-IMPORT] Fetched products', { page: currentPage, count: products.length });

      if (products.length === 0) {
        console.log('[API-IMPORT] No more products, stopping pagination');
        break;
      }

      allProducts = allProducts.concat(products);

      // Update progress
      await supabase
        .from('import_jobs')
        .update({
          total_rows: allProducts.length,
          processed_rows: allProducts.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (!importConfig.pagination?.enabled) {
        break;
      }

      currentPage++;
    }

    console.log('[API-IMPORT] Total products fetched', { count: allProducts.length });

    // Map products to database schema
    const mappedProducts = allProducts.map(product => {
      const mapped: any = {
        user_id: importJob.user_id,
        status: 'draft',
        import_job_id: jobId
      };

      // Apply field mapping
      for (const [apiField, productField] of Object.entries(importConfig.field_mapping || {})) {
        if (product[apiField] !== undefined && product[apiField] !== null) {
          mapped[productField] = product[apiField];
        }
      }

      // Fallback mappings for common fields
      if (!mapped.name) {
        mapped.name = product.name || product.title || product.product_name || 'Sans nom';
      }
      if (!mapped.price && product.price !== undefined) {
        mapped.price = parseFloat(product.price) || 0;
      }
      if (!mapped.description) {
        mapped.description = product.description || product.desc || null;
      }
      if (!mapped.sku) {
        mapped.sku = product.sku || product.id || null;
      }
      if (!mapped.image_url && product.image) {
        mapped.image_url = product.image;
      }

      return mapped;
    });

    console.log('[API-IMPORT] Mapped products', { count: mappedProducts.length });

    // Insert products in batches
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < mappedProducts.length; i += batchSize) {
      const batch = mappedProducts.slice(i, i + batchSize);
      
      console.log('[API-IMPORT] Inserting batch', { 
        start: i, 
        end: i + batch.length,
        total: mappedProducts.length 
      });

      const { error: insertError } = await supabase
        .from('imported_products')
        .insert(batch);

      if (insertError) {
        console.error('[API-IMPORT] Batch insert error', { error: insertError.message });
        errorCount += batch.length;
        errors.push(`Batch ${i}-${i + batch.length}: ${insertError.message}`);
      } else {
        successCount += batch.length;
      }

      // Update progress
      await supabase
        .from('import_jobs')
        .update({
          processed_rows: Math.min(i + batch.length, mappedProducts.length),
          success_rows: successCount,
          error_rows: errorCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
    }

    const executionTime = Date.now() - startTime;

    console.log('[API-IMPORT] Import completed', {
      job_id: jobId,
      total: allProducts.length,
      success: successCount,
      errors: errorCount,
      duration_ms: executionTime
    });

    // Mark job as completed or failed
    const finalStatus = errorCount === mappedProducts.length ? 'failed' : 'completed';
    
    await supabase
      .from('import_jobs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        total_rows: allProducts.length,
        processed_rows: mappedProducts.length,
        success_rows: successCount,
        error_rows: errorCount,
        errors: errors.length > 0 ? errors : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    return new Response(
      JSON.stringify({
        success: finalStatus === 'completed',
        job_id: jobId,
        total_products: allProducts.length,
        imported: successCount,
        errors: errorCount,
        error_details: errors.length > 0 ? errors : undefined,
        execution_time_ms: executionTime
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('[API-IMPORT] Fatal error', { 
      error: error.message, 
      stack: error.stack,
      job_id: jobId 
    });

    // Try to mark job as failed
    if (jobId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from('import_jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            errors: [error.message],
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      } catch (updateError) {
        console.error('[API-IMPORT] Failed to update job status', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        job_id: jobId,
        execution_time_ms: executionTime
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
