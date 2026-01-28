import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
};

interface AmazonPAAPIRequest {
  action: string;
  item_ids?: string[];
  keywords?: string;
  search_index?: string;
  resources?: string[];
  marketplace?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: AmazonPAAPIRequest = await req.json();
    const { action, marketplace = 'www.amazon.com' } = body;

    // Get API credentials from environment
    const accessKey = Deno.env.get('AMAZON_ACCESS_KEY');
    const secretKey = Deno.env.get('AMAZON_SECRET_KEY');
    const partnerTag = Deno.env.get('AMAZON_PARTNER_TAG');

    if (!accessKey || !secretKey || !partnerTag) {
      return new Response(
        JSON.stringify({
          error: 'Amazon PA-API credentials not configured',
          configured: false,
          required: ['AMAZON_ACCESS_KEY', 'AMAZON_SECRET_KEY', 'AMAZON_PARTNER_TAG'],
          docs: 'https://webservices.amazon.com/paapi5/documentation/'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Marketplace to region/host mapping
    const marketplaceConfig: Record<string, { host: string; region: string }> = {
      'www.amazon.com': { host: 'webservices.amazon.com', region: 'us-east-1' },
      'www.amazon.fr': { host: 'webservices.amazon.fr', region: 'eu-west-1' },
      'www.amazon.de': { host: 'webservices.amazon.de', region: 'eu-west-1' },
      'www.amazon.co.uk': { host: 'webservices.amazon.co.uk', region: 'eu-west-1' },
      'www.amazon.es': { host: 'webservices.amazon.es', region: 'eu-west-1' },
      'www.amazon.it': { host: 'webservices.amazon.it', region: 'eu-west-1' },
      'www.amazon.ca': { host: 'webservices.amazon.ca', region: 'us-east-1' },
      'www.amazon.co.jp': { host: 'webservices.amazon.co.jp', region: 'us-west-2' },
    };

    const config = marketplaceConfig[marketplace] || marketplaceConfig['www.amazon.com'];

    switch (action) {
      case 'check_credentials':
        return new Response(
          JSON.stringify({ configured: true, status: 'ready' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'get_items': {
        const { item_ids, resources } = body;
        
        if (!item_ids || item_ids.length === 0) {
          return new Response(
            JSON.stringify({ error: 'item_ids required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const requestBody = {
          ItemIds: item_ids,
          PartnerTag: partnerTag,
          PartnerType: 'Associates',
          Marketplace: marketplace,
          Resources: resources || [
            'Images.Primary.Large',
            'Images.Variants.Large',
            'ItemInfo.Title',
            'ItemInfo.Features',
            'ItemInfo.ProductInfo',
            'Offers.Listings.Price'
          ]
        };

        const response = await makeAmazonRequest(
          'GetItems',
          requestBody,
          config,
          accessKey,
          secretKey
        );

        return new Response(
          JSON.stringify(response),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'search_items': {
        const { keywords, search_index, resources } = body;
        
        if (!keywords) {
          return new Response(
            JSON.stringify({ error: 'keywords required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const requestBody = {
          Keywords: keywords,
          SearchIndex: search_index || 'All',
          PartnerTag: partnerTag,
          PartnerType: 'Associates',
          Marketplace: marketplace,
          Resources: resources || [
            'Images.Primary.Medium',
            'ItemInfo.Title',
            'Offers.Listings.Price'
          ],
          ItemCount: 10
        };

        const response = await makeAmazonRequest(
          'SearchItems',
          requestBody,
          config,
          accessKey,
          secretKey
        );

        return new Response(
          JSON.stringify(response),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_variations': {
        const { asin, resources } = body as any;
        
        if (!asin) {
          return new Response(
            JSON.stringify({ error: 'asin required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const requestBody = {
          ASIN: asin,
          PartnerTag: partnerTag,
          PartnerType: 'Associates',
          Marketplace: marketplace,
          Resources: resources || [
            'VariationSummary.Price',
            'VariationSummary.VariationDimension',
            'ItemInfo.Title',
            'Images.Primary.Large'
          ]
        };

        const response = await makeAmazonRequest(
          'GetVariations',
          requestBody,
          config,
          accessKey,
          secretKey
        );

        return new Response(
          JSON.stringify(response),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_browse_nodes': {
        const { browse_node_ids, resources } = body as any;
        
        if (!browse_node_ids || browse_node_ids.length === 0) {
          return new Response(
            JSON.stringify({ error: 'browse_node_ids required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const requestBody = {
          BrowseNodeIds: browse_node_ids,
          PartnerTag: partnerTag,
          PartnerType: 'Associates',
          Marketplace: marketplace,
          Resources: resources || ['BrowseNodes.Ancestor', 'BrowseNodes.Children']
        };

        const response = await makeAmazonRequest(
          'GetBrowseNodes',
          requestBody,
          config,
          accessKey,
          secretKey
        );

        return new Response(
          JSON.stringify(response),
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
    console.error('Amazon PA-API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function makeAmazonRequest(
  operation: string,
  requestBody: any,
  config: { host: string; region: string },
  accessKey: string,
  secretKey: string
): Promise<any> {
  const path = '/paapi5/' + operation.toLowerCase();
  const target = `com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${operation}`;
  
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const dateStamp = amzDate.slice(0, 8);
  
  const bodyString = JSON.stringify(requestBody);
  
  // Create canonical request
  const canonicalHeaders = [
    `content-encoding:amz-1.0`,
    `content-type:application/json; charset=utf-8`,
    `host:${config.host}`,
    `x-amz-date:${amzDate}`,
    `x-amz-target:${target}`,
  ].join('\n') + '\n';
  
  const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';
  
  const payloadHash = await sha256Hash(bodyString);
  
  const canonicalRequest = [
    'POST',
    path,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  // Create string to sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${config.region}/ProductAdvertisingAPI/aws4_request`;
  const canonicalRequestHash = await sha256Hash(canonicalRequest);
  
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    canonicalRequestHash
  ].join('\n');
  
  // Calculate signature
  const signingKey = await getSignatureKey(secretKey, dateStamp, config.region, 'ProductAdvertisingAPI');
  const signature = await hmacSha256Hex(signingKey, stringToSign);
  
  // Create authorization header
  const authorization = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  // Make request
  const response = await fetch(`https://${config.host}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Encoding': 'amz-1.0',
      'Host': config.host,
      'X-Amz-Date': amzDate,
      'X-Amz-Target': target,
      'Authorization': authorization
    },
    body: bodyString
  });
  
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Amazon API error: ${response.status} - ${errorBody}`);
  }
  
  return await response.json();
}

async function sha256Hash(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSha256(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
}

async function hmacSha256Hex(key: ArrayBuffer, message: string): Promise<string> {
  const signature = await hmacSha256(key, message);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function getSignatureKey(
  key: string,
  dateStamp: string,
  regionName: string,
  serviceName: string
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const kDate = await hmacSha256(encoder.encode('AWS4' + key), dateStamp);
  const kRegion = await hmacSha256(kDate, regionName);
  const kService = await hmacSha256(kRegion, serviceName);
  return await hmacSha256(kService, 'aws4_request');
}
