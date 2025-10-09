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
      .from('price_stock_monitoring')
      .select('*, catalog_product:catalog_product_id(*), product:product_id(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createMonitor(userId: string, monitor: {
    product_id?: string;
    catalog_product_id: string;
    check_frequency_minutes?: number;
    price_change_threshold?: number;
    stock_alert_threshold?: number;
    auto_adjust_price?: boolean;
    price_adjustment_rules?: any;
  }) {
    const { data, error } = await supabase
      .from('price_stock_monitoring')
      .insert({
        user_id: userId,
        ...monitor
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateMonitor(monitorId: string, updates: any) {
    const { data, error } = await supabase
      .from('price_stock_monitoring')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', monitorId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteMonitor(monitorId: string) {
    const { error } = await supabase
      .from('price_stock_monitoring')
      .delete()
      .eq('id', monitorId);

    if (error) throw error;
  }

  async checkAllMonitors(userId: string) {
    const { data, error } = await supabase.functions.invoke('price-stock-monitor', {
      body: {
        userId,
        action: 'check_all'
      }
    });

    if (error) throw error;
    return data;
  }

  async checkSingleMonitor(userId: string, monitoringId: string) {
    const { data, error } = await supabase.functions.invoke('price-stock-monitor', {
      body: {
        userId,
        monitoringId,
        action: 'check_single'
      }
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
    let query = supabase
      .from('price_stock_alerts')
      .select('*, monitoring:monitoring_id(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.isRead !== undefined) {
      query = query.eq('is_read', filters.isRead);
    }

    if (filters?.isResolved !== undefined) {
      query = query.eq('is_resolved', filters.isResolved);
    }

    if (filters?.alertType) {
      query = query.eq('alert_type', filters.alertType);
    }

    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async markAlertAsRead(alertId: string) {
    const { error } = await supabase
      .from('price_stock_alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    if (error) throw error;
  }

  async resolveAlert(alertId: string) {
    const { error } = await supabase
      .from('price_stock_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) throw error;
  }
}

export const priceStockMonitorService = PriceStockMonitorService.getInstance();
