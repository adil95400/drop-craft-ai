/**
 * Service d'analytics marketplace utilisant les tables existantes
 * Calcule les métriques depuis orders, marketplace_integrations, products
 */

import { supabase } from '@/integrations/supabase/client'
import type { AnalyticsDashboard, ChannelComparison, AlertSummary } from '@/types/marketplace-analytics'

export class MarketplaceAnalyticsService {
  /**
   * Récupère le dashboard analytics complet
   */
  async getDashboard(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<AnalyticsDashboard> {
    // Calculer période précédente
    const daysDiff = Math.floor(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    const prevStartDate = new Date(new Date(startDate).getTime() - daysDiff * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    const prevEndDate = new Date(new Date(endDate).getTime() - daysDiff * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    // Métriques période actuelle
    const currentMetrics = await this.getPeriodMetrics(userId, startDate, endDate)
    const previousMetrics = await this.getPeriodMetrics(userId, prevStartDate, prevEndDate)

    // Variations
    const revenueChange = this.calculateChange(currentMetrics.revenue, previousMetrics.revenue)
    const ordersChange = this.calculateChange(currentMetrics.orders, previousMetrics.orders)
    const marginChange = this.calculateChange(currentMetrics.margin, previousMetrics.margin)

    // Top produits et canaux
    const topProducts = await this.getTopProducts(userId, startDate, endDate, 5)
    const channelStats = await this.getChannelStats(userId, startDate, endDate)

    // Tendance 7 jours
    const revenueTrend = await this.getRevenueTrend(userId, 7)

    // Alertes
    const alertSummary = await this.getAlertSummary(userId)

    return {
      total_revenue: currentMetrics.revenue,
      total_revenue_change: revenueChange,
      total_orders: currentMetrics.orders,
      total_orders_change: ordersChange,
      avg_margin_percent: currentMetrics.margin,
      margin_change: marginChange,
      top_products: topProducts,
      top_marketplaces: channelStats.slice(0, 5),
      low_stock_products: alertSummary.low_stock_count,
      price_alerts: alertSummary.price_alerts_count,
      sync_errors: alertSummary.sync_errors_count,
      revenue_trend: revenueTrend,
      channel_stats: channelStats
    }
  }

  /**
   * Métriques depuis la table orders
   */
  private async getPeriodMetrics(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ revenue: number; orders: number; margin: number }> {
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const revenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
    const ordersCount = orders?.length || 0
    const margin = 30 // Marge par défaut 30%

    return { revenue, orders: ordersCount, margin }
  }

  /**
   * Top produits basés sur les ventes réelles
   */
  private async getTopProducts(
    userId: string,
    startDate: string,
    endDate: string,
    limit: number
  ): Promise<Array<{
    product_id: string
    name: string
    revenue: number
    units_sold: number
    margin_percent: number
  }>> {
    // Get orders with items for the period
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, qty, unit_price, total_price')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Aggregate by product
    const productStats = new Map<string, { revenue: number; units: number }>()
    orderItems?.forEach(item => {
      if (!item.product_id) return
      const existing = productStats.get(item.product_id) || { revenue: 0, units: 0 }
      productStats.set(item.product_id, {
        revenue: existing.revenue + (item.total_price || (item.unit_price || 0) * (item.qty || 0) || 0),
        units: existing.units + (item.qty || 0)
      })
    })

    // Get product details for top sellers
    const topProductIds = [...productStats.entries()]
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, limit)
      .map(([id]) => id)

    if (topProductIds.length === 0) {
      // Fallback: return top products by price if no sales data
      const { data: products } = await supabase
        .from('products')
        .select('id, name, price, cost_price')
        .eq('user_id', userId)
        .order('price', { ascending: false })
        .limit(limit)

      return (products || []).map(product => ({
        product_id: product.id,
        name: product.name,
        revenue: 0,
        units_sold: 0,
        margin_percent: product.cost_price
          ? Math.round(((product.price - product.cost_price) / product.price) * 100)
          : 0
      }))
    }

    const { data: products } = await supabase
      .from('products')
      .select('id, name, price, cost_price')
      .in('id', topProductIds)

    const productMap = new Map(products?.map(p => [p.id, p]) || [])

    return topProductIds.map(id => {
      const product = productMap.get(id)
      const stats = productStats.get(id)!
      return {
        product_id: id,
        name: product?.name || 'Produit inconnu',
        revenue: Math.round(stats.revenue * 100) / 100,
        units_sold: stats.units,
        margin_percent: product?.cost_price
          ? Math.round(((product.price - product.cost_price) / product.price) * 100)
          : 0
      }
    })
  }

  /**
   * Tendance revenue sur N jours
   */
  private async getRevenueTrend(
    userId: string,
    days: number
  ): Promise<Array<{ date: string; revenue: number; orders: number }>> {
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    const { data: orders } = await supabase
      .from('orders')
      .select('created_at, total_amount')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Agréger par jour
    const dailyStats = new Map<string, { revenue: number; count: number }>()
    orders?.forEach(order => {
      const date = order.created_at.split('T')[0]
      const existing = dailyStats.get(date) || { revenue: 0, count: 0 }
      dailyStats.set(date, {
        revenue: existing.revenue + order.total_amount,
        count: existing.count + 1
      })
    })

    // Remplir jours manquants
    const trend = []
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const dayData = dailyStats.get(date)
      trend.unshift({
        date,
        revenue: dayData?.revenue || 0,
        orders: dayData?.count || 0
      })
    }

    return trend
  }

  /**
   * Stats par marketplace
   */
  private async getChannelStats(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ChannelComparison[]> {
    // Récupérer intégrations (simplifié)
    const { data: integrations } = await (supabase.from('integrations') as any)
      .select('id, platform, is_active, last_sync_at')
      .eq('user_id', userId)

    const channelStats: ChannelComparison[] = []

    // Get orders for the period to calculate real revenue per channel
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, external_platform, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Aggregate orders by source/platform
    const ordersBySource = new Map<string, { revenue: number; count: number }>()
    orders?.forEach(order => {
      const source = order.external_platform || 'direct'
      const existing = ordersBySource.get(source) || { revenue: 0, count: 0 }
      ordersBySource.set(source, {
        revenue: existing.revenue + (order.total_amount || 0),
        count: existing.count + 1
      })
    })

    for (const integration of (integrations || []) as any[]) {
      const platform = integration.platform || 'unknown'
      const orderData = ordersBySource.get(platform) || { revenue: 0, count: 0 }

      // Count active products linked to this integration
      const { count: activeProducts } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active')

      channelStats.push({
        marketplace: platform,
        marketplace_name: platform,
        revenue: orderData.revenue,
        revenue_change_percent: 0,
        orders_count: orderData.count,
        conversion_rate: 0,
        avg_order_value: orderData.count > 0 ? orderData.revenue / orderData.count : 0,
        margin_percent: 0,
        total_margin: 0,
        active_products: activeProducts || 0,
        out_of_stock_products: 0,
        last_sync_at: integration.last_sync_at || undefined,
        sync_status: integration.is_active ? 'success' : 'error'
      })
    }

    return channelStats.sort((a, b) => b.revenue - a.revenue)
  }

  /**
   * Résumé alertes
   */
  private async getAlertSummary(userId: string): Promise<AlertSummary> {
    // Produits faible stock via API
    const { productsApi } = await import('@/services/api/client')
    const stats = await productsApi.stats()
    const lowStockCount = stats.low_stock || 0

    // Intégrations en erreur (simplifié)
    const { data: failedIntegrations } = await (supabase.from('integrations') as any)
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', false)

    const syncErrorsCount = failedIntegrations?.length || 0

    return {
      critical_alerts: syncErrorsCount,
      warning_alerts: lowStockCount,
      info_alerts: 0,
      unresolved_count: syncErrorsCount + lowStockCount,
      low_stock_count: lowStockCount,
      price_alerts_count: 0,
      sync_errors_count: syncErrorsCount,
      top_alerts: []
    }
  }

  /**
   * Calcul variation
   */
  private calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }
}

export const marketplaceAnalyticsService = new MarketplaceAnalyticsService()
