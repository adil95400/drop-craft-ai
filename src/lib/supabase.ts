import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rzdfzehwcuzfufivhnnk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6ZGZ6ZWh3Y3V6ZnVmaXZobm5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0NDEzNDksImV4cCI6MjA0OTAxNzM0OX0.YEHzGmVQ6Iv8KhptKZVP5fSF_L9wZJaXowMGKN7B05w'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Product {
  id: string
  name: string
  price: number
  cost: number
  margin: number
  supplier: string
  category: string
  status: 'active' | 'draft' | 'sold_out'
  image_url?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  product_id: string
  customer_email: string
  customer_name: string
  quantity: number
  total_amount: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  tracking_number?: string
  shipping_address: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  email: string
  name: string
  phone?: string
  total_orders: number
  total_spent: number
  status: 'active' | 'inactive'
  created_at: string
  last_order_at?: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  featured_image?: string
  status: 'draft' | 'published' | 'scheduled'
  published_at?: string
  author: string
  tags?: string[]
  seo_title?: string
  seo_description?: string
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  product_id: string
  customer_name: string
  customer_email: string
  rating: number
  title: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  verified_purchase: boolean
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  contact_email: string
  contact_phone?: string
  country: string
  rating: number
  products_count: number
  status: 'active' | 'inactive'
  commission_rate: number
  created_at: string
  updated_at: string
}