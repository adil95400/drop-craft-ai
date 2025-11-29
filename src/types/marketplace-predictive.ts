// Types pour l'analyse prédictive

export interface SalesForecast {
  id: string
  user_id: string
  product_id?: string
  category?: string
  marketplace?: string
  
  // Période de prévision
  forecast_date: string
  forecast_horizon_days: number
  
  // Prévisions
  predicted_sales_units: number
  predicted_revenue: number
  confidence_interval_lower: number
  confidence_interval_upper: number
  confidence_level: number // 0-100%
  
  // Facteurs d'influence
  seasonality_factor: number
  trend_factor: number
  promotion_impact: number
  
  // Modèle utilisé
  model_type: 'linear_regression' | 'arima' | 'prophet' | 'ml_ensemble'
  model_accuracy: number
  
  // Données historiques utilisées
  training_period_start: string
  training_period_end: string
  data_points_used: number
  
  created_at: string
}

export interface RestockRecommendation {
  id: string
  user_id: string
  product_id: string
  
  // État actuel
  current_stock: number
  days_of_stock_remaining: number
  
  // Recommandation
  recommended_restock_quantity: number
  recommended_restock_date: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
  
  // Prévisions
  predicted_sales_next_30_days: number
  predicted_stockout_date?: string
  
  // Coûts
  estimated_cost: number
  estimated_revenue: number
  estimated_profit: number
  
  // Supplier info
  suggested_supplier_id?: string
  supplier_lead_time_days?: number
  
  // Statut
  status: 'pending' | 'acknowledged' | 'ordered' | 'dismissed'
  acknowledged_at?: string
  
  created_at: string
  updated_at: string
}

export interface PricingRecommendation {
  id: string
  user_id: string
  product_id: string
  marketplace: string
  
  // Prix actuel
  current_price: number
  current_margin_percent: number
  
  // Recommandation
  recommended_price: number
  recommended_margin_percent: number
  expected_sales_lift_percent: number
  
  // Analyse
  market_average_price: number
  competitor_min_price: number
  competitor_max_price: number
  price_elasticity: number
  
  // Raisons
  recommendation_reason: string
  confidence_score: number
  
  // Impact estimé
  estimated_daily_sales_increase: number
  estimated_revenue_impact: number
  
  status: 'pending' | 'applied' | 'rejected'
  
  created_at: string
  expires_at: string
}

export interface TrendAnalysis {
  id: string
  user_id: string
  analysis_date: string
  
  // Produits en tendance
  trending_products: Array<{
    product_id: string
    product_name: string
    trend_score: number
    sales_velocity: number // Sales per day
    growth_rate_percent: number
  }>
  
  // Catégories en tendance
  trending_categories: Array<{
    category: string
    product_count: number
    revenue_growth_percent: number
    demand_score: number
  }>
  
  // Opportunités
  opportunities: Array<{
    type: 'new_product' | 'price_increase' | 'expand_category' | 'new_marketplace'
    title: string
    description: string
    estimated_revenue_impact: number
    confidence_level: number
  }>
  
  // Risques
  risks: Array<{
    type: 'declining_sales' | 'increased_competition' | 'margin_erosion'
    product_ids: string[]
    severity: 'low' | 'medium' | 'high'
    description: string
    recommended_action: string
  }>
  
  created_at: string
}

export interface PredictiveDashboard {
  // Prévisions globales
  next_30_days_forecast: {
    revenue: number
    orders: number
    confidence: number
  }
  
  next_90_days_forecast: {
    revenue: number
    orders: number
    confidence: number
  }
  
  // Recommandations actives
  restock_recommendations: RestockRecommendation[]
  pricing_recommendations: PricingRecommendation[]
  
  // Alertes prédictives
  stockout_alerts: Array<{
    product_id: string
    product_name: string
    days_until_stockout: number
    urgency: string
  }>
  
  // Tendances
  trending_up: Array<{
    product_name: string
    growth_rate: number
  }>
  
  trending_down: Array<{
    product_name: string
    decline_rate: number
  }>
}
