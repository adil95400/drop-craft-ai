import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichmentRequest {
  product_ids: string[];
  sources?: string[];
}

interface MarketplaceData {
  source: string;
  source_url?: string;
  source_product_id?: string;
  matched_via: string;
  raw_title?: string;
  raw_description?: string;
  raw_images?: string[];
  raw_attributes?: Record<string, any>;
  raw_variants?: any[];
  raw_price?: number;
  raw_currency?: string;
  raw_reviews_count?: number;
  raw_rating?: number;
  raw_shipping_info?: Record<string, any>;
}

// Product matching via EAN/GTIN/Image using REAL data providers only
async function matchProductOnMarketplace(
  product: any,
  source: string
): Promise<MarketplaceData | null> {
  const { ean, gtin, upc, name, vendor, image_url } = product;
  
  // Priority: EAN > GTIN > UPC > Image > Title+Brand
  let matchedVia = 'ean';
  let identifier = ean || gtin || upc;
  
  // Try image-based matching if no barcode
  if (!identifier && image_url) {
    matchedVia = 'image';
    identifier = image_url;
  }
  
  if (!identifier && name) {
    matchedVia = 'title_brand';
    identifier = `${name} ${vendor || ''}`.trim();
  }
  
  if (!identifier) {
    console.log(`No identifier found for product ${product.id}`);
    return null;
  }

  try {
    switch (source) {
      case 'amazon':
        return await fetchAmazonData(identifier, matchedVia, product);
      case 'aliexpress':
        return await fetchAliExpressData(identifier, matchedVia, product);
      case 'ebay':
        return await fetchEbayData(identifier, matchedVia, product);
      case 'cdiscount':
        return await fetchCdiscountData(identifier, matchedVia, product);
      case 'temu':
        return await fetchTemuData(identifier, matchedVia, product);
      default:
        console.log(`Source ${source} not supported for real API integration`);
        return null;
    }
  } catch (error) {
    console.error(`Error matching product on ${source}:`, error);
    return null;
  }
}

// Amazon via RapidAPI Product Data API - REAL API ONLY
async function fetchAmazonData(
  identifier: string,
  matchedVia: string,
  product: any
): Promise<MarketplaceData | null> {
  const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
  
  if (!rapidApiKey) {
    console.error('RAPIDAPI_KEY not configured - cannot enrich from Amazon');
    return null;
  }

  try {
    console.log(`Fetching Amazon data via RapidAPI for identifier: ${identifier}`);
    
    // Use search endpoint for text queries, or ASIN lookup if we have one
    let url: string;
    let options: RequestInit;
    
    if (matchedVia === 'ean') {
      // Search by EAN/barcode
      url = `https://amazon-product-data6.p.rapidapi.com/product-by-barcode?barcode=${encodeURIComponent(identifier)}&country=FR`;
    } else {
      // Text search
      url = `https://amazon-product-data6.p.rapidapi.com/search?keyword=${encodeURIComponent(identifier)}&country=FR&page=1`;
    }
    
    options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'amazon-product-data6.p.rapidapi.com'
      }
    };

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`RapidAPI Amazon error ${response.status}: ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    
    // Handle different response formats
    let result: any = null;
    
    if (matchedVia === 'ean' && data.product) {
      result = data.product;
    } else if (data.products && data.products.length > 0) {
      result = data.products[0];
    } else if (data.data && data.data.products) {
      result = data.data.products[0];
    }
    
    if (!result) {
      console.log(`No Amazon results found for: ${identifier}`);
      return null;
    }

    console.log(`Amazon product found: ${result.title || result.name}`);
    
    return {
      source: 'amazon',
      source_url: result.url || result.product_url || `https://www.amazon.fr/dp/${result.asin}`,
      source_product_id: result.asin,
      matched_via: matchedVia,
      raw_title: result.title || result.name,
      raw_description: result.description || result.feature_bullets?.join(' ') || result.title,
      raw_images: result.images || (result.image ? [result.image] : result.main_image ? [result.main_image] : []),
      raw_attributes: result.specifications || result.attributes || {},
      raw_variants: result.variants || [],
      raw_price: parseFloat(result.price?.current_price || result.price?.value || result.current_price || '0'),
      raw_currency: result.price?.currency || 'EUR',
      raw_reviews_count: result.reviews_count || result.total_reviews,
      raw_rating: result.rating || result.stars,
      raw_shipping_info: result.delivery_info || result.shipping || {},
    };
  } catch (error) {
    console.error('RapidAPI Amazon error:', error);
    return null;
  }
}

