/**
 * Bulk Import Products - Secure Implementation
 * P1.1: Auth obligatoire, rate limiting, validation Zod, scoping user_id
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticateUser, logSecurityEvent, checkRateLimit } from '../_shared/secure-auth.ts'
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Input validation
const ProductSchema = z.object({
  name: z.string().max(500).optional(),
  title: z.string().max(500).optional(),
  product_name: z.string().max(500).optional(),
  description: z.string().max(10000).optional(),
  price: z.union([z.string(), z.number()]).optional(),
  cost_price: z.union([z.string(), z.number()]).optional(),
  sku: z.string().max(100).optional(),
  id: z.string().max(100).optional(),
  image_url: z.string().url().optional().or(z.string().max(0)),
  images: z.array(z.string()).max(20).optional(),
  category: z.string().max(200).optional(),
  brand: z.string().max(200).optional(),
  stock_quantity: z.union([z.string(), z.number()]).optional(),
  supplier: z.string().max(200).optional(),
  supplier_name: z.string().max(200).optional(),
  tags: z.array(z.string()).max(30).optional(),
  weight: z.union([z.string(), z.number()]).optional(),
  source_url: z.string().url().optional(),
  url: z.string().url().optional(),
}).passthrough()

const BulkImportSchema = z.object({
  products: z.array(ProductSchema).min(1).max(1000),
  source: z.enum(['supplier', 'csv', 'url', 'shopify', 'api']),
  options: z.object({
    auto_optimize: z.boolean().optional(),
    auto_publish: z.boolean().optional(),
    target_store: z.string().optional(),
  }).optional()
})

// Platform detection
function detectPlatform(url: string): { platform: string; productId: string | null } {
  const urlLower = url.toLowerCase()
  
  if (urlLower.includes('amazon.')) {
    const match = url.match(/\/dp\/([A-Z0-9]+)/i) || url.match(/\/gp\/product\/([A-Z0-9]+)/i)
    return { platform: 'amazon', productId: match?.[1] || null }
  }
  if (urlLower.includes('aliexpress.')) {
    const match = url.match(/item\/(\d+)\.html/) || url.match(/\/(\d+)\.html/)
    return { platform: 'aliexpress', productId: match?.[1] || null }
  }
  if (urlLower.includes('ebay.')) {
    const match = url.match(/\/itm\/(\d+)/)
    return { platform: 'ebay', productId: match?.[1] || null }
  }
  if (urlLower.includes('temu.com')) {
    return { platform: 'temu', productId: null }
  }
  return { platform: 'unknown', productId: null }
}

// Scrape product via quick-import-url function
async function scrapeProductUrl(url: string, userId: string, supabase: any): Promise<any> {
  console.log(`📡 Scraping URL: ${url}`)
  
  try {
    const { data, error } = await supabase.functions.invoke('quick-import-url', {
      body: {
        url,
        user_id: userId,
        action: 'import',
        price_multiplier: 1.5
      }
    })
    
    if (error) {
      console.error(`Scrape error for ${url}:`, error)
      throw error
    }
    
    if (!data?.success) {
      throw new Error(data?.error || 'Scraping failed')
    }
    
    console.log(`✅ Scraped: ${data.data?.name || 'Unknown'}`)
    
    return {
      success: true,
      product: data.data,
      summary: data.summary
    }
  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error)
    return {
      success: false,
      error: error.message || 'Scraping failed'
    }
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req)
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightSecure(req)
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // 1. Auth obligatoire - userId provient du token uniquement
    const { user } = await authenticateUser(req, supabase)
    const userId = user.id
    
    // 2. Rate limiting: max 5 bulk imports per hour
    const rateCheck = await checkRateLimit(supabase, userId, 'bulk_import', 5, 60)
    if (!rateCheck) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded. Max 5 bulk imports per hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Parse and validate input
    const body = await req.json()
    const parseResult = BulkImportSchema.safeParse(body)
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request',
          details: parseResult.error.flatten()
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { products, source, options } = parseResult.data

    console.log(`[SECURE] Starting bulk import of ${products.length} products from ${source} for user ${userId}`)

    // Create import job - SECURE: user_id from token only
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        user_id: userId, // CRITICAL: from token only
        source_platform: source,
        job_type: 'bulk_import',
        status: 'processing',
        total_products: products.length,
        successful_imports: 0,
        failed_imports: 0,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) {
      console.error('Job creation error:', jobError)
      throw new Error(`Failed to create import job: ${jobError.message}`)
    }

    const jobId = job.id
    console.log(`Created import job: ${jobId}`)

    // P1.1: Return job_id immediately, process in background
    // Use fire-and-forget pattern for async processing
    const processPromise = processImportInBackground(supabase, userId, jobId, products, source, options)
    processPromise.catch(err => console.error(`Background import ${jobId} failed:`, err))

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        status: 'processing',
        total: products.length,
        message: `Import job queued with ${products.length} products`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 202
      }
    )

  } catch (error) {
    console.error('Bulk import error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        headers: { ...getSecureCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

// ── Background Processing ───────────────────────────────────────────────────
async function processImportInBackground(
  supabase: any, userId: string, jobId: string,
  products: any[], source: string, options: any
) {
  let succeeded = 0
  let failed = 0
  const errors: string[] = []

  try {
    if (source === 'url') {
      console.log('🔗 Processing URL-based bulk import with full scraping')
      
      for (let i = 0; i < products.length; i++) {
        const product = products[i]
        const sourceUrl = product.source_url || product.url
        
        if (!sourceUrl) {
          failed++
          errors.push(`Product ${i + 1}: No URL provided`)
          continue
        }
        
        try {
          const result = await scrapeProductUrl(sourceUrl, userId, supabase)
          
          if (result.success) {
            succeeded++
            console.log(`✅ Product ${i + 1}/${products.length} imported`)
          } else {
            failed++
            errors.push(`Product ${i + 1}: ${result.error}`)
          }
        } catch (error) {
          failed++
          errors.push(`Product ${i + 1}: ${error.message}`)
        }
        
        // Update job progress - SCOPED to user
        await supabase
          .from('import_jobs')
          .update({
            successful_imports: succeeded,
            failed_imports: failed,
            error_log: errors.length > 0 ? errors : null
          })
          .eq('id', jobId)
          .eq('user_id', userId) // SECURE: scope to user
        
        // Rate limiting between requests
        if (i < products.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    } else {
      // Non-URL import: batch insert (CSV, supplier, etc.)
      const batchSize = 25
      
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, Math.min(i + batchSize, products.length))
        
        try {
          const mappedProducts = batch.map((product, idx) => {
            const price = parseFloat(String(product.price || '0')) || 0
            const costPrice = parseFloat(String(product.cost_price || '0')) || price * 0.6
            
            return {
              user_id: userId, // CRITICAL: from token only
              title: (product.name || product.title || `Product ${i + idx + 1}`).substring(0, 500),
              description: (product.description || '').substring(0, 5000),
              price: Math.min(price, 999999.99),
              cost_price: Math.min(costPrice, 999999.99),
              sku: (product.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`).substring(0, 100),
              category: (product.category || 'Imported').substring(0, 100),
              image_url: product.image_url || (Array.isArray(product.images) ? product.images[0] : null),
              images: Array.isArray(product.images) ? product.images.slice(0, 10) : [],
              stock_quantity: Math.min(parseInt(String(product.stock_quantity || '0')) || 0, 999999),
              status: 'draft',
              tags: Array.isArray(product.tags) ? product.tags.slice(0, 20) : [],
              supplier: product.supplier_name || product.supplier || source,
              weight: Math.min(parseFloat(String(product.weight || '0')) || 0, 9999),
            }
          })

          const { error: insertError } = await supabase
            .from('products')
            .insert(mappedProducts)

          if (insertError) {
            console.error(`Batch ${Math.floor(i / batchSize) + 1} insert error:`, insertError)
            failed += batch.length
            errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${insertError.message}`)
          } else {
            succeeded += batch.length
            console.log(`Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} products imported successfully`)
          }

        } catch (error) {
          console.error(`Batch ${Math.floor(i / batchSize) + 1} processing error:`, error)
          failed += batch.length
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
        }

        // Update job progress - SCOPED to user
        await supabase
          .from('import_jobs')
          .update({
            successful_imports: succeeded,
            failed_imports: failed,
            error_log: errors.length > 0 ? errors : null
          })
          .eq('id', jobId)
          .eq('user_id', userId) // SECURE: scope to user

        console.log(`Progress: ${i + batch.length}/${products.length} (${succeeded} success, ${failed} failed)`)
      }
    }

    // Mark job as completed - SCOPED to user
    const finalStatus = failed > 0 && succeeded === 0 ? 'failed' : 'completed'
    
    await supabase
      .from('import_jobs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        successful_imports: succeeded,
        failed_imports: failed,
        error_log: errors.length > 0 ? errors : null
      })
      .eq('id', jobId)
      .eq('user_id', userId)

    // Log security event
    await logSecurityEvent(supabase, userId, 'bulk_import_completed', 'info', {
      job_id: jobId,
      source,
      total: products.length,
      succeeded,
      failed
    })

    console.log(`✅ Background import ${jobId} completed: ${succeeded} succeeded, ${failed} failed`)

  } catch (error) {
    console.error(`❌ Background import ${jobId} error:`, error)
    await supabase
      .from('import_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_log: [error.message || 'Unknown error']
      })
      .eq('id', jobId)
      .eq('user_id', userId)
  }
}
