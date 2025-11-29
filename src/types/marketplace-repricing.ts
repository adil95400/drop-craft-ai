// Types pour le module de repricing dynamique avancé

export interface RepricingRule {
  id: string
  user_id: string
  name: string
  description?: string
  
  // Scope
  applies_to: 'all' | 'category' | 'product' | 'marketplace'
  target_products?: string[] // Product IDs
  target_categories?: string[]
  target_marketplaces?: string[]
  
  // Stratégie de repricing
  strategy: 'buybox' | 'margin_based' | 'competitive' | 'dynamic'
  
  // Contraintes de marge
  min_margin_percent: number
  target_margin_percent: number
  max_discount_percent?: number
  
  // Règles de prix
  min_price?: number
  max_price?: number
  rounding_strategy: 'none' | 'up' | 'down' | 'nearest_99' | 'nearest_95'
  
  // Analyse concurrentielle
  competitor_analysis_enabled: boolean
  buybox_target_position?: 'win' | 'top3' | 'competitive'
  price_match_threshold_percent?: number
  
  // Fréquence
  update_frequency_minutes: number
  
  // État
  is_active: boolean
  last_executed_at?: string
  execution_count: number
  success_count: number
  
  created_at: string
  updated_at: string
}

export interface RepricingExecution {
  id: string
  rule_id: string
  product_id: string
  marketplace: string
  
  // Prix avant/après
  old_price: number
  new_price: number
  price_change_percent: number
  
  // Analyse concurrentielle
  competitor_prices: Array<{
    seller: string
    price: number
    is_buybox_winner: boolean
    shipping_cost?: number
  }>
  
  // Décision
  strategy_used: string
  margin_before: number
  margin_after: number
  decision_reason: string
  
  // Résultat
  sync_status: 'pending' | 'applied' | 'failed'
  sync_error?: string
  applied_at?: string
  
  executed_at: string
}

export interface MarketplacePriceData {
  marketplace: string
  product_id: string
  current_price: number
  competitor_count: number
  min_competitor_price: number
  avg_competitor_price: number
  buybox_price: number
  buybox_seller: string
  last_checked_at: string
}

export interface RepricingDashboard {
  active_rules: number
  products_monitored: number
  repricing_executions_today: number
  avg_margin_change: number
  
  recent_changes: Array<{
    product_name: string
    marketplace: string
    old_price: number
    new_price: number
    margin_impact: number
    executed_at: string
  }>
  
  buybox_performance: Array<{
    marketplace: string
    buybox_win_rate: number
    avg_position: number
    products_in_buybox: number
  }>
  
  margin_distribution: Array<{
    margin_range: string
    product_count: number
    revenue_percent: number
  }>
}
