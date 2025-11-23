import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticateUser } from '../_shared/secure-auth.ts'
import { secureUpdate, secureDelete } from '../_shared/db-helpers.ts'
import { handleError, ValidationError } from '../_shared/error-handler.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  console.log('Order Management Function called:', req.method, req.url)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { user } = await authenticateUser(req, supabase)
    
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'list'
    
    console.log(`Order management action: ${action}`)

    switch (action) {
      case 'list':
        return await listOrders(supabase, user.id, req)
      
      case 'get':
        return await getOrder(supabase, user.id, req)
      
      case 'create':
        return await createOrder(supabase, user.id, req)
      
      case 'update':
        return await updateOrder(supabase, user.id, req)
      
      case 'delete':
        return await deleteOrder(supabase, user.id, req)
      
      case 'update_status':
        return await updateOrderStatus(supabase, user.id, req)
      
      case 'bulk_update':
        return await bulkUpdateOrders(supabase, user.id, req)
      
      case 'export':
        return await exportOrders(supabase, user.id, req)
      
      case 'stats':
        return await getOrderStats(supabase, user.id)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in order-management:', error)
    return handleError(error, corsHeaders)
  }
})

async function listOrders(supabase: any, userId: string, req: Request) {
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const offset = parseInt(url.searchParams.get('offset') || '0')
  const search = url.searchParams.get('search')

  let query = supabase
    .from('orders')
    .select('*, customer:customers(name, email)', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`order_number.ilike.%${search}%,customer_id.ilike.%${search}%`)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error listing orders:', error)
    throw error
  }

  // Log activity
  await supabase
    .from('activity_logs')
    .insert({
      user_id: userId,
      action: 'orders_list',
      description: `Listed ${data?.length || 0} orders`,
      entity_type: 'order',
      metadata: { status, limit, offset, search }
    })

  return new Response(
    JSON.stringify({
      success: true,
      orders: data,
      total: count,
      limit,
      offset
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getOrder(supabase: any, userId: string, req: Request) {
  const url = new URL(req.url)
  const orderId = url.searchParams.get('id')

  if (!orderId) {
    throw new ValidationError('Order ID is required')
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*, customer:customers(*), items:order_items(*)')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error getting order:', error)
    throw error
  }

  if (!data) {
    throw new ValidationError('Order not found')
  }

  return new Response(
    JSON.stringify({
      success: true,
      order: data
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createOrder(supabase: any, userId: string, req: Request) {
  const body = await req.json()
  const {
    customer_id,
    items,
    shipping_address,
    billing_address,
    payment_method,
    notes
  } = body

  // Validate required fields
  if (!customer_id || !items || items.length === 0) {
    throw new ValidationError('Customer ID and items are required')
  }

  // Calculate totals
  let subtotal = 0
  let tax = 0
  let shipping = 0

  for (const item of items) {
    const itemTotal = item.price * item.quantity
    subtotal += itemTotal
  }

  tax = subtotal * 0.20 // 20% TVA
  shipping = subtotal > 100 ? 0 : 9.99 // Free shipping over 100€
  const total = subtotal + tax + shipping

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      customer_id,
      order_number: orderNumber,
      status: 'pending',
      payment_status: 'pending',
      subtotal,
      tax,
      shipping_cost: shipping,
      total_amount: total,
      currency: 'EUR',
      shipping_address,
      billing_address,
      payment_method,
      notes,
      order_date: new Date().toISOString()
    })
    .select()
    .single()

  if (orderError) {
    console.error('Error creating order:', orderError)
    throw orderError
  }

  // Create order items
  const orderItems = items.map((item: any) => ({
    order_id: order.id,
    user_id: userId,
    product_id: item.product_id,
    product_name: item.name,
    quantity: item.quantity,
    unit_price: item.price,
    total_price: item.price * item.quantity,
    sku: item.sku
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    console.error('Error creating order items:', itemsError)
    // Rollback order
    await supabase.from('orders').delete().eq('id', order.id)
    throw itemsError
  }

  // Update customer stats
  await supabase
    .from('customers')
    .update({
      total_orders: supabase.raw('total_orders + 1'),
      total_spent: supabase.raw(`total_spent + ${total}`),
      last_order_date: new Date().toISOString()
    })
    .eq('id', customer_id)

  // Log activity
  await supabase
    .from('activity_logs')
    .insert({
      user_id: userId,
      action: 'order_created',
      description: `Created order ${orderNumber}`,
      entity_type: 'order',
      entity_id: order.id,
      metadata: {
        order_number: orderNumber,
        total_amount: total,
        items_count: items.length
      }
    })

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Order created successfully',
      order
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateOrder(supabase: any, userId: string, req: Request) {
  const body = await req.json()
  const { order_id, updates } = body

  if (!order_id) {
    throw new ValidationError('Order ID is required')
  }

  // Remove protected fields
  delete updates.id
  delete updates.user_id
  delete updates.created_at

  updates.updated_at = new Date().toISOString()

  const { data, error } = await secureUpdate(
    supabase,
    'orders',
    order_id,
    updates,
    userId
  )

  if (error) {
    console.error('Error updating order:', error)
    throw error
  }

  // Log activity
  await supabase
    .from('activity_logs')
    .insert({
      user_id: userId,
      action: 'order_updated',
      description: `Updated order ${order_id}`,
      entity_type: 'order',
      entity_id: order_id,
      metadata: { updates }
    })

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Order updated successfully',
      order: data
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deleteOrder(supabase: any, userId: string, req: Request) {
  const url = new URL(req.url)
  const orderId = url.searchParams.get('id')

  if (!orderId) {
    throw new ValidationError('Order ID is required')
  }

  // Delete order items first
  await supabase
    .from('order_items')
    .delete()
    .eq('order_id', orderId)

  // Delete order
  await secureDelete(supabase, 'orders', orderId, userId)

  // Log activity
  await supabase
    .from('activity_logs')
    .insert({
      user_id: userId,
      action: 'order_deleted',
      description: `Deleted order ${orderId}`,
      entity_type: 'order',
      entity_id: orderId
    })

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Order deleted successfully'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateOrderStatus(supabase: any, userId: string, req: Request) {
  const body = await req.json()
  const { order_id, status, tracking_number } = body

  if (!order_id || !status) {
    throw new ValidationError('Order ID and status are required')
  }

  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
  if (!validStatuses.includes(status)) {
    throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
  }

  const updates: any = {
    status,
    updated_at: new Date().toISOString()
  }

  if (status === 'shipped' && tracking_number) {
    updates.tracking_number = tracking_number
    updates.shipped_at = new Date().toISOString()
  }

  if (status === 'delivered') {
    updates.delivered_at = new Date().toISOString()
  }

  const { data, error } = await secureUpdate(
    supabase,
    'orders',
    order_id,
    updates,
    userId
  )

  if (error) {
    console.error('Error updating order status:', error)
    throw error
  }

  // Log activity
  await supabase
    .from('activity_logs')
    .insert({
      user_id: userId,
      action: 'order_status_updated',
      description: `Updated order status to ${status}`,
      entity_type: 'order',
      entity_id: order_id,
      metadata: { status, tracking_number }
    })

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Order status updated successfully',
      order: data
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function bulkUpdateOrders(supabase: any, userId: string, req: Request) {
  const body = await req.json()
  const { order_ids, updates } = body

  if (!order_ids || order_ids.length === 0) {
    throw new ValidationError('Order IDs are required')
  }

  const results = {
    success: [] as string[],
    errors: [] as { id: string; error: string }[]
  }

  for (const orderId of order_ids) {
    try {
      await secureUpdate(supabase, 'orders', orderId, updates, userId)
      results.success.push(orderId)
    } catch (error) {
      results.errors.push({
        id: orderId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Updated ${results.success.length}/${order_ids.length} orders`,
      results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function exportOrders(supabase: any, userId: string, req: Request) {
  const url = new URL(req.url)
  const format = url.searchParams.get('format') || 'csv'
  const status = url.searchParams.get('status')

  let query = supabase
    .from('orders')
    .select('*, customer:customers(name, email)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error exporting orders:', error)
    throw error
  }

  if (format === 'csv') {
    const csv = convertToCSV(data)
    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="orders_${Date.now()}.csv"`
      }
    })
  } else {
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="orders_${Date.now()}.json"`
      }
    })
  }
}

async function getOrderStats(supabase: any, userId: string) {
  // Get orders from last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo)

  if (error) {
    console.error('Error getting order stats:', error)
    throw error
  }

  const stats = {
    total_orders: orders?.length || 0,
    total_revenue: orders?.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0,
    avg_order_value: orders?.length > 0 
      ? orders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) / orders.length 
      : 0,
    by_status: {
      pending: orders?.filter((o: any) => o.status === 'pending').length || 0,
      processing: orders?.filter((o: any) => o.status === 'processing').length || 0,
      shipped: orders?.filter((o: any) => o.status === 'shipped').length || 0,
      delivered: orders?.filter((o: any) => o.status === 'delivered').length || 0,
      cancelled: orders?.filter((o: any) => o.status === 'cancelled').length || 0
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      stats
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''

  const headers = ['Order Number', 'Customer', 'Status', 'Total', 'Date']
  const rows = data.map(order => [
    order.order_number,
    order.customer?.name || 'N/A',
    order.status,
    `${order.total_amount} ${order.currency}`,
    new Date(order.created_at).toLocaleDateString()
  ])

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
}
