/**
 * Amazon Product Advertising API 5.0 Connector
 * 
 * Supports: search, product details, import to catalog
 * Auth: AWS Signature v4 (HMAC-SHA256)
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ==========================================
// AWS SIGNATURE V4
// ==========================================
async function hmacSha256(key: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key instanceof Uint8Array ? key : new Uint8Array(key),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
}

async function sha256(message: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSignatureKey(key: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
  const kDate = await hmacSha256(new TextEncoder().encode('AWS4' + key), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, 'aws4_request');
}

// ==========================================
// AMAZON PA-API 5.0 CLIENT
// ==========================================
const MARKETPLACE_HOSTS: Record<string, { host: string; region: string }> = {
  'www.amazon.fr': { host: 'webservices.amazon.fr', region: 'eu-west-1' },
  'www.amazon.com': { host: 'webservices.amazon.com', region: 'us-east-1' },
  'www.amazon.co.uk': { host: 'webservices.amazon.co.uk', region: 'eu-west-1' },
  'www.amazon.de': { host: 'webservices.amazon.de', region: 'eu-west-1' },
  'www.amazon.es': { host: 'webservices.amazon.es', region: 'eu-west-1' },
  'www.amazon.it': { host: 'webservices.amazon.it', region: 'eu-west-1' },
};

class AmazonPAApiClient {
  private accessKey: string;
  private secretKey: string;
  private partnerTag: string;
  private host: string;
  private region: string;
  private marketplace: string;

  constructor(accessKey: string, secretKey: string, partnerTag: string, marketplace = 'www.amazon.fr') {
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.partnerTag = partnerTag;
    this.marketplace = marketplace;
    const mp = MARKETPLACE_HOSTS[marketplace] || MARKETPLACE_HOSTS['www.amazon.fr'];
    this.host = mp.host;
    this.region = mp.region;
  }

  private async signedRequest(operation: string, payload: Record<string, any>): Promise<any> {
    const service = 'ProductAdvertisingAPI';
    const path = `/paapi5/${operation.toLowerCase()}`;
    const url = `https://${this.host}${path}`;

    payload.PartnerTag = this.partnerTag;
    payload.PartnerType = 'Associates';
    payload.Marketplace = this.marketplace;

    const body = JSON.stringify(payload);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const dateStamp = amzDate.slice(0, 8);

    const contentHash = await sha256(body);
    const canonicalHeaders = `content-encoding:amz-1.0\ncontent-type:application/json; charset=utf-8\nhost:${this.host}\nx-amz-date:${amzDate}\nx-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${operation}\n`;
    const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';

    const canonicalRequest = `POST\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${contentHash}`;
    const credentialScope = `${dateStamp}/${this.region}/${service}/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`;

    const signingKey = await getSignatureKey(this.secretKey, dateStamp, this.region, service);
    const signatureBuffer = await hmacSha256(signingKey, stringToSign);
    const signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const authHeader = `AWS4-HMAC-SHA256 Credential=${this.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Encoding': 'amz-1.0',
        'X-Amz-Date': amzDate,
        'X-Amz-Target': `com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${operation}`,
        'Authorization': authHeader,
        'Host': this.host,
      },
      body,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Amazon PA-API ${response.status}: ${errText.slice(0, 200)}`);
    }
    return response.json();
  }

  async searchItems(keywords: string, category?: string, pageNum = 1): Promise<any> {
    return this.signedRequest('SearchItems', {
      Keywords: keywords,
      SearchIndex: category || 'All',
      ItemCount: 10,
      ItemPage: pageNum,
      Resources: [
        'Images.Primary.Large',
        'ItemInfo.Title',
        'Offers.Listings.Price',
        'ItemInfo.Features',
        'ItemInfo.ByLineInfo',
      ],
    });
  }

  async getItems(asinList: string[]): Promise<any> {
    return this.signedRequest('GetItems', {
      ItemIds: asinList,
      Resources: [
        'Images.Primary.Large',
        'Images.Variants.Large',
        'ItemInfo.Title',
        'ItemInfo.Features',
        'ItemInfo.ByLineInfo',
        'Offers.Listings.Price',
        'Offers.Listings.SavingBasis',
      ],
    });
  }
}

// ==========================================
// NORMALIZE
// ==========================================
function normalizeAmazonProduct(item: any): any {
  const listing = item.Offers?.Listings?.[0];
  const price = listing?.Price?.Amount || 0;
  const originalPrice = listing?.SavingBasis?.Amount || price;
  const images: string[] = [];
  if (item.Images?.Primary?.Large?.URL) images.push(item.Images.Primary.Large.URL);
  if (item.Images?.Variants) {
    for (const v of item.Images.Variants) {
      if (v.Large?.URL) images.push(v.Large.URL);
    }
  }

  return {
    asin: item.ASIN,
    title: item.ItemInfo?.Title?.DisplayValue || '',
    price,
    original_price: originalPrice,
    currency: listing?.Price?.Currency || 'EUR',
    image_url: images[0] || null,
    images,
    product_url: item.DetailPageURL || '',
    brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || '',
    features: item.ItemInfo?.Features?.DisplayValues || [],
  };
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Authorization required' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const { action, ...params } = await req.json();
    console.log(`[amazon] action=${action}, user=${user.id.slice(0, 8)}`);

    const accessKey = Deno.env.get('AMAZON_ACCESS_KEY');
    const secretKey = Deno.env.get('AMAZON_SECRET_KEY');
    const partnerTag = Deno.env.get('AMAZON_PARTNER_TAG');

    if (!accessKey || !secretKey || !partnerTag) {
      return jsonResponse({
        success: false,
        error: 'Amazon PA-API credentials not configured. Add AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY and AMAZON_PARTNER_TAG in your secrets.',
        setup_required: true,
      }, 400);
    }

    const marketplace = params.marketplace || 'www.amazon.fr';
    const client = new AmazonPAApiClient(accessKey, secretKey, partnerTag, marketplace);

    if (action === 'search_products') {
      const result = await client.searchItems(params.keywords, params.category, params.pageNum || 1);
      const items = result.SearchResult?.Items || [];
      return jsonResponse({
        success: true,
        products: items.map(normalizeAmazonProduct),
        total: result.SearchResult?.TotalResultCount || items.length,
      });
    }

    if (action === 'get_product') {
      const result = await client.getItems([params.asin]);
      const items = result.ItemsResult?.Items || [];
      return jsonResponse({
        success: true,
        product: items.length > 0 ? normalizeAmazonProduct(items[0]) : null,
      });
    }

    if (action === 'import_products') {
      const asins = params.asins as string[];
      if (!asins || asins.length === 0) {
        return jsonResponse({ error: 'asins required' }, 400);
      }

      const chunks: string[][] = [];
      for (let i = 0; i < asins.length; i += 10) {
        chunks.push(asins.slice(i, i + 10));
      }

      const imported: any[] = [];
      for (const chunk of chunks) {
        try {
          const result = await client.getItems(chunk);
          const items = result.ItemsResult?.Items || [];

          for (const item of items) {
            const norm = normalizeAmazonProduct(item);
            const { data, error } = await supabase
              .from('products')
              .insert({
                user_id: user.id,
                name: norm.title,
                description: norm.features?.join('\n') || norm.title,
                price: norm.price,
                compare_at_price: norm.original_price > norm.price ? norm.original_price : null,
                image_url: norm.image_url,
                images: norm.images.length > 0 ? norm.images : null,
                source: 'amazon_api',
                source_url: norm.product_url,
                external_id: norm.asin,
                status: 'draft',
                category: 'Amazon Import',
              })
              .select('id, name')
              .single();

            if (!error && data) imported.push(data);
          }
        } catch (e) {
          console.error('[amazon] chunk import error:', e);
        }
      }

      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'amazon_api_import',
        entity_type: 'products',
        description: `Imported ${imported.length} products via Amazon PA-API`,
        source: 'amazon-connector',
      });

      return jsonResponse({
        success: true,
        imported_count: imported.length,
        products: imported,
      });
    }

    return jsonResponse({ error: 'Unknown action' }, 400);

  } catch (error) {
    console.error('[amazon] Error:', error);
    return jsonResponse({ success: false, error: (error as Error).message }, 500);
  }
});

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
