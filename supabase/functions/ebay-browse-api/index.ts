import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
};

interface EbayRequest {
  action: string;
  item_id?: string;
  keywords?: string;
  category_id?: string;
  limit?: number;
  offset?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: EbayRequest = await req.json();
    const { action } = body;

    // Get API credentials from environment
    const appId = Deno.env.get('EBAY_APP_ID');
    const certId = Deno.env.get('EBAY_CERT_ID');
    
    if (!appId) {
      return new Response(
        JSON.stringify({
          error: 'eBay API credentials not configured',
          configured: false,
          required: ['EBAY_APP_ID', 'EBAY_CERT_ID'],
          docs: 'https://developer.ebay.com/api-docs/buy/browse/static/overview.html'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get OAuth token
    const accessToken = await getEbayAccessToken(appId, certId || '');
    
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Failed to obtain eBay access token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const API_BASE = 'https://api.ebay.com/buy/browse/v1';

    switch (action) {
      case 'check_credentials':
        return new Response(
          JSON.stringify({ configured: true, status: 'ready' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'get_item': {
        const { item_id } = body;
        
        if (!item_id) {
          return new Response(
            JSON.stringify({ error: 'item_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Format item ID with prefix if needed
        const formattedId = item_id.startsWith('v1|') ? item_id : `v1|${item_id}|0`;

        const response = await fetch(`${API_BASE}/item/${encodeURIComponent(formattedId)}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_FR'
          }
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.errors?.[0]?.message || `eBay API error: ${response.status}`);
        }

        const data = await response.json();

        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'search': {
        const { keywords, category_id, limit = 20, offset = 0 } = body;
        
        if (!keywords && !category_id) {
          return new Response(
            JSON.stringify({ error: 'keywords or category_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const params = new URLSearchParams({
          limit: String(Math.min(limit, 50)),
          offset: String(offset)
        });

        if (keywords) params.append('q', keywords);
        if (category_id) params.append('category_ids', category_id);

        const response = await fetch(`${API_BASE}/item_summary/search?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_FR'
          }
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.errors?.[0]?.message || `eBay API error: ${response.status}`);
        }

        const data = await response.json();

        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_items_by_item_group': {
        const { item_group_id } = body as any;
        
        if (!item_group_id) {
          return new Response(
            JSON.stringify({ error: 'item_group_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const response = await fetch(`${API_BASE}/item/get_items_by_item_group?item_group_id=${encodeURIComponent(item_group_id)}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_FR'
          }
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.errors?.[0]?.message || `eBay API error: ${response.status}`);
        }

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
    console.error('eBay Browse API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getEbayAccessToken(appId: string, certId: string): Promise<string | null> {
  try {
    const credentials = btoa(`${appId}:${certId}`);
    
    const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'https://api.ebay.com/oauth/api_scope'
      }).toString()
    });

    if (!response.ok) {
      console.error('eBay OAuth error:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('eBay OAuth exception:', error);
    return null;
  }
}
