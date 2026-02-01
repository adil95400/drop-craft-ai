/**
 * URL Scraper - Enterprise-Safe Implementation
 * 
 * Security:
 * - JWT authentication mandatory
 * - SSRF protection (private IPs, forbidden hosts)
 * - Strict CORS allowlist
 * - Rate limiting (10 scrapes/hour)
 * - URL validation and sanitization
 * - Response size limits
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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

function isForbiddenHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  
  if (lower === 'localhost') return true;
  if (lower.endsWith('.local')) return true;
  if (lower.endsWith('.internal')) return true;
  if (lower.includes('metadata')) return true;
  if (lower === '169.254.169.254') return true;
  if (isPrivateIPv4(lower)) return true;
  if (lower.includes('@')) return true;
  
  return false;
}

function validateScrapingUrl(urlString: string): URL {
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
  
  if (!hostname || hostname.length < 3) {
    throw new Error('Invalid hostname');
  }
  
  if (isForbiddenHostname(hostname)) {
    throw new Error('Forbidden host - access denied');
  }
  
  return url;
}

async function safeFetchHtml(url: URL): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  
  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    
    // Handle redirect with validation
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) throw new Error('Redirect without location');
      
      const redirectUrl = validateScrapingUrl(new URL(location, url).toString());
      
      const res2 = await fetch(redirectUrl.toString(), {
        method: 'GET',
        redirect: 'error',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });
      
      if (!res2.ok) throw new Error(`Fetch failed: ${res2.status}`);
      
      const buf2 = await res2.arrayBuffer();
      if (buf2.byteLength > 3_000_000) throw new Error('Response too large (max 3MB)');
      return new TextDecoder().decode(buf2);
    }
    
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 3_000_000) throw new Error('Response too large (max 3MB)');
    return new TextDecoder().decode(buf);
    
  } finally {
    clearTimeout(timeout);
  }
}

interface ScrapeRequest {
  url: string;
  config?: {
    extract_images?: boolean;
    analyze_seo?: boolean;
    generate_variants?: boolean;
    price_tracking?: boolean;
  };
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

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

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
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // Rate limiting (10 scrapes/hour)
    const { count: recentScrapes } = await supabaseClient
      .from('import_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('source_type', 'url_scraper')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString());

    if ((recentScrapes || 0) >= 10) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Max 10 URL scrapes per hour.' }),
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

    const { url: urlRaw, config = {} }: ScrapeRequest = body;

    if (typeof urlRaw !== 'string' || urlRaw.length < 10 || urlRaw.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL (SSRF protection)
    const url = validateScrapingUrl(urlRaw);

    console.log(`[url-scraper] Scraping: ${url.hostname}, user: ${userId.slice(0, 8)}`);

    // Create import job - SCOPED TO USER
    const { data: importJob, error: jobError } = await supabaseClient
      .from('import_jobs')
      .insert({
        user_id: userId, // Always from auth, never from request
        source_type: 'url_scraper',
        source_url: url.toString(),
        status: 'processing'
      })
      .select()
      .single();

    if (jobError) {
      console.error('Job creation error:', jobError);
      return new Response(
        JSON.stringify({ error: 'Failed to create import job' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      let scrapedData: any[] = [];
      
      // Try Firecrawl first if API key is available
      const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (firecrawlApiKey) {
        console.log('Using Firecrawl for advanced scraping');
        const firecrawlResult = await firecrawlScrape(url.toString(), firecrawlApiKey);
        
        if (firecrawlResult?.data?.extractedContent?.products) {
          scrapedData = firecrawlResult.data.extractedContent.products.map((product: any) => ({
            name: product.name || 'Produit extrait',
            description: product.description || '',
            price: parseFloat(product.price?.replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
            currency: 'EUR',
            image_urls: product.image ? [product.image] : [],
            category: product.category || 'Divers',
            sku: product.sku || `FIRECRAWL-${Date.now()}`,
            supplier_name: url.hostname.replace('www.', ''),
            supplier_url: url.toString(),
            tags: ['firecrawl', 'ai-extracted'],
            availability_status: product.availability === 'in_stock' ? 'in_stock' : 'out_of_stock'
          }));
        }
      }
      
      // Fallback to custom scraping
      if (scrapedData.length === 0) {
        console.log('Using safe fetch for scraping');
        const html = await safeFetchHtml(url);
        scrapedData = await scrapeProductData(html, url.toString(), config);
      }
      
      if (!scrapedData || scrapedData.length === 0) {
        await supabaseClient
          .from('import_jobs')
          .update({
            status: 'completed',
            total_rows: 0,
            success_rows: 0,
            error_rows: 0,
            errors: ['No products found on the page']
          })
          .eq('id', importJob.id);

        return new Response(JSON.stringify({
          success: true,
          products_found: 0,
          message: 'No products found on this page'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Insert products - SCOPED TO USER
      const productsToInsert = scrapedData.map(product => ({
        ...product,
        user_id: userId, // Always from auth
        import_id: importJob.id,
        status: 'draft',
        review_status: 'pending'
      }));

      const { error: insertError } = await supabaseClient
        .from('imported_products')
        .insert(productsToInsert);

      if (insertError) {
        console.error('Products insertion error:', insertError);
        
        await supabaseClient
          .from('import_jobs')
          .update({
            status: 'failed',
            error_rows: scrapedData.length,
            errors: [insertError.message]
          })
          .eq('id', importJob.id);

        return new Response(
          JSON.stringify({ error: 'Failed to insert products' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update job as completed
      await supabaseClient
        .from('import_jobs')
        .update({
          status: 'completed',
          total_rows: scrapedData.length,
          success_rows: scrapedData.length,
          processed_rows: scrapedData.length,
          error_rows: 0,
          result_data: {
            products_scraped: scrapedData.length,
            source_url: url.toString(),
            scraping_config: config,
            completed_at: new Date().toISOString()
          }
        })
        .eq('id', importJob.id);

      // Log activity
      await supabaseClient.from('activity_logs').insert({
        user_id: userId,
        action: 'url_scrape',
        entity_type: 'import',
        entity_id: importJob.id,
        description: `${scrapedData.length} products scraped from ${url.hostname}`,
        source: 'url_scraper'
      });

      console.log(`[url-scraper] Success: ${scrapedData.length} products`);

      return new Response(JSON.stringify({
        success: true,
        import_id: importJob.id,
        products_scraped: scrapedData.length,
        products: scrapedData.slice(0, 3),
        message: `${scrapedData.length} produits scrapés avec succès`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Scraping error:', error);
      
      await supabaseClient
        .from('import_jobs')
        .update({
          status: 'failed',
          errors: [(error as Error).message]
        })
        .eq('id', importJob.id);

      throw error;
    }

  } catch (error) {
    console.error('URL scraper error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message || 'Scraping failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Firecrawl API integration
async function firecrawlScrape(url: string, apiKey: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    
    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        extractorOptions: {
          extractionSchema: {
            type: 'object',
            properties: {
              products: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    price: { type: 'string' },
                    description: { type: 'string' },
                    image: { type: 'string' },
                    category: { type: 'string' },
                    sku: { type: 'string' },
                    availability: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Firecrawl error:', error);
    return null;
  }
}

async function scrapeProductData(html: string, url: string, config: any) {
  const products: any[] = [];
  
  // Extract JSON-LD structured data
  const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis);
  
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
        const data = JSON.parse(jsonContent);
        
        if (data['@type'] === 'Product' || (Array.isArray(data) && data.some(item => item['@type'] === 'Product'))) {
          const productData = Array.isArray(data) ? data.filter(item => item['@type'] === 'Product') : [data];
          
          for (const product of productData) {
            products.push({
              name: (product.name || 'Produit sans nom').substring(0, 500),
              description: (product.description || '').substring(0, 5000),
              price: parseFloat(product.offers?.price || product.offers?.lowPrice || '0') || 0,
              currency: product.offers?.priceCurrency || 'EUR',
              image_urls: Array.isArray(product.image) ? product.image.slice(0, 10) : product.image ? [product.image] : [],
              category: (product.category || 'Divers').substring(0, 200),
              sku: (product.sku || product.productID || `SCRAPED-${Date.now()}`).substring(0, 100),
              supplier_name: new URL(url).hostname.replace('www.', ''),
              supplier_url: url,
              tags: ['scraped', 'structured-data']
            });
          }
        }
      } catch (e) {
        console.error('Error parsing JSON-LD:', e);
      }
    }
  }

  // If no structured data, try CSS selectors
  if (products.length === 0) {
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(/&[^;]+;/g, '').substring(0, 200) : 'Produit scraped';
    
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
    const description = descMatch ? descMatch[1].trim().substring(0, 2000) : 'Description extraite automatiquement';
    
    // Extract price
    const pricePatterns = [
      /[\$€£¥]\s*([0-9,]+(?:\.[0-9]{2})?)/g,
      /([0-9,]+(?:\.[0-9]{2})?)\s*[\$€£¥]/g,
      /"price":\s*"?([0-9,]+(?:\.[0-9]{2})?)"?/g,
    ];
    
    let price = 0;
    for (const pattern of pricePatterns) {
      const matches = [...html.matchAll(pattern)];
      if (matches.length > 0) {
        price = parseFloat(matches[0][1].replace(',', '.')) || 0;
        if (price > 0) break;
      }
    }

    // Extract images
    const imageMatches = html.match(/<img[^>]*src="([^"]*)"[^>]*>/gi) || [];
    const images = imageMatches
      .map(match => {
        const srcMatch = match.match(/src="([^"]*)"/);
        return srcMatch ? srcMatch[1] : null;
      })
      .filter(src => src && !src.includes('data:') && (src.includes('.jpg') || src.includes('.png') || src.includes('.webp')))
      .slice(0, 5);

    products.push({
      name: title,
      description: description,
      price: price,
      currency: 'EUR',
      image_urls: images,
      category: 'Scraped',
      sku: `SCRAPED-${Date.now()}`,
      supplier_name: new URL(url).hostname.replace('www.', ''),
      supplier_url: url,
      tags: ['scraped', 'css-extracted']
    });
  }

  return products;
}
