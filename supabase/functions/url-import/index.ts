/**
 * URL Import - Secure Edge Function (CONSOLIDATED P0)
 * 
 * CHANGES from legacy:
 * - Still uses service_role for job creation (needed to bypass RLS on jobs table)
 *   but VALIDATES JWT first
 * - Writes to `products` table as 'draft' (canon) instead of `imported_products`
 * - Enhanced SSRF protection maintained
 * - Ownership always from JWT
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  const metadataHosts = ['169.254.169.254', 'metadata.google.internal', 'metadata.google.com'];
  if (metadataHosts.some(h => host.includes(h))) {
    throw new Error('Metadata endpoints not allowed');
  }

  return url;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now()
  let jobId: string | null = null

  try {
    // SECURITY: Validate JWT first via anon key client
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: authError } = await anonClient.auth.getUser(token)
    
    if (authError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;
    console.log('[URL-IMPORT] Authenticated user:', userId.slice(0, 8));

    // Service client for job/product operations that need to bypass RLS
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

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
    const { data: job, error: jobError } = await serviceClient
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
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(validatedUrl.toString(), {
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'User-Agent': 'ShopOpti-Import/1.0 (Compatible)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      clearTimeout(timeout);

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
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

      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 2_000_000) {
        throw new Error('Response too large (max 2MB)');
      }

      const html = await response.text();
      if (html.length > 2_000_000) {
        throw new Error('Response too large (max 2MB)');
      }

      console.log('[URL-IMPORT] Fetched content, size:', html.length);

      const doc = new DOMParser().parseFromString(html, 'text/html');
      if (!doc) {
        throw new Error('Failed to parse HTML');
      }

      // Extract product data
      const productData: any = {
        user_id: userId,
        status: 'draft',
        source_url: validatedUrl.toString(),
        source_type: 'url',
      };

      // Extract title
      const rawTitle = 
        doc.querySelector('h1')?.textContent?.trim() ||
        doc.querySelector('[itemprop="name"]')?.textContent?.trim() ||
        doc.querySelector('.product-title')?.textContent?.trim() ||
        doc.querySelector('.product-name')?.textContent?.trim() ||
        doc.querySelector('title')?.textContent?.trim() ||
        'Sans nom';
      productData.title = rawTitle.substring(0, 500);

      // Extract description
      const rawDescription = 
        doc.querySelector('[itemprop="description"]')?.textContent?.trim() ||
        doc.querySelector('.product-description')?.textContent?.trim() ||
        doc.querySelector('.description')?.textContent?.trim() ||
        doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ||
        '';
      productData.description = rawDescription.substring(0, 5000);

      // Extract price
      const priceSelectors = [
        '[itemprop="price"]', '.price', '.product-price', '[data-price]', '.sale-price'
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

      // Extract images
      const images: string[] = [];
      const imageSelectors = [
        '[itemprop="image"]', '.product-image img', '.product-gallery img',
        '[data-zoom-image]', 'img[src*="product"]'
      ];

      for (const selector of imageSelectors) {
        const imgElements = doc.querySelectorAll(selector);
        for (const img of Array.from(imgElements)) {
          const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-zoom-image');
          if (src && !src.includes('data:image') && !src.includes('javascript:')) {
            try {
              const absoluteUrl = src.startsWith('http') ? src : new URL(src, validatedUrl).toString();
              if (absoluteUrl.startsWith('http') && !images.includes(absoluteUrl) && images.length < 20) {
                images.push(absoluteUrl);
              }
            } catch { /* Invalid URL, skip */ }
          }
        }
      }

      if (images.length > 0) {
        productData.image_url = images[0];
        productData.images = images;
      }

      // Extract SKU
      const rawSku = 
        doc.querySelector('[itemprop="sku"]')?.textContent?.trim() ||
        doc.querySelector('.sku')?.textContent?.trim() ||
        doc.querySelector('[data-sku]')?.getAttribute('data-sku') ||
        null;
      productData.sku = rawSku ? rawSku.substring(0, 100) : `URL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      // Extract brand → supplier
      const rawBrand = 
        doc.querySelector('[itemprop="brand"]')?.textContent?.trim() ||
        doc.querySelector('.brand')?.textContent?.trim() ||
        null;
      productData.supplier = rawBrand ? rawBrand.substring(0, 200) : validatedUrl.hostname;

      console.log('[URL-IMPORT] Extracted product:', {
        title: productData.title?.substring(0, 50),
        price: productData.price,
        images_count: images.length
      });

      // CONSOLIDATED: Insert into CANON `products` table (not imported_products)
      const { error: insertError } = await serviceClient
        .from('products')
        .insert(productData);

      if (insertError) throw insertError;

      const executionTime = Date.now() - startTime;

      // Update job as completed
      await serviceClient
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
            title: productData.title,
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
        const serviceClient = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        await serviceClient
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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});