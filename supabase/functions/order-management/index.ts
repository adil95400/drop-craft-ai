import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { requireAuth, handlePreflight, errorResponse } from '../_shared/jwt-auth.ts'

serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)
    
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'list'
    
    console.log(`[SECURE] Order management action: ${action} by user ${userId}`)

    switch (action) {
      case 'list':
        return await listOrders(supabase, userId, req, corsHeaders)
      
      case 'get':
        return await getOrder(supabase, userId, req, corsHeaders)
      
      case 'create':
        return await createOrder(supabase, userId, req, corsHeaders)
      
      case 'update':
        return await updateOrder(supabase, userId, req, corsHeaders)
      
      case 'delete':
        return await deleteOrder(supabase, userId, req, corsHeaders)
      
      case 'update_status':
        return await updateOrderStatus(supabase, userId, req, corsHeaders)
      
      case 'bulk_update':
        return await bulkUpdateOrders(supabase, userId, req, corsHeaders)
      
      case 'export':
        return await exportOrders(supabase, userId, req, corsHeaders)
      
      case 'stats':
        return await getOrderStats(supabase, userId, corsHeaders)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Error in order-management:', error)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function listOrders(supabase: any, userId: string, req: Request, corsHeaders: Record<string, string>) {
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const offset = parseInt(url.searchParams.get('offset') || '0')
  const search = url.searchParams.get('search')

  // SECURE: Always scope to user_id
  let query = supabase
    .from('orders')
    .select('*, customer:customers(name, email)', { count: 'exact' })
    .eq('user_id', userId) // CRITICAL: scope to user
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`order_number.ilike.%${search}%`)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error listing orders:', error)
    throw error
  }

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

async function getOrder(supabase: any, userId: string, req: Request, corsHeaders: Record<string, string>) {
  const url = new URL(req.url)
  const orderId = url.searchParams.get('id')

  if (!orderId) {
    throw new ValidationError('Order ID is required')
  }

  // SECURE: scope to user_id
  const { data, error } = await supabase
    .from('orders')
    .select('*, customer:customers(*), items:order_items(*)')
    .eq('id', orderId)
    .eq('user_id', userId) // CRITICAL: scope to user
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

async function createOrder(supabase: any, userId: string, req: Request, corsHeaders: Record<string, string>) {
  const body = await req.json()
  const {
    customer_id,
    items,
    shipping_address,
    billing_address,
    payment_method,
    notes
  } = body

  if (!customer_id || !items || items.length === 0) {
    throw new ValidationError('Customer ID and items are required')
  }

  // SECURITY: Verify customer belongs to user
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('id', customer_id)
    .eq('user_id', userId) // CRITICAL: verify ownership
    .single()

  if (customerError || !customer) {
    throw new ValidationError('Customer not found or unauthorized')
  }

  // Calculate totals
  let subtotal = 0
  for (const item of items) {
    subtotal += item.price * item.quantity
  }

  const tax = subtotal * 0.20
  const shipping = subtotal > 100 ? 0 : 9.99
  const total = subtotal + tax + shipping

  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

  // Create order - SECURE: user_id from token only
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId, // CRITICAL: from token only
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

  // Create order items - SECURE: user_id from token only
  const orderItems = items.map((item: any) => ({
    order_id: order.id,
    user_id: userId, // CRITICAL: from token only
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
    await supabase.from('orders').delete().eq('id', order.id).eq('user_id', userId)
    throw itemsError
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'order_created',
    description: `Created order ${orderNumber}`,
    entity_type: 'order',
    entity_id: order.id,
    metadata: { order_number: orderNumber, total_amount: total, items_count: items.length }
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

async function updateOrder(supabase: any, userId: string, req: Request, corsHeaders: Record<string, string>) {
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

  // SECURE: secureUpdate verifies user_id
  const { data, error } = await secureUpdate(supabase, 'orders', order_id, updates, userId)

  if (error) {
    console.error('Error updating order:', error)
    throw error
  }

  await supabase.from('activity_logs').insert({
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

async function deleteOrder(supabase: any, userId: string, req: Request, corsHeaders: Record<string, string>) {
  const url = new URL(req.url)
  const orderId = url.searchParams.get('id')

  if (!orderId) {
    throw new ValidationError('Order ID is required')
  }

  // Delete order items first - SCOPED to user
  await supabase
    .from('order_items')
    .delete()
    .eq('order_id', orderId)
    .eq('user_id', userId) // CRITICAL: scope to user

  // SECURE: secureDelete verifies user_id
  await secureDelete(supabase, 'orders', orderId, userId)

  await supabase.from('activity_logs').insert({
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

async function updateOrderStatus(supabase: any, userId: string, req: Request, corsHeaders: Record<string, string>) {
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

  // SECURE: secureUpdate verifies user_id
  const { data, error } = await secureUpdate(supabase, 'orders', order_id, updates, userId)

  if (error) {
    console.error('Error updating order status:', error)
    throw error
  }

  await supabase.from('activity_logs').insert({
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

async function bulkUpdateOrders(supabase: any, userId: string, req: Request, corsHeaders: Record<string, string>) {
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
      // SECURE: secureUpdate verifies user_id
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

async function exportOrders(supabase: any, userId: string, req: Request, corsHeaders: Record<string, string>) {
  const url = new URL(req.url)
  const format = url.searchParams.get('format') || 'csv'
  const status = url.searchParams.get('status')

  // SECURE: Always scope to user_id
  let query = supabase
    .from('orders')
    .select('*, customer:customers(name, email)')
    .eq('user_id', userId) // CRITICAL: scope to user
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

async function getOrderStats(supabase: any, userId: string, corsHeaders: Record<string, string>) {
  // SECURE: All queries scoped to user_id
  const { data: orders, error } = await supabase
    .from('orders')
    .select('status, total_amount, created_at')
    .eq('user_id', userId) // CRITICAL: scope to user

  if (error) throw error

  const stats = {
    total_orders: orders?.length || 0,
    total_revenue: orders?.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0,
    by_status: {} as Record<string, number>,
    recent_30_days: 0
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  orders?.forEach((order: any) => {
    stats.by_status[order.status] = (stats.by_status[order.status] || 0) + 1
    if (new Date(order.created_at) > thirtyDaysAgo) {
      stats.recent_30_days++
    }
  })

  return new Response(
    JSON.stringify({ success: true, stats }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        if (value === null || value === undefined) return ''
        const str = typeof value === 'object' ? JSON.stringify(value) : String(value)
        return str.includes(',') || str.includes('"') 
          ? `"${str.replace(/"/g, '""')}"` 
          : str
      }).join(',')
    )
  ]
  return csvRows.join('\n')
}
