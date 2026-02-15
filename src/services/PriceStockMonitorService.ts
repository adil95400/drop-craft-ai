import { supabase } from "@/integrations/supabase/client";

export class PriceStockMonitorService {
  private static instance: PriceStockMonitorService;

  static getInstance(): PriceStockMonitorService {
    if (!PriceStockMonitorService.instance) {
      PriceStockMonitorService.instance = new PriceStockMonitorService();
    }
    return PriceStockMonitorService.instance;
  }

  async getMonitors(userId: string) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku, price, cost_price, stock_quantity, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createMonitor(userId: string, monitor: {
    product_id?: string;
    catalog_product_id?: string;
    check_frequency_minutes?: number;
    price_change_threshold?: number;
    stock_alert_threshold?: number;
    auto_adjust_price?: boolean;
    price_adjustment_rules?: any;
  }) {
    // Monitors are now tracked via products table directly
    return { id: monitor.product_id, user_id: userId };
  }

  async updateMonitor(monitorId: string, updates: any) {
    return { id: monitorId, ...updates };
  }

  async deleteMonitor(monitorId: string) {
    // No-op since monitoring is now product-level
  }

  async checkAllMonitors(userId: string) {
    const { data, error } = await supabase.functions.invoke('price-stock-monitor', {
      body: { userId, action: 'check_all' }
    });
    if (error) throw error;
    return data;
  }

  async checkSingleMonitor(userId: string, monitoringId: string) {
    const { data, error } = await supabase.functions.invoke('price-stock-monitor', {
      body: { userId, monitoringId, action: 'check_single' }
    });
    if (error) throw error;
    return data;
  }

  async getAlerts(userId: string, filters?: {
    isRead?: boolean;
    isResolved?: boolean;
    alertType?: string;
    severity?: string;
    limit?: number;
  }) {
    let query = (supabase
      .from('active_alerts') as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.severity) query = query.eq('severity', filters.severity);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async markAlertAsRead(alertId: string) {
    const { error } = await supabase
      .from('active_alerts')
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq('id', alertId);
    if (error) throw error;
  }

  async resolveAlert(alertId: string) {
    const { error } = await supabase
      .from('active_alerts')
      .update({ status: 'resolved' })
      .eq('id', alertId);
    if (error) throw error;
  }
}

export const priceStockMonitorService = PriceStockMonitorService.getInstance();
