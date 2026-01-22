import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
};

interface ScrapedProduct {
  name: string;
  title?: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  image?: string;
  imageUrl?: string;
  variants?: any[];
  brand?: string;
  category?: string;
  sku?: string;
  supplier_name: string;
  supplier_url: string;
  url?: string;
  platform?: string;
  stock_status?: 'in_stock' | 'out_of_stock' | 'limited_stock';
  rating?: number;
  reviews_count?: number;
  shipping_info?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = `scr_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  console.log(`[${requestId}] 🔄 Extension scraper request`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check extension token
    const extensionToken = req.headers.get('x-extension-token');
    let userId: string | null = null;

    if (extensionToken) {
      console.log(`[${requestId}] 🔑 Validating extension token...`);
      
      const { data: tokenData } = await supabase
        .from("extension_auth_tokens")
        .select("user_id, is_active, expires_at")
        .eq("token", extensionToken)
        .eq("is_active", true)
        .maybeSingle();

      if (tokenData?.is_active) {
        if (!tokenData.expires_at || new Date(tokenData.expires_at) > new Date()) {
          userId = tokenData.user_id;
          console.log(`[${requestId}] ✅ Authenticated user: ${userId}`);
        }
      }

      // Fallback to legacy table
      if (!userId) {
        const { data: legacyToken } = await supabase
          .from("extension_tokens")
          .select("user_id, is_active, expires_at")
          .eq("token", extensionToken)
          .maybeSingle();

        if (legacyToken?.is_active) {
          userId = legacyToken.user_id;
          console.log(`[${requestId}] ✅ Authenticated via legacy token`);
        }
      }
    }

    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL manquante' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`[${requestId}] 🔍 Scraping: ${url}`);

    const supplier = detectSupplier(url);
    let product: ScrapedProduct | null = null;
    let scrapeMethod = 'fallback';

    // Try Firecrawl first
    try {
      const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (firecrawlKey) {
        console.log(`[${requestId}] 🔥 Trying Firecrawl...`);
        const result = await scrapeWithFirecrawl(url, supplier, firecrawlKey);
        if (result && result.name && result.name.length > 5) {
          product = result;
          scrapeMethod = 'firecrawl';
        }
      }
    } catch (e) {
      console.log(`[${requestId}] ⚠️ Firecrawl failed: ${e.message}`);
    }

    // Try direct fetch
    if (!product) {
      try {
        console.log(`[${requestId}] 🌐 Trying direct fetch...`);
        const result = await scrapeWithDirectFetch(url, supplier);
        if (result && result.name && result.name.length > 5) {
          product = result;
          scrapeMethod = 'direct_fetch';
        }
      } catch (e) {
        console.log(`[${requestId}] ⚠️ Direct fetch failed: ${e.message}`);
      }
    }

    // Fallback
    if (!product) {
      product = createFallbackProduct(url, supplier);
      scrapeMethod = 'fallback';
    }

    product.url = url;
    product.title = product.name;
    product.image = product.images?.[0] || '';
    product.imageUrl = product.images?.[0] || '';
    product.platform = supplier;

    console.log(`[${requestId}] ✅ Product: ${product.name} (${scrapeMethod})`);

    // Log if authenticated
    if (userId) {
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'extension_scrape',
        description: `Scraped: ${product.name}`,
        source: 'chrome_extension',
        details: { supplier, scrapeMethod, url }
      });
    }

    return new Response(
      JSON.stringify({ success: true, product, scrapeMethod, requestId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error(`[${requestId}] ❌ Error:`, error);
    return new Response(
      JSON.stringify({ success: false, error: error.message, requestId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

async function scrapeWithFirecrawl(url: string, supplier: string, apiKey: string): Promise<ScrapedProduct | null> {
  const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'html'],
      onlyMainContent: false,
      waitFor: 3000,
    }),
  });

  if (!response.ok) throw new Error(`Firecrawl ${response.status}`);

  const data = await response.json();
  const html = data.data?.html || '';
  const metadata = data.data?.metadata || {};

  return parseProductFromHtml(html, metadata, url, supplier);
}

async function scrapeWithDirectFetch(url: string, supplier: string): Promise<ScrapedProduct | null> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    },
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const html = await response.text();
  return parseProductFromHtml(html, {}, url, supplier);
}

function parseProductFromHtml(html: string, metadata: any, url: string, supplier: string): ScrapedProduct | null {
  // Try JSON-LD first
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/i, '');
        const data = JSON.parse(jsonContent);
        const product = data['@type'] === 'Product' ? data : 
          (Array.isArray(data['@graph']) ? data['@graph'].find((i: any) => i['@type'] === 'Product') : null);
        
        if (product) {
          return {
            name: cleanText(product.name || ''),
            description: cleanText(product.description || ''),
            price: parsePrice(product.offers?.price || product.offers?.[0]?.price),
            currency: product.offers?.priceCurrency || 'EUR',
            images: Array.isArray(product.image) ? product.image : [product.image].filter(Boolean),
            brand: product.brand?.name || product.brand,
            supplier_name: supplier,
            supplier_url: url,
            stock_status: product.offers?.availability?.includes('InStock') ? 'in_stock' : 'out_of_stock',
            rating: product.aggregateRating?.ratingValue,
            reviews_count: product.aggregateRating?.reviewCount,
          };
        }
      } catch (e) { /* continue */ }
    }
  }

  // HTML parsing fallback
  const name = extractFromHtml(html, [
    /<h1[^>]*>([^<]+)<\/h1>/i,
    /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i,
    /<title>([^<]+)<\/title>/i,
  ]) || metadata.title || '';

  const description = extractFromHtml(html, [
    /<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i,
    /<meta[^>]*name="description"[^>]*content="([^"]+)"/i,
  ]) || '';

  const priceMatch = html.match(/["']price["']\s*:\s*["']?(\d+[.,]?\d*)/i) ||
    html.match(/(\d+[.,]\d{2})\s*€/) || html.match(/€\s*(\d+[.,]\d{2})/) ||
    html.match(/\$\s*(\d+\.\d{2})/);

  const images = extractImages(html);

  if (!name || name.length < 5) return null;

  return {
    name: cleanText(name),
    description: cleanText(description),
    price: priceMatch ? parsePrice(priceMatch[1]) : 0,
    currency: html.includes('€') ? 'EUR' : 'USD',
    images,
    supplier_name: supplier,
    supplier_url: url,
    stock_status: 'in_stock',
  };
}

function extractFromHtml(html: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function extractImages(html: string): string[] {
  const images: string[] = [];
  
  const ogMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
  if (ogMatch) images.push(ogMatch[1]);

  const imgRegex = /<img[^>]+(?:src|data-src)=["']([^"']+)["']/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null && images.length < 10) {
    const imgUrl = match[1];
    if (imgUrl.startsWith('http') && !imgUrl.includes('icon') && !imgUrl.includes('logo') && !imgUrl.includes('.svg')) {
      if (!images.includes(imgUrl)) images.push(imgUrl);
    }
  }

  return images;
}

function createFallbackProduct(url: string, supplier: string): ScrapedProduct {
  const urlPath = new URL(url).pathname;
  let productName = urlPath.split('/').pop() || 'Produit';
  productName = productName.replace(/[-_]/g, ' ').replace(/\.html?$/i, '').replace(/\d+/g, '').trim();
  
  if (productName.length < 5) productName = `Produit ${supplier}`;

  return {
    name: productName.charAt(0).toUpperCase() + productName.slice(1),
    description: `Produit importé depuis ${supplier}`,
    price: 0,
    currency: 'EUR',
    images: [],
    supplier_name: supplier,
    supplier_url: url,
    stock_status: 'in_stock',
  };
}

function detectSupplier(url: string): string {
  const u = url.toLowerCase();
  if (u.includes('aliexpress')) return 'AliExpress';
  if (u.includes('amazon.')) return 'Amazon';
  if (u.includes('temu.com')) return 'Temu';
  if (u.includes('ebay.')) return 'eBay';
  if (u.includes('etsy.com')) return 'Etsy';
  if (u.includes('shopify.com') || u.includes('/products/')) return 'Shopify';
  try {
    return new URL(url).hostname.replace('www.', '').split('.')[0];
  } catch {
    return 'Unknown';
  }
}

function parsePrice(value: any): number {
  if (!value) return 0;
  const str = String(value).replace(/[^\d.,]/g, '').replace(',', '.');
  return parseFloat(str) || 0;
}

function cleanText(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 500);
}