// AliExpress Affiliate API - REAL API ONLY
async function fetchAliExpressData(
  identifier: string,
  matchedVia: string,
  product: any
): Promise<MarketplaceData | null> {
  const aliexpressApiKey = Deno.env.get('ALIEXPRESS_API_KEY');
  const aliexpressAppSecret = Deno.env.get('ALIEXPRESS_APP_SECRET');
  
  if (!aliexpressApiKey || !aliexpressAppSecret) {
    console.error('ALIEXPRESS_API_KEY or ALIEXPRESS_APP_SECRET not configured - cannot enrich from AliExpress');
    return null;
  }

  try {
    console.log(`Fetching AliExpress data for identifier: ${identifier}`);
    
    // Generate signature for AliExpress TOP API
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const signData = `aliexpress.affiliate.product.queryapp_key${aliexpressApiKey}keywords${identifier}sign_methodmd5target_currencyEURtarget_languageFRtimestamp${timestamp}`;
    
    // Simple MD5-like signature (in production, use proper crypto)
    const encoder = new TextEncoder();
    const data = encoder.encode(aliexpressAppSecret + signData + aliexpressAppSecret);
    const hashBuffer = await crypto.subtle.digest('MD5', data).catch(() => null);
    
    let sign = '';
    if (hashBuffer) {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      sign = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    const url = 'https://api-sg.aliexpress.com/sync';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        method: 'aliexpress.affiliate.product.query',
        app_key: aliexpressApiKey,
        sign_method: 'md5',
        sign: sign,
        timestamp: timestamp,
        keywords: identifier,
        target_currency: 'EUR',
        target_language: 'FR',
        page_no: '1',
        page_size: '1',
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AliExpress API error ${response.status}: ${errorText}`);
      return null;
    }
    
    const responseData = await response.json();
    const result = responseData.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.[0];
    
    if (!result) {
      console.log(`No AliExpress results found for: ${identifier}`);
      return null;
    }

    console.log(`AliExpress product found: ${result.product_title}`);
    
    return {
      source: 'aliexpress',
      source_url: result.product_detail_url,
      source_product_id: String(result.product_id),
      matched_via: matchedVia,
      raw_title: result.product_title,
      raw_description: result.product_title,
      raw_images: [result.product_main_image_url, ...(result.product_small_image_urls?.string || [])],
      raw_attributes: {},
      raw_price: parseFloat(result.target_sale_price || result.target_original_price || '0'),
      raw_currency: 'EUR',
      raw_reviews_count: result.evaluate_rate ? parseInt(result.evaluate_rate) : undefined,
      raw_rating: undefined,
      raw_shipping_info: { 
        delivery_time: result.logistics_info_dto?.delivery_time,
        ship_to_country: result.ship_to_country,
      },
    };
  } catch (error) {
    console.error('AliExpress API error:', error);
    return null;
  }
}

// eBay Browse API - REAL API ONLY
async function fetchEbayData(
  identifier: string,
  matchedVia: string,
  product: any
): Promise<MarketplaceData | null> {
  const ebayClientId = Deno.env.get('EBAY_CLIENT_ID');
  const ebayClientSecret = Deno.env.get('EBAY_CLIENT_SECRET');
  
  if (!ebayClientId || !ebayClientSecret) {
    console.error('EBAY_CLIENT_ID or EBAY_CLIENT_SECRET not configured - cannot enrich from eBay');
    return null;
  }

  try {
    console.log(`Fetching eBay data for identifier: ${identifier}`);
    
    // Get OAuth token first
    const tokenResponse = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${ebayClientId}:${ebayClientSecret}`)}`,
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`eBay OAuth error ${tokenResponse.status}: ${errorText}`);
      return null;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('Failed to obtain eBay access token');
      return null;
    }

    // Search for product
    const searchParam = matchedVia === 'ean' ? `gtin:${identifier}` : identifier;
    const searchUrl = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(searchParam)}&limit=1`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_FR',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`eBay Browse API error ${response.status}: ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    const result = data.itemSummaries?.[0];
    
    if (!result) {
      console.log(`No eBay results found for: ${identifier}`);
      return null;
    }

    console.log(`eBay product found: ${result.title}`);
    
    return {
      source: 'ebay',
      source_url: result.itemWebUrl,
      source_product_id: result.itemId,
      matched_via: matchedVia,
      raw_title: result.title,
      raw_description: result.shortDescription || result.title,
      raw_images: [result.image?.imageUrl, ...(result.additionalImages?.map((i: any) => i.imageUrl) || [])].filter(Boolean),
      raw_attributes: result.itemSpecifics || {},
      raw_price: parseFloat(result.price?.value || '0'),
      raw_currency: result.price?.currency || 'EUR',
      raw_shipping_info: result.shippingOptions?.[0] || {},
    };
  } catch (error) {
    console.error('eBay API error:', error);
    return null;
  }
}

