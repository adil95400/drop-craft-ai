import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
};

interface AliExpressRequest {
  action: string;
  product_id?: string;
  product_ids?: string[];
  include_reviews?: boolean;
  include_shipping?: boolean;
  target_language?: string;
  target_currency?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: AliExpressRequest = await req.json();
    const { action } = body;

    // Get API credentials from environment
    const appKey = Deno.env.get('ALIEXPRESS_APP_KEY');
    const appSecret = Deno.env.get('ALIEXPRESS_APP_SECRET');
    const accessToken = Deno.env.get('ALIEXPRESS_ACCESS_TOKEN');

    if (!appKey || !appSecret) {
      return new Response(
        JSON.stringify({
          error: 'AliExpress API credentials not configured',
          configured: false,
          docs: 'https://developers.aliexpress.com/'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const API_BASE = 'https://api-sg.aliexpress.com/sync';

    switch (action) {
      case 'check_credentials':
        return new Response(
          JSON.stringify({ configured: true, status: 'ready' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'get_product': {
        const { product_id, include_reviews, include_shipping, target_language, target_currency } = body;
        
        if (!product_id) {
          return new Response(
            JSON.stringify({ error: 'product_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Build API request
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
        
        const params: Record<string, string> = {
          app_key: appKey,
          timestamp,
          sign_method: 'sha256',
          v: '2.0',
          format: 'json',
          method: 'aliexpress.ds.product.get',
          product_id,
          target_language: target_language || 'EN',
          target_currency: target_currency || 'USD',
        };

        // Generate signature
        const sign = await generateSignature(params, appSecret);
        params.sign = sign;

        // Make API call
        const url = `${API_BASE}?${new URLSearchParams(params).toString()}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        const data = await response.json();

        // Get additional data if requested
        if (include_shipping && data.aliexpress_ds_product_get_response?.result) {
          const shippingData = await getShippingInfo(product_id, appKey, appSecret, API_BASE);
          data.shipping_info = shippingData;
        }

        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'search_products': {
        const { keywords, category_id, page_no, page_size, sort } = body as any;
        
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
        
        const params: Record<string, string> = {
          app_key: appKey,
          timestamp,
          sign_method: 'sha256',
          v: '2.0',
          format: 'json',
          method: 'aliexpress.ds.recommend.feed.get',
          target_language: 'EN',
          target_currency: 'USD',
          page_no: String(page_no || 1),
          page_size: String(page_size || 20),
        };

        if (keywords) params.keywords = keywords;
        if (category_id) params.category_id = category_id;
        if (sort) params.sort = sort;

        const sign = await generateSignature(params, appSecret);
        params.sign = sign;

        const url = `${API_BASE}?${new URLSearchParams(params).toString()}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const data = await response.json();

        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_categories': {
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
        
        const params: Record<string, string> = {
          app_key: appKey,
          timestamp,
          sign_method: 'sha256',
          v: '2.0',
          format: 'json',
          method: 'aliexpress.ds.category.get',
        };

        const sign = await generateSignature(params, appSecret);
        params.sign = sign;

        const url = `${API_BASE}?${new URLSearchParams(params).toString()}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const data = await response.json();

        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create_order': {
        if (!accessToken) {
          return new Response(
            JSON.stringify({ error: 'Access token required for order operations' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { product_id, quantity, shipping_address, logistics_service_name } = body as any;
        
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
        
        const params: Record<string, string> = {
          app_key: appKey,
          timestamp,
          sign_method: 'sha256',
          v: '2.0',
          format: 'json',
          access_token: accessToken,
          method: 'aliexpress.ds.order.create',
          product_id,
          product_num: String(quantity || 1),
          logistics_address: JSON.stringify(shipping_address),
        };

        if (logistics_service_name) {
          params.logistics_service_name = logistics_service_name;
        }

        const sign = await generateSignature(params, appSecret);
        params.sign = sign;

        const url = `${API_BASE}?${new URLSearchParams(params).toString()}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const data = await response.json();

        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('AliExpress API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateSignature(params: Record<string, string>, secret: string): Promise<string> {
  // Sort parameters alphabetically
  const sortedKeys = Object.keys(params).sort();
  let signStr = secret;
  
  for (const key of sortedKeys) {
    signStr += key + params[key];
  }
  signStr += secret;

  // Generate HMAC-SHA256
  const encoder = new TextEncoder();
  const data = encoder.encode(signStr);
  const keyData = encoder.encode(secret);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
  
  // Convert to uppercase hex
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

async function getShippingInfo(
  productId: string, 
  appKey: string, 
  appSecret: string, 
  apiBase: string
): Promise<any> {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  
  const params: Record<string, string> = {
    app_key: appKey,
    timestamp,
    sign_method: 'sha256',
    v: '2.0',
    format: 'json',
    method: 'aliexpress.ds.freight.query',
    product_id: productId,
    ship_to_country: 'FR',
  };

  const sign = await generateSignature(params, appSecret);
  params.sign = sign;

  const url = `${apiBase}?${new URLSearchParams(params).toString()}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return await response.json();
  } catch (e) {
    console.error('Shipping info error:', e);
    return null;
  }
}
