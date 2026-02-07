import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type OrderUpdate = Database['public']['Tables']['orders']['Update'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];
type OrderItemInsert = Database['public']['Tables']['order_items']['Insert'];

export class OrdersService {
  /**
   * Récupère toutes les commandes
   */
  static async getOrders(userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        order_items(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Récupère une commande par ID avec ses items
   */
  static async getOrder(id: string, userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        order_items(
          *,
          product:products(*)
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Crée une nouvelle commande
   */
  static async createOrder(userId: string, orderData: any, items?: any[]) {
    const orderNumber = orderData.order_number || `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const shippingAddress = orderData.shipping_address || {};
    if (orderData.customer_name) shippingAddress.name = orderData.customer_name;
    if (orderData.customer_email) shippingAddress.email = orderData.customer_email;

    const order: OrderInsert = {
      user_id: userId,
      order_number: orderNumber,
      customer_id: orderData.customer_id || null,
      customer_name: orderData.customer_name || null,
      customer_email: orderData.customer_email || null,
      status: orderData.status || 'pending',
      payment_status: orderData.payment_status || 'pending',
      subtotal: orderData.subtotal || 0,
      shipping_cost: orderData.shipping_cost || 0,
      total_amount: orderData.total_amount || 0,
      shipping_address: Object.keys(shippingAddress).length > 0 ? shippingAddress : null,
      carrier: orderData.carrier || null,
      notes: orderData.notes || null,
      currency: orderData.currency || 'EUR',
    };

    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items if provided
    if (items && items.length > 0) {
      const orderItems: OrderItemInsert[] = items.map(item => ({
        order_id: newOrder.id,
        product_id: item.product_id || null,
        product_name: item.product_name || 'Produit',
        product_sku: item.product_sku || null,
        qty: item.quantity || item.qty || 1,
        unit_price: item.unit_price || item.price || 0,
        total_price: (item.quantity || item.qty || 1) * (item.unit_price || item.price || 0),
        variant_title: item.variant_title || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;
    }

    return newOrder;
  }

  /**
   * Met à jour une commande
   */
  static async updateOrder(id: string, userId: string, updates: OrderUpdate) {
    const { data, error } = await supabase
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Met à jour le statut d'une commande
   */
  static async updateOrderStatus(id: string, userId: string, status: string) {
    return this.updateOrder(id, userId, { status });
  }

  /**
   * Met à jour le fulfillment (tracking, carrier)
   */
  static async updateFulfillment(id: string, userId: string, data: {
    fulfillment_status?: string;
    tracking_number?: string;
    tracking_url?: string;
    carrier?: string;
    supplier_order_id?: string;
  }) {
    return this.updateOrder(id, userId, {
      fulfillment_status: data.fulfillment_status,
      tracking_number: data.tracking_number,
      tracking_url: data.tracking_url,
      carrier: data.carrier,
      supplier_order_id: data.supplier_order_id,
    });
  }

  /**
   * Supprime une commande
   */
  static async deleteOrder(id: string, userId: string) {
    await supabase.from('order_items').delete().eq('order_id', id);

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Statistiques commandes
   */
  static async getOrderStats(userId: string) {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('total_amount, status, payment_status, fulfillment_status, created_at')
      .eq('user_id', userId);

    if (error) throw error;

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const ordersThisMonth = orders.filter(o => new Date(o.created_at!) >= thisMonth);
    const ordersLastMonth = orders.filter(o =>
      new Date(o.created_at!) >= lastMonth && new Date(o.created_at!) < thisMonth
    );

    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      toFulfill: orders.filter(o => o.fulfillment_status === null || o.fulfillment_status === 'unfulfilled').length,
      paid: orders.filter(o => o.payment_status === 'paid').length,
      revenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
      avgOrderValue: orders.length > 0
        ? orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / orders.length
        : 0,
      revenueThisMonth: ordersThisMonth.reduce((sum, o) => sum + (o.total_amount || 0), 0),
      revenueLastMonth: ordersLastMonth.reduce((sum, o) => sum + (o.total_amount || 0), 0),
      ordersThisMonth: ordersThisMonth.length,
      ordersLastMonth: ordersLastMonth.length
    };

    const revenueGrowth = stats.revenueLastMonth > 0
      ? ((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth) * 100
      : 0;

    const ordersGrowth = stats.ordersLastMonth > 0
      ? ((stats.ordersThisMonth - stats.ordersLastMonth) / stats.ordersLastMonth) * 100
      : 0;

    return { ...stats, revenueGrowth, ordersGrowth };
  }

  /**
   * Recherche de commandes
   */
  static async searchOrders(userId: string, searchTerm: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, customer:customers(*), order_items(*)`)
      .eq('user_id', userId)
      .or(`order_number.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,tracking_number.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Filtrer par statut
   */
  static async filterByStatus(userId: string, status: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, customer:customers(*), order_items(*)`)
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Commandes par période
   */
  static async getOrdersByPeriod(userId: string, startDate: Date, endDate: Date) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}
