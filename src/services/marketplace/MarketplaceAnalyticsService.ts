import { supabase } from '@/integrations/supabase/client'
import type {
  MarketplaceAnalytics,
  ProductPerformance,
  ChannelComparison,
  AnalyticsDashboard,
  RevenueByCategory,
  AlertSummary
} from '@/types/marketplace-analytics'

/**
 * Service d'analytics marketplace avec données réelles
 * Fournit métriques, comparaisons par canal, et alertes
 */
export class MarketplaceAnalyticsService {
  /**
   * Récupère le dashboard complet avec toutes les métriques
   */
  async getDashboard(userId: string, period: 'today' | '7days' | '30days' = '7days'): Promise<AnalyticsDashboard> {
    const dateRange = this.getDateRange(period)

    // Récupère toutes les données en parallèle
    const [
      overviewStats,
      topProducts,
      topMarketplaces,
      revenueTrend,
      channelStats,
      alertSummary
    ] = await Promise.all([
      this.getOverviewStats(userId, dateRange),
      this.getTopProducts(userId, dateRange, 5),
      this.getTopMarketplaces(userId, dateRange, 5),
      this.getRevenueTrend(userId, dateRange),
      this.getChannelComparison(userId, dateRange),
      this.getAlertSummary(userId)
    ])

    return {
      ...overviewStats,
      top_products: topProducts,
      top_marketplaces: topMarketplaces,
      revenue_trend: revenueTrend,
      channel_stats: channelStats,
      low_stock_products: alertSummary.low_stock_count || 0,
      price_alerts: alertSummary.price_alerts || 0,
      sync_errors: alertSummary.sync_errors || 0
    }
  }

  /**
   * Statistiques globales (revenue, orders, margin)
   */
  private async getOverviewStats(userId: string, dateRange: { start: string; end: string }): Promise<{
    total_revenue: number
    total_revenue_change: number
    total_orders: number
    total_orders_change: number
    avg_margin_percent: number
    margin_change: number
  }> {
    // Période actuelle
    const { data: current } = await supabase
      .from('marketplace_analytics')
      .select('revenue, orders_count, margin_percent')
      .eq('user_id', userId)
      .gte('date', dateRange.start)
      .lte('date', dateRange.end)

    // Période précédente (même durée)
    const daysDiff = Math.floor(
      (new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24)
    )
    const prevStart = new Date(new Date(dateRange.start).getTime() - daysDiff * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]
    const prevEnd = new Date(new Date(dateRange.end).getTime() - daysDiff * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]

    const { data: previous } = await supabase
      .from('marketplace_analytics')
      .select('revenue, orders_count, margin_percent')
      .eq('user_id', userId)
      .gte('date', prevStart)
      .lte('date', prevEnd)

    const currentRevenue = current?.reduce((sum, d) => sum + (d.revenue || 0), 0) || 0
    const previousRevenue = previous?.reduce((sum, d) => sum + (d.revenue || 0), 0) || 0
    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0

    const currentOrders = current?.reduce((sum, d) => sum + (d.orders_count || 0), 0) || 0
    const previousOrders = previous?.reduce((sum, d) => sum + (d.orders_count || 0), 0) || 0
    const ordersChange = previousOrders > 0
      ? ((currentOrders - previousOrders) / previousOrders) * 100
      : 0

    const avgMargin = current && current.length > 0
      ? current.reduce((sum, d) => sum + (d.margin_percent || 0), 0) / current.length
      : 0

    const prevAvgMargin = previous && previous.length > 0
      ? previous.reduce((sum, d) => sum + (d.margin_percent || 0), 0) / previous.length
      : 0

    const marginChange = prevAvgMargin > 0
      ? avgMargin - prevAvgMargin
      : 0

    return {
      total_revenue: currentRevenue,
      total_revenue_change: revenueChange,
      total_orders: currentOrders,
      total_orders_change: ordersChange,
      avg_margin_percent: avgMargin,
      margin_change: marginChange
    }
  }

  /**
   * Top produits par revenue
   */
  private async getTopProducts(
    userId: string,
    dateRange: { start: string; end: string },
    limit: number = 5
  ): Promise<Array<{
    product_id: string
    name: string
    revenue: number
    units_sold: number
    margin_percent: number
  }>> {
    const { data } = await supabase
      .from('product_performance')
      .select(`
        product_id,
        revenue,
        units_sold,
        margin_percent,
        products:product_id (name)
      `)
      .gte('period_start', dateRange.start)
      .lte('period_end', dateRange.end)
      .order('revenue', { ascending: false })
      .limit(limit)

    return (data || []).map(d => ({
      product_id: d.product_id,
      name: (d.products as any)?.name || 'Produit sans nom',
      revenue: d.revenue,
      units_sold: d.units_sold,
      margin_percent: d.margin_percent
    }))
  }

  /**
   * Top marketplaces par revenue
   */
  private async getTopMarketplaces(
    userId: string,
    dateRange: { start: string; end: string },
    limit: number = 5
  ): Promise<ChannelComparison[]> {
    const channels = await this.getChannelComparison(userId, dateRange)
    return channels
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
  }

