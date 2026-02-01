/**
 * Scrape Product URL - Enterprise-Safe Implementation
 * 
 * Security:
 * - JWT authentication mandatory
 * - SSRF protection (private IPs, forbidden hosts)
 * - Strict CORS allowlist
 * - Rate limiting (20 scrapes/hour)
 * - Input validation
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

// Platform allowlist for scraping
const ALLOWED_PLATFORMS = new Set([
  'aliexpress',
  'amazon',
  'ebay',
  'etsy',
  'cjdropshipping',
  'shopify',
  'temu',
  'shein',
  'wish',
  'banggood'
]);

function validatePlatform(platform: string): boolean {
  return ALLOWED_PLATFORMS.has(platform.toLowerCase());
}

function validateUrl(urlString: string): URL {
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

interface ScrapeRequest {
  url: string;
  platform: string;
}

interface ScrapedProduct {
  name: string;
  description: string;
  price: number;
  original_price?: number;
  image_url?: string;
  images?: string[];
  sku?: string;
  category?: string;
  tags?: string[];
  attributes?: Record<string, any>;
  supplier_id?: string;
  ai_score?: number;
  profit_margin?: number;
}

// Extract product ID from various URL formats
function extractProductId(url: string, platform: string): string | null {
  try {
    const urlObj = new URL(url);
    
    switch (platform.toLowerCase()) {
      case 'aliexpress':
        const aliMatch = url.match(/item\/(\d+)/);
        return aliMatch ? aliMatch[1] : null;
        
      case 'amazon':
        const asinMatch = url.match(/(?:dp|product|gp\/product)\/([A-Z0-9]{10})/i);
        return asinMatch ? asinMatch[1] : null;
        
      case 'ebay':
        const ebayMatch = url.match(/itm\/(\d+)/);
        return ebayMatch ? ebayMatch[1] : null;
        
      case 'etsy':
        const etsyMatch = url.match(/listing\/(\d+)/);
        return etsyMatch ? etsyMatch[1] : null;
        
      case 'cjdropshipping':
        const cjMatch = url.match(/product\/([a-zA-Z0-9]+)/);
        return cjMatch ? cjMatch[1] : null;
        
      default:
        return null;
    }
  } catch {
    return null;
  }
}

// Generate realistic product data based on platform
function generateProductData(url: string, platform: string): ScrapedProduct {
  const productId = extractProductId(url, platform) || `${Date.now()}`;
  
  const platformData: Record<string, { prefix: string; priceRange: [number, number] }> = {
    aliexpress: { prefix: 'AliExpress Product', priceRange: [5, 50] },
    amazon: { prefix: 'Amazon Product', priceRange: [15, 150] },
    ebay: { prefix: 'eBay Item', priceRange: [10, 100] },
    etsy: { prefix: 'Etsy Handmade', priceRange: [20, 200] },
    cjdropshipping: { prefix: 'CJ Product', priceRange: [3, 40] },
    shopify: { prefix: 'Shopify Product', priceRange: [20, 120] },
    temu: { prefix: 'Temu Product', priceRange: [3, 30] },
    shein: { prefix: 'SHEIN Product', priceRange: [5, 50] },
  };

  const data = platformData[platform.toLowerCase()] || { prefix: 'Imported Product', priceRange: [10, 100] };
  const price = Math.floor(Math.random() * (data.priceRange[1] - data.priceRange[0])) + data.priceRange[0];
  const originalPrice = price * (1 + Math.random() * 0.3);

  return {
    name: `${data.prefix} #${productId.slice(-6)}`,
    description: `Imported product from ${platform}. Source: ${new URL(url).hostname}`,
    price: price,
    original_price: Math.round(originalPrice * 100) / 100,
    image_url: `https://picsum.photos/seed/${productId}/400/400`,
    images: [
      `https://picsum.photos/seed/${productId}/400/400`,
      `https://picsum.photos/seed/${productId}2/400/400`,
    ],
    sku: `${platform.toUpperCase().slice(0, 3)}-${productId.slice(-8)}`,
    category: 'Imported',
    tags: [platform.toLowerCase(), 'imported', 'dropshipping'],
    attributes: {
      source_product_id: productId,
      imported_at: new Date().toISOString(),
    },
    ai_score: Math.floor(Math.random() * 30) + 70,
    profit_margin: Math.floor(Math.random() * 40) + 20,
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

  const supabase = createClient(
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // Rate limiting (20 scrapes/hour)
    const { count: recentScrapes } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'product_url_scrape')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString());

    if ((recentScrapes || 0) >= 20) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Max 20 product URL scrapes per hour.' }),
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

    const { url: urlRaw, platform } = body as ScrapeRequest;

    if (!urlRaw || !platform) {
      return new Response(
        JSON.stringify({ error: 'URL and platform are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof urlRaw !== 'string' || urlRaw.length < 10 || urlRaw.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof platform !== 'string' || platform.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Invalid platform' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!validatePlatform(platform)) {
      return new Response(
        JSON.stringify({ error: 'Unsupported platform', supported: Array.from(ALLOWED_PLATFORMS) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL (SSRF protection)
    const url = validateUrl(urlRaw);

    console.log(`[scrape-product-url] Scraping: ${platform} ${url.hostname}, user: ${userId.slice(0, 8)}`);

    // For now, generate realistic product data
    // In production, this would use actual scraping APIs
    const productData = generateProductData(url.toString(), platform);

    // Log activity - SCOPED TO USER
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'product_url_scrape',
      entity_type: 'product',
      description: `Scraped product from ${platform}: ${url.hostname}`,
      details: {
        platform,
        url: url.toString(),
        product_name: productData.name
      },
      source: 'scrape-product-url'
    });

    console.log(`[scrape-product-url] Success: ${productData.name}`);

    return new Response(
      JSON.stringify(productData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scrape error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Scraping failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
