import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedProduct {
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  variants?: any[];
  brand?: string;
  category?: string;
  sku?: string;
  supplier_name: string;
  supplier_url: string;
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

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Non authentifié');
    }

    const { url } = await req.json();

    if (!url) {
      throw new Error('URL manquante');
    }

    console.log('🔍 Scraping product from URL:', url);

    // Get Firecrawl API key
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      throw new Error('Firecrawl API key not configured');
    }

    // Detect supplier
    const supplier = detectSupplier(url);
    console.log('📦 Detected supplier:', supplier);

    // Call Firecrawl API to scrape the page
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        includeTags: ['img', 'h1', 'h2', 'p', 'span', 'div'],
      }),
    });

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error('❌ Firecrawl API error:', errorText);
      throw new Error(`Firecrawl scraping failed: ${firecrawlResponse.status}`);
    }

    const firecrawlData = await firecrawlResponse.json();
    console.log('✅ Firecrawl data received');

    // Extract product data from scraped content
    const product = extractProductData(firecrawlData, url, supplier);

    console.log('✅ Product extracted:', product.name);

    // Log activity
    await supabaseClient.from('activity_logs').insert({
      user_id: user.id,
      action: 'product_url_scrape',
      description: `Produit extrait depuis URL: ${product.name}`,
      metadata: {
        supplier: product.supplier_name,
        source_url: url,
        scrape_timestamp: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        product,
        rawData: firecrawlData
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
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

function detectSupplier(url: string): string {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('aliexpress.com')) return 'AliExpress';
  if (urlLower.includes('amazon.')) return 'Amazon';
  if (urlLower.includes('temu.com')) return 'Temu';
  if (urlLower.includes('ebay.')) return 'eBay';
  if (urlLower.includes('walmart.com')) return 'Walmart';
  if (urlLower.includes('etsy.com')) return 'Etsy';
  
  return 'Unknown Supplier';
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
  // Try metadata title first
  if (metadata.title && metadata.title.length > 5) {
    return cleanText(metadata.title);
  }

  // Extract from markdown headers
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return cleanText(h1Match[1]);
  }

  // Fallback patterns based on supplier
  if (supplier === 'AliExpress') {
    const match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (match) return cleanText(match[1]);
  }

  return `Produit importé - ${new Date().toISOString().split('T')[0]}`;
}

function extractDescription(markdown: string, html: string, supplier: string): string {
  // Remove headers and extract first few paragraphs
  const lines = markdown.split('\n').filter(line => 
    !line.startsWith('#') && 
    line.trim().length > 20 &&
    !line.includes('http')
  );

  return lines.slice(0, 5).join('\n').substring(0, 1000);
}

function extractPrice(markdown: string, html: string, supplier: string): { price: number; currency: string } {
  // Common price patterns
  const pricePatterns = [
    /\$\s*(\d+(?:\.\d{2})?)/,  // $29.99
    /(\d+(?:\.\d{2})?)\s*\$/,  // 29.99$
    /€\s*(\d+(?:\.\d{2})?)/,   // €29.99
    /(\d+(?:\.\d{2})?)\s*€/,   // 29.99€
    /£\s*(\d+(?:\.\d{2})?)/,   // £29.99
    /US\s*\$\s*(\d+(?:\.\d{2})?)/i, // US $29.99
  ];

  let price = 0;
  let currency = 'USD';

  for (const pattern of pricePatterns) {
    const match = markdown.match(pattern) || html.match(pattern);
    if (match) {
      price = parseFloat(match[1]);
      if (markdown.includes('€') || html.includes('€')) currency = 'EUR';
      else if (markdown.includes('£') || html.includes('£')) currency = 'GBP';
      break;
    }
  }

  // If no price found, set a default
  if (price === 0) {
    price = 9.99;
  }

  return { price, currency };
}

function extractImages(html: string, links: any[]): string[] {
  const images: string[] = [];
  
  // Extract from img tags
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    const imgUrl = match[1];
    // Filter out small icons and logos
    if (!imgUrl.includes('icon') && 
        !imgUrl.includes('logo') && 
        !imgUrl.includes('placeholder') &&
        imgUrl.length > 20) {
      images.push(imgUrl);
    }
  }

  // Deduplicate and limit to 10 images
  return [...new Set(images)].slice(0, 10);
}

function extractRatings(markdown: string, html: string): { rating?: number; reviews_count?: number } {
  let rating: number | undefined;
  let reviews_count: number | undefined;

  // Rating patterns
  const ratingMatch = markdown.match(/(\d+(?:\.\d+)?)\s*(?:out of|\/)\s*5/i);
  if (ratingMatch) {
    rating = parseFloat(ratingMatch[1]);
  }

  // Reviews count patterns
  const reviewsMatch = markdown.match(/(\d+(?:,\d+)?)\s*(?:reviews?|ratings?)/i);
  if (reviewsMatch) {
    reviews_count = parseInt(reviewsMatch[1].replace(/,/g, ''));
  }

  return { rating, reviews_count };
}

function extractStockStatus(markdown: string, html: string): 'in_stock' | 'out_of_stock' | 'limited_stock' {
  const text = (markdown + ' ' + html).toLowerCase();
  
  if (text.includes('out of stock') || text.includes('sold out') || text.includes('épuisé')) {
    return 'out_of_stock';
  }
  
  if (text.includes('limited stock') || text.includes('only') || text.includes('hurry')) {
    return 'limited_stock';
  }
  
  return 'in_stock';
}

function extractBrand(markdown: string, html: string, metadata: any): string | undefined {
  // Try metadata
  if (metadata.brand) {
    return cleanText(metadata.brand);
  }

  // Common brand patterns
  const brandMatch = markdown.match(/Brand:\s*([^\n]+)/i) || html.match(/Brand:\s*([^<]+)/i);
  if (brandMatch) {
    return cleanText(brandMatch[1]);
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
    .replace(/[^\w\s\-.,!?]/g, '')
    .trim()
    .substring(0, 500);
}
