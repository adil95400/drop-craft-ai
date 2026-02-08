/**
 * CJ & AliExpress Unified Connector
 * 
 * Production-ready API integration for:
 * - CJ Dropshipping (Full API)
 * - AliExpress (Affiliate/Dropship API)
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ==========================================
// CJ DROPSHIPPING API CLIENT
// ==========================================
class CJApiClient {
  private baseUrl = 'https://developers.cjdropshipping.com/api2.0/v1';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': this.accessToken,
      },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    const data = await response.json();
    if (data.code !== 200 && !data.result) throw new Error(data.message || 'CJ API Error');
    return data;
  }

  async searchProducts(params: { keyword?: string; categoryId?: string; pageNum?: number; pageSize?: number }): Promise<any> {
    return this.request('/product/list', 'POST', {
      productNameEn: params.keyword,
      categoryId: params.categoryId,
      pageNum: params.pageNum || 1,
      pageSize: params.pageSize || 20,
    });
  }

  async getProductDetail(pid: string): Promise<any> {
    return this.request(`/product/query?pid=${pid}`);
  }

  async getProductVariants(pid: string): Promise<any> {
    return this.request(`/product/variant/queryByPid?pid=${pid}`);
  }

  async createOrder(orderData: any): Promise<any> {
    return this.request('/shopping/order/createOrder', 'POST', orderData);
  }

  async getCategories(): Promise<any> {
    return this.request('/product/getCategory');
  }
}

// ==========================================
// ALIEXPRESS API CLIENT  
// ==========================================
class AliExpressApiClient {
  private appKey: string;
  private appSecret: string;
  private baseUrl = 'https://api-sg.aliexpress.com/sync';

  constructor(appKey: string, appSecret: string) {
    this.appKey = appKey;
    this.appSecret = appSecret;
  }

  private async generateSign(params: Record<string, string>): Promise<string> {
    const sortedKeys = Object.keys(params).sort();
    let signStr = this.appSecret;
    for (const key of sortedKeys) {
      signStr += key + params[key];
    }
    signStr += this.appSecret;

    // HMAC-MD5 signature using Web Crypto
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.appSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signStr));
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  private async request(method: string, params: Record<string, any> = {}): Promise<any> {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
    
    const baseParams: Record<string, string> = {
      app_key: this.appKey,
      method,
      sign_method: 'hmac-sha256',
      timestamp,
      format: 'json',
      v: '2.0',
    };

    const allParams: Record<string, string> = {};
    for (const [k, v] of Object.entries({ ...baseParams, ...params })) {
      if (v !== undefined && v !== null) allParams[k] = String(v);
    }
    allParams.sign = await this.generateSign(allParams);

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(allParams).toString(),
    });

    const data = await response.json();
    if (data.error_response) {
      throw new Error(data.error_response.msg || `AliExpress API Error: ${data.error_response.code}`);
    }
    return data;
  }

  async searchProducts(params: {
    keywords?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    pageNo?: number;
    pageSize?: number;
    sort?: string;
    currency?: string;
    language?: string;
  }): Promise<any> {
    return this.request('aliexpress.affiliate.product.query', {
      keywords: params.keywords,
      category_ids: params.categoryId,
      min_sale_price: params.minPrice,
      max_sale_price: params.maxPrice,
      page_no: params.pageNo || 1,
      page_size: Math.min(params.pageSize || 20, 50),
      sort: params.sort || 'SALE_PRICE_ASC',
      target_currency: params.currency || 'EUR',
      target_language: params.language || 'FR',
      ship_to_country: 'FR',
    });
  }

  async getProductDetail(productIds: string): Promise<any> {
    return this.request('aliexpress.affiliate.productdetail.get', {
      product_ids: productIds,
      target_currency: 'EUR',
      target_language: 'FR',
      ship_to_country: 'FR',
      fields: 'commission_rate,sale_price,original_price,product_main_image_url,product_small_image_urls,product_title,evaluate_rate,original_price_currency,sale_price_currency,shop_url,shop_id,product_video_url,second_level_category_id,target_sale_price,target_original_price',
    });
  }

  async getHotProducts(params: {
    categoryId?: string;
    pageNo?: number;
    pageSize?: number;
  }): Promise<any> {
    return this.request('aliexpress.affiliate.hotproduct.query', {
      category_ids: params.categoryId,
      page_no: params.pageNo || 1,
      page_size: Math.min(params.pageSize || 20, 50),
      target_currency: 'EUR',
      target_language: 'FR',
      ship_to_country: 'FR',
    });
  }

  async getCategories(): Promise<any> {
    return this.request('aliexpress.affiliate.category.get');
  }
}

// ==========================================
// MAIN HANDLER
// ==========================================
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Auth check via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, supplier, ...params } = await req.json();
    console.log(`[connector] supplier=${supplier}, action=${action}, user=${user.id.slice(0, 8)}`);

    // ==========================================
    // ALIEXPRESS ACTIONS
    // ==========================================
    if (supplier === 'aliexpress') {
      const appKey = Deno.env.get('ALIEXPRESS_APP_KEY');
      const appSecret = Deno.env.get('ALIEXPRESS_APP_SECRET');

      if (!appKey || !appSecret) {
        return jsonResponse({
          success: false,
          error: 'AliExpress API keys not configured. Please add ALIEXPRESS_APP_KEY and ALIEXPRESS_APP_SECRET in your secrets.',
          setup_required: true,
        }, 400);
      }

      const aeClient = new AliExpressApiClient(appKey, appSecret);

      if (action === 'search_products') {
        const result = await aeClient.searchProducts(params);
        const products = result?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.product || [];
        const total = result?.aliexpress_affiliate_product_query_response?.resp_result?.result?.total_record_count || 0;
        
        return jsonResponse({
          success: true,
          products: normalizeAEProducts(products),
          total,
          page: params.pageNo || 1,
        });
      }

      if (action === 'hot_products') {
        const result = await aeClient.getHotProducts(params);
        const products = result?.aliexpress_affiliate_hotproduct_query_response?.resp_result?.result?.products?.product || [];
        
        return jsonResponse({
          success: true,
          products: normalizeAEProducts(products),
          total: products.length,
        });
      }

      if (action === 'get_product') {
        const result = await aeClient.getProductDetail(params.product_ids);
        const products = result?.aliexpress_affiliate_productdetail_get_response?.resp_result?.result?.products?.product || [];
        
        return jsonResponse({
          success: true,
          product: products.length > 0 ? normalizeAEProduct(products[0]) : null,
        });
      }

      if (action === 'get_categories') {
        const result = await aeClient.getCategories();
        const categories = result?.aliexpress_affiliate_category_get_response?.resp_result?.result?.categories?.category || [];
        
        return jsonResponse({ success: true, categories });
      }

      if (action === 'import_products') {
        // Import selected AliExpress products into the user's catalog
        const productIds = params.product_ids as string[];
        if (!productIds || productIds.length === 0) {
          return jsonResponse({ error: 'product_ids required' }, 400);
        }

        const result = await aeClient.getProductDetail(productIds.join(','));
        const aeProducts = result?.aliexpress_affiliate_productdetail_get_response?.resp_result?.result?.products?.product || [];
        
        const imported: any[] = [];
        for (const aeProd of aeProducts) {
          const normalized = normalizeAEProduct(aeProd);
          
          const { data, error } = await supabase
            .from('products')
            .insert({
              user_id: user.id,
              name: normalized.title,
              description: normalized.title,
              price: normalized.sale_price,
              compare_at_price: normalized.original_price > normalized.sale_price ? normalized.original_price : null,
              image_url: normalized.image_url,
              images: normalized.images,
              source: 'aliexpress_api',
              source_url: normalized.product_url,
              external_id: normalized.product_id,
              status: 'draft',
              category: normalized.category || 'AliExpress Import',
            })
            .select('id, name')
            .single();

          if (!error && data) imported.push(data);
        }

        // Log activity
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'aliexpress_api_import',
          entity_type: 'products',
          description: `Imported ${imported.length} products via AliExpress API`,
          source: 'cj-aliexpress-connector',
        });

        return jsonResponse({
          success: true,
          imported_count: imported.length,
          products: imported,
        });
      }
    }

    // ==========================================
    // CJ DROPSHIPPING ACTIONS
    // ==========================================
    if (supplier === 'cj') {
      const cjToken = Deno.env.get('CJ_ACCESS_TOKEN');
      if (!cjToken) {
        return jsonResponse({
          success: false,
          error: 'CJ Dropshipping API key not configured.',
          setup_required: true,
        }, 400);
      }

      const cjClient = new CJApiClient(cjToken);

      if (action === 'search_products') {
        const result = await cjClient.searchProducts(params);
        return jsonResponse({ success: true, products: result.data?.list || [], total: result.data?.total || 0 });
      }

      if (action === 'get_product') {
        const result = await cjClient.getProductDetail(params.product_id);
        return jsonResponse({ success: true, product: result.data });
      }

      if (action === 'get_categories') {
        const result = await cjClient.getCategories();
        return jsonResponse({ success: true, categories: result.data || [] });
      }
    }

    return jsonResponse({ error: 'Unknown action or supplier' }, 400);

  } catch (error) {
    console.error('[connector] Error:', error);
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
});

// ==========================================
// HELPERS
// ==========================================

function normalizeAEProducts(products: any[]): any[] {
  return products.map(normalizeAEProduct);
}

function normalizeAEProduct(p: any): any {
  const images: string[] = [];
  if (p.product_main_image_url) images.push(p.product_main_image_url);
  if (p.product_small_image_urls?.string) {
    const smallImages = Array.isArray(p.product_small_image_urls.string) 
      ? p.product_small_image_urls.string 
      : [p.product_small_image_urls.string];
    images.push(...smallImages);
  }

  return {
    product_id: p.product_id,
    title: p.product_title,
    sale_price: parseFloat(p.target_sale_price || p.sale_price || '0'),
    original_price: parseFloat(p.target_original_price || p.original_price || '0'),
    currency: p.target_sale_price_currency || p.sale_price_currency || 'EUR',
    image_url: p.product_main_image_url,
    images,
    product_url: p.product_detail_url || p.promotion_link,
    commission_rate: p.commission_rate,
    evaluate_rate: p.evaluate_rate,
    shop_url: p.shop_url,
    video_url: p.product_video_url,
    category: p.second_level_category_id,
  };
}

function jsonResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
