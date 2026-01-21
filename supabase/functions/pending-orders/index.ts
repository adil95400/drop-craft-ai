import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    let userId: string

    // Support both JWT and extension tokens
    if (token.startsWith('ext_')) {
      const { data: session } = await supabase
        .from('extension_sessions')
        .select('user_id')
        .eq('token', token)
        .eq('is_active', true)
        .single()
      
      if (!session) {
        return new Response(
          JSON.stringify({ error: 'Invalid extension token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      userId = session.user_id
    } else {
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (error || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      userId = user.id
    }

    // Get pending orders for auto-fulfillment
    // These are orders that need to be placed with suppliers
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        total_amount,
        currency,
        created_at,
        customer_name,
        shipping_address,
        order_items (
          id,
          product_id,
          variant_id,
          quantity,
          unit_price,
          product_name,
          variant_info,
          supplier_url,
          supplier_sku
        )
      `)
      .eq('user_id', userId)
      .in('status', ['pending', 'processing', 'awaiting_fulfillment'])
      .order('created_at', { ascending: false })
      .limit(50)

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch orders' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format orders for auto-order processing
    const pendingOrders = (orders || []).map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      total: order.total_amount,
      currency: order.currency || 'EUR',
      createdAt: order.created_at,
      customerName: order.customer_name,
      shippingAddress: order.shipping_address,
      items: (order.order_items || []).map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        variantId: item.variant_id,
        quantity: item.quantity,
        price: item.unit_price,
        name: item.product_name,
        variant: item.variant_info,
        supplierUrl: item.supplier_url,
        supplierSku: item.supplier_sku
      }))
    }))

    // Also get automation rules for auto-ordering
    const { data: rules } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('trigger_type', 'new_order')
      .eq('action_type', 'auto_fulfill')
      .eq('is_active', true)

    return new Response(
      JSON.stringify({ 
        orders: pendingOrders,
        autoFulfillRules: rules || [],
        total: pendingOrders.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Pending orders error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
