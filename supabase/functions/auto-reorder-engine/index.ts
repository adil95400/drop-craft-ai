import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'check_and_reorder';

    if (action === 'check_and_reorder') {
      return await handleCheckAndReorder(supabase);
    } else if (action === 'process_queue') {
      return await handleProcessQueue(supabase);
    } else if (action === 'update_tracking') {
      return await handleUpdateTracking(supabase);
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Auto-reorder engine error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ─── Check stock thresholds and create reorder entries ────────────────

async function handleCheckAndReorder(supabase: any) {
  // Get all active auto-order rules
  const { data: rules, error: rulesError } = await supabase
    .from('auto_order_rules')
    .select('*, products(id, title, price, cost_price, stock_quantity, status, user_id), suppliers(id, name, contact_email)')
    .eq('is_active', true);

  if (rulesError) throw rulesError;

  const results = { checked: 0, triggered: 0, skipped: 0, errors: [] as string[] };

  for (const rule of (rules || [])) {
    results.checked++;
    const product = rule.products;
    if (!product) { results.skipped++; continue; }

    const currentStock = product.stock_quantity || 0;
    const threshold = rule.min_stock_trigger || 5;

    // Skip if stock is above threshold
    if (currentStock > threshold) { results.skipped++; continue; }

    // Check if there's already a pending order for this product
    const { data: existingOrders } = await supabase
      .from('auto_order_queue')
      .select('id')
      .eq('order_id', product.id)
      .eq('user_id', rule.user_id)
      .in('status', ['pending', 'processing'])
      .limit(1);

    if (existingOrders && existingOrders.length > 0) {
      results.skipped++;
      continue;
    }

    // Calculate optimal quantity
    const reorderQty = calculateOptimalQuantity(rule, currentStock);

    // Select best supplier
    const supplierId = rule.supplier_id;
    const supplierType = rule.supplier_type || 'generic';
    const supplierName = rule.suppliers?.name || supplierType;

    // Check max price constraint
    const estimatedCost = (product.cost_price || 0) * reorderQty;
    if (rule.max_price && estimatedCost > rule.max_price) {
      results.errors.push(`Product ${product.title}: estimated cost ${estimatedCost} exceeds max ${rule.max_price}`);
      continue;
    }

    // Create auto-order entry
    const { error: insertError } = await supabase
      .from('auto_order_queue')
      .insert({
        user_id: rule.user_id,
        order_id: product.id,
        supplier_type: supplierType,
        status: 'pending',
        payload: {
          product_id: product.id,
          product_title: product.title,
          quantity: reorderQty,
          unit_cost: product.cost_price || 0,
          total_cost: estimatedCost,
          supplier_id: supplierId,
          supplier_name: supplierName,
          trigger_reason: `Stock (${currentStock}) below threshold (${threshold})`,
          rule_id: rule.id,
          auto_generated: true,
        },
        max_retries: 3,
      });

    if (insertError) {
      results.errors.push(`Failed to create order for ${product.title}: ${insertError.message}`);
      continue;
    }

    // Update rule trigger count
    await supabase
      .from('auto_order_rules')
      .update({
        trigger_count: (rule.trigger_count || 0) + 1,
        last_triggered_at: new Date().toISOString(),
      })
      .eq('id', rule.id);

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: rule.user_id,
      action: 'auto_reorder_triggered',
      entity_type: 'product',
      entity_id: product.id,
      description: `Auto-reorder: ${reorderQty}x ${product.title} from ${supplierName}`,
      details: { rule_id: rule.id, quantity: reorderQty, current_stock: currentStock, threshold },
      source: 'auto_reorder_engine',
      severity: 'info',
    });

    results.triggered++;
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─── Process pending orders in the queue ──────────────────────────────

async function handleProcessQueue(supabase: any) {
  const { data: pending } = await supabase
    .from('auto_order_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(20);

  const results = { processed: 0, failed: 0 };

  for (const item of (pending || [])) {
    try {
      // Mark as processing
      await supabase
        .from('auto_order_queue')
        .update({ status: 'processing' })
        .eq('id', item.id);

      const payload = item.payload || {};
      const supplierType = item.supplier_type;

      // Attempt to place order via supplier
      // For now, simulate success and generate a supplier order ID
      const supplierOrderId = `SO-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // Update queue entry with result
      await supabase
        .from('auto_order_queue')
        .update({
          status: 'completed',
          supplier_order_id: supplierOrderId,
          processed_at: new Date().toISOString(),
          result: {
            order_placed: true,
            supplier_order_id: supplierOrderId,
            estimated_delivery: calculateEstimatedDelivery(supplierType),
            method: 'api',
          },
        })
        .eq('id', item.id);

      // Log success
      await supabase.from('activity_logs').insert({
        user_id: item.user_id,
        action: 'auto_order_placed',
        entity_type: 'auto_order',
        entity_id: item.id,
        description: `Order placed: ${supplierOrderId} via ${supplierType}`,
        source: 'auto_reorder_engine',
        severity: 'info',
      });

      results.processed++;
    } catch (err) {
      const retryCount = (item.retry_count || 0) + 1;
      const maxRetries = item.max_retries || 3;

      await supabase
        .from('auto_order_queue')
        .update({
          status: retryCount >= maxRetries ? 'failed' : 'retry',
          retry_count: retryCount,
          error_message: err.message,
          next_retry_at: retryCount < maxRetries
            ? new Date(Date.now() + retryCount * 5 * 60 * 1000).toISOString()
            : null,
        })
        .eq('id', item.id);

      results.failed++;
    }
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─── Update tracking for in-transit orders ────────────────────────────

async function handleUpdateTracking(supabase: any) {
  const { data: tracked } = await supabase
    .from('auto_order_queue')
    .select('*')
    .eq('status', 'completed')
    .not('tracking_number', 'is', null)
    .is('estimated_delivery', null);

  // For each tracked order, check delivery status
  // In production, this would call carrier APIs
  const results = { updated: 0 };

  for (const item of (tracked || [])) {
    // Simulate tracking update
    const daysSinceOrder = Math.floor((Date.now() - new Date(item.processed_at || item.created_at).getTime()) / 86400000);

    if (daysSinceOrder > 7) {
      await supabase
        .from('auto_order_queue')
        .update({
          estimated_delivery: new Date(Date.now() + 3 * 86400000).toISOString(),
          result: {
            ...(item.result || {}),
            tracking_status: 'in_transit',
            last_tracking_update: new Date().toISOString(),
          },
        })
        .eq('id', item.id);

      results.updated++;
    }
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────

function calculateOptimalQuantity(rule: any, currentStock: number): number {
  const baseQty = rule.reorder_quantity || 10;
  const threshold = rule.min_stock_trigger || 5;

  // If stock is 0, order more to cover backlog
  if (currentStock === 0) {
    return Math.ceil(baseQty * 1.5);
  }

  // If stock is very low relative to threshold, order the base amount
  if (currentStock < threshold * 0.5) {
    return Math.ceil(baseQty * 1.2);
  }

  return baseQty;
}

function calculateEstimatedDelivery(supplierType: string): string {
  const daysMap: Record<string, number> = {
    aliexpress: 15,
    cj: 10,
    bigbuy: 5,
    bts: 7,
    generic: 14,
  };
  const days = daysMap[supplierType] || 14;
  return new Date(Date.now() + days * 86400000).toISOString();
}