// Cdiscount API - REAL API ONLY
async function fetchCdiscountData(
  identifier: string,
  matchedVia: string,
  product: any
): Promise<MarketplaceData | null> {
  const cdiscountApiKey = Deno.env.get('CDISCOUNT_API_KEY');
  
  if (!cdiscountApiKey) {
    console.error('CDISCOUNT_API_KEY not configured - cannot enrich from Cdiscount');
    return null;
  }

  try {
    console.log(`Fetching Cdiscount data for identifier: ${identifier}`);
    
    // Cdiscount API endpoint
    const url = `https://api.cdiscount.com/OpenApi/Marketplace/Products?apikey=${cdiscountApiKey}&ean=${encodeURIComponent(identifier)}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Cdiscount API error ${response.status}: ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    const result = data.Products?.[0];
    
    if (!result) {
      console.log(`No Cdiscount results found for: ${identifier}`);
      return null;
    }

    console.log(`Cdiscount product found: ${result.Name}`);
    
    return {
      source: 'cdiscount',
      source_url: result.ProductUrl,
      source_product_id: result.ProductId,
      matched_via: matchedVia,
      raw_title: result.Name,
      raw_description: result.Description,
      raw_images: result.Images || [],
      raw_attributes: result.Attributes || {},
      raw_price: parseFloat(result.Price || '0'),
      raw_currency: 'EUR',
      raw_reviews_count: result.ReviewCount,
      raw_rating: result.Rating,
      raw_shipping_info: result.ShippingInfo || {},
    };
  } catch (error) {
    console.error('Cdiscount API error:', error);
    return null;
  }
}

// Temu API - Via RapidAPI scraper (no official API)
async function fetchTemuData(
  identifier: string,
  matchedVia: string,
  product: any
): Promise<MarketplaceData | null> {
  const temuApiKey = Deno.env.get('TEMU_API_KEY') || Deno.env.get('RAPIDAPI_KEY');
  
  if (!temuApiKey) {
    console.error('TEMU_API_KEY not configured - cannot enrich from Temu');
    return null;
  }

  try {
    console.log(`Fetching Temu data for identifier: ${identifier}`);
    
    // Use RapidAPI Temu scraper
    const url = `https://temu-com-shopping.p.rapidapi.com/search?keyword=${encodeURIComponent(identifier)}&page=1`;
    
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': temuApiKey,
        'X-RapidAPI-Host': 'temu-com-shopping.p.rapidapi.com'
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Temu API error ${response.status}: ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    const result = data.data?.items?.[0];
    
    if (!result) {
      console.log(`No Temu results found for: ${identifier}`);
      return null;
    }

    console.log(`Temu product found: ${result.title}`);
    
    return {
      source: 'temu',
      source_url: result.url || `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(identifier)}`,
      source_product_id: result.id,
      matched_via: matchedVia,
      raw_title: result.title,
      raw_description: result.description || result.title,
      raw_images: result.images || (result.image ? [result.image] : []),
      raw_attributes: {},
      raw_price: parseFloat(result.price || result.salePrice || '0'),
      raw_currency: result.currency || 'EUR',
      raw_reviews_count: result.reviewCount,
      raw_rating: result.rating,
      raw_shipping_info: { free_shipping: result.freeShipping },
    };
  } catch (error) {
    console.error('Temu API error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { product_ids, sources = ['amazon', 'aliexpress', 'ebay'] }: EnrichmentRequest = await req.json();

    if (!product_ids || product_ids.length === 0) {
      return new Response(JSON.stringify({ error: 'product_ids required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check which APIs are configured
    const configuredSources: string[] = [];
    if (Deno.env.get('RAPIDAPI_KEY')) configuredSources.push('amazon');
    if (Deno.env.get('ALIEXPRESS_API_KEY') && Deno.env.get('ALIEXPRESS_APP_SECRET')) configuredSources.push('aliexpress');
    if (Deno.env.get('EBAY_CLIENT_ID') && Deno.env.get('EBAY_CLIENT_SECRET')) configuredSources.push('ebay');
    if (Deno.env.get('CDISCOUNT_API_KEY')) configuredSources.push('cdiscount');
    if (Deno.env.get('TEMU_API_KEY')) configuredSources.push('temu');

    if (configuredSources.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No enrichment APIs configured',
        message: 'Please configure at least one API: RAPIDAPI_KEY (for Amazon), ALIEXPRESS_API_KEY, or EBAY_CLIENT_ID',
        required_secrets: ['RAPIDAPI_KEY', 'ALIEXPRESS_API_KEY', 'ALIEXPRESS_APP_SECRET', 'EBAY_CLIENT_ID', 'EBAY_CLIENT_SECRET'],
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Filter to only configured sources
    const activeSources = sources.filter(s => configuredSources.includes(s));
    
    if (activeSources.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'None of the requested sources are configured',
        requested: sources,
        configured: configuredSources,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Starting REAL API enrichment for ${product_ids.length} products from sources: ${activeSources.join(', ')}`);
    console.log(`Configured sources: ${configuredSources.join(', ')}`);

    const results: any[] = [];

    for (const productId of product_ids) {
      // Fetch product
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('user_id', user.id)
        .single();

      if (productError || !product) {
        results.push({ product_id: productId, status: 'error', message: 'Product not found' });
        continue;
      }

      // Update product status
      await supabase
        .from('products')
        .update({ enrichment_status: 'in_progress' })
        .eq('id', productId);

      let enrichmentSuccess = false;
      const enrichedSources: string[] = [];

      for (const source of activeSources) {
        try {
          // Check if enrichment already exists
          const { data: existing } = await supabase
            .from('product_enrichment')
            .select('id, enrichment_status')
            .eq('product_id', productId)
            .eq('source', source)
            .single();

          // Fetch marketplace data via REAL API
          const marketplaceData = await matchProductOnMarketplace(product, source);

          if (marketplaceData) {
            const enrichmentRecord = {
              product_id: productId,
              user_id: user.id,
              ...marketplaceData,
              enrichment_status: 'success',
              last_fetch_at: new Date().toISOString(),
              fetch_attempts: (existing?.id ? 1 : 0) + 1,
            };

            if (existing?.id) {
              await supabase
                .from('product_enrichment')
                .update(enrichmentRecord)
                .eq('id', existing.id);
            } else {
              await supabase
                .from('product_enrichment')
                .insert(enrichmentRecord);
            }

            enrichmentSuccess = true;
            enrichedSources.push(source);
            console.log(`Successfully enriched product ${productId} from ${source}`);
          }
        } catch (error) {
          console.error(`Error enriching from ${source}:`, error);
        }
      }

      // Update product status
      await supabase
        .from('products')
        .update({
          enrichment_status: enrichmentSuccess ? 'success' : 'failed',
          last_enriched_at: new Date().toISOString(),
        })
        .eq('id', productId);

      results.push({
        product_id: productId,
        status: enrichmentSuccess ? 'success' : 'no_results',
        sources_checked: activeSources,
        sources_enriched: enrichedSources,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Enrichment completed for ${product_ids.length} products using REAL APIs`,
      configured_sources: configuredSources,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Enrichment error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
