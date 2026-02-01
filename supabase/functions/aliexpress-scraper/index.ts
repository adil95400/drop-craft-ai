/**
 * AliExpress Scraper - Enterprise-Safe Implementation
 * 
 * Security:
 * - JWT authentication mandatory
 * - Strict CORS allowlist
 * - SSRF protection for URLs
 * - Rate limiting (10 scrapes/hour)
 * - Action allowlist
 * - Input validation
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Secure CORS configuration
const ALLOWED_ORIGINS = [
  'https://app.shopopti.io',
  'https://shopopti.io',
  'https://drop-craft-ai.lovable.app'
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  
  return headers;
}

// SSRF Protection
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  
  const [a, b] = parts.map(Number);
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  
  return false;
}

function validateAliExpressUrl(urlString: string): URL {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error('Invalid URL format');
  }
  
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('URL must use HTTP/HTTPS protocol');
  }
  
  const hostname = url.hostname.toLowerCase();
  
  // Only allow AliExpress domains
  const allowedDomains = [
    'aliexpress.com',
    'aliexpress.fr',
    'aliexpress.us',
    'aliexpress.ru',
    'ali.ski',
    's.click.aliexpress.com'
  ];
  
  const isAllowed = allowedDomains.some(domain => 
    hostname === domain || hostname.endsWith('.' + domain)
  );
  
  if (!isAllowed) {
    throw new Error('URL must be from AliExpress domain');
  }
  
  if (isPrivateIPv4(hostname)) {
    throw new Error('Private IP addresses not allowed');
  }
  
  return url;
}

// Allowed actions
const ALLOWED_ACTIONS = new Set(['scrape_product', 'search_products', 'bulk_import']);

interface AliExpressProduct {
  product_id: string;
  title: string;
  price: number;
  original_price: number;
  discount_rate: number;
  rating: number;
  review_count: number;
  image_urls: string[];
  video_urls: string[];
  category: string;
  tags: string[];
  supplier_name: string;
  shipping_time: string;
  min_order_quantity: number;
  description?: string;
  source_url: string;
  stock_quantity?: number;
  sku: string;
  specifications: Record<string, string>;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin');
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

  try {
    // Auth mandatory
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // Rate limiting (10 scrapes/hour)
    const { count: recentScrapes } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'aliexpress_product_import')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString());

    if ((recentScrapes || 0) >= 10) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Max 10 AliExpress scrapes per hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, url, keywords, category, maxPrice, minPrice, limit = 20, urls } = body;

    // Validate action
    if (!action || !ALLOWED_ACTIONS.has(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action', allowed: Array.from(ALLOWED_ACTIONS) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[aliexpress-scraper] ${action}, user: ${userId.slice(0, 8)}`);

    // Action: scrape_product
    if (action === 'scrape_product' && url) {
      if (!firecrawlApiKey) {
        return new Response(
          JSON.stringify({ error: 'Firecrawl API key not configured. Please connect Firecrawl in Settings.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (typeof url !== 'string' || url.length < 10 || url.length > 2000) {
        return new Response(
          JSON.stringify({ error: 'Invalid URL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate URL (SSRF protection + domain restriction)
      const validatedUrl = validateAliExpressUrl(url);

      console.log('[aliexpress-scraper] Scraping URL:', validatedUrl.toString());

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);

      const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: validatedUrl.toString(),
          formats: ['markdown', 'html'],
          onlyMainContent: false,
          waitFor: 5000,
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!firecrawlResponse.ok) {
        const errorText = await firecrawlResponse.text();
        console.error('[aliexpress-scraper] Firecrawl error:', errorText);
        return new Response(
          JSON.stringify({ error: `Scraping failed: ${firecrawlResponse.status}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const firecrawlData = await firecrawlResponse.json();
      const product = extractProductFromPage(firecrawlData, validatedUrl.toString());

      // Save product - SCOPED TO USER
      const { data: savedProduct, error: saveError } = await supabase
        .from('imported_products')
        .insert({
          user_id: userId, // Always from auth
          source_platform: 'aliexpress',
          source_url: validatedUrl.toString(),
          name: product.title,
          description: product.description,
          category: product.category,
          price: product.price,
          compare_at_price: product.original_price > product.price ? product.original_price : null,
          image_urls: product.image_urls,
          sku: product.sku,
          supplier_name: product.supplier_name,
          rating: product.rating,
          review_count: product.review_count,
          shipping_info: { shipping_time: product.shipping_time },
          status: 'draft'
        })
        .select()
        .single();

      if (saveError) {
        console.error('[aliexpress-scraper] Save error:', saveError);
      }

      // Log activity - SCOPED TO USER
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'aliexpress_product_import',
        entity_type: 'product',
        entity_id: savedProduct?.id,
        description: `Imported product from AliExpress: ${product.title}`,
        details: { url: validatedUrl.toString(), product_id: product.product_id, sku: product.sku },
        source: 'aliexpress-scraper'
      });

      return new Response(JSON.stringify({
        success: true,
        product,
        saved_id: savedProduct?.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: search_products
    if (action === 'search_products') {
      if (!firecrawlApiKey) {
        return new Response(
          JSON.stringify({ error: 'Firecrawl API key not configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const searchQuery = typeof keywords === 'string' ? keywords.slice(0, 200) : 'dropshipping winning products';
      const searchLimit = Math.min(Math.max(1, parseInt(String(limit)) || 20), 20);

      console.log('[aliexpress-scraper] Searching:', searchQuery);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);

      const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `site:aliexpress.com ${searchQuery}`,
          limit: searchLimit,
          scrapeOptions: {
            formats: ['markdown']
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!searchResponse.ok) {
        return new Response(
          JSON.stringify({ error: `Search failed: ${searchResponse.status}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const searchData = await searchResponse.json();
      const products = (searchData.data || [])
        .map((result: any) => extractProductFromSearch(result))
        .filter((p: any) => p.title && p.price > 0);

      return new Response(JSON.stringify({
        success: true,
        products,
        total: products.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: bulk_import
    if (action === 'bulk_import') {
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return new Response(
          JSON.stringify({ error: 'URLs array required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!firecrawlApiKey) {
        return new Response(
          JSON.stringify({ error: 'Firecrawl API key not configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const results: any[] = [];
      const errors: any[] = [];

      // Limit to 5 products per bulk import
      const urlsToProcess = urls.slice(0, 5);

      for (const productUrl of urlsToProcess) {
        if (typeof productUrl !== 'string') {
          errors.push({ url: productUrl, error: 'Invalid URL type' });
          continue;
        }

        try {
          // Validate each URL
          const validatedUrl = validateAliExpressUrl(productUrl);

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 20_000);

          const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: validatedUrl.toString(),
              formats: ['markdown', 'html'],
              onlyMainContent: false,
              waitFor: 3000,
            }),
            signal: controller.signal
          });

          clearTimeout(timeout);

          if (firecrawlResponse.ok) {
            const data = await firecrawlResponse.json();
            const product = extractProductFromPage(data, validatedUrl.toString());
            results.push(product);
          } else {
            errors.push({ url: productUrl, error: 'Scraping failed' });
          }

          // Rate limiting between requests
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          errors.push({ url: productUrl, error: (error as Error).message });
        }
      }

      // Save all successful products - SCOPED TO USER
      if (results.length > 0) {
        const productsToInsert = results.map(p => ({
          user_id: userId, // Always from auth
          source_platform: 'aliexpress',
          source_url: p.source_url,
          name: p.title,
          description: p.description,
          category: p.category,
          price: p.price,
          compare_at_price: p.original_price > p.price ? p.original_price : null,
          image_urls: p.image_urls,
          sku: p.sku,
          supplier_name: p.supplier_name,
          status: 'draft'
        }));

        await supabase.from('imported_products').insert(productsToInsert);

        // Log activity
        await supabase.from('activity_logs').insert({
          user_id: userId,
          action: 'aliexpress_bulk_import',
          entity_type: 'products',
          description: `Bulk imported ${results.length} products from AliExpress`,
          details: { imported_count: results.length, failed_count: errors.length },
          source: 'aliexpress-scraper'
        });
      }

      return new Response(JSON.stringify({
        success: true,
        imported: results.length,
        failed: errors.length,
        products: results,
        errors
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[aliexpress-scraper] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message || 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ============= EXTRACTION FUNCTIONS =============

function extractProductFromPage(data: any, url: string): AliExpressProduct {
  const html = data?.data?.html || '';
  const markdown = data?.data?.markdown || '';
  
  // Extract product ID from URL
  const productIdMatch = url.match(/item\/(\d+)/) || url.match(/\/(\d+)\.html/);
  const productId = productIdMatch?.[1] || `AE-${Date.now()}`;
  
  // Extract title
  let title = 'AliExpress Product';
  const titlePatterns = [
    /"subject"\s*:\s*"([^"]+)"/,
    /<title[^>]*>([^<]+)/i,
    /class="[^"]*title[^"]*"[^>]*>([^<]+)/i,
  ];
  for (const pattern of titlePatterns) {
    const match = html.match(pattern) || markdown.match(pattern);
    if (match && match[1]) {
      title = match[1].replace(/\s*[-|].*AliExpress.*$/i, '').trim().substring(0, 500);
      break;
    }
  }

  // Extract price
  const priceData = extractAliExpressPrice(html, markdown);

  // Extract images
  const imageUrls = extractAliExpressImages(html, markdown);

  // Extract other fields
  const rating = extractRating(html, markdown);
  const reviewCount = extractReviewCount(html, markdown);
  const supplierName = extractSupplierName(html, markdown);
  const shippingTime = extractShippingTime(html, markdown);

  return {
    product_id: productId,
    title,
    price: priceData.price,
    original_price: priceData.originalPrice,
    discount_rate: priceData.discountRate,
    rating,
    review_count: reviewCount,
    image_urls: imageUrls,
    video_urls: [],
    category: 'AliExpress',
    tags: ['aliexpress', 'dropshipping'],
    supplier_name: supplierName,
    shipping_time: shippingTime,
    min_order_quantity: 1,
    description: markdown.substring(0, 2000),
    source_url: url,
    sku: `AE-${productId.substring(0, 10)}`,
    specifications: {}
  };
}

function extractProductFromSearch(result: any): any {
  return {
    title: result.title || 'Product',
    price: 0,
    source_url: result.url || '',
    image_urls: [],
  };
}

function extractAliExpressPrice(html: string, markdown: string): { price: number; originalPrice: number; discountRate: number } {
  let price = 0;
  let originalPrice = 0;
  let discountRate = 0;

  const pricePatterns = [
    /"minPrice":\s*"?([\d\.]+)"?/,
    /"actPrice":\s*"[€$£US\s]*([\d,\.]+)"/i,
    /[€$£]\s*([\d,\.]+)/,
  ];

  for (const pattern of pricePatterns) {
    const match = html.match(pattern) || markdown.match(pattern);
    if (match) {
      const parsed = parseFloat(match[1].replace(/,/g, ''));
      if (parsed > 0 && parsed < 10000) {
        price = parsed;
        break;
      }
    }
  }

  return { price, originalPrice, discountRate };
}

function extractAliExpressImages(html: string, markdown: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  const imgPatterns = [
    /"imageUrl":\s*"([^"]+)"/g,
    /src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi,
  ];

  for (const pattern of imgPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null && images.length < 10) {
      const url = match[1];
      if (url && !seen.has(url) && url.startsWith('http')) {
        seen.add(url);
        images.push(url);
      }
    }
  }

  return images;
}

function extractRating(html: string, markdown: string): number {
  const match = html.match(/"averageStar":\s*"?([\d\.]+)"?/) ||
                html.match(/(\d+\.?\d*)\s*(?:stars?|étoiles?)/i);
  return match ? parseFloat(match[1]) || 0 : 0;
}

function extractReviewCount(html: string, markdown: string): number {
  const match = html.match(/"reviewCount":\s*"?(\d+)"?/) ||
                html.match(/(\d+)\s*(?:reviews?|avis)/i);
  return match ? parseInt(match[1]) || 0 : 0;
}

function extractSupplierName(html: string, markdown: string): string {
  const match = html.match(/"storeName":\s*"([^"]+)"/) ||
                html.match(/Store:\s*([^\n<]+)/i);
  return match ? match[1].trim().substring(0, 100) : 'AliExpress Seller';
}

function extractShippingTime(html: string, markdown: string): string {
  const match = html.match(/(\d+)\s*-\s*(\d+)\s*(?:days?|jours?)/i);
  return match ? `${match[1]}-${match[2]} days` : '15-30 days';
}
