/**
 * Pending Orders — SECURED (JWT-first, RLS-enforced)
 */

import { requireAuth, handlePreflight, successResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id, order_number, status, total_amount, currency, created_at,
        customer_name, shipping_address,
        order_items (
          id, product_id, variant_id, quantity, unit_price,
          product_name, variant_info, supplier_url, supplier_sku
        )
      `)
      .eq('user_id', userId)
      .in('status', ['pending', 'processing', 'awaiting_fulfillment'])
      .order('created_at', { ascending: false })
      .limit(50)

    if (ordersError) throw ordersError

    const pendingOrders = (orders || []).map((order: any) => ({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      total: order.total_amount,
      currency: order.currency || 'EUR',
      createdAt: order.created_at,
      customerName: order.customer_name,
      shippingAddress: order.shipping_address,
      items: (order.order_items || []).map((item: any) => ({
        id: item.id, productId: item.product_id, variantId: item.variant_id,
        quantity: item.quantity, price: item.unit_price, name: item.product_name,
        variant: item.variant_info, supplierUrl: item.supplier_url, supplierSku: item.supplier_sku
      }))
    }))

    const { data: rules } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('trigger_type', 'new_order')
      .eq('action_type', 'auto_fulfill')
      .eq('is_active', true)

    return successResponse({
      orders: pendingOrders,
      autoFulfillRules: rules || [],
      total: pendingOrders.length
    }, corsHeaders)

  } catch (err) {
    if (err instanceof Response) return err
    console.error('[pending-orders] Error:', err)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur interne' }),
      { status: 500, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})
