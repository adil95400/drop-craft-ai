import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  let jobId: string | null = null

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Authentication required')
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    const { url, config = {} } = await req.json()
    
    if (!url) {
      throw new Error('URL is required')
    }

    console.log('[URL-IMPORT] Starting import from URL', { url, user_id: user.id })

    // Create import job
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        user_id: user.id,
        source_type: 'url',
        source_url: url,
        configuration: config,
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) throw jobError
    jobId = job.id

    console.log('[URL-IMPORT] Created job', { job_id: jobId })

    // Fetch the URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImportBot/1.0)'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || ''
    const html = await response.text()

    console.log('[URL-IMPORT] Fetched content', { 
      content_type: contentType,
      size: html.length 
    })

    // Parse HTML
    const doc = new DOMParser().parseFromString(html, 'text/html')
    if (!doc) {
      throw new Error('Failed to parse HTML')
    }

    // Extract product data using intelligent selectors
    const productData: any = {
      user_id: user.id,
      status: 'draft',
      import_job_id: jobId,
      source_url: url
    }

    // Extract title
    productData.name = 
      doc.querySelector('h1')?.textContent?.trim() ||
      doc.querySelector('[itemprop="name"]')?.textContent?.trim() ||
      doc.querySelector('.product-title')?.textContent?.trim() ||
      doc.querySelector('.product-name')?.textContent?.trim() ||
      doc.querySelector('title')?.textContent?.trim() ||
      'Sans nom'

    // Extract description
    productData.description = 
      doc.querySelector('[itemprop="description"]')?.textContent?.trim() ||
      doc.querySelector('.product-description')?.textContent?.trim() ||
      doc.querySelector('.description')?.textContent?.trim() ||
      doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ||
      null

    // Extract price
    const priceSelectors = [
      '[itemprop="price"]',
      '.price',
      '.product-price',
      '[data-price]',
      '.sale-price'
    ]
    
    for (const selector of priceSelectors) {
      const priceEl = doc.querySelector(selector)
      if (priceEl) {
        const priceText = priceEl.textContent || priceEl.getAttribute('content') || priceEl.getAttribute('data-price') || ''
        const priceMatch = priceText.match(/[\d,]+\.?\d*/g)
        if (priceMatch) {
          productData.price = parseFloat(priceMatch[0].replace(/,/g, ''))
          break
        }
      }
    }

    // Extract images
    const images: string[] = []
    const imageSelectors = [
      '[itemprop="image"]',
      '.product-image img',
      '.product-gallery img',
      '[data-zoom-image]',
      'img[src*="product"]'
    ]

    for (const selector of imageSelectors) {
      const imgElements = doc.querySelectorAll(selector)
      for (const img of Array.from(imgElements)) {
        const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-zoom-image')
        if (src && !src.includes('data:image')) {
          // Convert relative URLs to absolute
          const absoluteUrl = src.startsWith('http') ? src : new URL(src, url).toString()
          if (!images.includes(absoluteUrl)) {
            images.push(absoluteUrl)
          }
        }
      }
    }

    if (images.length > 0) {
      productData.image_url = images[0]
      productData.images = images
    }

    // Extract SKU
    productData.sku = 
      doc.querySelector('[itemprop="sku"]')?.textContent?.trim() ||
      doc.querySelector('.sku')?.textContent?.trim() ||
      doc.querySelector('[data-sku]')?.getAttribute('data-sku') ||
      null

    // Extract brand
    productData.brand = 
      doc.querySelector('[itemprop="brand"]')?.textContent?.trim() ||
      doc.querySelector('.brand')?.textContent?.trim() ||
      null

    console.log('[URL-IMPORT] Extracted product data', {
      name: productData.name,
      price: productData.price,
      images_count: images.length
    })

    // Insert product
    const { error: insertError } = await supabase
      .from('imported_products')
      .insert(productData)

    if (insertError) throw insertError

    const executionTime = Date.now() - startTime

    // Update job as completed
    await supabase
      .from('import_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_rows: 1,
        processed_rows: 1,
        success_rows: 1,
        error_rows: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    console.log('[URL-IMPORT] Import completed', {
      job_id: jobId,
      duration_ms: executionTime
    })

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        product_data: productData,
        execution_time_ms: executionTime
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('[URL-IMPORT] Error', { 
      error: error.message,
      job_id: jobId 
    })

    if (jobId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        await supabase
          .from('import_jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            errors: [error.message],
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId)
      } catch (updateError) {
        console.error('[URL-IMPORT] Failed to update job status', updateError)
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
    )
  }
})