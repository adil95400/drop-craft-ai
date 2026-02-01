/**
 * Auto Order Processor - Secure Edge Function
 * P0.4 FIX: Auth required + CORS allowlist + Rate limiting + User scoping
 * CRITICAL: All DB operations MUST be scoped by authenticated userId
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getSecureCorsHeaders, handleCorsPreflightSecure, isAllowedOrigin } from "../_shared/secure-cors.ts";
import { authenticateUser } from "../_shared/secure-auth.ts";
import { checkRateLimit, RATE_LIMITS, createRateLimitResponse } from "../_shared/rate-limit.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Input validation schemas
const CreateOrderSchema = z.object({
  action: z.literal('create_order'),
  ruleId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

const RetryOrderSchema = z.object({
  action: z.literal('retry_order'),
  orderId: z.string().uuid(),
});

const UpdateStatusSchema = z.object({
  action: z.literal('update_status'),
  orderId: z.string().uuid(),
  status: z.enum(['pending', 'ordered', 'shipped', 'delivered', 'failed', 'cancelled']),
  trackingNumber: z.string().max(100).optional(),
  deliveryDate: z.string().optional(),
});

const InputSchema = z.discriminatedUnion('action', [
  CreateOrderSchema,
  RetryOrderSchema,
  UpdateStatusSchema,
]);

serve(async (req) => {
  // CORS preflight - secure
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightSecure(req);
  }

  const corsHeaders = getSecureCorsHeaders(req);
  const origin = req.headers.get('Origin');

  // Block unauthorized origins
  if (origin && !isAllowedOrigin(origin)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized origin' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Only POST allowed
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1) Authentication required
    const { user } = await authenticateUser(req, supabase);
    const userId = user.id;

    // 2) Parse and validate input
    const body = await req.json();
    const parseResult = InputSchema.safeParse(body);
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parseResult.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const input = parseResult.data;

    // 3) Rate limiting per action
    const rateCfg = input.action === 'create_order' ? RATE_LIMITS.IMPORT : RATE_LIMITS.API_GENERAL;
    const rateCheck = await checkRateLimit(supabase, userId, `auto_order:${input.action}`, rateCfg);
    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck, corsHeaders);
    }

    // 4) Handle actions with user scoping
    if (input.action === 'create_order') {
      return await handleCreateOrder(supabase, userId, input.ruleId, input.reason, corsHeaders);
    }

    if (input.action === 'retry_order') {
      return await handleRetryOrder(supabase, userId, input.orderId, corsHeaders);
    }

    if (input.action === 'update_status') {
      return await handleUpdateStatus(supabase, userId, input, corsHeaders);
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Auto-order processor error:', error);
    
    // Auth errors
    if ((error as Error).message?.includes('Unauthorized') || 
        (error as Error).message?.includes('token')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Create order - SCOPED BY USER ID
 */
