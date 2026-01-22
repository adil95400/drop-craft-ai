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
  specifications?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = `req_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  console.log(`[${requestId}] 🔄 Product URL scraper request received`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for extension token OR standard auth
    const extensionToken = req.headers.get('x-extension-token');
    const authHeader = req.headers.get('Authorization');
    
    let userId: string | null = null;
    let authMethod = 'anonymous';

    // Try extension token first - check extension_auth_tokens (primary) then legacy table
    if (extensionToken) {
      console.log(`[${requestId}] 🔑 Checking extension token...`);
      
      // Try primary extension_auth_tokens table
      const { data: authTokenData, error: authErr } = await supabase
        .from("extension_auth_tokens")
        .select("user_id, is_active, expires_at")
        .eq("token", extensionToken)
        .eq("is_active", true)
        .maybeSingle();

      if (authErr) {
        console.log(`[${requestId}] ⚠️ extension_auth_tokens query error:`, authErr.message);
      }

      if (authTokenData?.is_active) {
        if (!authTokenData.expires_at || new Date(authTokenData.expires_at) > new Date()) {
          userId = authTokenData.user_id;
          authMethod = 'extension_auth_tokens';
          console.log(`[${requestId}] ✅ Authenticated via extension_auth_tokens`);
        } else {
          console.log(`[${requestId}] ⚠️ Token expired`);
        }
      } else {
        // Fallback to legacy extension_tokens table
        const { data: tokenData, error: tokenErr } = await supabase
          .from("extension_tokens")
          .select("user_id, is_active, expires_at")
          .eq("token", extensionToken)
          .maybeSingle();

        if (tokenErr) {
          console.log(`[${requestId}] ⚠️ extension_tokens query error:`, tokenErr.message);
        }

        if (tokenData?.is_active) {
          if (!tokenData.expires_at || new Date(tokenData.expires_at) > new Date()) {
            userId = tokenData.user_id;
            authMethod = 'extension_tokens';
            console.log(`[${requestId}] ✅ Authenticated via legacy extension_tokens`);
          }
        } else {
          console.log(`[${requestId}] ⚠️ Token not found or inactive in either table`);
        }
      }
    }
    
    // Fallback to standard auth
    if (!userId && authHeader) {
      const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        userId = user.id;
        authMethod = 'jwt';
        console.log(`[${requestId}] ✅ Authenticated via JWT`);
      }
    }

    // Log auth status (but don't fail - allow anonymous scraping)
    if (!userId) {
      console.log(`[${requestId}] ℹ️ Proceeding without authentication (anonymous scrape)`);
    }

    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'URL manquante - veuillez fournir une URL de produit valide',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('🔍 Scraping product from URL:', url);

    // Detect supplier
    const supplier = detectSupplier(url);
    console.log('📦 Detected supplier:', supplier);

    let product: ScrapedProduct | null = null;
    let scrapeMethod = 'unknown';

    // Try multiple scraping strategies
    const strategies = [
      { name: 'firecrawl', fn: () => scrapeWithFirecrawl(url, supplier) },
      { name: 'direct_fetch', fn: () => scrapeWithDirectFetch(url, supplier) },
      { name: 'fallback', fn: () => createFallbackProduct(url, supplier) },
    ];

    for (const strategy of strategies) {
      try {
        console.log(`🔄 Trying ${strategy.name} strategy...`);
        const result = await strategy.fn();
        if (result && result.name && result.name.length > 5) {
          product = result;
          scrapeMethod = strategy.name;
          console.log(`✅ Successfully scraped with ${strategy.name}`);
          break;
        }
      } catch (error) {
        console.warn(`⚠️ ${strategy.name} failed:`, error.message);
      }
    }

    if (!product) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Impossible d'extraire les données du produit depuis ${supplier}. Vérifiez que l'URL pointe vers une page produit valide.`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Ensure all required fields are present
    product.url = url;
    product.title = product.name;
    product.image = product.images?.[0] || '';
    product.imageUrl = product.images?.[0] || '';
    product.platform = supplier;

    console.log('✅ Product extracted:', product.name);

    // Log activity if authenticated
    if (userId) {
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'product_url_scrape',
        description: `Produit extrait depuis URL: ${product.name}`,
        source: extensionToken ? 'chrome_extension' : 'web',
        metadata: {
          supplier: product.supplier_name,
          source_url: url,
          scrape_method: scrapeMethod,
          scrape_timestamp: new Date().toISOString()
        }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        product,
        scrapeMethod
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error in product-url-scraper:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors du scraping du produit',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function scrapeWithFirecrawl(url: string, supplier: string): Promise<ScrapedProduct | null> {
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlApiKey) {
    throw new Error('Firecrawl API key not configured');
  }

  const firecrawlResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: url,
      formats: ['markdown', 'html'],
      onlyMainContent: false,
      waitFor: 3000,
      includeTags: ['img', 'h1', 'h2', 'h3', 'p', 'span', 'div', 'meta'],
    }),
  });

  if (!firecrawlResponse.ok) {
    const errorText = await firecrawlResponse.text();
    throw new Error(`Firecrawl API error: ${firecrawlResponse.status} - ${errorText}`);
  }

  const firecrawlData = await firecrawlResponse.json();
  return extractProductData(firecrawlData, url, supplier);
}

