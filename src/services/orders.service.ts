/**
 * OrdersService — Resilient data access with direct Supabase queries
 * Replaces broken API V1 proxy (/v1/orders not implemented) with direct DB access.
 */
import { supabase } from '@/integrations/supabase/client'

export class OrdersService {
  static async getOrders(userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) { console.warn('OrdersService.getOrders error:', error); return [] }
    return data ?? []
  }

  static async getOrder(id: string, userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    if (error) throw error
    return data
  }

  static async createOrder(userId: string, orderData: any, items?: any[]) {
    const { data, error } = await supabase
      .from('orders')
      .insert({ ...orderData, user_id: userId })
      .select()
      .single()
    if (error) throw error

    if (items?.length && data) {
      await supabase.from('order_items').insert(
        items.map(item => ({ ...item, order_id: data.id }))
      )
    }
    return data
  }

  static async updateOrder(id: string, userId: string, updates: any) {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async updateOrderStatus(id: string, userId: string, status: string) {
    return this.updateOrder(id, userId, { status })
  }

  static async updateFulfillment(id: string, userId: string, data: {
    fulfillment_status?: string
    tracking_number?: string
    tracking_url?: string
    carrier?: string
    supplier_order_id?: string
  }) {
    return this.updateOrder(id, userId, data)
  }

  static async deleteOrder(id: string, userId: string) {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
  }

  static async getOrderStats(userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('status, total_amount, payment_status')
      .eq('user_id', userId)

    if (error) { console.warn('OrdersService.getOrderStats error:', error); return { total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, revenue: 0 } }

    const orders = data ?? []
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      revenue: orders.reduce((s, o) => s + (o.total_amount || 0), 0),
    }
  }

  static async searchOrders(userId: string, searchTerm: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .or(`order_number.ilike.%${searchTerm}%,tracking_number.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) { console.warn('OrdersService.searchOrders error:', error); return [] }
    return data ?? []
  }

  static async filterByStatus(userId: string, status: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) return []
    return data ?? []
  }

  static async getOrdersByPeriod(userId: string, startDate: Date, endDate: Date) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) return []
    return data ?? []
  }
}
