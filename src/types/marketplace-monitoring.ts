// Types pour la surveillance automatique stock/prix

export interface StockPriceMonitoring {
  id: string
  user_id: string
  product_id: string
  marketplace_integration_id: string
  
  // Configuration
  monitor_stock: boolean
  monitor_price: boolean
  sync_frequency_minutes: number // Fréquence de vérification
  
  // État actuel
  current_stock?: number
  current_price?: number
  supplier_stock?: number
  supplier_price?: number
  
  // Règles de synchronisation
  stock_sync_enabled: boolean
  price_sync_enabled: boolean
  
  // Règles de marge pour le prix
  margin_type: 'fixed' | 'percentage' | 'formula'
  margin_value?: number
  price_formula?: string // Ex: "{{supplier_price}} * 1.4 + 2"
  
  // Seuils d'alerte
  min_stock_threshold?: number
  max_price_variation_percent?: number
  
  // État
  last_checked_at?: string
  last_synced_at?: string
  status: 'active' | 'paused' | 'error'
  error_message?: string
  
  created_at: string
  updated_at: string
}

export interface StockPriceChange {
  id: string
  monitoring_id: string
  product_id: string
  change_type: 'stock' | 'price'
  
  // Avant/Après
  old_value: number
  new_value: number
  change_percent: number
  
  // Action prise
  auto_sync_applied: boolean
  sync_result?: 'success' | 'failed'
  sync_error?: string
  
  // Alertes
  alert_triggered: boolean
  alert_reason?: string
  
  detected_at: string
  synced_at?: string
}

export interface MonitoringAlert {
  id: string
  user_id: string
  monitoring_id: string
  product_id: string
  marketplace: string
  
  alert_type: 'stock_low' | 'stock_out' | 'price_change' | 'sync_error' | 'supplier_unavailable'
  severity: 'info' | 'warning' | 'critical'
  
  title: string
  message: string
  data: Record<string, any>
  
  read: boolean
  resolved: boolean
  resolved_at?: string
  
  created_at: string
}

export interface SupplierConnection {
  id: string
  user_id: string
  supplier_name: string
  supplier_type: 'api' | 'scraper' | 'manual'
  
  // Configuration API
  api_endpoint?: string
  api_key?: string
  credentials?: Record<string, any>
  
  // Mapping produits
  product_id_field: string // Champ qui contient l'ID produit chez le fournisseur
  stock_field: string
  price_field: string
  
  // État
  status: 'active' | 'inactive' | 'error'
  last_sync_at?: string
  
  created_at: string
  updated_at: string
}

export interface MonitoringDashboardStats {
  total_monitored_products: number
  active_monitors: number
  paused_monitors: number
  error_monitors: number
  
  stock_alerts: number
  price_alerts: number
  unresolved_alerts: number
  
  today_syncs: number
  today_sync_success_rate: number
  
  avg_price_change_percent: number
  products_out_of_stock: number
  products_low_stock: number
}
