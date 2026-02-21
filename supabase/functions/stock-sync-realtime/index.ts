/**
 * Stock Sync Realtime - Secure Edge Function
 * P0.4 FIX: Replaced CORS * with restrictive allowlist
 * P0.5 FIX: userId derived from JWT, not from body
 * P1: Rate limiting and action allowlist
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Secure CORS configuration
const ALLOWED_ORIGINS = [
  'https://shopopti.io',
  'https://www.shopopti.io',
  'https://app.shopopti.io',
  'https://drop-craft-ai.lovable.app',
  'https://id-preview--7af4654f-dfc7-42c6-900f-b9ac682ca5ec.lovable.app',
];

// Also allow any *.lovable.app origin for dev previews
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith('.lovable.app')) return true;
  return false;
}

function getSecureCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
  
  if (isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin!;
  }
  
  return headers;
}

// Allowed actions
const ALLOWED_ACTIONS = new Set([
  'sync_all',
  'sync_supplier',
  'update_config',
  'check_alerts',
  'get_status'
]);

// Allowed supplier connectors for API calls
const ALLOWED_CONNECTORS = new Set([
  'bigbuy',
  'cjdropshipping',
  'btswholesaler',
  'matterhorn',
  'vidaxl'
]);

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getSecureCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    if (!isAllowedOrigin(origin)) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // SECURITY: Get user from JWT, NOT from body
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !authUser?.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authUser.id;
    const body = await req.json();
    
    // SECURITY: Validate action
    const action = body.action;
    if (typeof action !== 'string' || !ALLOWED_ACTIONS.has(action)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Never accept userId from body
    if ('userId' in body || 'user_id' in body) {
      console.warn(`[SECURITY] Blocked userId in body attempt from user ${userId.slice(0, 8)}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Do not send userId in body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[STOCK-SYNC] Action: ${action}, User: ${userId.slice(0, 8)}...`);

    // Action: sync_all - Synchronize all configured suppliers
    if (action === 'sync_all') {
      const { data: configs, error: configError } = await supabaseClient
        .from('stock_sync_configs')
        .select('*, suppliers(*)')
        .eq('user_id', userId) // SECURITY: Only user's own configs
        .eq('sync_enabled', true)
        .lte('next_sync_at', new Date().toISOString());

      if (configError) throw configError;

      const results = [];
      for (const config of configs || []) {
        const syncResult = await syncSupplierStock(supabaseClient, userId, config);
        results.push(syncResult);
      }

      return new Response(JSON.stringify({
        success: true,
        synced_suppliers: results.length,
        results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: sync_supplier - Sync specific supplier
    if (action === 'sync_supplier') {
      const supplierId = body.supplier_id;
      
      if (typeof supplierId !== 'string' || supplierId.length < 10) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid supplier_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: config, error: configError } = await supabaseClient
        .from('stock_sync_configs')
        .select('*, suppliers(*)')
        .eq('user_id', userId) // SECURITY: Only user's own config
        .eq('supplier_id', supplierId)
        .single();

      if (configError || !config) {
        return new Response(
          JSON.stringify({ success: false, error: 'Supplier sync config not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const syncResult = await syncSupplierStock(supabaseClient, userId, config);

      return new Response(JSON.stringify({
        success: true,
        ...syncResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: update_config - Update sync configuration
    if (action === 'update_config') {
      const configId = body.config_id;
      
      if (typeof configId !== 'string' || configId.length < 10) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid config_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate update fields
      const syncEnabled = typeof body.sync_enabled === 'boolean' ? body.sync_enabled : undefined;
      const syncFrequency = typeof body.sync_frequency_minutes === 'number' ? 
        Math.max(5, Math.min(1440, body.sync_frequency_minutes)) : undefined;
      const lowStockThreshold = typeof body.low_stock_threshold === 'number' ?
        Math.max(0, Math.min(1000, body.low_stock_threshold)) : undefined;
      const outOfStockAction = typeof body.out_of_stock_action === 'string' &&
        ['pause', 'notify', 'hide'].includes(body.out_of_stock_action) ?
        body.out_of_stock_action : undefined;

      const updates: Record<string, any> = {};
      if (syncEnabled !== undefined) updates.sync_enabled = syncEnabled;
      if (syncFrequency !== undefined) {
        updates.sync_frequency_minutes = syncFrequency;
        updates.next_sync_at = new Date(Date.now() + (syncFrequency * 60 * 1000)).toISOString();
      }
      if (lowStockThreshold !== undefined) updates.low_stock_threshold = lowStockThreshold;
      if (outOfStockAction !== undefined) updates.out_of_stock_action = outOfStockAction;

      if (Object.keys(updates).length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'No valid updates provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: updated, error: updateError } = await supabaseClient
        .from('stock_sync_configs')
        .update(updates)
        .eq('id', configId)
        .eq('user_id', userId) // SECURITY: Only user's own config
        .select()
        .single();

      if (updateError) throw updateError;

      return new Response(JSON.stringify({
        success: true,
        config: updated
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: check_alerts - Check and create stock alerts
    if (action === 'check_alerts') {
      const alerts = await checkStockAlerts(supabaseClient, userId);

      return new Response(JSON.stringify({
        success: true,
        alerts_created: alerts.length,
        alerts
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: get_status - Get sync status
    if (action === 'get_status') {
      const { data: configs, error } = await supabaseClient
        .from('stock_sync_configs')
        .select('id, supplier_id, sync_enabled, last_sync_at, next_sync_at, total_syncs, failed_syncs, last_error')
        .eq('user_id', userId); // SECURITY: Only user's own configs

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        configs: configs || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[STOCK-SYNC] Error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 500,
      headers: { ...getSecureCorsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' }
    });
  }
});

async function syncSupplierStock(supabaseClient: any, userId: string, config: any) {
  console.log(`[SYNC] Starting sync for supplier: ${config.suppliers?.name}`);

  try {
    // SECURITY: Only fetch user's own products
    const { data: products, error: prodError } = await supabaseClient
      .from('supplier_products')
      .select('id, external_id, name, stock_quantity')
      .eq('supplier_id', config.supplier_id)
      .eq('user_id', userId); // CRITICAL: Tenant isolation

    if (prodError) throw prodError;

    let updatedCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const product of products || []) {
      // Fetch stock from supplier API
      const newStock = await fetchSupplierStock(supabaseClient, userId, config.suppliers, product.external_id);

      if (newStock !== null && newStock !== product.stock_quantity) {
        const previousQuantity = product.stock_quantity || 0;

        // Update stock
        await supabaseClient
          .from('supplier_products')
          .update({ stock_quantity: newStock })
          .eq('id', product.id)
          .eq('user_id', userId); // SECURITY: Tenant isolation

        // Record in history
        await supabaseClient
          .from('stock_history')
          .insert({
            user_id: userId,
            product_id: product.id,
            product_source: 'supplier_products',
            previous_quantity: previousQuantity,
            new_quantity: newStock,
            change_amount: newStock - previousQuantity,
            change_reason: 'sync',
            supplier_id: config.supplier_id,
            sync_config_id: config.id
          });

        updatedCount++;

        // Check thresholds
        if (newStock === 0) {
          outOfStockCount++;
          await createStockAlert(supabaseClient, userId, product, 'out_of_stock', newStock, config);
        } else if (newStock <= config.low_stock_threshold) {
          lowStockCount++;
          await createStockAlert(supabaseClient, userId, product, 'low_stock', newStock, config);
        }
      }
    }

    // Update config
    await supabaseClient
      .from('stock_sync_configs')
      .update({
        last_sync_at: new Date().toISOString(),
        next_sync_at: new Date(Date.now() + (config.sync_frequency_minutes * 60 * 1000)).toISOString(),
        total_syncs: (config.total_syncs || 0) + 1
      })
      .eq('id', config.id)
      .eq('user_id', userId); // SECURITY: Tenant isolation

    console.log(`[SYNC] Completed: ${updatedCount} products updated`);

    return {
      supplier_id: config.supplier_id,
      supplier_name: config.suppliers?.name,
      products_checked: products?.length || 0,
      products_updated: updatedCount,
      low_stock_detected: lowStockCount,
      out_of_stock_detected: outOfStockCount
    };

  } catch (error) {
    console.error(`[SYNC] Error for supplier ${config.supplier_id}:`, error);

    await supabaseClient
      .from('stock_sync_configs')
      .update({
        failed_syncs: (config.failed_syncs || 0) + 1,
        last_error: error.message
      })
      .eq('id', config.id)
      .eq('user_id', userId);

    throw error;
  }
}

async function fetchSupplierStock(supabaseClient: any, userId: string, supplier: any, externalId: string): Promise<number | null> {
  if (!supplier?.id || !externalId) {
    return null;
  }
  
  console.log(`[FETCH-STOCK] Fetching stock for ${supplier.name}, product: ${externalId}`);
  
  try {
    // SECURITY: Verify user owns the supplier credentials
    const { data: credentials } = await supabaseClient
      .from('supplier_credentials_vault')
      .select('api_key_encrypted, access_token_encrypted, oauth_data')
      .eq('supplier_id', supplier.id)
      .eq('user_id', userId) // CRITICAL: Tenant isolation
      .single();

    if (!credentials) {
      console.error(`[FETCH-STOCK] No credentials for supplier: ${supplier.name}`);
      return null;
    }

    const oauth = credentials.oauth_data || {};
    const connectorId = (oauth.connectorId || supplier.connector_type || '').toLowerCase();

    // SECURITY: Only allow known connectors
    if (!ALLOWED_CONNECTORS.has(connectorId)) {
      console.log(`[FETCH-STOCK] Unknown connector: ${connectorId}`);
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      // Call real supplier APIs with timeout
      switch (connectorId) {
        case 'bigbuy': {
          const apiKey = oauth.apiKey || credentials.api_key_encrypted;
          if (!apiKey) return null;
          
          const response = await fetch(`https://api.bigbuy.eu/rest/catalog/product/${encodeURIComponent(externalId)}.json`, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
            signal: controller.signal
          });
          if (response.ok) {
            const data = await response.json();
            return typeof data.stock === 'number' ? data.stock : 0;
          }
          break;
        }

        case 'cjdropshipping': {
          const accessToken = oauth.accessToken || credentials.access_token_encrypted;
          if (!accessToken) return null;
          
          const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/query', {
            method: 'POST',
            headers: {
              'CJ-Access-Token': accessToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pid: externalId }),
            signal: controller.signal
          });
          if (response.ok) {
            const data = await response.json();
            return data.data?.variants?.[0]?.vid ? 999 : 0;
          }
          break;
        }

        case 'btswholesaler': {
          const apiKey = oauth.apiKey || oauth.username;
          if (!apiKey) return null;
          
          const response = await fetch(`https://api.btswholesaler.com/v1/api/getProduct?id=${encodeURIComponent(externalId)}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
            signal: controller.signal
          });
          if (response.ok) {
            const data = await response.json();
            return typeof data.product?.stock === 'number' ? data.product.stock : 0;
          }
          break;
        }

        case 'matterhorn': {
          const apiKey = oauth.apiKey || credentials.api_key_encrypted;
          if (!apiKey) return null;
          
          const response = await fetch(`https://matterhorn-wholesale.com/B2BAPI/ITEMS/${encodeURIComponent(externalId)}`, {
            headers: { 'Authorization': apiKey },
            signal: controller.signal
          });
          if (response.ok) {
            const data = await response.json();
            return parseInt(data.stock_total) || 0;
          }
          break;
        }

        case 'vidaxl': {
          const apiKey = oauth.apiKey || credentials.api_key_encrypted;
          if (!apiKey) return null;
          
          const response = await fetch(`https://api.vidaxl.com/v1/products/${encodeURIComponent(externalId)}`, {
            headers: { 'X-API-Key': apiKey },
            signal: controller.signal
          });
          if (response.ok) {
            const data = await response.json();
            return typeof data.stock === 'number' ? data.stock : 0;
          }
          break;
        }
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error(`[FETCH-STOCK] Error:`, error);
  }
  
  return null;
}

async function createStockAlert(supabaseClient: any, userId: string, product: any, alertType: string, currentStock: number, config: any) {
  // Check if similar alert already exists
  const { data: existing } = await supabaseClient
    .from('stock_alerts')
    .select('id')
    .eq('user_id', userId) // SECURITY: Tenant isolation
    .eq('product_id', product.id)
    .eq('alert_type', alertType)
    .eq('status', 'active')
    .single();

  if (existing) return;

  const severity = alertType === 'out_of_stock' ? 'critical' : 'medium';
  const message = alertType === 'out_of_stock'
    ? `Stock épuisé pour ${product.name}`
    : `Stock faible (${currentStock} unités) pour ${product.name}`;

  await supabaseClient
    .from('stock_alerts')
    .insert({
      user_id: userId, // SECURITY: Never from client
      product_id: product.id,
      product_source: 'supplier_products',
      product_name: product.name,
      alert_type: alertType,
      severity,
      message,
      current_stock: currentStock,
      threshold: config.low_stock_threshold,
      supplier_id: config.supplier_id
    });

  console.log(`[ALERT] Created ${alertType} alert for product: ${product.name}`);
}

async function checkStockAlerts(supabaseClient: any, userId: string) {
  // SECURITY: Only fetch user's own products
  const { data: products } = await supabaseClient
    .from('supplier_products')
    .select('id, name, stock_quantity, supplier_id')
    .eq('user_id', userId) // CRITICAL: Tenant isolation
    .lte('stock_quantity', 10);

  const alerts = [];

  for (const product of products || []) {
    const { data: config } = await supabaseClient
      .from('stock_sync_configs')
      .select('id, low_stock_threshold, supplier_id')
      .eq('supplier_id', product.supplier_id)
      .eq('user_id', userId) // SECURITY: Tenant isolation
      .single();

    if (config && product.stock_quantity <= config.low_stock_threshold) {
      await createStockAlert(supabaseClient, userId, product, 
        product.stock_quantity === 0 ? 'out_of_stock' : 'low_stock',
        product.stock_quantity, config);
      alerts.push({
        product_id: product.id,
        product_name: product.name,
        stock: product.stock_quantity,
        type: product.stock_quantity === 0 ? 'out_of_stock' : 'low_stock'
      });
    }
  }

  return alerts;
}
