/**
 * TikTok Shop Service
 * Frontend service for TikTok Shop marketplace integration
 */
import { supabase } from '@/integrations/supabase/client';

export interface TikTokShopConnection {
  shop_id: string;
  access_token: string;
  shop_name?: string;
  shop_region?: string;
}

export interface TikTokAnalytics {
  revenue_30d: number;
  orders_30d: number;
  avg_order_value: number;
}

export class TikTokShopService {
  private static async invoke(action: string, params: Record<string, any> = {}) {
    const { data, error } = await supabase.functions.invoke('tiktok-shop-integration', {
      body: { action, ...params },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }

  /** Connect a TikTok Shop */
  static async connect(connection: TikTokShopConnection) {
    return this.invoke('connect', connection);
  }

  /** Disconnect a TikTok Shop */
  static async disconnect(integrationId: string) {
    return this.invoke('disconnect', { integration_id: integrationId });
  }

  /** Publish a product to TikTok Shop */
  static async publishProduct(integrationId: string, productId: string) {
    return this.invoke('publish_product', {
      integration_id: integrationId,
      product_id: productId,
    });
  }

  /** Bulk publish products */
  static async publishBulk(integrationId: string, productIds: string[]) {
    return this.invoke('publish_bulk', {
      integration_id: integrationId,
      product_ids: productIds,
    });
  }

  /** Sync products from TikTok Shop */
  static async syncProducts(integrationId: string) {
    return this.invoke('sync_products', { integration_id: integrationId });
  }

  /** Sync orders from TikTok Shop */
  static async syncOrders(integrationId: string) {
    return this.invoke('sync_orders', { integration_id: integrationId });
  }

  /** Update inventory on TikTok Shop */
  static async updateInventory(integrationId: string, productId: string, quantity: number) {
    return this.invoke('update_inventory', {
      integration_id: integrationId,
      product_id: productId,
      quantity,
    });
  }

  /** Get TikTok Shop categories */
  static async getCategories(integrationId: string) {
    return this.invoke('get_categories', { integration_id: integrationId });
  }

  /** Get integration status */
  static async getStatus(integrationId: string) {
    return this.invoke('get_status', { integration_id: integrationId });
  }

  /** Get analytics (30d) */
  static async getAnalytics(integrationId: string): Promise<TikTokAnalytics> {
    const result = await this.invoke('get_analytics', { integration_id: integrationId });
    return result.analytics;
  }

  /** Get all TikTok Shop integrations for the current user */
  static async getIntegrations() {
    const { data, error } = await supabase
      .from('marketplace_integrations')
      .select('*')
      .eq('platform', 'tiktok_shop')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