async function scrapeWithDirectFetch(url: string, supplier: string): Promise<ScrapedProduct | null> {
  console.log('🌐 Attempting direct fetch for:', url);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();
  
  // Try to find JSON-LD product data
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  let productData: any = null;
  
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/i, '');
        const data = JSON.parse(jsonContent);
        if (data['@type'] === 'Product' || (Array.isArray(data['@graph']) && data['@graph'].find((item: any) => item['@type'] === 'Product'))) {
          productData = data['@type'] === 'Product' ? data : data['@graph'].find((item: any) => item['@type'] === 'Product');
          break;
        }
      } catch (e) {
        // Continue to next match
      }
    }
  }

  if (productData) {
    console.log('✅ Found JSON-LD product data');
    return {
      name: productData.name || 'Produit importé',
      description: productData.description || '',
      price: parseFloat(productData.offers?.price || productData.offers?.[0]?.price || '0'),
      currency: productData.offers?.priceCurrency || productData.offers?.[0]?.priceCurrency || 'EUR',
      images: Array.isArray(productData.image) ? productData.image : [productData.image].filter(Boolean),
      brand: productData.brand?.name || productData.brand,
      supplier_name: supplier,
      supplier_url: url,
      stock_status: productData.offers?.availability?.includes('InStock') ? 'in_stock' : 'out_of_stock',
      rating: productData.aggregateRating?.ratingValue,
      reviews_count: productData.aggregateRating?.reviewCount,
    };
  }

  // Fallback to HTML parsing
  const name = extractFromHtml(html, [
    /<h1[^>]*class="[^"]*product[^"]*"[^>]*>([^<]+)<\/h1>/i,
    /<h1[^>]*>([^<]+)<\/h1>/i,
    /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i,
    /<title>([^<]+)<\/title>/i,
  ]);

  const priceMatch = html.match(/["']price["']\s*:\s*["']?(\d+[.,]?\d*)/i) ||
    html.match(/(\d+[.,]\d{2})\s*€/) ||
    html.match(/€\s*(\d+[.,]\d{2})/) ||
    html.match(/\$\s*(\d+\.\d{2})/);

  const images = extractImagesFromHtml(html);

  const description = extractFromHtml(html, [
    /<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i,
    /<meta[^>]*name="description"[^>]*content="([^"]+)"/i,
  ]) || '';

  if (!name || name.length < 5) {
    throw new Error('Could not extract product name');
  }

  return {
    name: cleanText(name),
    description: cleanText(description),
    price: priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0,
    currency: html.includes('€') ? 'EUR' : html.includes('$') ? 'USD' : 'EUR',
    images,
    supplier_name: supplier,
    supplier_url: url,
    stock_status: 'in_stock',
  };
}

