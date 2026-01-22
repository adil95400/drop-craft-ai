import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChannelMapping {
  id: string;
  channel_id: string;
  platform: string;
  external_product_id: string;
  external_variant_id: string | null;
}

interface Integration {
  id: string;
  platform: string;
  store_url: string;
  config: {
    credentials?: {
      access_token?: string;
      api_key?: string;
      api_secret?: string;
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { queue_id, product_id, new_price, user_id, channels } = await req.json();

    if (!product_id || !new_price || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Récupérer les mappings de canaux pour ce produit
    let mappingsQuery = supabase
      .from('product_channel_mappings')
      .select('*')
      .eq('product_id', product_id)
      .eq('user_id', user_id)
      .neq('sync_status', 'error');

    if (channels && channels.length > 0) {
      mappingsQuery = mappingsQuery.in('channel_id', channels);
    }

    const { data: mappings, error: mappingsError } = await mappingsQuery;

    if (mappingsError) throw mappingsError;

    if (!mappings || mappings.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No channels to sync',
        synced: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Récupérer les intégrations uniques
    const channelIds = [...new Set(mappings.map(m => m.channel_id))];
    const { data: integrations, error: intError } = await supabase
      .from('integrations')
      .select('*')
      .in('id', channelIds)
      .eq('enabled', true);

    if (intError) throw intError;

    const integrationMap = new Map<string, Integration>();
    (integrations || []).forEach(i => integrationMap.set(i.id, i));

    const results: Array<{
      mapping_id: string;
      platform: string;
      status: 'success' | 'error' | 'skipped';
      error?: string;
    }> = [];

    // Synchroniser vers chaque canal
    for (const mapping of mappings) {
      const integration = integrationMap.get(mapping.channel_id);
      
      if (!integration) {
        results.push({
          mapping_id: mapping.id,
          platform: mapping.platform,
          status: 'skipped',
          error: 'Integration not found or disabled'
        });
        continue;
      }

      const startTime = Date.now();
      let syncResult: { success: boolean; error?: string; response?: any } = { success: false };

      try {
        switch (mapping.platform.toLowerCase()) {
          case 'shopify':
            syncResult = await syncToShopify(integration, mapping, new_price);
            break;
          case 'woocommerce':
            syncResult = await syncToWooCommerce(integration, mapping, new_price);
            break;
          case 'prestashop':
            syncResult = await syncToPrestaShop(integration, mapping, new_price);
            break;
          case 'amazon':
            syncResult = await syncToAmazon(integration, mapping, new_price);
            break;
          case 'ebay':
            syncResult = await syncToEbay(integration, mapping, new_price);
            break;
          default:
            syncResult = { success: false, error: `Platform ${mapping.platform} not supported` };
        }
      } catch (err) {
        syncResult = { success: false, error: err.message };
      }

      const duration = Date.now() - startTime;

      // Logger le résultat
      await supabase.from('price_sync_logs').insert({
        user_id,
        queue_id,
        mapping_id: mapping.id,
        product_id,
        channel_id: mapping.channel_id,
        platform: mapping.platform,
        external_product_id: mapping.external_product_id,
        old_price: mapping.current_synced_price,
        new_price,
        status: syncResult.success ? 'success' : 'error',
        error_message: syncResult.error,
        api_response: syncResult.response,
        duration_ms: duration
      });

      // Mettre à jour le mapping
      await supabase
        .from('product_channel_mappings')
        .update({
          current_synced_price: syncResult.success ? new_price : mapping.current_synced_price,
          last_synced_at: syncResult.success ? new Date().toISOString() : mapping.last_synced_at,
          sync_status: syncResult.success ? 'synced' : 'error',
          sync_error: syncResult.error || null
        })
        .eq('id', mapping.id);

      results.push({
        mapping_id: mapping.id,
        platform: mapping.platform,
        status: syncResult.success ? 'success' : 'error',
        error: syncResult.error
      });
    }

    const successCount = results.filter(r => r.status === 'success').length;

    return new Response(JSON.stringify({
      success: true,
      synced: successCount,
      total: results.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Shopify API
async function syncToShopify(
  integration: Integration, 
  mapping: ChannelMapping, 
  newPrice: number
): Promise<{ success: boolean; error?: string; response?: any }> {
  const accessToken = integration.config?.credentials?.access_token || Deno.env.get('SHOPIFY_ACCESS_TOKEN');
  
  if (!accessToken) {
    return { success: false, error: 'Missing Shopify access token' };
  }

  const shopDomain = integration.store_url?.replace('https://', '').replace('http://', '').replace(/\/$/, '');
  
  if (!shopDomain) {
    return { success: false, error: 'Missing shop domain' };
  }

  // Si on a un variant ID, on met à jour le variant, sinon le produit
  const endpoint = mapping.external_variant_id
    ? `https://${shopDomain}/admin/api/2024-01/variants/${mapping.external_variant_id}.json`
    : `https://${shopDomain}/admin/api/2024-01/products/${mapping.external_product_id}.json`;

  const body = mapping.external_variant_id
    ? { variant: { id: mapping.external_variant_id, price: newPrice.toString() } }
    : { product: { id: mapping.external_product_id, variants: [{ price: newPrice.toString() }] } };

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok) {
    return { success: false, error: data.errors || 'Shopify API error', response: data };
  }

  return { success: true, response: data };
}

// WooCommerce API
async function syncToWooCommerce(
  integration: Integration, 
  mapping: ChannelMapping, 
  newPrice: number
): Promise<{ success: boolean; error?: string; response?: any }> {
  const { api_key, api_secret } = integration.config?.credentials || {};
  
  if (!api_key || !api_secret) {
    return { success: false, error: 'Missing WooCommerce credentials' };
  }

  const storeUrl = integration.store_url?.replace(/\/$/, '');
  
  if (!storeUrl) {
    return { success: false, error: 'Missing store URL' };
  }

  const auth = btoa(`${api_key}:${api_secret}`);
  
  const endpoint = mapping.external_variant_id
    ? `${storeUrl}/wp-json/wc/v3/products/${mapping.external_product_id}/variations/${mapping.external_variant_id}`
    : `${storeUrl}/wp-json/wc/v3/products/${mapping.external_product_id}`;

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    },
    body: JSON.stringify({ regular_price: newPrice.toString() })
  });

  const data = await response.json();

  if (!response.ok) {
    return { success: false, error: data.message || 'WooCommerce API error', response: data };
  }

  return { success: true, response: data };
}

// PrestaShop API
async function syncToPrestaShop(
  integration: Integration, 
  mapping: ChannelMapping, 
  newPrice: number
): Promise<{ success: boolean; error?: string; response?: any }> {
  const { api_key } = integration.config?.credentials || {};
  
  if (!api_key) {
    return { success: false, error: 'Missing PrestaShop API key' };
  }

  const storeUrl = integration.store_url?.replace(/\/$/, '');
  
  if (!storeUrl) {
    return { success: false, error: 'Missing store URL' };
  }

  // PrestaShop utilise XML par défaut, mais supporte JSON
  const endpoint = `${storeUrl}/api/products/${mapping.external_product_id}?output_format=JSON`;

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(api_key + ':')}`
    },
    body: JSON.stringify({
      product: {
        id: mapping.external_product_id,
        price: newPrice
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    return { success: false, error: text || 'PrestaShop API error' };
  }

  const data = await response.json().catch(() => ({}));
  return { success: true, response: data };
}

// Amazon SP-API (simplifié - nécessite auth OAuth complexe)
async function syncToAmazon(
  integration: Integration, 
  mapping: ChannelMapping, 
  newPrice: number
): Promise<{ success: boolean; error?: string; response?: any }> {
  // Amazon SP-API nécessite une implémentation OAuth complexe
  // Pour l'instant, on retourne une erreur indiquant que c'est en développement
  return { 
    success: false, 
    error: 'Amazon SP-API integration pending - manual price update required' 
  };
}

// eBay API (simplifié)
async function syncToEbay(
  integration: Integration, 
  mapping: ChannelMapping, 
  newPrice: number
): Promise<{ success: boolean; error?: string; response?: any }> {
  const { access_token } = integration.config?.credentials || {};
  
  if (!access_token) {
    return { success: false, error: 'Missing eBay access token' };
  }

  // eBay Inventory API
  const endpoint = `https://api.ebay.com/sell/inventory/v1/offer/${mapping.external_product_id}`;

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`
    },
    body: JSON.stringify({
      pricingSummary: {
        price: {
          value: newPrice.toString(),
          currency: 'EUR'
        }
      }
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    return { success: false, error: data.errors?.[0]?.message || 'eBay API error', response: data };
  }

  return { success: true };
}
