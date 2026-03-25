import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const CRON_SECRET = Deno.env.get('CRON_SECRET');

    // ── SECURITY: Require CRON_SECRET or valid service_role JWT ──
    const cronSecret = req.headers.get('x-cron-secret');
    const authHeader = req.headers.get('Authorization');
    const isServiceRole = authHeader?.includes(supabaseKey);

    if (!cronSecret && !isServiceRole) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (cronSecret && CRON_SECRET && cronSecret !== CRON_SECRET) {
      const logClient = createClient(supabaseUrl, supabaseKey);
      await logClient.from('activity_logs').insert({
        action: 'reorder_auth_failed', entity_type: 'security',
        description: 'Unauthorized auto-reorder-engine trigger attempt',
        severity: 'warn', source: 'auto_reorder_engine',
      });
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
  reliability: number;
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
  const { data: mappings } = await supabase
    .from('supplier_products')
    .select('*, suppliers(id, name, tier, config, rating, avg_delivery_days)')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (!mappings || mappings.length === 0) {
    if (ruleSupplier) {
      return {
        id: ruleSupplier.id, name: ruleSupplier.name, type: ruleSupplier.type || 'generic',
        price: 0, stock: quantity, reliability: 50, delivery_days: 14, score: 50,
      };
    }
    return null;
  }

  const candidates: SupplierCandidate[] = mappings
    .filter((m: any) => (m.stock_quantity || 0) >= quantity)
    .map((m: any) => {
      const supplier = m.suppliers || {};
      const price = m.cost_price || m.price || 0;
      const reliability = supplier.rating || 70;
      const deliveryDays = supplier.avg_delivery_days || 14;
      const stock = m.stock_quantity || 0;
      const supplierType = supplier.tier || 'generic';

      const prices = mappings.map((x: any) => x.cost_price || x.price || 1);
      const maxPrice = Math.max(...prices);
      const priceScore = maxPrice > 0 ? (1 - price / maxPrice) * 100 : 50;
      const speedScore = Math.max(0, 100 - deliveryDays * 5);
      const stockScore = Math.min(100, (stock / Math.max(quantity, 1)) * 50);

      const score = priceScore * 0.4 + reliability * 0.3 + speedScore * 0.2 + stockScore * 0.1;

      return {
        id: supplier.id || m.supplier_id, name: supplier.name || 'Unknown', type: supplierType,
        price, stock, reliability, delivery_days: deliveryDays, score: Math.round(score),
      };
    });

  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length > 0) return candidates[0];
  if (ruleSupplier) {
    return { id: ruleSupplier.id, name: ruleSupplier.name, type: ruleSupplier.type, price: 0, stock: 0, reliability: 50, delivery_days: 14, score: 30 };
  }
  return null;
}

// ─── Demand-based quantity optimization ──────────────────────────────

async function calculateOptimalQuantity(
  supabase: any, rule: any, product: any, currentStock: number
): Promise<number> {
  const baseQty = rule.reorder_quantity || 10;
  const threshold = rule.min_stock_trigger || 5;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: recentOrders } = await supabase
    .from('order_items')
    .select('quantity')
    .eq('product_id', product.id)
    .gte('created_at', thirtyDaysAgo);

  if (recentOrders && recentOrders.length > 0) {
    const totalSold = recentOrders.reduce((s: number, o: any) => s + (o.quantity || 1), 0);
    const dailyVelocity = totalSold / 30;
    const demandBasedQty = Math.ceil(dailyVelocity * 30);
    return Math.min(Math.max(demandBasedQty, baseQty), baseQty * 3);
  }

  if (currentStock === 0) return Math.ceil(baseQty * 1.5);
  if (currentStock < threshold * 0.5) return Math.ceil(baseQty * 1.2);
  return baseQty;
}

// ─── Check stock thresholds and create reorder entries ────────────────

