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
      // Cron-triggered: process all users' suppliers
      userId = null; // will process all
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
    const syncType = body.syncType || 'products';
    const limit = body.limit || 500;

    // Get active supplier connections to sync
    let query = supabase
      .from('supplier_connections')
      .select('*')
      .eq('status', 'active');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (body.supplierId) {
      query = query.eq('id', body.supplierId);
    }

    const { data: connections, error: connError } = await query;
    if (connError) throw connError;

    const results: any[] = [];

    for (const conn of connections || []) {
      const jobId = crypto.randomUUID();
      
      // Create sync job record
      await supabase.from('supplier_sync_jobs').insert({
        id: jobId,
        user_id: conn.user_id,
        supplier_type: conn.connector_id,
        job_type: syncType === 'full' ? 'full_sync' : `${syncType}_sync`,
        status: 'running',
        started_at: new Date().toISOString(),
      });

      try {
        // Sync logic per connector type
        const syncResult = await syncSupplier(supabase, conn, syncType, limit);
        
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

        results.push({ connector: conn.connector_id, status: 'completed', ...syncResult });
      } catch (syncError: any) {
        // Update job as failed
        await supabase.from('supplier_sync_jobs').update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: syncError.message || 'Unknown error',
        }).eq('id', jobId);

        // Update connection status
        await supabase.from('supplier_connections').update({
          status: 'error',
          sync_stats: {
            last_error: syncError.message,
            last_error_at: new Date().toISOString(),
          },
        }).eq('id', conn.id);

        // Log error
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

    return new Response(JSON.stringify({ 
      success: true, 
      synced: results.length,
      results 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Supplier sync engine error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ─── Sync a single supplier connection ───
async function syncSupplier(
  supabase: any, 
  connection: any, 
  syncType: string, 
  limit: number
) {
  const result = { processed: 0, created: 0, updated: 0, failed: 0 };
  
  // Get existing supplier products for dedup
  const { data: existing } = await supabase
    .from('supplier_products')
    .select('id, external_product_id')
    .eq('user_id', connection.user_id)
    .not('external_product_id', 'is', null);
  
  const existingMap = new Map(
    (existing || []).map((p: any) => [p.external_product_id, p.id])
  );

  // For now, update sync timestamps on existing products
  // Real API calls would go here per connector_id
  const { data: products } = await supabase
    .from('supplier_products')
    .select('*')
    .eq('user_id', connection.user_id)
    .limit(limit);

  for (const product of products || []) {
    try {
      // Update last_synced_at
      await supabase
        .from('supplier_products')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', product.id);
      
      result.processed++;
      result.updated++;
    } catch {
      result.failed++;
    }
  }

  // Update product_supplier_mapping timestamps
  if (syncType === 'stock' || syncType === 'full') {
    await supabase
      .from('product_supplier_mapping')
      .update({ last_stock_update: new Date().toISOString() })
      .eq('user_id', connection.user_id);
  }
  if (syncType === 'prices' || syncType === 'full') {
    await supabase
      .from('product_supplier_mapping')
      .update({ last_price_update: new Date().toISOString() })
      .eq('user_id', connection.user_id);
  }

  return result;
}