function extractFromHtml(html: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

function extractImagesFromHtml(html: string): string[] {
  const images: string[] = [];
  
  // Try og:image first
  const ogMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
  if (ogMatch) {
    images.push(ogMatch[1]);
  }

  // Extract from img tags
  const imgRegex = /<img[^>]+(?:src|data-src)=["']([^"']+)["']/gi;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null && images.length < 10) {
    const imgUrl = match[1];
    if (imgUrl.startsWith('http') && 
        !imgUrl.includes('icon') && 
        !imgUrl.includes('logo') &&
        !imgUrl.includes('.svg') &&
        imgUrl.length > 20) {
      if (!images.includes(imgUrl)) {
        images.push(imgUrl);
      }
    }
  }

  return images;
}

function createFallbackProduct(url: string, supplier: string): ScrapedProduct {
  console.log('⚠️ Using fallback product creation');
  
  // Extract potential product info from URL
  const urlPath = new URL(url).pathname;
  const pathParts = urlPath.split('/').filter(p => p.length > 0);
  
  // Try to get product name from URL
  let productName = pathParts[pathParts.length - 1] || 'Produit importé';
  productName = productName
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\.html?$/i, '')
    .replace(/\d+/g, '')
    .trim();

  if (productName.length < 5) {
    productName = `Produit ${supplier} - ${new Date().toLocaleDateString('fr-FR')}`;
  }

  return {
    name: productName.charAt(0).toUpperCase() + productName.slice(1),
    description: `Produit importé depuis ${supplier}. Veuillez compléter la description.`,
    price: 0,
    currency: 'EUR',
    images: [],
    supplier_name: supplier,
    supplier_url: url,
    stock_status: 'in_stock',
  };
}

function detectSupplier(url: string): string {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('aliexpress.com') || urlLower.includes('aliexpress.')) return 'AliExpress';
  if (urlLower.includes('amazon.')) return 'Amazon';
  if (urlLower.includes('temu.com')) return 'Temu';
  if (urlLower.includes('ebay.')) return 'eBay';
  if (urlLower.includes('walmart.com')) return 'Walmart';
  if (urlLower.includes('etsy.com')) return 'Etsy';
  if (urlLower.includes('wish.com')) return 'Wish';
  if (urlLower.includes('banggood.com')) return 'Banggood';
  if (urlLower.includes('dhgate.com')) return 'DHgate';
  if (urlLower.includes('cjdropshipping.com')) return 'CJ Dropshipping';
  if (urlLower.includes('shein.com')) return 'Shein';
  if (urlLower.includes('1688.com')) return '1688';
  if (urlLower.includes('taobao.com')) return 'Taobao';
  if (urlLower.includes('myshopify.com') || urlLower.includes('/products/')) return 'Shopify Store';
  
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '').split('.')[0];
  } catch {
    return 'Unknown Supplier';
  }
}

function extractProductData(
  firecrawlData: any,
  url: string,
  supplier: string
): ScrapedProduct {
  const markdown = firecrawlData.data?.markdown || '';
  const html = firecrawlData.data?.html || '';
  const metadata = firecrawlData.data?.metadata || {};

  // Extract product name
  const name = extractProductName(markdown, html, metadata, supplier);

  // Extract description
  const description = extractDescription(markdown, html, supplier);

  // Extract price
  const { price, currency } = extractPrice(markdown, html, supplier);

  // Extract images
  const images = extractImages(html, firecrawlData.data?.links || []);

  // Extract rating and reviews
  const { rating, reviews_count } = extractRatings(markdown, html);

  // Extract stock status
  const stock_status = extractStockStatus(markdown, html);

  // Extract brand
  const brand = extractBrand(markdown, html, metadata);

  // Extract category
  const category = extractCategory(markdown, html, metadata);

  return {
    name,
    description,
    price,
    currency,
    images,
    brand,
    category,
    supplier_name: supplier,
    supplier_url: url,
    stock_status,
    rating,
    reviews_count,
  };
}

