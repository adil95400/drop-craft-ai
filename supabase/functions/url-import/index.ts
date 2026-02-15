/**
 * URL Import - Secure Edge Function
 * UNIFIED: Writes to `jobs` table (not import_jobs)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

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

// SSRF Protection
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return false;
  const [a, b] = parts;
  return (
    a === 10 || a === 127 || a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function validateImportUrl(urlString: string): URL {
  let url: URL;
  try { 
    url = new URL(urlString); 
  } catch { 
    throw new Error('Invalid URL format'); 
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('URL must use http or https');
  }

  const host = url.hostname.toLowerCase();
  if (!host || host.length < 3) throw new Error('Invalid hostname');
  if (host === 'localhost' || host.endsWith('.local')) throw new Error('Forbidden host');
  if (host.includes('@')) throw new Error('Forbidden host format');
  if (isPrivateIPv4(host)) throw new Error('Private IP not allowed');

  // Block cloud metadata endpoints
  const metadataHosts = ['169.254.169.254', 'metadata.google.internal', 'metadata.google.com'];
  if (metadataHosts.some(h => host.includes(h))) {
    throw new Error('Metadata endpoints not allowed');
  }

  return url;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getSecureCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now()
  let jobId: string | null = null

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // SECURITY: Get user from JWT, NOT from body
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;
    console.log('[URL-IMPORT] Authenticated user:', userId.slice(0, 8));

    const body = await req.json();
    const { url, config = {} } = body;
    
    // SECURITY: Reject if userId is in body
    if ('userId' in body || 'user_id' in body) {
      return new Response(
        JSON.stringify({ success: false, error: 'Do not send userId in body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Valid URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Validate and sanitize URL
    const validatedUrl = validateImportUrl(url);
    console.log('[URL-IMPORT] Validated URL:', validatedUrl.hostname);

    // Create job in unified `jobs` table
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        user_id: userId,
        job_type: 'import',
        job_subtype: 'url',
        status: 'running',
        name: `Import URL: ${validatedUrl.hostname}`,
        started_at: new Date().toISOString(),
        input_data: { source_url: validatedUrl.toString(), configuration: config },
        total_items: 1,
        processed_items: 0,
        failed_items: 0,
      })
      .select()
      .single()

    if (jobError) throw jobError
    jobId = job.id

    console.log('[URL-IMPORT] Created job:', jobId)

    // Fetch the URL with timeout and SSRF protection
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await fetch(validatedUrl.toString(), {
        signal: controller.signal,
        redirect: 'manual', // Don't auto-follow redirects
        headers: {
          'User-Agent': 'ShopOpti-Import/1.0 (Compatible)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      clearTimeout(timeout);

      // Handle redirect manually to prevent SSRF
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          // Validate redirect target
          try {
            validateImportUrl(new URL(location, validatedUrl).toString());
          } catch {
            throw new Error('Redirect to forbidden URL');
          }
        }
        throw new Error('Redirect handling not allowed for security');
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      }

      // Limit response size
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 2_000_000) {
        throw new Error('Response too large (max 2MB)');
      }

      const html = await response.text();
      if (html.length > 2_000_000) {
        throw new Error('Response too large (max 2MB)');
      }

      console.log('[URL-IMPORT] Fetched content, size:', html.length);

      // Parse HTML
      const doc = new DOMParser().parseFromString(html, 'text/html');
      if (!doc) {
        throw new Error('Failed to parse HTML');
      }

      // Extract product data using intelligent selectors
      const productData: any = {
        user_id: userId, // CRITICAL: from token only
        status: 'draft',
        import_job_id: jobId,
        source_url: validatedUrl.toString()
      };

      // Extract title (sanitized)
      const rawTitle = 
        doc.querySelector('h1')?.textContent?.trim() ||
        doc.querySelector('[itemprop="name"]')?.textContent?.trim() ||
        doc.querySelector('.product-title')?.textContent?.trim() ||
        doc.querySelector('.product-name')?.textContent?.trim() ||
        doc.querySelector('title')?.textContent?.trim() ||
        'Sans nom';
      productData.name = rawTitle.substring(0, 500);

      // Extract description (sanitized)
      const rawDescription = 
        doc.querySelector('[itemprop="description"]')?.textContent?.trim() ||
        doc.querySelector('.product-description')?.textContent?.trim() ||
        doc.querySelector('.description')?.textContent?.trim() ||
        doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ||
        '';
      productData.description = rawDescription.substring(0, 5000);

      // Extract price
      const priceSelectors = [
        '[itemprop="price"]',
        '.price',
        '.product-price',
        '[data-price]',
        '.sale-price'
      ];
      
      for (const selector of priceSelectors) {
        const priceEl = doc.querySelector(selector);
        if (priceEl) {
          const priceText = priceEl.textContent || priceEl.getAttribute('content') || priceEl.getAttribute('data-price') || '';
          const priceMatch = priceText.match(/[\d,]+\.?\d*/g);
          if (priceMatch) {
            const price = parseFloat(priceMatch[0].replace(/,/g, ''));
            if (price > 0 && price < 1000000) {
              productData.price = price;
              break;
            }
          }
        }
      }

      // Extract images (validated URLs only)
      const images: string[] = [];
      const imageSelectors = [
        '[itemprop="image"]',
        '.product-image img',
        '.product-gallery img',
        '[data-zoom-image]',
        'img[src*="product"]'
      ];

      for (const selector of imageSelectors) {
        const imgElements = doc.querySelectorAll(selector);
        for (const img of Array.from(imgElements)) {
          const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-zoom-image');
          if (src && !src.includes('data:image') && !src.includes('javascript:')) {
            try {
              const absoluteUrl = src.startsWith('http') ? src : new URL(src, validatedUrl).toString();
              // Only allow http/https images
              if (absoluteUrl.startsWith('http') && !images.includes(absoluteUrl) && images.length < 20) {
                images.push(absoluteUrl);
              }
            } catch {
              // Invalid URL, skip
            }
          }
        }
      }

      if (images.length > 0) {
        productData.image_url = images[0];
        productData.images = images;
      }

      // Extract SKU (sanitized)
      const rawSku = 
        doc.querySelector('[itemprop="sku"]')?.textContent?.trim() ||
        doc.querySelector('.sku')?.textContent?.trim() ||
        doc.querySelector('[data-sku]')?.getAttribute('data-sku') ||
        null;
      productData.sku = rawSku ? rawSku.substring(0, 100) : null;

      // Extract brand (sanitized)
      const rawBrand = 
        doc.querySelector('[itemprop="brand"]')?.textContent?.trim() ||
        doc.querySelector('.brand')?.textContent?.trim() ||
        null;
      productData.brand = rawBrand ? rawBrand.substring(0, 200) : null;

      console.log('[URL-IMPORT] Extracted product:', {
        name: productData.name?.substring(0, 50),
        price: productData.price,
        images_count: images.length
      });

      // Insert product
      const { error: insertError } = await supabase
        .from('imported_products')
        .insert(productData);

      if (insertError) throw insertError;

      const executionTime = Date.now() - startTime;

      // Update job as completed in unified `jobs` table
      await supabase
        .from('jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          processed_items: 1,
          failed_items: 0,
          progress_percent: 100,
          duration_ms: executionTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      console.log('[URL-IMPORT] Import completed, duration:', executionTime);

      return new Response(
        JSON.stringify({
          success: true,
          job_id: jobId,
          product_data: {
            name: productData.name,
            price: productData.price,
            images_count: images.length
          },
          execution_time_ms: executionTime
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );

    } finally {
      clearTimeout(timeout);
    }

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('[URL-IMPORT] Error:', error.message);

    if (jobId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from('jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: error.message,
            duration_ms: executionTime,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      } catch (updateError) {
        console.error('[URL-IMPORT] Failed to update job status:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        job_id: jobId,
        execution_time_ms: executionTime
      }),
      { headers: { ...getSecureCorsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
