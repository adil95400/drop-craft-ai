/**
 * Types for advanced stock management
 */

export interface Warehouse {
  id: string
  user_id: string
  name: string
  location: string
  address: Record<string, any>
  capacity: number
  current_utilization: number
  manager_name?: string
  contact_email?: string
  contact_phone?: string
  is_active: boolean
  warehouse_type: 'standard' | 'cold_storage' | 'hazmat'
  operating_hours: Record<string, any>
  created_at: string
  updated_at: string
}

export interface StockLevel {
  id: string
  user_id: string
  product_id: string
  warehouse_id: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  reorder_point: number
  reorder_quantity: number
  max_stock_level: number
  min_stock_level: number
  last_restock_date?: string
  last_count_date?: string
  location_in_warehouse?: string
  batch_number?: string
  expiry_date?: string
  cost_per_unit?: number
  created_at: string
  updated_at: string
  // Joined data
  product?: {
    name: string
    sku?: string
    image_url?: string
  }
  warehouse?: {
    name: string
    location: string
  }
}

export interface StockPrediction {
  id: string
  user_id: string
  product_id: string
  warehouse_id?: string
  prediction_date: string
  predicted_demand: number
  predicted_stockout_date?: string
  confidence_score: number
  recommended_reorder_quantity?: number
  recommended_reorder_date?: string
  factors: Record<string, any>
  model_version: string
  created_at: string
}

export interface StockAlert {
  id: string
  user_id: string
  product_id: string
  warehouse_id?: string
  alert_type: 'low_stock' | 'out_of_stock' | 'overstocked' | 'expiring_soon'
  severity: 'low' | 'medium' | 'high' | 'critical'
  current_quantity: number
  threshold_quantity: number
  message: string
  recommended_action?: string
  is_resolved: boolean
  resolved_at?: string
  resolved_by?: string
  notification_sent: boolean
  notification_channels: string[]
  created_at: string
  updated_at: string
  // Joined data
  product?: {
    name: string
    sku?: string
    image_url?: string
  }
  warehouse?: {
    name: string
  }
}

export interface StockMovement {
  id: string
  user_id: string
  product_id: string
  warehouse_id: string
  movement_type: 'inbound' | 'outbound' | 'transfer' | 'adjustment' | 'return'
  quantity: number
  from_warehouse_id?: string
  to_warehouse_id?: string
  reference_id?: string
  reference_type?: string
  reason?: string
  notes?: string
  performed_by?: string
  cost_impact?: number
  created_at: string
  // Joined data
  product?: {
    name: string
    sku?: string
  }
  warehouse?: {
    name: string
  }
}

export interface StockAlertConfig {
  id: string
  user_id: string
  product_id?: string
  warehouse_id?: string
  alert_type: string
  threshold: number
  notification_channels: string[]
  is_enabled: boolean
  created_at: string
  updated_at: string
}

export interface StockStats {
  total_products: number
  total_warehouses: number
  total_stock_value: number
  low_stock_items: number
  out_of_stock_items: number
  active_alerts: number
  predicted_stockouts_7d: number
  average_stock_turnover: number
}