async function handleCreateOrder(
  supabase: any,
  userId: string,
  ruleId: string,
  reason?: string,
  corsHeaders: Record<string, string> = {}
) {
  // SECURITY: Verify rule belongs to authenticated user
  const { data: rule, error: ruleError } = await supabase
    .from('auto_order_rules')
    .select('*, catalog_products(*)')
    .eq('id', ruleId)
    .eq('user_id', userId) // CRITICAL: Scope by user
    .single();

  if (ruleError || !rule) {
    return new Response(
      JSON.stringify({ error: 'Rule not found or unauthorized' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!rule.is_enabled) {
    return new Response(
      JSON.stringify({ error: 'Rule is disabled' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Price check
  const currentPrice = rule.catalog_products?.price || 0;
  if (rule.max_price && currentPrice > rule.max_price) {
    console.log(`Price ${currentPrice} exceeds max price ${rule.max_price}`);
    
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'auto_order_skipped',
      entity_type: 'auto_order',
      description: `Commande automatique annulée: prix trop élevé (${currentPrice} > ${rule.max_price})`,
      metadata: { rule_id: ruleId, current_price: currentPrice, max_price: rule.max_price }
    });

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Price exceeds maximum', 
        current_price: currentPrice,
        max_price: rule.max_price
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Create order with authenticated user's ID
  const totalPrice = currentPrice * rule.reorder_quantity;
  
  const { data: order, error: orderError } = await supabase
    .from('auto_orders')
    .insert({
      user_id: userId, // Always use authenticated userId
      product_id: rule.product_id,
      supplier_url: rule.supplier_url,
      order_status: 'pending',
      quantity: rule.reorder_quantity,
      unit_price: currentPrice,
      total_price: totalPrice,
      metadata: {
        rule_id: ruleId,
        trigger_reason: reason || 'manual',
        created_by: 'auto_order_processor'
      }
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // Log event
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'auto_order_created',
    entity_type: 'auto_order',
    entity_id: order.id,
    description: `Commande automatique créée: ${rule.reorder_quantity}x ${rule.catalog_products?.name || 'Product'}`,
    metadata: {
      order_id: order.id,
      quantity: rule.reorder_quantity,
      total_price: totalPrice,
      reason
    }
  });

  // Simulate processing (in production: call supplier API)
  processOrderAsync(supabase, order.id, userId);

  return new Response(
    JSON.stringify({
      success: true,
      order,
      message: 'Auto-order created and processing'
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Retry order - SCOPED BY USER ID
 */
async function handleRetryOrder(
  supabase: any,
  userId: string,
  orderId: string,
  corsHeaders: Record<string, string> = {}
) {
  // SECURITY: Verify order belongs to user
  const { data: order, error: fetchError } = await supabase
    .from('auto_orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', userId) // CRITICAL: Scope by user
    .single();

  if (fetchError || !order) {
    return new Response(
      JSON.stringify({ error: 'Order not found or unauthorized' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (order.retry_count >= order.max_retries) {
    return new Response(
      JSON.stringify({ error: 'Max retries exceeded' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  await supabase
    .from('auto_orders')
    .update({
      order_status: 'pending',
      retry_count: order.retry_count + 1,
      error_message: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .eq('user_id', userId); // Double check

  return new Response(
    JSON.stringify({ success: true, message: 'Order queued for retry' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Update status - SCOPED BY USER ID
 */
async function handleUpdateStatus(
  supabase: any,
  userId: string,
  input: z.infer<typeof UpdateStatusSchema>,
  corsHeaders: Record<string, string> = {}
) {
  // SECURITY: Verify order exists and belongs to user
  const { data: existing } = await supabase
    .from('auto_orders')
    .select('id')
    .eq('id', input.orderId)
    .eq('user_id', userId)
    .single();

  if (!existing) {
    return new Response(
      JSON.stringify({ error: 'Order not found or unauthorized' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const updates: Record<string, any> = {
    order_status: input.status,
    updated_at: new Date().toISOString()
  };

  if (input.trackingNumber) updates.tracking_number = input.trackingNumber;
  if (input.deliveryDate) updates.actual_delivery_date = input.deliveryDate;
  if (input.status === 'delivered') updates.actual_delivery_date = new Date().toISOString();

  await supabase
    .from('auto_orders')
    .update(updates)
    .eq('id', input.orderId)
    .eq('user_id', userId); // CRITICAL: Always scope

  return new Response(
    JSON.stringify({ success: true, message: 'Order status updated' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Async order processing (simulated)
 */
function processOrderAsync(supabase: any, orderId: string, userId: string) {
  setTimeout(async () => {
    try {
      const supplierOrderId = `SO-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const trackingNumber = `TRK${Date.now()}`;
      
      await supabase
        .from('auto_orders')
        .update({
          order_status: 'ordered',
          supplier_order_id: supplierOrderId,
          tracking_number: trackingNumber,
          expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', orderId)
        .eq('user_id', userId); // Always scope

      console.log(`Order ${orderId} placed successfully with supplier`);
    } catch (error) {
      console.error(`Failed to place order ${orderId}:`, error);
      
      await supabase
        .from('auto_orders')
        .update({
          order_status: 'failed',
          error_message: (error as Error).message
        })
        .eq('id', orderId)
        .eq('user_id', userId);
    }
  }, 2000);
}
