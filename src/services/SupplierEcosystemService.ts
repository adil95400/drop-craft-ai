// ============================================
// SHOPOPTI SUPPLIER ECOSYSTEM SERVICE
// Professional service layer for supplier management
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type {
  SupplierConnection,
  SupplierPricingRule,
  SupplierOrder,
  SupplierAnalytics,
  SupplierWebhook,
  SupplierExtended,
  SupplierHealthScore,
  ConnectSupplierRequest,
  ConnectSupplierResponse,
  PlaceOrderRequest,
  PlaceOrderResponse,
  SyncProductsRequest,
  SyncProductsResponse,
  GetAnalyticsRequest,
  GetAnalyticsResponse,
} from '@/types/supplier-ecosystem';

export class SupplierEcosystemService {
  private static instance: SupplierEcosystemService;

  static getInstance(): SupplierEcosystemService {
    if (!SupplierEcosystemService.instance) {
      SupplierEcosystemService.instance = new SupplierEcosystemService();
    }
    return SupplierEcosystemService.instance;
  }

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  async connectSupplier(request: ConnectSupplierRequest): Promise<ConnectSupplierResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('supplier-connect-advanced', {
        body: request,
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to connect supplier:', error);
      throw error;
    }
  }

  async disconnectSupplier(supplierId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('supplier_credentials_vault')
      .update({ connection_status: 'revoked' })
      .eq('supplier_id', supplierId)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  async testConnection(supplierId: string, credentials?: any): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('supplier-test-connection', {
        body: { supplierId, credentials },
      });

      if (error) throw error;

      return data.success;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async getConnectionStatus(supplierId: string): Promise<SupplierConnection | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('supplier_credentials_vault')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      supplier_id: data.supplier_id,
      connection_type: data.connection_type as any,
      connection_status: data.connection_status as any,
      last_validation_at: data.last_validation_at,
      last_error: data.last_error,
      error_count: data.error_count,
      is_healthy: data.connection_status === 'active' && data.error_count < 3,
      expires_at: data.expires_at,
    };
  }

  // ============================================
  // PRICING MANAGEMENT
  // ============================================

  async createPricingRule(rule: Partial<SupplierPricingRule>): Promise<SupplierPricingRule> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('supplier_pricing_rules')
      .insert({ ...rule, user_id: user.id } as any)
      .select()
      .single();

    if (error) throw error;

    return data as any;
  }

  async updatePricingRule(id: string, updates: Partial<SupplierPricingRule>): Promise<SupplierPricingRule> {
    const { data, error } = await supabase
      .from('supplier_pricing_rules')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data as any;
  }

  async getPricingRules(supplierId: string): Promise<SupplierPricingRule[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('supplier_pricing_rules')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) throw error;

    return (data || []) as any;
  }

  calculatePrice(costPrice: number, rule: SupplierPricingRule, category?: string): number {
    // Category override
    if (category && rule.category_overrides?.[category]) {
      const override = rule.category_overrides[category];
      if (override.markup) {
        const price = costPrice * (1 + override.markup / 100);
        if (override.min_price && price < override.min_price) return override.min_price;
        if (override.max_price && price > override.max_price) return override.max_price;
        return price;
      }
    }

    // Apply pricing strategy
    switch (rule.pricing_type) {
      case 'fixed_markup':
        return costPrice + (rule.fixed_markup_amount || 0);

      case 'percentage_markup':
        return costPrice * (1 + (rule.percentage_markup || 0) / 100);

      case 'target_margin': {
        const targetMargin = rule.target_margin_percent || 0;
        const price = costPrice / (1 - targetMargin / 100);
        if (rule.min_price && price < rule.min_price) return rule.min_price;
        if (rule.max_price && price > rule.max_price) return rule.max_price;
        return price;
      }

      case 'tiered': {
        const tier = rule.price_tiers?.find(
          (t) => costPrice >= t.min_cost && costPrice <= t.max_cost
        );
        if (tier) {
          return costPrice * (1 + tier.markup / 100);
        }
        return costPrice;
      }

      default:
        return costPrice;
    }
  }

  // ============================================
  // ORDER MANAGEMENT (Auto-fulfillment)
  // ============================================

  async placeOrder(request: PlaceOrderRequest): Promise<PlaceOrderResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('supplier-place-order', {
        body: request,
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to place order:', error);
      throw error;
    }
  }

  async getOrder(orderId: string): Promise<SupplierOrder | null> {
    const { data, error } = await supabase
      .from('supplier_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) return null;

    return data as any;
  }

  async getSupplierOrders(supplierId: string, limit = 50): Promise<SupplierOrder[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('supplier_orders')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('user_id', user.id)
      .order('placed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []) as any;
  }

  async updateOrderTracking(
    orderId: string,
    tracking: { tracking_number?: string; tracking_url?: string; carrier?: string }
  ): Promise<void> {
    const { error } = await supabase
      .from('supplier_orders')
      .update(tracking)
      .eq('id', orderId);

    if (error) throw error;
  }

  async cancelOrder(orderId: string, reason?: string): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('supplier-cancel-order', {
        body: { order_id: orderId, reason },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      throw error;
    }
  }

  // ============================================
  // ANALYTICS
  // ============================================

  async getAnalytics(request: GetAnalyticsRequest): Promise<GetAnalyticsResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('supplier_analytics')
      .select('*')
      .eq('supplier_id', request.supplier_id)
      .eq('user_id', user.id);

    if (request.start_date) {
      query = query.gte('date', request.start_date);
    }

    if (request.end_date) {
      query = query.lte('date', request.end_date);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;

    const analytics = data || [];

    // Calculate summary
    const summary = {
      total_revenue: analytics.reduce((sum, a) => sum + a.total_revenue, 0),
      total_orders: analytics.reduce((sum, a) => sum + a.total_orders, 0),
      success_rate:
        analytics.length > 0
          ? analytics.reduce((sum, a) => sum + a.success_rate, 0) / analytics.length
          : 0,
      average_profit_margin:
        analytics.length > 0
          ? analytics.reduce((sum, a) => {
              const margin = a.total_revenue > 0 ? (a.total_profit / a.total_revenue) * 100 : 0;
              return sum + margin;
            }, 0) / analytics.length
          : 0,
    };

    return { success: true, analytics, summary };
  }

  async getHealthScore(supplierId: string): Promise<SupplierHealthScore> {
    const { data, error } = await supabase.rpc('get_supplier_health_score', {
      p_supplier_id: supplierId,
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
    });

    if (error) throw error;

    return data as any;
  }

  // ============================================
  // PRODUCT SYNC
  // ============================================

  async syncProducts(request: SyncProductsRequest): Promise<SyncProductsResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('supplier-sync-products', {
        body: request,
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to sync products:', error);
      throw error;
    }
  }

  // ============================================
  // WEBHOOKS
  // ============================================

  async createWebhook(webhook: Partial<SupplierWebhook>): Promise<SupplierWebhook> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('supplier_webhooks')
      .insert({ ...webhook, user_id: user.id } as any)
      .select()
      .single();

    if (error) throw error;

    return data as any;
  }

  async getWebhooks(supplierId: string): Promise<SupplierWebhook[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('supplier_webhooks')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('user_id', user.id);

    if (error) throw error;

    return (data || []) as any;
  }

  // ============================================
  // EXTENDED SUPPLIER DATA
  // ============================================

  async getSupplierExtended(supplierId: string): Promise<SupplierExtended | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get base supplier
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single();

    if (supplierError || !supplier) return null;

    // Get all related data in parallel
    const [connection, pricingRules, analytics, recentOrders, webhooks, healthScore] =
      await Promise.all([
        this.getConnectionStatus(supplierId),
        this.getPricingRules(supplierId),
        this.getAnalytics({ supplier_id: supplierId }),
        this.getSupplierOrders(supplierId, 10),
        this.getWebhooks(supplierId),
        this.getHealthScore(supplierId),
      ]);

    // Calculate analytics summary
    const analytics_summary = {
      total_orders: analytics.analytics.reduce((sum, a) => sum + a.total_orders, 0),
      success_rate: analytics.summary.success_rate,
      total_profit: analytics.analytics.reduce((sum, a) => sum + a.total_profit, 0),
      avg_fulfillment_hours:
        analytics.analytics.length > 0
          ? analytics.analytics.reduce((sum, a) => sum + (a.average_fulfillment_time_hours || 0), 0) /
            analytics.analytics.length
          : 0,
    };

    return {
      ...supplier,
      connection,
      pricing_rules: pricingRules,
      analytics: analytics.analytics,
      analytics_summary,
      health_score: healthScore,
      recent_orders: recentOrders,
      webhooks,
    } as any;
  }
}

export const supplierEcosystemService = SupplierEcosystemService.getInstance();
