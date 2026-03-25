/**
 * Automation Alert Engine
 * Centralized alerting for all automation modules:
 * - Stock alerts (low stock, stockout)
 * - Pricing alerts (margin drop, supplier price hike)
 * - Workflow alerts (failures, anomalies)
 * - Sync alerts (API errors, data inconsistencies)
 * 
 * Actions: scan_all | scan_stock | scan_pricing | scan_workflows
 */
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { action = 'scan_all', user_id } = await req.json().catch(() => ({}));

    // If called from cron, scan all users; otherwise scan requesting user
    let userIds: string[] = [];
    if (user_id) {
      userIds = [user_id];
    } else {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .limit(500);
      userIds = (profiles || []).map((p: any) => p.id);
    }

    const allResults: any[] = [];

    for (const uid of userIds) {
      const results: any = { user_id: uid, alerts_created: 0 };

      // Load user's alert preferences
      const { data: prefs } = await supabase
        .from('alert_configurations')
        .select('*')
        .eq('user_id', uid)
        .eq('is_enabled', true);

      const prefMap = new Map((prefs || []).map((p: any) => [p.alert_type, p]));

      // ── STOCK ALERTS ──────────────────────────────────────
      if (action === 'scan_all' || action === 'scan_stock') {
        const stockThreshold = (prefMap.get('stock_low') as any)?.threshold_value ?? 5;

        const { data: lowStockProducts } = await supabase
          .from('products')
          .select('id, title, stock_quantity, status')
          .eq('user_id', uid)
          .eq('status', 'active')
          .lt('stock_quantity', stockThreshold)
          .limit(50);

        for (const product of lowStockProducts || []) {
          const severity = product.stock_quantity === 0 ? 'critical' : product.stock_quantity <= 2 ? 'high' : 'medium';
          const title = product.stock_quantity === 0
            ? `🚨 Rupture de stock : ${product.title}`
            : `⚠️ Stock bas : ${product.title} (${product.stock_quantity} restants)`;

          await createAlertIfNew(supabase, uid, {
            title,
            message: `Le produit "${product.title}" a ${product.stock_quantity} unités en stock.`,
            notification_type: product.stock_quantity === 0 ? 'stock_out' : 'stock_low',
            category: 'inventory',
            priority: severity,
            action_url: `/products/${product.id}`,
            action_label: 'Voir le produit',
            metadata: { product_id: product.id, stock: product.stock_quantity },
          });
          results.alerts_created++;
        }
      }

      // ── PRICING ALERTS ────────────────────────────────────
      if (action === 'scan_all' || action === 'scan_pricing') {
        const marginThreshold = (prefMap.get('margin_drop') as any)?.threshold_percent ?? 10;

        // Check products with very low margins
        const { data: products } = await supabase
          .from('products')
          .select('id, title, price, buy_price')
          .eq('user_id', uid)
          .not('buy_price', 'is', null)
          .gt('buy_price', 0)
          .limit(200);

        for (const p of products || []) {
          if (!p.price || !p.buy_price) continue;
          const margin = ((p.price - p.buy_price) / p.price) * 100;
          if (margin < marginThreshold) {
            const severity = margin <= 0 ? 'critical' : margin < 5 ? 'high' : 'medium';
            await createAlertIfNew(supabase, uid, {
              title: `💰 Marge faible : ${p.title} (${margin.toFixed(1)}%)`,
              message: `Marge actuelle ${margin.toFixed(1)}% — seuil configuré : ${marginThreshold}%. Prix vente: ${p.price}€, Coût: ${p.buy_price}€.`,
              notification_type: 'margin_low',
              category: 'pricing',
              priority: severity,
              action_url: `/products/${p.id}`,
              action_label: 'Ajuster le prix',
              metadata: { product_id: p.id, margin, price: p.price, cost: p.buy_price },
            });
            results.alerts_created++;
          }
        }

        // Check recent supplier price increases (last 24h)
        const { data: priceChanges } = await supabase
          .from('price_change_history')
          .select('*')
          .eq('user_id', uid)
          .eq('change_type', 'supplier_cost')
          .gte('changed_at', new Date(Date.now() - 86400000).toISOString())
          .limit(50);

        for (const change of priceChanges || []) {
          if (change.new_value > change.old_value) {
            const increase = ((change.new_value - change.old_value) / change.old_value * 100).toFixed(1);
            await createAlertIfNew(supabase, uid, {
              title: `📈 Hausse prix fournisseur (+${increase}%)`,
              message: `Prix passé de ${change.old_value}€ à ${change.new_value}€ pour le produit.`,
              notification_type: 'price_change',
              category: 'pricing',
              priority: parseFloat(increase) > 20 ? 'critical' : parseFloat(increase) > 10 ? 'high' : 'medium',
              metadata: { change_id: change.id, old: change.old_value, new: change.new_value, increase },
            });
            results.alerts_created++;
          }
        }
      }

      // ── WORKFLOW ALERTS ───────────────────────────────────
      if (action === 'scan_all' || action === 'scan_workflows') {
        // Check failed auto-orders
        const { data: failedOrders } = await supabase
          .from('auto_order_queue')
          .select('id, order_id, error_message, retry_count, max_retries')
          .eq('user_id', uid)
          .eq('status', 'failed')
          .gte('created_at', new Date(Date.now() - 86400000).toISOString())
          .limit(20);

        for (const order of failedOrders || []) {
          if (order.retry_count >= order.max_retries) {
            await createAlertIfNew(supabase, uid, {
              title: `❌ Commande auto échouée (${order.retry_count} tentatives)`,
              message: order.error_message || 'Commande automatique échouée après tous les essais.',
              notification_type: 'workflow_failure',
              category: 'system',
              priority: 'high',
              action_url: '/automation/supply-chain',
              action_label: 'Voir la commande',
              metadata: { order_id: order.order_id, queue_id: order.id },
            });
            results.alerts_created++;
          }
        }

        // Check sync failures
        const { data: syncLogs } = await supabase
          .from('supplier_sync_logs')
          .select('id, supplier_id, sync_type, error_message')
          .eq('user_id', uid)
          .eq('status', 'error')
          .gte('started_at', new Date(Date.now() - 3600000).toISOString())
          .limit(10);

        for (const log of syncLogs || []) {
          await createAlertIfNew(supabase, uid, {
            title: `🔌 Échec de synchronisation`,
            message: log.error_message || 'Erreur lors de la synchronisation fournisseur.',
            notification_type: 'sync_failure',
            category: 'integrations',
            priority: 'high',
            action_url: '/automation/price-stock',
            action_label: 'Voir les syncs',
            metadata: { sync_log_id: log.id, supplier_id: log.supplier_id },
          });
          results.alerts_created++;
        }
      }

      allResults.push(results);
    }

    return new Response(JSON.stringify({ success: true, results: allResults }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Create alert only if a similar one doesn't already exist (deduplication)
 */
async function createAlertIfNew(
  supabase: any,
  userId: string,
  alert: {
    title: string;
    message: string;
    notification_type: string;
    category: string;
    priority: string;
    action_url?: string;
    action_label?: string;
    metadata?: Record<string, any>;
  }
) {
  // Check for duplicate: same type + category in last 6 hours
  const { count } = await supabase
    .from('user_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('notification_type', alert.notification_type)
    .eq('is_read', false)
    .gte('created_at', new Date(Date.now() - 6 * 3600000).toISOString());

  // Max 5 unread alerts of same type
  if ((count || 0) >= 5) return;

  await supabase.from('user_notifications').insert({
    user_id: userId,
    title: alert.title,
    message: alert.message,
    notification_type: alert.notification_type,
    category: alert.category,
    priority: alert.priority,
    action_url: alert.action_url,
    action_label: alert.action_label,
    metadata: alert.metadata || {},
    is_read: false,
  });
}