  /**
   * Tendance de revenue (graphique temporel)
   */
  private async getRevenueTrend(
    userId: string,
    dateRange: { start: string; end: string }
  ): Promise<Array<{
    date: string
    revenue: number
    orders: number
  }>> {
    const { data } = await supabase
      .from('marketplace_analytics')
      .select('date, revenue, orders_count')
      .eq('user_id', userId)
      .gte('date', dateRange.start)
      .lte('date', dateRange.end)
      .order('date', { ascending: true })

    // Groupe par date (agrège tous les marketplaces)
    const grouped = (data || []).reduce((acc, item) => {
      const existing = acc.find(d => d.date === item.date)
      if (existing) {
        existing.revenue += item.revenue
        existing.orders += item.orders_count
      } else {
        acc.push({
          date: item.date,
          revenue: item.revenue,
          orders: item.orders_count
        })
      }
      return acc
    }, [] as Array<{ date: string; revenue: number; orders: number }>)

    return grouped
  }

  /**
   * Comparaison par canal/marketplace
   */
  private async getChannelComparison(
    userId: string,
    dateRange: { start: string; end: string }
  ): Promise<ChannelComparison[]> {
    const { data } = await supabase
      .from('marketplace_analytics')
      .select(`
        marketplace,
        revenue,
        orders_count,
        conversion_rate,
        margin_percent,
        marketplace_integrations:marketplace_integration_id (
          platform,
          status,
          last_sync_at
        )
      `)
      .eq('user_id', userId)
      .gte('date', dateRange.start)
      .lte('date', dateRange.end)

    // Groupe par marketplace
    const grouped = (data || []).reduce((acc, item) => {
      const marketplace = item.marketplace
      const existing = acc.find(c => c.marketplace === marketplace)

      if (existing) {
        existing.revenue += item.revenue
        existing.orders_count += item.orders_count
        existing.total_margin += item.revenue * (item.margin_percent / 100)
      } else {
        const integration = item.marketplace_integrations as any
        acc.push({
          marketplace,
          marketplace_name: this.getMarketplaceName(marketplace),
          revenue: item.revenue,
          revenue_change_percent: 0, // TODO: calculer vs période précédente
          orders_count: item.orders_count,
          conversion_rate: item.conversion_rate,
          avg_order_value: item.orders_count > 0 ? item.revenue / item.orders_count : 0,
          margin_percent: item.margin_percent,
          total_margin: item.revenue * (item.margin_percent / 100),
          active_products: 0, // TODO: compter depuis products
          out_of_stock_products: 0, // TODO: compter depuis monitoring
          last_sync_at: integration?.last_sync_at,
          sync_status: integration?.status === 'connected' ? 'success' : 'error'
        })
      }
      return acc
    }, [] as ChannelComparison[])

    // Calcule les moyennes
    grouped.forEach(channel => {
      if (channel.orders_count > 0) {
        channel.avg_order_value = channel.revenue / channel.orders_count
        channel.margin_percent = (channel.total_margin / channel.revenue) * 100
      }
    })

    return grouped
  }

  /**
   * Résumé des alertes
   */
  private async getAlertSummary(userId: string): Promise<AlertSummary & {
    low_stock_count?: number
    price_alerts?: number
    sync_errors?: number
  }> {
    const { data: alerts } = await supabase
      .from('monitoring_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(10)

    const critical = alerts?.filter(a => a.severity === 'critical').length || 0
    const warning = alerts?.filter(a => a.severity === 'warning').length || 0
    const info = alerts?.filter(a => a.severity === 'info').length || 0

    const lowStock = alerts?.filter(a => 
      a.alert_type === 'stock_low' || a.alert_type === 'stock_out'
    ).length || 0

    const priceAlerts = alerts?.filter(a => 
      a.alert_type === 'price_change'
    ).length || 0

    const syncErrors = alerts?.filter(a => 
      a.alert_type === 'sync_error'
    ).length || 0

    return {
      critical_alerts: critical,
      warning_alerts: warning,
      info_alerts: info,
      unresolved_count: alerts?.length || 0,
      top_alerts: (alerts || []).slice(0, 5).map(a => ({
        id: a.id,
        type: a.alert_type,
        severity: a.severity,
        message: a.message,
        created_at: a.created_at
      })),
      low_stock_count: lowStock,
      price_alerts: priceAlerts,
      sync_errors: syncErrors
    }
  }

  /**
   * Revenue par catégorie
   */
  async getRevenueByCategory(
    userId: string,
    dateRange: { start: string; end: string }
  ): Promise<RevenueByCategory[]> {
    // TODO: Implémenter quand table products/categories sera disponible
    return []
  }

  /**
   * Helpers
   */
  private getDateRange(period: 'today' | '7days' | '30days'): { start: string; end: string } {
    const end = new Date()
    const start = new Date()

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        break
      case '7days':
        start.setDate(start.getDate() - 7)
        break
      case '30days':
        start.setDate(start.getDate() - 30)
        break
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }

  private getMarketplaceName(marketplace: string): string {
    const names: Record<string, string> = {
      amazon: 'Amazon',
      ebay: 'eBay',
      etsy: 'Etsy',
      cdiscount: 'Cdiscount',
      shopify: 'Shopify',
      woocommerce: 'WooCommerce',
      facebook_shops: 'Facebook Shops',
      instagram_shopping: 'Instagram Shopping',
      tiktok_shop: 'TikTok Shop'
    }
    return names[marketplace] || marketplace
  }
}

export const marketplaceAnalyticsService = new MarketplaceAnalyticsService()
