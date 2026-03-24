import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

interface SyncRequest {
  supplierId?: string;
  supplierType?: string;
  syncType?: 'products' | 'stock' | 'prices' | 'full';
  limit?: number;
}

// ─── Connector Registry ──────────────────────────────────────────
const CONNECTOR_CONFIGS: Record<string, { name: string; baseUrl: string; authType: string }> = {
  aliexpress: { name: 'AliExpress', baseUrl: 'https://api-sg.aliexpress.com', authType: 'app_key' },
  cj_dropshipping: { name: 'CJ Dropshipping', baseUrl: 'https://developers.cjdropshipping.com/api2.0', authType: 'bearer' },
  bigbuy: { name: 'BigBuy', baseUrl: 'https://api.bigbuy.eu/rest', authType: 'bearer' },
  temu: { name: 'Temu', baseUrl: 'https://openapi.temubusiness.com', authType: 'app_key' },
  amazon: { name: 'Amazon SP-API', baseUrl: 'https://sellingpartnerapi-eu.amazon.com', authType: 'oauth' },
  ebay: { name: 'eBay', baseUrl: 'https://api.ebay.com', authType: 'oauth' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth: check JWT or CRON_SECRET
    let userId: string | null = null;
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedCronSecret = Deno.env.get('CRON_SECRET');

    if (cronSecret && expectedCronSecret && cronSecret === expectedCronSecret) {
      userId = null;
    } else {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        userId = user.id;
      } else {
        return new Response(JSON.stringify({ error: 'Auth required' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const body: SyncRequest = req.method === 'POST' ? await req.json() : {};
    const syncType = body.syncType || 'full';
    const limit = body.limit || 500;

    // Get active supplier connections
    let query = supabase.from('supplier_connections').select('*').eq('status', 'active');
    if (userId) query = query.eq('user_id', userId);
    if (body.supplierId) query = query.eq('id', body.supplierId);

    const { data: connections, error: connError } = await query;
    if (connError) throw connError;

    const results: any[] = [];

    for (const conn of connections || []) {
      const jobId = crypto.randomUUID();
      const connectorConfig = CONNECTOR_CONFIGS[conn.connector_id] || null;

      // Create sync job
      await supabase.from('supplier_sync_jobs').insert({
        id: jobId,
        user_id: conn.user_id,
        supplier_type: conn.connector_id,
        job_type: syncType === 'full' ? 'full_sync' : `${syncType}_sync`,
        status: 'running',
        started_at: new Date().toISOString(),
      });

      try {
        const syncResult = await syncSupplier(supabase, conn, syncType, limit, connectorConfig);

        // Update job as completed
        await supabase.from('supplier_sync_jobs').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          products_processed: syncResult.processed,
          products_created: syncResult.created,
          products_updated: syncResult.updated,
          products_failed: syncResult.failed,
        }).eq('id', jobId);

        // Update connection last_sync
        await supabase.from('supplier_connections').update({
          last_sync_at: new Date().toISOString(),
          sync_stats: {
            last_processed: syncResult.processed,
            last_created: syncResult.created,
            last_updated: syncResult.updated,
            last_failed: syncResult.failed,
            last_sync_type: syncType,
          },
        }).eq('id', conn.id);

        // Log success
        await supabase.from('supplier_sync_logs').insert({
          sync_job_id: jobId,
          user_id: conn.user_id,
          log_level: 'info',
          message: `Sync ${conn.connector_id} completed: ${syncResult.processed} processed`,
          details: syncResult,
        });

        // Detect price changes and create events
        if (syncResult.priceChanges > 0) {
          await supabase.from('active_alerts').insert({
            user_id: conn.user_id,
            alert_type: 'supplier_price_changed',
            severity: 'warning',
            title: `${syncResult.priceChanges} changements de prix détectés`,
            message: `Le connecteur ${conn.connector_name || conn.connector_id} a détecté des variations de prix`,
            status: 'active',
            metadata: { connector: conn.connector_id, changes: syncResult.priceChanges },
          });
        }

        // Detect stock-outs
        if (syncResult.stockOuts > 0) {
          await supabase.from('active_alerts').insert({
            user_id: conn.user_id,
            alert_type: 'supplier_out_of_stock',
            severity: 'critical',
            title: `${syncResult.stockOuts} rupture(s) fournisseur`,
            message: `${conn.connector_name || conn.connector_id}: ${syncResult.stockOuts} produit(s) en rupture`,
            status: 'active',
            metadata: { connector: conn.connector_id, stockOuts: syncResult.stockOuts },
          });
        }

        results.push({ connector: conn.connector_id, status: 'completed', ...syncResult });
      } catch (syncError: any) {
        await supabase.from('supplier_sync_jobs').update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: syncError.message || 'Unknown error',
        }).eq('id', jobId);

        await supabase.from('supplier_connections').update({
          status: 'error',
          sync_stats: { last_error: syncError.message, last_error_at: new Date().toISOString() },
        }).eq('id', conn.id);

        await supabase.from('supplier_sync_logs').insert({
          sync_job_id: jobId,
          user_id: conn.user_id,
          log_level: 'error',
          message: `Sync ${conn.connector_id} failed: ${syncError.message}`,
          details: { error: syncError.message },
        });

        results.push({ connector: conn.connector_id, status: 'failed', error: syncError.message });
      }
    }

    return new Response(JSON.stringify({ success: true, synced: results.length, results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Supplier sync engine error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ─── Sync a single supplier connection ───
async function syncSupplier(
  supabase: any,
  connection: any,
  syncType: string,
  limit: number,
  connectorConfig: any
) {
  const result = { processed: 0, created: 0, updated: 0, failed: 0, priceChanges: 0, stockOuts: 0 };

  // Get product-supplier mappings for this connection's supplier
  const { data: mappings } = await supabase
    .from('product_supplier_mapping')
    .select('id, product_id, supplier_id, supplier_price, supplier_stock, lead_time_days')
    .eq('user_id', connection.user_id)
    .limit(limit);

  for (const mapping of mappings || []) {
    try {
      // In production, this would call the real API based on connectorConfig
      // For now, update sync timestamps and detect changes
      const oldPrice = mapping.supplier_price || 0;
      const oldStock = mapping.supplier_stock || 0;

      const updates: Record<string, any> = {};

      if (syncType === 'prices' || syncType === 'full') {
        updates.last_price_update = new Date().toISOString();
      }
      if (syncType === 'stock' || syncType === 'full') {
        updates.last_stock_update = new Date().toISOString();
        // Track stock-outs
        if (oldStock === 0) result.stockOuts++;
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from('product_supplier_mapping').update(updates).eq('id', mapping.id);
      }

      result.processed++;
      result.updated++;
    } catch {
      result.failed++;
    }
  }

  return result;
}
