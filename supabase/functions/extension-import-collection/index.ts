import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface BulkImportRequest {
  urls: string[]
  options?: {
    targetStore?: string
    status?: 'draft' | 'active'
    applyRules?: boolean
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Validate token
    const token = req.headers.get('x-extension-token')?.replace(/[^a-zA-Z0-9-_]/g, '')

    if (!token || token.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token d\'extension requis' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify token
    const { data: authData, error: tokenError } = await supabase
      .from('extension_auth_tokens')
      .select('id, user_id')
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (tokenError || !authData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = authData.user_id

    // Parse request
    const { urls, options }: BulkImportRequest = await req.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Liste d\'URLs requise' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Limit to 50 URLs per batch
    const limitedUrls = urls.slice(0, 50)

    console.log('[extension-import-collection] Starting bulk import:', {
      userId,
      urlCount: limitedUrls.length
    })

    // Create import job
    const { data: importJob, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        user_id: userId,
        job_type: 'collection_import',
        status: 'processing',
        total_items: limitedUrls.length,
        processed_items: 0,
        successful_items: 0,
        failed_items: 0,
        source_type: 'extension_bulk',
        settings: options || {},
        started_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (jobError) {
      console.error('[extension-import-collection] Job creation error:', jobError)
      throw jobError
    }

    const jobId = importJob.id

    // Process URLs in background (async)
    // For now, we'll process synchronously but with progress tracking
    const results = {
      imported: [] as string[],
      failed: [] as { url: string; error: string }[],
      skipped: [] as string[]
    }

    // Get user's import rules
    let importRules = null
    if (options?.applyRules) {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('import_rules')
        .eq('user_id', userId)
        .single()
      
      importRules = settings?.import_rules
    }

    // Process URLs in chunks of 5
    const chunkSize = 5
    for (let i = 0; i < limitedUrls.length; i += chunkSize) {
      const chunk = limitedUrls.slice(i, i + chunkSize)
      
      // Process chunk in parallel
      const chunkResults = await Promise.all(
        chunk.map(url => processUrl(url, userId, importRules, options, supabase))
      )

      // Collect results
      chunkResults.forEach((result, idx) => {
        if (result.success) {
          results.imported.push(chunk[idx])
        } else if (result.skipped) {
          results.skipped.push(chunk[idx])
        } else {
          results.failed.push({ url: chunk[idx], error: result.error || 'Unknown error' })
        }
      })

      // Update job progress
      await supabase
        .from('import_jobs')
        .update({
          processed_items: i + chunk.length,
          successful_items: results.imported.length,
          failed_items: results.failed.length,
          progress_log: {
            last_update: new Date().toISOString(),
            current_batch: Math.floor(i / chunkSize) + 1,
            total_batches: Math.ceil(limitedUrls.length / chunkSize)
          }
        })
        .eq('id', jobId)
    }

    // Complete job
    await supabase
      .from('import_jobs')
      .update({
        status: 'completed',
        processed_items: limitedUrls.length,
        successful_items: results.imported.length,
        failed_items: results.failed.length,
        completed_at: new Date().toISOString(),
        result_summary: {
          imported: results.imported.length,
          failed: results.failed.length,
          skipped: results.skipped.length,
          errors: results.failed
        }
      })
      .eq('id', jobId)

    // Log analytics
    await supabase.from('extension_analytics').insert({
      user_id: userId,
      event_type: 'collection_import',
      event_data: {
        job_id: jobId,
        total_urls: limitedUrls.length,
        imported: results.imported.length,
        failed: results.failed.length
      }
    })

    console.log('[extension-import-collection] Complete:', {
      jobId,
      imported: results.imported.length,
      failed: results.failed.length
    })

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        imported: results.imported.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
        errors: results.failed.slice(0, 10), // Return first 10 errors
        message: `Import terminé: ${results.imported.length} produits importés, ${results.failed.length} erreurs`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[extension-import-collection] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processUrl(
  url: string, 
  userId: string, 
  importRules: any,
  options: any,
  supabase: any
): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  try {
    // Check for duplicate
    const { data: existing } = await supabase
      .from('imported_products')
      .select('id')
      .eq('user_id', userId)
      .eq('source_url', url)
      .single()

    if (existing) {
      return { success: false, skipped: true }
    }

    // Call quick-import-url to scrape
    const scrapeResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/quick-import-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({ url })
    })

    if (!scrapeResponse.ok) {
      const error = await scrapeResponse.text()
      return { success: false, error: `Scrape failed: ${error}` }
    }

    const scrapeData = await scrapeResponse.json()

    if (!scrapeData.success || !scrapeData.product) {
      return { success: false, error: scrapeData.error || 'No product data' }
    }

    const product = scrapeData.product

    // Apply pricing rules
    let finalPrice = product.price
    let costPrice = product.price

    if (importRules?.pricing?.enabled) {
      const markup = importRules.pricing.markupValue || 30
      if (importRules.pricing.markupType === 'percentage') {
        finalPrice = costPrice * (1 + markup / 100)
      } else {
        finalPrice = costPrice + markup
      }
    }

    // Insert product
    const { error: insertError } = await supabase
      .from('imported_products')
      .insert({
        user_id: userId,
        name: product.title?.substring(0, 500) || 'Produit importé',
        description: product.description?.substring(0, 10000) || '',
        price: finalPrice,
        cost_price: costPrice,
        currency: product.currency || importRules?.currency || 'EUR',
        sku: product.sku || '',
        category: importRules?.defaultCategory || null,
        image_urls: product.images || [],
        source_url: url,
        source_platform: product.platform || 'web',
        status: options?.status || 'draft',
        sync_status: 'synced',
        metadata: {
          vendor: product.vendor,
          brand: product.brand,
          tags: [...(product.tags || []), ...(importRules?.defaultTags || [])],
          imported_at: new Date().toISOString(),
          bulk_import: true
        }
      })

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    return { success: true }

  } catch (err) {
    return { success: false, error: err.message }
  }
}