function extractProductName(markdown: string, html: string, metadata: any, supplier: string): string {
  // Try metadata title first (often the most accurate)
  if (metadata.title && metadata.title.length > 10) {
    const title = cleanText(metadata.title);
    // Filter out site names
    const siteNames = ['temu', 'aliexpress', 'amazon', 'ebay', 'walmart', 'etsy'];
    const isNotJustSiteName = !siteNames.some(site => title.toLowerCase().trim() === site);
    if (isNotJustSiteName) {
      console.log(`📝 Product name from metadata: ${title}`);
      return title;
    }
  }

  // Try og:title
  const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
  if (ogTitleMatch && ogTitleMatch[1].length > 10) {
    console.log(`📝 Product name from og:title: ${ogTitleMatch[1]}`);
    return cleanText(ogTitleMatch[1]);
  }

  // Extract from markdown headers
  const lines = markdown.split('\n');
  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)$/);
    if (h1Match) {
      const title = cleanText(h1Match[1]);
      if (title.length > 10) {
        console.log(`📝 Product name from markdown: ${title}`);
        return title;
      }
    }
  }

  // Try h1 from HTML
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match && h1Match[1].length > 10) {
    console.log(`📝 Product name from HTML h1: ${h1Match[1]}`);
    return cleanText(h1Match[1]);
  }

  console.warn('⚠️ No product name found, using fallback');
  return `Produit ${supplier} - ${new Date().toLocaleDateString('fr-FR')}`;
}

function extractDescription(markdown: string, html: string, supplier: string): string {
  // Try og:description first
  const ogMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
  if (ogMatch && ogMatch[1].length > 20) {
    return cleanText(ogMatch[1]);
  }

  // Try meta description
  const metaMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
  if (metaMatch && metaMatch[1].length > 20) {
    return cleanText(metaMatch[1]);
  }

  // Remove headers and extract first few paragraphs from markdown
  const lines = markdown.split('\n').filter(line => 
    !line.startsWith('#') && 
    line.trim().length > 20 &&
    !line.includes('http')
  );

  return lines.slice(0, 5).join('\n').substring(0, 1000);
}

function extractPrice(markdown: string, html: string, supplier: string): { price: number; currency: string } {
  const combinedText = markdown + ' ' + html;
  
  // Common price patterns - including European format with comma
  const pricePatterns = [
    { regex: /["']price["']\s*:\s*["']?(\d+[.,]?\d*)/i, currency: 'EUR' },
    { regex: /(\d+,\d{2})\s*€/, currency: 'EUR' },
    { regex: /€\s*(\d+,\d{2})/, currency: 'EUR' },
    { regex: /(\d+\.\d{2})\s*€/, currency: 'EUR' },
    { regex: /€\s*(\d+\.\d{2})/, currency: 'EUR' },
    { regex: /\$\s*(\d+\.\d{2})/, currency: 'USD' },
    { regex: /(\d+\.\d{2})\s*\$/, currency: 'USD' },
    { regex: /US\s*\$\s*(\d+\.\d{2})/i, currency: 'USD' },
    { regex: /£\s*(\d+\.\d{2})/, currency: 'GBP' },
    { regex: /(\d+\.\d{2})\s*£/, currency: 'GBP' },
    { regex: /(\d+,\d{2})\s*EUR/i, currency: 'EUR' },
    { regex: /(\d+\.\d{2})\s*USD/i, currency: 'USD' },
  ];

  for (const { regex, currency } of pricePatterns) {
    const match = combinedText.match(regex);
    if (match) {
      const priceStr = match[1].replace(',', '.');
      const price = parseFloat(priceStr);
      if (price > 0 && price < 100000) {
        console.log(`💰 Price extracted: ${price} ${currency}`);
        return { price, currency };
      }
    }
  }

  console.warn('⚠️ No price found, using default');
  return { price: 0, currency: 'EUR' };
}

