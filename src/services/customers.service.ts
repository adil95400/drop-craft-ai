import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

export class CustomersService {
  /**
   * Récupère tous les clients
   */
  static async getCustomers(userId: string) {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        orders:orders(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Récupère un client par ID
   */
  static async getCustomer(id: string, userId: string) {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        orders:orders(*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Crée un nouveau client
   */
  static async createCustomer(customer: CustomerInsert) {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Met à jour un client
   */
  static async updateCustomer(id: string, userId: string, updates: CustomerUpdate) {
    const { data, error } = await supabase
      .from('customers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Supprime un client
   */
  static async deleteCustomer(id: string, userId: string) {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Recherche de clients
   */
  static async searchCustomers(userId: string, searchTerm: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .or(`email.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Statistiques clients
   */
  static async getCustomerStats(userId: string) {
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, total_spent, total_orders, created_at')
      .eq('user_id', userId);

    if (customersError) throw customersError;

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const customersThisMonth = customers.filter(c => new Date(c.created_at || '') >= thisMonth);
    const customersLastMonth = customers.filter(c => 
      new Date(c.created_at || '') >= lastMonth && new Date(c.created_at || '') < thisMonth
    );

    // Estimate active/inactive based on order history
    const activeCustomers = customers.filter(c => (c.total_orders || 0) > 0);
    const inactiveCustomers = customers.filter(c => (c.total_orders || 0) === 0);

    const stats = {
      total: customers.length,
      active: activeCustomers.length,
      inactive: inactiveCustomers.length,
      totalRevenue: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
      avgOrderValue: customers.length > 0
        ? customers.reduce((sum, c) => sum + (c.total_spent || 0), 0) / 
          Math.max(customers.reduce((sum, c) => sum + (c.total_orders || 0), 0), 1)
        : 0,
      avgLifetimeValue: customers.length > 0
        ? customers.reduce((sum, c) => sum + (c.total_spent || 0), 0) / customers.length
        : 0,
      newCustomersThisMonth: customersThisMonth.length,
      newCustomersLastMonth: customersLastMonth.length,
      topCustomers: customers
        .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
        .slice(0, 10)
    };

    const customerGrowth = stats.newCustomersLastMonth > 0
      ? ((stats.newCustomersThisMonth - stats.newCustomersLastMonth) / stats.newCustomersLastMonth) * 100
      : 0;

    return { ...stats, customerGrowth };
  }

  /**
   * Historique des commandes d'un client
   */
  static async getCustomerOrders(customerId: string, userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Segmentation des clients
   */
  static async segmentCustomers(userId: string) {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    const segments = {
      vip: customers.filter(c => (c.total_spent || 0) > 1000),
      regular: customers.filter(c => (c.total_spent || 0) >= 100 && (c.total_spent || 0) <= 1000),
      new: customers.filter(c => (c.total_orders || 0) < 2),
      inactive: customers.filter(c => (c.total_orders || 0) === 0)
    };

    return segments;
  }

  /**
   * Mise à jour automatique des statistiques client
   */
  static async updateCustomerStats(customerId: string, userId: string) {
    // Récupérer toutes les commandes du client
    const { data: orders, error } = await supabase
      .from('orders')
      .select('total_amount, created_at, status')
      .eq('customer_id', customerId)
      .eq('user_id', userId);

    if (error) throw error;

    const completedOrders = orders.filter(o => 
      o.status === 'delivered' || o.status === 'completed'
    );

    const totalSpent = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const totalOrders = completedOrders.length;

    await this.updateCustomer(customerId, userId, {
      total_spent: totalSpent,
      total_orders: totalOrders
    });
  }
}
