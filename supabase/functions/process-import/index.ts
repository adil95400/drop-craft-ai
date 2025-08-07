import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    );

    const { import_job_id } = await req.json();

    console.log('Processing import job:', import_job_id);

    // Get the import job details
    const { data: importJob, error: jobError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', import_job_id)
      .single();

    if (jobError || !importJob) {
      console.error('Error fetching import job:', jobError);
      return new Response(
        JSON.stringify({ error: 'Import job not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Update status to processing
    await supabase
      .from('import_jobs')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', import_job_id);

    // Process the import based on source type
    let result;
    switch (importJob.source_type) {
      case 'csv':
        result = await processCsvImport(importJob, supabase);
        break;
      case 'shopify':
        result = await processShopifyImport(importJob, supabase);
        break;
      case 'aliexpress':
        result = await processAliExpressImport(importJob, supabase);
        break;
      default:
        throw new Error(`Unsupported source type: ${importJob.source_type}`);
    }

    // Update the import job with results
    await supabase
      .from('import_jobs')
      .update({
        status: result.success ? 'completed' : 'failed',
        processed_rows: result.processed,
        success_rows: result.success_count,
        error_rows: result.error_count,
        errors: result.errors,
        result_data: result.data,
        completed_at: new Date().toISOString()
      })
      .eq('id', import_job_id);

    console.log('Import job completed:', result);

    return new Response(
      JSON.stringify({ success: true, result }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing import:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function processCsvImport(importJob: any, supabase: any) {
  const { file_data, mapping_config, user_id } = importJob;
  const results = {
    success: true,
    processed: 0,
    success_count: 0,
    error_count: 0,
    errors: [] as string[],
    data: []
  };

  try {
    for (const row of file_data) {
      results.processed++;
      
      try {
        // Map CSV fields to product fields
        const productData = {
          user_id,
          name: row[mapping_config.name] || 'Produit sans nom',
          description: row[mapping_config.description] || '',
          price: parseFloat(row[mapping_config.price] || '0'),
          sku: row[mapping_config.sku] || '',
          category: row[mapping_config.category] || '',
          stock_quantity: parseInt(row[mapping_config.stock_quantity] || '0'),
          image_url: row[mapping_config.image_url] || '',
          status: 'active'
        };

        // Insert product
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (error) {
          results.errors.push(`Ligne ${results.processed}: ${error.message}`);
          results.error_count++;
        } else {
          results.success_count++;
          results.data.push(data);
        }
      } catch (rowError) {
        results.errors.push(`Ligne ${results.processed}: ${rowError.message}`);
        results.error_count++;
      }
    }
  } catch (error) {
    results.success = false;
    results.errors.push(`Erreur générale: ${error.message}`);
  }

  return results;
}

async function processShopifyImport(importJob: any, supabase: any) {
  // Simulate Shopify import
  return {
    success: true,
    processed: 10,
    success_count: 8,
    error_count: 2,
    errors: ['Produit 3: Stock indisponible', 'Produit 7: Prix invalide'],
    data: []
  };
}

async function processAliExpressImport(importJob: any, supabase: any) {
  // Simulate AliExpress import
  return {
    success: true,
    processed: 15,
    success_count: 12,
    error_count: 3,
    errors: ['Produit 5: Image non trouvée', 'Produit 9: Description manquante', 'Produit 13: Catégorie invalide'],
    data: []
  };
}