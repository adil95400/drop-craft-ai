// Types pour l'automatisation du fulfillment

export interface FulfillmentCarrier {
  id: string
  user_id: string
  carrier_name: string
  carrier_code: string // 'colissimo' | 'chronopost' | 'ups' | 'dhl' | 'fedex'
  
  // Configuration API
  api_endpoint?: string
  api_key?: string
  account_number?: string
  credentials: Record<string, any>
  
  // Zones de livraison
  supported_countries: string[]
  default_for_country?: string
  
  // Tarifs
  pricing_rules: Array<{
    weight_min_kg: number
    weight_max_kg: number
    zone: string
    price: number
    estimated_days: number
  }>
  
  // État
  is_active: boolean
  is_default: boolean
  
  created_at: string
  updated_at: string
}

export interface FulfillmentShipment {
  id: string
  user_id: string
  order_id: string
  carrier_id: string
  
  // Informations expédition
  tracking_number: string
  label_url?: string
  label_format: 'pdf' | 'zpl' | 'epl'
  
  // Colis
  weight_kg: number
  dimensions?: {
    length_cm: number
    width_cm: number
    height_cm: number
  }
  
  // Adresses
  shipping_address: {
    name: string
    street: string
    city: string
    postal_code: string
    country: string
    phone?: string
    email?: string
  }
  
  // Statut tracking
  status: 'created' | 'printed' | 'picked_up' | 'in_transit' | 'delivered' | 'failed'
  tracking_events: Array<{
    timestamp: string
    location: string
    status: string
    description: string
  }>
  
  // Coûts
  shipping_cost: number
  insurance_cost?: number
  total_cost: number
  
  // Dates
  estimated_delivery_date?: string
  actual_delivery_date?: string
  
  created_at: string
  updated_at: string
}

export interface FulfillmentAutomationRule {
  id: string
  user_id: string
  name: string
  
  // Conditions de déclenchement
  trigger_on_order_status: 'paid' | 'confirmed' | 'processing'
  order_conditions?: {
    min_amount?: number
    max_amount?: number
    countries?: string[]
    products?: string[]
  }
  
  // Actions automatiques
  auto_select_carrier: boolean
  carrier_selection_criteria: 'cheapest' | 'fastest' | 'preferred' | 'rules_based'
  
  auto_generate_label: boolean
  auto_print_label: boolean
  
  auto_notify_customer: boolean
  notification_template: string
  
  // Règles de sélection transporteur
  carrier_rules: Array<{
    condition: string
    carrier_id: string
    priority: number
  }>
  
  is_active: boolean
  execution_count: number
  
  created_at: string
  updated_at: string
}

export interface FulfillmentStats {
  total_shipments: number
  shipments_today: number
  in_transit: number
  delivered_on_time: number
  delivery_success_rate: number
  avg_delivery_time_days: number
  
  by_carrier: Array<{
    carrier_name: string
    shipments: number
    on_time_rate: number
    avg_cost: number
  }>
  
  pending_labels: number
  failed_shipments: number
}
