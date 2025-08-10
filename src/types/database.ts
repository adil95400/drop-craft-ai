// Temporary types to resolve build errors until Supabase types are regenerated
export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  status: string
  plan_name?: string
  price_id?: string
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end?: boolean
  created_at: string
  updated_at: string
}

export interface TrackingOrder {
  id: string
  order_number: string
  tracking_number: string
  carrier: string
  status: string
  created_at: string
  customer_name?: string
  shipping_address?: any
}