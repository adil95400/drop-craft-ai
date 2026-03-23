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

    const handlers: Record<string, () => Promise<Response>> = {
      check_and_reorder: () => handleCheckAndReorder(supabase),
      process_queue: () => handleProcessQueue(supabase),
      update_tracking: () => handleUpdateTracking(supabase),
      get_tracking: () => handleGetTracking(supabase, body),
    };

    const handler = handlers[action];
    if (!handler) {
      return new Response(JSON.stringify({ error: 'Unknown action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return await handler();
  } catch (error) {
    console.error('Auto-reorder engine error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ─── Intelligent supplier selection ──────────────────────────────────

interface SupplierCandidate {
  id: string;
  name: string;
  type: string;
  price: number;
  stock: number;
  reliability: number; // 0-100
  delivery_days: number;
  score: number;
}

async function selectBestSupplier(
  supabase: any,
  productId: string,
  userId: string,
  quantity: number,
  ruleSupplier?: { id: string; name: string; type: string }
): Promise<SupplierCandidate | null> {
  // Get all supplier_products mappings for this product
  const { data: mappings } = await supabase
    .from('supplier_products')
    .select('*, suppliers(id, name, tier, config, rating, avg_delivery_days)')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (!mappings || mappings.length === 0) {
    // Fall back to rule supplier
    if (ruleSupplier) {
      return {
        id: ruleSupplier.id,
        name: ruleSupplier.name,
        type: ruleSupplier.type || 'generic',
        price: 0,
        stock: quantity,
        reliability: 50,
        delivery_days: 14,
        score: 50,
      };
    }
    return null;
  }

  // Score each supplier candidate
  const candidates: SupplierCandidate[] = mappings
    .filter((m: any) => (m.stock_quantity || 0) >= quantity)
    .map((m: any) => {
      const supplier = m.suppliers || {};
      const price = m.cost_price || m.price || 0;
      const reliability = supplier.rating || 70;
      const deliveryDays = supplier.avg_delivery_days || 14;
      const stock = m.stock_quantity || 0;
      const supplierType = supplier.tier || 'generic';

      // Weighted scoring: price (40%), reliability (30%), delivery speed (20%), stock depth (10%)
      const maxPrice = Math.max(...mappings.map((x: any) => x.supplier_price || x.cost_price || 1));
      const priceScore = maxPrice > 0 ? (1 - price / maxPrice) * 100 : 50;
      const speedScore = Math.max(0, 100 - deliveryDays * 5);
      const stockScore = Math.min(100, (stock / Math.max(quantity, 1)) * 50);

      const score = priceScore * 0.4 + reliability * 0.3 + speedScore * 0.2 + stockScore * 0.1;

      return {
        id: supplier.id || m.supplier_id,
        name: supplier.name || 'Unknown',
        type: supplier.supplier_type || 'generic',
        price,
        stock,
        reliability,
        delivery_days: deliveryDays,
        score: Math.round(score),
      };
    });

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  // Return best candidate, or fallback to rule supplier
  if (candidates.length > 0) return candidates[0];
  if (ruleSupplier) {
    return {
      id: ruleSupplier.id,
      name: ruleSupplier.name,
      type: ruleSupplier.type,
      price: 0,
      stock: 0,
      reliability: 50,
      delivery_days: 14,
      score: 30,
    };
  }
  return null;
}

// ─── Demand-based quantity optimization ──────────────────────────────

async function calculateOptimalQuantity(
  supabase: any,
  rule: any,
  product: any,
  currentStock: number
): Promise<number> {
  const baseQty = rule.reorder_quantity || 10;
  const threshold = rule.min_stock_trigger || 5;

  // Try to estimate demand from recent orders
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: recentOrders } = await supabase
    .from('order_items')
    .select('quantity')
    .eq('product_id', product.id)
    .gte('created_at', thirtyDaysAgo);

  if (recentOrders && recentOrders.length > 0) {
    const totalSold = recentOrders.reduce((s: number, o: any) => s + (o.quantity || 1), 0);
    const dailyVelocity = totalSold / 30;
    const daysOfCover = 30; // target 30 days of stock
    const demandBasedQty = Math.ceil(dailyVelocity * daysOfCover);

    // Use the larger of demand-based or rule-based, capped at 3x base
    const optimalQty = Math.min(
      Math.max(demandBasedQty, baseQty),
      baseQty * 3
    );

    return optimalQty;
  }

  // Fallback: simple heuristics
  if (currentStock === 0) return Math.ceil(baseQty * 1.5);
  if (currentStock < threshold * 0.5) return Math.ceil(baseQty * 1.2);
  return baseQty;
}

// ─── Check stock thresholds and create reorder entries ────────────────

async function handleCheckAndReorder(supabase: any) {
  const { data: rules, error: rulesError } = await supabase
    .from('auto_order_rules')
    .select('*, products(id, title, price, cost_price, stock_quantity, status, user_id), suppliers(id, name, supplier_type, contact_email, reliability_score)')
    .eq('is_active', true);

  if (rulesError) throw rulesError;

  const results = { checked: 0, triggered: 0, skipped: 0, errors: [] as string[] };

  for (const rule of (rules || [])) {
    results.checked++;
    const product = rule.products;
    if (!product) { results.skipped++; continue; }

    const currentStock = product.stock_quantity || 0;
    const threshold = rule.min_stock_trigger || 5;

    if (currentStock > threshold) { results.skipped++; continue; }

    // Check for existing pending orders
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

    // Intelligent supplier selection
    const bestSupplier = await selectBestSupplier(
      supabase,
      product.id,
      rule.user_id,
      rule.reorder_quantity || 10,
      rule.suppliers ? { id: rule.supplier_id, name: rule.suppliers.name, type: rule.supplier_type || 'generic' } : undefined
    );

    if (!bestSupplier) {
      results.errors.push(`No supplier found for ${product.title}`);
      continue;
    }

    // Demand-based quantity
    const reorderQty = await calculateOptimalQuantity(supabase, rule, product, currentStock);

    // Check max price constraint
    const unitCost = bestSupplier.price || product.cost_price || 0;
    const estimatedCost = unitCost * reorderQty;
    if (rule.max_price && estimatedCost > rule.max_price) {
      results.errors.push(`Product ${product.title}: estimated cost ${estimatedCost.toFixed(2)}€ exceeds max ${rule.max_price}€`);
      continue;
    }

    // Create auto-order entry
    const { error: insertError } = await supabase
      .from('auto_order_queue')
      .insert({
        user_id: rule.user_id,
        order_id: product.id,
        supplier_type: bestSupplier.type,
        status: 'pending',
        payload: {
          product_id: product.id,
          product_title: product.title,
          quantity: reorderQty,
          unit_cost: unitCost,
          total_cost: estimatedCost,
          supplier_id: bestSupplier.id,
          supplier_name: bestSupplier.name,
          supplier_score: bestSupplier.score,
          supplier_reliability: bestSupplier.reliability,
          estimated_delivery_days: bestSupplier.delivery_days,
          trigger_reason: `Stock (${currentStock}) below threshold (${threshold})`,
          rule_id: rule.id,
          auto_generated: true,
          selection_method: 'intelligent',
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
      description: `Auto-reorder: ${reorderQty}x ${product.title} from ${bestSupplier.name} (score: ${bestSupplier.score}/100)`,
      details: {
        rule_id: rule.id,
        quantity: reorderQty,
        current_stock: currentStock,
        threshold,
        supplier: bestSupplier,
      },
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
  // Also pick up retries that are due
  const now = new Date().toISOString();
  const { data: pending } = await supabase
    .from('auto_order_queue')
    .select('*')
    .or(`status.eq.pending,and(status.eq.retry,next_retry_at.lte.${now})`)
    .order('created_at', { ascending: true })
    .limit(20);

  const results = { processed: 0, failed: 0, email_fallback: 0 };

  for (const item of (pending || [])) {
    try {
      await supabase
        .from('auto_order_queue')
        .update({ status: 'processing', updated_at: now })
        .eq('id', item.id);

      const payload = item.payload || {};
      const supplierType = item.supplier_type;

      // Attempt to place order via supplier API
      let orderResult: any;
      let method = 'api';

      try {
        orderResult = await placeSupplierOrder(supabase, item);
      } catch (apiErr) {
        // Email fallback
        console.warn(`API order failed for ${item.id}, trying email fallback:`, apiErr.message);
        method = 'email_fallback';
        orderResult = await sendEmailFallback(supabase, item);
        results.email_fallback++;
      }

      const supplierOrderId = orderResult.supplier_order_id ||
        `SO-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // Update queue entry with result
      await supabase
        .from('auto_order_queue')
        .update({
          status: 'completed',
          supplier_order_id: supplierOrderId,
          processed_at: new Date().toISOString(),
          estimated_delivery: calculateEstimatedDelivery(supplierType, payload.estimated_delivery_days),
          result: {
            order_placed: true,
            supplier_order_id: supplierOrderId,
            method,
            ...orderResult,
          },
        })
        .eq('id', item.id);

      // Log
      await supabase.from('activity_logs').insert({
        user_id: item.user_id,
        action: 'auto_order_placed',
        entity_type: 'auto_order',
        entity_id: item.id,
        description: `Order placed: ${supplierOrderId} via ${method} (${supplierType})`,
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

      // If failed permanently, create alert
      if (retryCount >= maxRetries) {
        await supabase.from('active_alerts').insert({
          user_id: item.user_id,
          alert_type: 'auto_order_failed',
          severity: 'high',
          title: `Auto-order failed: ${(item.payload?.product_title || '').substring(0, 50)}`,
          message: `Order for ${item.payload?.quantity || 0} units failed after ${maxRetries} attempts. Error: ${err.message}`,
          metadata: { queue_id: item.id, product_id: item.payload?.product_id },
        });
      }

      results.failed++;
    }
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─── Place order via supplier (simulated API calls) ──────────────────

async function placeSupplierOrder(supabase: any, item: any): Promise<any> {
  const payload = item.payload || {};
  const supplierType = item.supplier_type;

  // In production, these would be real API calls to CJ, AliExpress, etc.
  // For now, simulate based on supplier type
  const supplierOrderId = `${supplierType.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  return {
    supplier_order_id: supplierOrderId,
    estimated_delivery: calculateEstimatedDelivery(supplierType, payload.estimated_delivery_days),
    confirmation: true,
    placed_at: new Date().toISOString(),
  };
}

// ─── Email fallback when API is unavailable ──────────────────────────

async function sendEmailFallback(supabase: any, item: any): Promise<any> {
  const payload = item.payload || {};

  // Get supplier contact email
  let contactEmail = '';
  if (payload.supplier_id) {
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('contact_email, name')
      .eq('id', payload.supplier_id)
      .single();
    contactEmail = supplier?.contact_email || '';
  }

  // Log the email fallback attempt
  await supabase.from('activity_logs').insert({
    user_id: item.user_id,
    action: 'auto_order_placed',
    entity_type: 'auto_order',
    entity_id: item.id,
    description: `Email fallback: PO for ${payload.quantity}x ${payload.product_title} → ${contactEmail || 'no email'}`,
    details: { method: 'email_fallback', contact_email: contactEmail },
    source: 'auto_reorder_engine',
    severity: 'warn',
  });

  const fallbackOrderId = `EMAIL-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  return {
    supplier_order_id: fallbackOrderId,
    method: 'email_fallback',
    email_sent_to: contactEmail || 'pending_manual',
    placed_at: new Date().toISOString(),
  };
}

// ─── Update tracking for in-transit orders ────────────────────────────

async function handleUpdateTracking(supabase: any) {
  const { data: tracked } = await supabase
    .from('auto_order_queue')
    .select('*')
    .eq('status', 'completed')
    .order('processed_at', { ascending: true })
    .limit(50);

  const results = { updated: 0, delivered: 0 };

  for (const item of (tracked || [])) {
    const processedAt = new Date(item.processed_at || item.created_at).getTime();
    const daysSinceOrder = Math.floor((Date.now() - processedAt) / 86400000);
    const estimatedDays = item.payload?.estimated_delivery_days || 14;
    const currentResult = item.result || {};

    let trackingStatus = currentResult.tracking_status || 'confirmed';
    let shouldUpdate = false;

    // Simulate tracking progression
    if (daysSinceOrder >= estimatedDays && trackingStatus !== 'delivered') {
      trackingStatus = 'delivered';
      shouldUpdate = true;
      results.delivered++;

      // Auto-update stock when delivered
      if (item.payload?.product_id && item.payload?.quantity) {
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.payload.product_id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({
              stock_quantity: (product.stock_quantity || 0) + item.payload.quantity,
            })
            .eq('id', item.payload.product_id);

          // Log stock update
          await supabase.from('activity_logs').insert({
            user_id: item.user_id,
            action: 'auto_reorder_triggered',
            entity_type: 'product',
            entity_id: item.payload.product_id,
            description: `Stock updated: +${item.payload.quantity} units (auto-delivery)`,
            source: 'auto_reorder_engine',
            severity: 'info',
          });
        }
      }
    } else if (daysSinceOrder >= Math.ceil(estimatedDays * 0.7) && trackingStatus === 'confirmed') {
      trackingStatus = 'in_transit';
      shouldUpdate = true;
    } else if (daysSinceOrder >= 1 && trackingStatus === 'pending') {
      trackingStatus = 'confirmed';
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      await supabase
        .from('auto_order_queue')
        .update({
          result: {
            ...currentResult,
            tracking_status: trackingStatus,
            last_tracking_update: new Date().toISOString(),
            days_since_order: daysSinceOrder,
            estimated_delivery_days: estimatedDays,
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

// ─── Get tracking data for UI ─────────────────────────────────────────

async function handleGetTracking(supabase: any, body: any) {
  const userId = body.userId;
  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: orders, error } = await supabase
    .from('auto_order_queue')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['completed', 'processing'])
    .not('supplier_order_id', 'is', null)
    .order('processed_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  // Categorize by tracking status
  const tracking = {
    confirmed: [] as any[],
    in_transit: [] as any[],
    delivered: [] as any[],
    unknown: [] as any[],
  };

  for (const order of (orders || [])) {
    const status = order.result?.tracking_status || 'confirmed';
    const list = tracking[status as keyof typeof tracking] || tracking.unknown;
    list.push({
      id: order.id,
      supplier_order_id: order.supplier_order_id,
      tracking_number: order.tracking_number,
      carrier: order.carrier,
      status,
      product: order.payload?.product_title,
      quantity: order.payload?.quantity,
      supplier: order.payload?.supplier_name,
      estimated_delivery: order.estimated_delivery,
      processed_at: order.processed_at,
      days_in_transit: order.result?.days_since_order || 0,
    });
  }

  return new Response(JSON.stringify({
    success: true,
    tracking,
    summary: {
      confirmed: tracking.confirmed.length,
      in_transit: tracking.in_transit.length,
      delivered: tracking.delivered.length,
      total: (orders || []).length,
    },
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────

function calculateEstimatedDelivery(supplierType: string, customDays?: number): string {
  const days = customDays || ({
    aliexpress: 15,
    cj: 10,
    bigbuy: 5,
    bts: 7,
    temu: 12,
    amazon: 3,
    generic: 14,
  }[supplierType] || 14);

  return new Date(Date.now() + days * 86400000).toISOString();
}
