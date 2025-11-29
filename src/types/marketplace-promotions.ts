// Types pour l'automatisation des promotions

export interface PromotionCampaign {
  id: string
  user_id: string
  campaign_name: string
  campaign_type: 'discount' | 'coupon' | 'flash_sale' | 'bundle' | 'free_shipping'
  
  // Scope
  applies_to_products?: string[]
  applies_to_categories?: string[]
  applies_to_marketplaces?: string[]
  
  // Règles de remise
  discount_type: 'percentage' | 'fixed_amount' | 'buy_x_get_y'
  discount_value: number
  
  // Buy X Get Y
  buy_quantity?: number
  get_quantity?: number
  get_discount_percent?: number
  
  // Conditions
  min_purchase_amount?: number
  max_uses_per_customer?: number
  max_total_uses?: number
  current_uses: number
  
  // Codes promo
  coupon_code?: string
  auto_apply: boolean
  
  // Période
  starts_at: string
  ends_at: string
  timezone: string
  
  // Planification automatique
  auto_start: boolean
  auto_end: boolean
  recurring: boolean
  recurrence_rule?: string // RRULE format
  
  // Déploiement multi-marketplace
  deployment_status: Record<string, 'pending' | 'active' | 'failed'>
  
  // Métriques
  revenue_generated: number
  orders_count: number
  avg_discount_per_order: number
  
  // État
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended'
  
  created_at: string
  updated_at: string
}

export interface PromotionAutomationRule {
  id: string
  user_id: string
  rule_name: string
  
  // Déclencheurs
  trigger_type: 'date_based' | 'inventory_based' | 'sales_based' | 'competitor_based'
  trigger_conditions: Record<string, any>
  
  // Exemples de conditions
  // date_based: { "dates": ["2024-12-25", "2024-07-14"] }
  // inventory_based: { "stock_below": 20, "product_category": "electronics" }
  // sales_based: { "no_sale_days": 30, "product_ids": [...] }
  // competitor_based: { "competitor_discount_detected": true, "marketplace": "amazon" }
  
  // Action
  campaign_template: Partial<PromotionCampaign>
  
  // Fréquence vérification
  check_frequency_hours: number
  
  is_active: boolean
  last_triggered_at?: string
  execution_count: number
  
  created_at: string
  updated_at: string
}

export interface PromotionPerformance {
  campaign_id: string
  date: string
  marketplace: string
  
  revenue: number
  orders_count: number
  units_sold: number
  discount_amount: number
  
  conversion_rate: number
  avg_order_value: number
  
  // Comparaison vs période sans promo
  revenue_lift_percent: number
  conversion_lift_percent: number
  
  created_at: string
}
