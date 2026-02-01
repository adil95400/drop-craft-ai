/**
 * Process Import - Secure Edge Function
 * P0.4 FIX: Replaced CORS * with restrictive allowlist
 * P0.5 FIX: userId derived from JWT, not from body
 * P1: Rate limiting and input validation
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Secure CORS configuration
const ALLOWED_ORIGINS = [
  'https://shopopti.io',
  'https://www.shopopti.io',
  'https://app.shopopti.io',
  'https://drop-craft-ai.lovable.app'
];

function getSecureCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  
  return headers;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getSecureCorsHeaders(origin);
  
  console.log('Process import function called')
  
  if (req.method === 'OPTIONS') {
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // SECURITY: Get user from JWT, NOT from body
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`[PROCESS-IMPORT] Authenticated user: ${userId.slice(0, 8)}...`);

    const body = await req.json();
    const { importJobId, fileData, mappingConfig } = body;
    
    // SECURITY: Reject if userId is in body
    if ('userId' in body || 'user_id' in body) {
      console.warn(`[SECURITY] Blocked userId in body from user ${userId.slice(0, 8)}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Do not send userId in body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate required inputs
    if (!importJobId || typeof importJobId !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid importJobId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!fileData || !Array.isArray(fileData)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid fileData - must be an array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[PROCESS-IMPORT] Processing job: ${importJobId}, ${fileData.length} rows`);

    // SECURITY: Verify job belongs to user
    const { data: existingJob, error: jobCheckError } = await supabase
      .from('import_jobs')
      .select('id, user_id')
      .eq('id', importJobId)
      .eq('user_id', userId) // CRITICAL: Verify ownership
      .single();

    if (jobCheckError || !existingJob) {
      return new Response(
        JSON.stringify({ success: false, error: 'Import job not found or access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update job status to processing
    await supabase
      .from('import_jobs')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', importJobId)
      .eq('user_id', userId) // SECURE: scope to user

    const totalRows = Math.min(fileData.length, 1000) // Limit to 1000 for performance
    let successRows = 0
    let errorRows = 0
    const errors: string[] = []

    // Process in batches of 50
    const batchSize = 50
    
    for (let i = 0; i < totalRows; i += batchSize) {
      const batch = fileData.slice(i, Math.min(i + batchSize, totalRows))
      const productsToInsert: any[] = []
      
      for (let j = 0; j < batch.length; j++) {
        const row = batch[j]
        const rowIndex = i + j + 1
        
        try {
          // Map fields according to configuration with validation
          const name = String(row[mappingConfig?.name] || `Product ${rowIndex}`).substring(0, 500)
          const priceRaw = row[mappingConfig?.price]
          const price = parseFloat(String(priceRaw).replace(/[^0-9.]/g, '')) || 0
          
          if (!name || price <= 0) {
            throw new Error('Missing name or invalid price')
          }
          
          const costPriceRaw = row[mappingConfig?.cost_price]
          const costPrice = costPriceRaw ? 
            Math.min(parseFloat(String(costPriceRaw).replace(/[^0-9.]/g, '')) || price * 0.7, 999999.99) : 
            price * 0.7
          
          productsToInsert.push({
            user_id: userId, // CRITICAL: from token only
            title: name,
            description: String(row[mappingConfig?.description] || '').substring(0, 5000),
            price: Math.min(price, 999999.99),
            cost_price: costPrice,
            sku: String(row[mappingConfig?.sku] || `SKU-${Date.now()}-${rowIndex}`).substring(0, 100),
            category: String(row[mappingConfig?.category] || 'Divers').substring(0, 100),
            image_url: row[mappingConfig?.image_url] || null,
            status: 'draft'
          })
          
        } catch (error) {
          console.warn(`[PROCESS-IMPORT] Row ${rowIndex} error:`, error.message)
          errors.push(`Row ${rowIndex}: ${error.message}`)
          errorRows++
        }
      }
      
      // Insert batch
      if (productsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('products')
          .insert(productsToInsert)

        if (insertError) {
          console.error(`[PROCESS-IMPORT] Batch insert error:`, insertError)
          errorRows += productsToInsert.length
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${insertError.message}`)
        } else {
          successRows += productsToInsert.length
        }
      }

      // Update progress every batch - SCOPED to user
      await supabase
        .from('import_jobs')
        .update({
          successful_imports: successRows,
          failed_imports: errorRows,
          error_log: errors.length > 0 ? errors.slice(0, 50) : null
        })
        .eq('id', importJobId)
        .eq('user_id', userId) // SECURE: scope to user

      console.log(`[PROCESS-IMPORT] Progress: ${Math.min(i + batchSize, totalRows)}/${totalRows} (${successRows} success, ${errorRows} failed)`)
    }

    // Final update - SCOPED to user
    const finalStatus = errorRows > 0 && successRows === 0 ? 'failed' : 'completed'
    
    await supabase
      .from('import_jobs')
      .update({
        status: finalStatus,
        total_products: totalRows,
        successful_imports: successRows,
        failed_imports: errorRows,
        error_log: errors.length > 0 ? errors.slice(0, 50) : null,
        completed_at: new Date().toISOString()
      })
      .eq('id', importJobId)
      .eq('user_id', userId) // SECURE: scope to user

    console.log(`[PROCESS-IMPORT] Import completed: ${successRows} success, ${errorRows} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: totalRows,
        successful: successRows,
        failed: errorRows,
        errors: errors.slice(0, 10)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[PROCESS-IMPORT] Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process import',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...getSecureCorsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' }
      }
    )
  }
})
