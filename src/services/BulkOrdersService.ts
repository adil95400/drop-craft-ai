/**
 * Bulk Orders Service
 * Gestion des commandes groupées multi-fournisseurs
 */
import { supabase } from '@/integrations/supabase/client';

export interface BulkOrder {
  id: string;
  user_id: string;
  order_number: string;
  name?: string;
  status: 'draft' | 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  primary_supplier_id?: string;
  total_items: number;
  total_amount: number;
  currency: string;
  shipping_method?: string;
  shipping_cost: number;
  estimated_delivery_date?: string;
  notes?: string;
  metadata: Record<string, any>;
  submitted_at?: string;
  processed_at?: string;
  shipped_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BulkOrderItem {
  id: string;
  bulk_order_id: string;
  product_id?: string;
  supplier_id?: string;
  product_title: string;
  product_sku?: string;
  variant_info: Record<string, any>;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  tracking_number?: string;
  carrier_code?: string;
  notes?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BulkOrderSupplierGroup {
  id: string;
  bulk_order_id: string;
  supplier_id?: string;
  items_count: number;
  subtotal: number;
  shipping_cost: number;
  status: 'pending' | 'ordered' | 'shipped' | 'delivered';
  supplier_order_number?: string;
  ordered_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateBulkOrderInput {
  name?: string;
  primary_supplier_id?: string;
  notes?: string;
  shipping_method?: string;
}

export interface AddItemInput {
  bulk_order_id: string;
  product_id?: string;
  supplier_id?: string;
  product_title: string;
  product_sku?: string;
  variant_info?: Record<string, any>;
  quantity: number;
  unit_price: number;
  notes?: string;
}

export const BulkOrdersService = {
  // ========== ORDERS ==========

  async getOrders(status?: string): Promise<BulkOrder[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('bulk_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as BulkOrder[];
  },

  async getOrder(orderId: string): Promise<BulkOrder & { items: BulkOrderItem[]; supplier_groups: BulkOrderSupplierGroup[] }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const [orderResult, itemsResult, groupsResult] = await Promise.all([
      supabase
        .from('bulk_orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('bulk_order_items')
        .select('*')
        .eq('bulk_order_id', orderId)
        .order('created_at', { ascending: true }),
      supabase
        .from('bulk_order_supplier_groups')
        .select('*')
        .eq('bulk_order_id', orderId)
    ]);

    if (orderResult.error) throw orderResult.error;

    return {
      ...(orderResult.data as BulkOrder),
      items: (itemsResult.data || []) as BulkOrderItem[],
      supplier_groups: (groupsResult.data || []) as BulkOrderSupplierGroup[]
    };
  },

  async createOrder(input: CreateBulkOrderInput): Promise<BulkOrder> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Generate order number
    const { data: orderNumber, error: numError } = await supabase.rpc('generate_bulk_order_number');
    if (numError) throw numError;

    const { data, error } = await supabase
      .from('bulk_orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        status: 'draft',
        ...input
      })
      .select()
      .single();

    if (error) throw error;
    return data as BulkOrder;
  },

  async updateOrder(orderId: string, updates: Partial<CreateBulkOrderInput & { status: string }>): Promise<BulkOrder> {
    const { data, error } = await supabase
      .from('bulk_orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data as BulkOrder;
  },

  async deleteOrder(orderId: string): Promise<void> {
    const { error } = await supabase
      .from('bulk_orders')
      .delete()
      .eq('id', orderId);

    if (error) throw error;
  },

  async submitOrder(orderId: string): Promise<BulkOrder> {
    const { data, error } = await supabase
      .from('bulk_orders')
      .update({
        status: 'pending',
        submitted_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data as BulkOrder;
  },

  // ========== ITEMS ==========

  async addItem(input: AddItemInput): Promise<BulkOrderItem> {
    const { data, error } = await supabase
      .from('bulk_order_items')
      .insert({
        ...input,
        variant_info: input.variant_info || {}
      })
      .select()
      .single();

    if (error) throw error;

    // Update order totals
    await this.recalculateOrderTotals(input.bulk_order_id);

    return data as BulkOrderItem;
  },

  async addBulkItems(items: AddItemInput[]): Promise<BulkOrderItem[]> {
    if (items.length === 0) return [];

    const { data, error } = await supabase
      .from('bulk_order_items')
      .insert(items.map(item => ({
        ...item,
        variant_info: item.variant_info || {}
      })))
      .select();

    if (error) throw error;

    // Update order totals
    const orderIds = [...new Set(items.map(i => i.bulk_order_id))];
    await Promise.all(orderIds.map(id => this.recalculateOrderTotals(id)));

    return (data || []) as BulkOrderItem[];
  },

  async updateItem(itemId: string, updates: Partial<AddItemInput>): Promise<BulkOrderItem> {
    const { data, error } = await supabase
      .from('bulk_order_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    // Update order totals
    if (data?.bulk_order_id) {
      await this.recalculateOrderTotals(data.bulk_order_id);
    }

    return data as BulkOrderItem;
  },

  async removeItem(itemId: string): Promise<void> {
    // Get item first to know which order to update
    const { data: item } = await supabase
      .from('bulk_order_items')
      .select('bulk_order_id')
      .eq('id', itemId)
      .single();

    const { error } = await supabase
      .from('bulk_order_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    // Update order totals
    if (item?.bulk_order_id) {
      await this.recalculateOrderTotals(item.bulk_order_id);
    }
  },

  async removeItems(itemIds: string[]): Promise<void> {
    // Get items first
    const { data: items } = await supabase
      .from('bulk_order_items')
      .select('bulk_order_id')
      .in('id', itemIds);

    const { error } = await supabase
      .from('bulk_order_items')
      .delete()
      .in('id', itemIds);

    if (error) throw error;

    // Update order totals
    const orderIds = [...new Set((items || []).map(i => i.bulk_order_id))];
    await Promise.all(orderIds.map(id => this.recalculateOrderTotals(id)));
  },

  // ========== HELPERS ==========

  async recalculateOrderTotals(orderId: string): Promise<void> {
    // Get all items for this order
    const { data: items } = await supabase
      .from('bulk_order_items')
      .select('quantity, unit_price')
      .eq('bulk_order_id', orderId);

    const totalItems = (items || []).reduce((sum, i) => sum + i.quantity, 0);
    const totalAmount = (items || []).reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);

    await supabase
      .from('bulk_orders')
      .update({
        total_items: totalItems,
        total_amount: totalAmount
      })
      .eq('id', orderId);
  },

  async getStats(): Promise<{
    total_orders: number;
    draft_orders: number;
    pending_orders: number;
    total_items: number;
    total_value: number;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: orders } = await supabase
      .from('bulk_orders')
      .select('status, total_items, total_amount')
      .eq('user_id', user.id);

    const allOrders = orders || [];

    return {
      total_orders: allOrders.length,
      draft_orders: allOrders.filter(o => o.status === 'draft').length,
      pending_orders: allOrders.filter(o => o.status === 'pending').length,
      total_items: allOrders.reduce((sum, o) => sum + (o.total_items || 0), 0),
      total_value: allOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount as any) || 0), 0)
    };
  },

  // Group items by supplier
  groupItemsBySupplier(items: BulkOrderItem[]): Map<string | null, BulkOrderItem[]> {
    const groups = new Map<string | null, BulkOrderItem[]>();
    
    items.forEach(item => {
      const supplierId = item.supplier_id || null;
      const existing = groups.get(supplierId) || [];
      groups.set(supplierId, [...existing, item]);
    });

    return groups;
  }
};
