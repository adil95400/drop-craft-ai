import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) throw new Error('Unauthorized');

    const { action, supplier_id, config_id, product_ids } = await req.json();

    console.log(`[STOCK-SYNC] Action: ${action}, User: ${user.id}`);

    // Action: sync_all - Synchroniser tous les fournisseurs configurés
    if (action === 'sync_all') {
      const { data: configs, error: configError } = await supabaseClient
        .from('stock_sync_configs')
        .select('*, suppliers(*)')
        .eq('user_id', user.id)
        .eq('sync_enabled', true)
        .lte('next_sync_at', new Date().toISOString());

      if (configError) throw configError;

      const results = [];
      for (const config of configs || []) {
        const syncResult = await syncSupplierStock(supabaseClient, user.id, config);
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

    // Action: sync_supplier - Synchroniser un fournisseur spécifique
    if (action === 'sync_supplier' && supplier_id) {
      const { data: config } = await supabaseClient
        .from('stock_sync_configs')
        .select('*, suppliers(*)')
        .eq('user_id', user.id)
        .eq('supplier_id', supplier_id)
        .single();

      if (!config) throw new Error('Supplier sync config not found');

      const syncResult = await syncSupplierStock(supabaseClient, user.id, config);

      return new Response(JSON.stringify({
        success: true,
        ...syncResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: update_config - Mettre à jour une config
    if (action === 'update_config' && config_id) {
      const { sync_enabled, sync_frequency_minutes, low_stock_threshold, out_of_stock_action } = await req.json();

      const { data: updated, error: updateError } = await supabaseClient
        .from('stock_sync_configs')
        .update({
          sync_enabled,
          sync_frequency_minutes,
          low_stock_threshold,
          out_of_stock_action,
          next_sync_at: new Date(Date.now() + (sync_frequency_minutes * 60 * 1000)).toISOString()
        })
        .eq('id', config_id)
        .eq('user_id', user.id)
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

    // Action: check_alerts - Vérifier et créer des alertes
    if (action === 'check_alerts') {
      const alerts = await checkStockAlerts(supabaseClient, user.id);

      return new Response(JSON.stringify({
        success: true,
        alerts_created: alerts.length,
        alerts
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('[STOCK-SYNC] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function syncSupplierStock(supabaseClient: any, userId: string, config: any) {
  console.log(`[SYNC] Starting sync for supplier: ${config.suppliers?.name}`);

  try {
    // Récupérer tous les produits du fournisseur
    const { data: products, error: prodError } = await supabaseClient
      .from('supplier_products')
      .select('*')
      .eq('supplier_id', config.supplier_id)
      .eq('user_id', userId);

    if (prodError) throw prodError;

    let updatedCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const product of products || []) {
      // Simuler récupération du stock depuis l'API fournisseur
      // En production, appeler l'API réelle du fournisseur
      const newStock = await fetchSupplierStock(config.suppliers, product.external_id);

      if (newStock !== null && newStock !== product.stock_quantity) {
        const previousQuantity = product.stock_quantity || 0;

        // Mettre à jour le stock
        await supabaseClient
          .from('supplier_products')
          .update({ stock_quantity: newStock })
          .eq('id', product.id);

        // Enregistrer dans l'historique
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

        // Vérifier les seuils
        if (newStock === 0) {
          outOfStockCount++;
          await createStockAlert(supabaseClient, userId, product, 'out_of_stock', newStock, config);
        } else if (newStock <= config.low_stock_threshold) {
          lowStockCount++;
          await createStockAlert(supabaseClient, userId, product, 'low_stock', newStock, config);
        }
      }
    }

    // Mettre à jour la config
    await supabaseClient
      .from('stock_sync_configs')
      .update({
        last_sync_at: new Date().toISOString(),
        next_sync_at: new Date(Date.now() + (config.sync_frequency_minutes * 60 * 1000)).toISOString(),
        total_syncs: (config.total_syncs || 0) + 1
      })
      .eq('id', config.id);

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
      .eq('id', config.id);

    throw error;
  }
}

async function fetchSupplierStock(supplier: any, externalId: string): Promise<number | null> {
  console.log(`[FETCH-STOCK] Fetching stock for ${supplier.name}, product: ${externalId}`);
  
  try {
    // Get supplier credentials
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: credentials } = await supabaseClient
      .from('supplier_credentials_vault')
      .select('*')
      .eq('supplier_id', supplier.id)
      .single();

    if (!credentials) {
      console.error(`[FETCH-STOCK] No credentials for supplier: ${supplier.name}`);
      return null;
    }

    const oauth = credentials.oauth_data || {};
    const connectorId = oauth.connectorId || supplier.id;

    // Call real supplier APIs
    switch (connectorId) {
      case 'bigbuy': {
        const apiKey = oauth.apiKey || credentials.api_key_encrypted;
        const response = await fetch(`https://api.bigbuy.eu/rest/catalog/product/${externalId}.json`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (response.ok) {
          const data = await response.json();
          return data.stock || 0;
        }
        break;
      }

      case 'cjdropshipping': {
        const accessToken = oauth.accessToken || credentials.access_token_encrypted;
        const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/query', {
          method: 'POST',
          headers: {
            'CJ-Access-Token': accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ pid: externalId })
        });
        if (response.ok) {
          const data = await response.json();
          return data.data?.variants?.[0]?.vid ? 999 : 0; // CJ has high availability
        }
        break;
      }

      case 'btswholesaler': {
        const apiKey = oauth.apiKey || oauth.username;
        const response = await fetch(`https://api.btswholesaler.com/v1/api/getProduct?id=${externalId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (response.ok) {
          const data = await response.json();
          return data.product?.stock || 0;
        }
        break;
      }

      case 'matterhorn': {
        const apiKey = oauth.apiKey || credentials.api_key_encrypted;
        const response = await fetch(`https://matterhorn-wholesale.com/B2BAPI/ITEMS/${externalId}`, {
          headers: { 'Authorization': apiKey }
        });
        if (response.ok) {
          const data = await response.json();
          return parseInt(data.stock_total) || 0;
        }
        break;
      }

      case 'vidaxl': {
        const apiKey = oauth.apiKey || credentials.api_key_encrypted;
        const response = await fetch(`https://api.vidaxl.com/v1/products/${externalId}`, {
          headers: { 'X-API-Key': apiKey }
        });
        if (response.ok) {
          const data = await response.json();
          return data.stock || 0;
        }
        break;
      }

      default:
        console.log(`[FETCH-STOCK] No API implementation for: ${connectorId}`);
        return null;
    }
  } catch (error) {
    console.error(`[FETCH-STOCK] Error:`, error);
  }
  
  return null;
}

async function createStockAlert(supabaseClient: any, userId: string, product: any, alertType: string, currentStock: number, config: any) {
  // Vérifier si une alerte similaire existe déjà
  const { data: existing } = await supabaseClient
    .from('stock_alerts')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', product.id)
    .eq('alert_type', alertType)
    .eq('status', 'active')
    .single();

  if (existing) return; // Alerte déjà active

  const severity = alertType === 'out_of_stock' ? 'critical' : 'medium';
  const message = alertType === 'out_of_stock'
    ? `Stock épuisé pour ${product.name}`
    : `Stock faible (${currentStock} unités) pour ${product.name}`;

  await supabaseClient
    .from('stock_alerts')
    .insert({
      user_id: userId,
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
  // Récupérer tous les produits avec stock faible
  const { data: products } = await supabaseClient
    .from('supplier_products')
    .select('*, supplier_id')
    .eq('user_id', userId)
    .lte('stock_quantity', 10);

  const alerts = [];

  for (const product of products || []) {
    const { data: config } = await supabaseClient
      .from('stock_sync_configs')
      .select('*')
      .eq('supplier_id', product.supplier_id)
      .single();

    if (config && product.stock_quantity <= config.low_stock_threshold) {
      await createStockAlert(supabaseClient, userId, product, 
        product.stock_quantity === 0 ? 'out_of_stock' : 'low_stock',
        product.stock_quantity, config);
      alerts.push(product);
    }
  }

  return alerts;
}