function extractImages(html: string, links: any[]): string[] {
  const images: string[] = [];
  
  // Try og:image first
  const ogMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
  if (ogMatch) {
    images.push(ogMatch[1]);
  }
  
  // Extract from img tags (src and data-src for lazy loading)
  const imgRegex = /<img[^>]+(?:src|data-src)=["']([^"']+)["']/gi;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    const imgUrl = match[1];
    // Filter out small icons, logos, and ensure it's a valid image URL
    if (!imgUrl.includes('icon') && 
        !imgUrl.includes('logo') && 
        !imgUrl.includes('placeholder') &&
        !imgUrl.includes('sprite') &&
        !imgUrl.includes('svg') &&
        (imgUrl.includes('.jpg') || imgUrl.includes('.jpeg') || 
         imgUrl.includes('.png') || imgUrl.includes('.webp') ||
         imgUrl.includes('image')) &&
        imgUrl.length > 20) {
      // Make sure it's an absolute URL
      if (imgUrl.startsWith('http') && !images.includes(imgUrl)) {
        images.push(imgUrl);
      }
    }
  }

  console.log(`🖼️ Found ${images.length} product images`);
  
  // Deduplicate and limit to 10 images
  return [...new Set(images)].slice(0, 10);
}

function extractRatings(markdown: string, html: string): { rating?: number; reviews_count?: number } {
  let rating: number | undefined;
  let reviews_count: number | undefined;

  // Rating patterns
  const ratingMatch = markdown.match(/(\d+(?:\.\d+)?)\s*(?:out of|\/)\s*5/i) ||
    html.match(/ratingValue["']?\s*:\s*["']?(\d+(?:\.\d+)?)/i);
  if (ratingMatch) {
    rating = parseFloat(ratingMatch[1]);
  }

  // Reviews count patterns
  const reviewsMatch = markdown.match(/(\d+(?:,\d+)?)\s*(?:reviews?|ratings?|avis)/i) ||
    html.match(/reviewCount["']?\s*:\s*["']?(\d+)/i);
  if (reviewsMatch) {
    reviews_count = parseInt(reviewsMatch[1].replace(/,/g, ''));
  }

  return { rating, reviews_count };
}

function extractStockStatus(markdown: string, html: string): 'in_stock' | 'out_of_stock' | 'limited_stock' {
  const text = (markdown + ' ' + html).toLowerCase();
  
  if (text.includes('out of stock') || text.includes('sold out') || text.includes('épuisé') || text.includes('OutOfStock')) {
    return 'out_of_stock';
  }
  
  if (text.includes('limited stock') || text.includes('only') || text.includes('hurry') || text.includes('LimitedAvailability')) {
    return 'limited_stock';
  }
  
  return 'in_stock';
}

function extractBrand(markdown: string, html: string, metadata: any): string | undefined {
  // Try metadata
  if (metadata.brand) {
    return cleanText(metadata.brand);
  }

  // Try JSON-LD
  const brandMatch = html.match(/["']brand["']\s*:\s*\{[^}]*["']name["']\s*:\s*["']([^"']+)["']/i) ||
    html.match(/["']brand["']\s*:\s*["']([^"']+)["']/i);
  if (brandMatch) {
    return cleanText(brandMatch[1]);
  }

  // Common brand patterns
  const textMatch = markdown.match(/Brand:\s*([^\n]+)/i) || html.match(/Brand:\s*([^<]+)/i);
  if (textMatch) {
    return cleanText(textMatch[1]);
  }

  return undefined;
}

function extractCategory(markdown: string, html: string, metadata: any): string | undefined {
  // Try metadata
  if (metadata.category) {
    return cleanText(metadata.category);
  }

  // Common category patterns
  const categoryMatch = markdown.match(/Category:\s*([^\n]+)/i) || html.match(/Category:\s*([^<]+)/i);
  if (categoryMatch) {
    return cleanText(categoryMatch[1]);
  }

  return 'Import URL';
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 500);
}
