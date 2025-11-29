// Types pour les analytics marketplace réels

export interface MarketplaceAnalytics {
  id: string
  user_id: string
  marketplace_integration_id: string
  marketplace: string
  date: string // Format: YYYY-MM-DD
  
  // Ventes
  revenue: number
  orders_count: number
  units_sold: number
  avg_order_value: number
  
  // Coûts et marges
  total_cost: number
  total_margin: number
  margin_percent: number
  
  // Performance
  conversion_rate: number
  views: number
  clicks: number
  
  // Retours
  returns_count: number
  returns_value: number
  return_rate: number
  
  created_at: string
  updated_at: string
}

export interface ProductPerformance {
  id: string
  product_id: string
  marketplace_integration_id: string
  marketplace: string
  period_start: string
  period_end: string
  
  // Métriques
  revenue: number
  units_sold: number
  views: number
  clicks: number
  conversion_rate: number
  
  // Coûts
  product_cost: number
  margin: number
  margin_percent: number
  
  // Classement
  rank_in_category?: number
  rank_change?: number
  
  created_at: string
}

export interface ChannelComparison {
  marketplace: string
  marketplace_name: string
  
  // Ventes
  revenue: number
  revenue_change_percent: number
  orders_count: number
  
  // Performance
  conversion_rate: number
  avg_order_value: number
  
  // Marges
  margin_percent: number
  total_margin: number
  
  // Activité
  active_products: number
  out_of_stock_products: number
  
  // Synchronisation
  last_sync_at?: string
  sync_status: 'success' | 'error' | 'pending'
}

export interface AnalyticsDashboard {
  // Vue d'ensemble
  total_revenue: number
  total_revenue_change: number
  total_orders: number
  total_orders_change: number
  avg_margin_percent: number
  margin_change: number
  
  // Top performers
  top_products: Array<{
    product_id: string
    name: string
    revenue: number
    units_sold: number
    margin_percent: number
  }>
  
  top_marketplaces: ChannelComparison[]
  
  // Alertes
  low_stock_products: number
  price_alerts: number
  sync_errors: number
  
  // Tendances (7 derniers jours)
  revenue_trend: Array<{
    date: string
    revenue: number
    orders: number
  }>
  
  // Statistiques par canal
  channel_stats: ChannelComparison[]
}

export interface RevenueByCategory {
  category: string
  revenue: number
  orders_count: number
  margin_percent: number
  products_count: number
}

export interface AlertSummary {
  critical_alerts: number
  warning_alerts: number
  info_alerts: number
  unresolved_count: number
  
  top_alerts: Array<{
    id: string
    type: string
    severity: string
    message: string
    created_at: string
  }>
}