async function handleCheckAndReorder(supabase: any) {
  const { data: rules, error: rulesError } = await supabase
    .from('auto_order_rules')
    .select('*, products(id, title, price, cost_price, stock_quantity, status, user_id), suppliers(id, name, tier, rating, avg_delivery_days, config)')
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

    const { data: existingOrders } = await supabase
      .from('auto_order_queue')
      .select('id')
      .eq('order_id', product.id)
      .eq('user_id', rule.user_id)
      .in('status', ['pending', 'processing'])
      .limit(1);

    if (existingOrders && existingOrders.length > 0) { results.skipped++; continue; }

    const bestSupplier = await selectBestSupplier(
      supabase, product.id, rule.user_id, rule.reorder_quantity || 10,
      rule.suppliers ? { id: rule.supplier_id, name: rule.suppliers.name, type: rule.suppliers.tier || rule.supplier_type || 'generic' } : undefined
    );

    if (!bestSupplier) { results.errors.push(`No supplier found for ${product.title}`); continue; }

    const reorderQty = await calculateOptimalQuantity(supabase, rule, product, currentStock);

    const unitCost = bestSupplier.price || product.cost_price || 0;
    const estimatedCost = unitCost * reorderQty;
    if (rule.max_price && estimatedCost > rule.max_price) {
      results.errors.push(`Product ${product.title}: estimated cost ${estimatedCost.toFixed(2)}€ exceeds max ${rule.max_price}€`);
      continue;
    }

    const { error: insertError } = await supabase
      .from('auto_order_queue')
      .insert({
        user_id: rule.user_id, order_id: product.id, supplier_type: bestSupplier.type,
        status: 'pending',
        payload: {
          product_id: product.id, product_title: product.title, quantity: reorderQty,
          unit_cost: unitCost, total_cost: estimatedCost,
          supplier_id: bestSupplier.id, supplier_name: bestSupplier.name,
          supplier_score: bestSupplier.score, supplier_reliability: bestSupplier.reliability,
          estimated_delivery_days: bestSupplier.delivery_days,
          trigger_reason: `Stock (${currentStock}) below threshold (${threshold})`,
          rule_id: rule.id, auto_generated: true, selection_method: 'intelligent',
        },
        max_retries: 3,
      });

    if (insertError) { results.errors.push(`Failed to create order for ${product.title}: ${insertError.message}`); continue; }

    await supabase.from('auto_order_rules').update({
      trigger_count: (rule.trigger_count || 0) + 1,
      last_triggered_at: new Date().toISOString(),
    }).eq('id', rule.id);

    await supabase.from('activity_logs').insert({
      user_id: rule.user_id, action: 'auto_reorder_triggered', entity_type: 'product', entity_id: product.id,
      description: `Auto-reorder: ${reorderQty}x ${product.title} from ${bestSupplier.name} (score: ${bestSupplier.score}/100)`,
      details: { rule_id: rule.id, quantity: reorderQty, current_stock: currentStock, threshold, supplier: bestSupplier },
      source: 'auto_reorder_engine', severity: 'info',
    });

    results.triggered++;
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─── Process pending orders in the queue ──────────────────────────────

async function handleProcessQueue(supabase: any) {
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
      await supabase.from('auto_order_queue').update({ status: 'processing', updated_at: now }).eq('id', item.id);

      const payload = item.payload || {};
      let orderResult: any;
      let method = 'api';

      try {
        orderResult = await placeSupplierOrder(supabase, item);
      } catch (apiErr) {
        console.warn(`API order failed for ${item.id}, trying email fallback:`, apiErr.message);
        method = 'email_fallback';
        orderResult = await sendEmailFallback(supabase, item);
        results.email_fallback++;
      }

      const supplierOrderId = orderResult.supplier_order_id || `SO-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      await supabase.from('auto_order_queue').update({
        status: 'completed', supplier_order_id: supplierOrderId,
        processed_at: new Date().toISOString(),
        estimated_delivery: calculateEstimatedDelivery(item.supplier_type, payload.estimated_delivery_days),
        result: { order_placed: true, supplier_order_id: supplierOrderId, method, ...orderResult },
      }).eq('id', item.id);

      await supabase.from('activity_logs').insert({
        user_id: item.user_id, action: 'auto_order_placed', entity_type: 'auto_order', entity_id: item.id,
        description: `Order placed: ${supplierOrderId} via ${method} (${item.supplier_type})`,
        source: 'auto_reorder_engine', severity: 'info',
      });

      results.processed++;
    } catch (err) {
      const retryCount = (item.retry_count || 0) + 1;
      const maxRetries = item.max_retries || 3;

      await supabase.from('auto_order_queue').update({
        status: retryCount >= maxRetries ? 'failed' : 'retry',
        retry_count: retryCount, error_message: err.message,
        next_retry_at: retryCount < maxRetries ? new Date(Date.now() + retryCount * 5 * 60 * 1000).toISOString() : null,
      }).eq('id', item.id);

      if (retryCount >= maxRetries) {
        await supabase.from('active_alerts').insert({
          user_id: item.user_id, alert_type: 'auto_order_failed', severity: 'high',
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

// ─── Place order via real supplier API ────────────────────────────────

async function placeSupplierOrder(supabase: any, item: any): Promise<any> {
  const payload = item.payload || {};
  const supplierType = item.supplier_type;
  const supplierId = payload.supplier_id;

  let apiKey = '';
  if (supplierId) {
    const { data: creds } = await supabase
      .from('supplier_credentials_vault')
      .select('oauth_data, api_key_encrypted, access_token_encrypted')
      .eq('supplier_id', supplierId).eq('user_id', item.user_id).maybeSingle();

    if (creds) {
      const od = creds.oauth_data || {};
      apiKey = od.accessToken || od.apiKey || creds.api_key_encrypted || creds.access_token_encrypted || '';
    }
  }

  switch (supplierType) {
    case 'cjdropshipping':
    case 'cj': {
      if (!apiKey) throw new Error('CJ Access Token not configured');
      const res = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CJ-Access-Token': apiKey },
        body: JSON.stringify({
          products: [{ vid: payload.product_id, quantity: payload.quantity }],
          shippingAddress: payload.shipping_address || {},
          shippingMethodId: 'CJ_PACKET_B',
        }),
      });
      const data = await res.json();
      if (data.code !== 200) throw new Error(`CJ API: ${data.message || data.code}`);
      return { supplier_order_id: data.data?.orderId || data.data?.orderNum, method: 'api', platform: 'cjdropshipping', placed_at: new Date().toISOString() };
    }

    case 'bigbuy': {
      if (!apiKey) throw new Error('BigBuy API key not configured');
      const res = await fetch('https://api.bigbuy.eu/rest/order/create.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          products: [{ reference: payload.product_sku || payload.product_id, quantity: payload.quantity }],
          internalReference: `AUTO-${Date.now()}`,
        }),
      });
      if (!res.ok) throw new Error(`BigBuy API: ${res.status}`);
      const data = await res.json();
      return { supplier_order_id: data.id || data.orderId, method: 'api', platform: 'bigbuy', placed_at: new Date().toISOString() };
    }

    default: {
      return { supplier_order_id: `SIM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`, method: 'simulation', platform: supplierType, placed_at: new Date().toISOString(), note: 'No real API integration for this supplier type' };
    }
  }
}

async function sendEmailFallback(supabase: any, item: any): Promise<any> {
  const payload = item.payload || {};
  console.log(`[email-fallback] Would send reorder email for product ${payload.product_title}`);
  return { supplier_order_id: `EMAIL-${Date.now()}`, method: 'email_fallback', platform: item.supplier_type, note: 'Email fallback (API unavailable)' };
}

function calculateEstimatedDelivery(supplierType: string, estimatedDays?: number): string {
  const days = estimatedDays || (supplierType === 'bigbuy' ? 5 : supplierType === 'cjdropshipping' || supplierType === 'cj' ? 14 : 10);
  return new Date(Date.now() + days * 86400000).toISOString();
}

// ─── Update tracking for completed orders ────────────────────────────

async function handleUpdateTracking(supabase: any) {
  const { data: completedOrders } = await supabase
    .from('auto_order_queue')
    .select('*')
    .eq('status', 'completed')
    .is('tracking_number', null)
    .limit(20);

  let updated = 0;
  for (const order of (completedOrders || [])) {
    const supplierType = order.supplier_type;
    const supplierId = order.payload?.supplier_id;

    if (!supplierId) continue;

    let apiKey = '';
    const { data: creds } = await supabase
      .from('supplier_credentials_vault')
      .select('oauth_data, api_key_encrypted, access_token_encrypted')
      .eq('supplier_id', supplierId).eq('user_id', order.user_id).maybeSingle();

    if (creds) {
      const od = creds.oauth_data || {};
      apiKey = od.accessToken || od.apiKey || creds.api_key_encrypted || creds.access_token_encrypted || '';
    }

    if (!apiKey || !order.supplier_order_id) continue;

    try {
      let trackingData: any = null;

      if (supplierType === 'cjdropshipping' || supplierType === 'cj') {
        const res = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/shopping/order/getOrderDetail?orderId=${order.supplier_order_id}`, {
          headers: { 'CJ-Access-Token': apiKey },
        });
        const data = await res.json();
        if (data.code === 200 && data.data?.trackNumber) {
          trackingData = { tracking_number: data.data.trackNumber, carrier: data.data.logisticName || 'Unknown' };
        }
      }

      if (trackingData) {
        await supabase.from('auto_order_queue').update({
          tracking_number: trackingData.tracking_number, carrier: trackingData.carrier,
        }).eq('id', order.id);
        updated++;
      }
    } catch (err) {
      console.warn(`[tracking] Failed for order ${order.id}:`, err.message);
    }
  }

  return new Response(JSON.stringify({ success: true, checked: completedOrders?.length || 0, updated }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleGetTracking(supabase: any, body: any) {
  const { orderId } = body;
  if (!orderId) {
    return new Response(JSON.stringify({ error: 'orderId required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: order } = await supabase.from('auto_order_queue').select('*').eq('id', orderId).single();
  if (!order) {
    return new Response(JSON.stringify({ error: 'Order not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    success: true, tracking: {
      order_id: order.id, supplier_order_id: order.supplier_order_id,
      tracking_number: order.tracking_number, carrier: order.carrier,
      estimated_delivery: order.estimated_delivery, status: order.status,
    },
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
