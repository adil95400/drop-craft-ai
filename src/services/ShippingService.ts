import { supabase } from '@/integrations/supabase/client';

export class ShippingService {
  // Shipping Zones
  static async getShippingZones() {
    const { data, error } = await supabase
      .from('shipping_zones' as any)
      .select('*')
      .order('priority', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  static async createShippingZone(zone: any) {
    const { data, error } = await supabase
      .from('shipping_zones' as any)
      .insert(zone)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateShippingZone(id: string, updates: any) {
    const { data, error } = await supabase
      .from('shipping_zones' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteShippingZone(id: string) {
    const { error } = await supabase
      .from('shipping_zones' as any)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Warehouses
  static async getWarehouses() {
    const { data, error } = await supabase
      .from('warehouses' as any)
      .select('*')
      .order('is_active', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async createWarehouse(warehouse: any) {
    const { data, error } = await supabase
      .from('warehouses' as any)
      .insert(warehouse)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateWarehouse(id: string, updates: any) {
    const { data, error } = await supabase
      .from('warehouses' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteWarehouse(id: string) {
    const { error } = await supabase
      .from('warehouses' as any)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Shipping Rates
  static async getShippingRates(zoneId?: string) {
    let query = supabase.from('shipping_rates' as any).select('*');
    
    if (zoneId) {
      query = query.eq('zone_id', zoneId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async createShippingRate(rate: any) {
    const { data, error } = await supabase
      .from('shipping_rates' as any)
      .insert(rate)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateShippingRate(id: string, updates: any) {
    const { data, error } = await supabase
      .from('shipping_rates' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteShippingRate(id: string) {
    const { error } = await supabase
      .from('shipping_rates' as any)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Calculate Shipping
  static async calculateShipping(params: any) {
    const { data, error } = await supabase.functions.invoke('shipping-rate-calculator', {
      body: params
    });
    
    if (error) throw error;
    return data;
  }

  // Shipment Tracking
  static async getShipments(filters?: any) {
    let query = supabase
      .from('shipment_tracking' as any)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.order_id) {
      query = query.eq('order_id', filters.order_id);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async generateTracking(params: any) {
    const { data, error } = await supabase.functions.invoke('tracking-automation', {
      body: {
        action: 'generate_tracking',
        ...params
      }
    });
    
    if (error) throw error;
    return data;
  }

  static async updateTracking(params: any) {
    const { data, error } = await supabase.functions.invoke('tracking-automation', {
      body: {
        action: 'update_tracking',
        ...params
      }
    });
    
    if (error) throw error;
    return data;
  }

  static async bulkGenerateTracking(params: any) {
    const { data, error } = await supabase.functions.invoke('tracking-automation', {
      body: {
        action: 'bulk_generate',
        ...params
      }
    });
    
    if (error) throw error;
    return data;
  }

  // Analytics
  static async getShippingAnalytics() {
    const { data: shipments } = await supabase
      .from('shipment_tracking' as any)
      .select('*');

    const total = shipments?.length || 0;
    const pending = shipments?.filter((s: any) => s.status === 'pending').length || 0;
    const in_transit = shipments?.filter((s: any) => s.status === 'in_transit').length || 0;
    const delivered = shipments?.filter((s: any) => s.status === 'delivered').length || 0;
    
    const totalCost = shipments?.reduce((sum: number, s: any) => sum + (s.shipping_cost || 0), 0) || 0;
    const avgCost = total > 0 ? totalCost / total : 0;

    return {
      total_shipments: total,
      pending_shipments: pending,
      in_transit: in_transit,
      delivered_shipments: delivered,
      total_shipping_cost: totalCost,
      average_shipping_cost: avgCost,
      delivery_rate: total > 0 ? (delivered / total) * 100 : 0
    };
  }
}
