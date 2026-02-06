/**
 * Real Analytics Hook - Uses Supabase direct queries
 */
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'

export interface RealAnalytics {
  revenue: number
  orders: number
  customers: number
  products: number
  averageOrderValue: number
  conversionRate: number
  topProducts: Array<{ name: string; sales: number; revenue: string; growth: string }>
  recentOrders: Array<{ id: string; order_number: string; total_amount: number; status: string; created_at: string }>
  salesByDay: Array<{ date: string; revenue: number; orders: number }>
}

export const useRealAnalytics = () => {
  const { user } = useAuth()

  const { data: analytics, isLoading, error, refetch } = useQuery({
    queryKey: ['real-analytics', user?.id],
    queryFn: async (): Promise<RealAnalytics> => {
      if (!user?.id) return getEmptyAnalytics()

      // Fetch real data from Supabase tables
      const [ordersRes, productsRes] = await Promise.all([
        supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('products').select('id, name, price').eq('user_id', user.id),
      ])

      const orders = ordersRes.data || []
      const products = productsRes.data || []
      const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0)
      const totalOrders = orders.length

      return {
        revenue: totalRevenue,
        orders: totalOrders,
        customers: new Set(orders.map(o => o.customer_email).filter(Boolean)).size,
        products: products.length,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        conversionRate: 0,
        topProducts: [],
        recentOrders: orders.slice(0, 10).map(o => ({
          id: o.id,
          order_number: o.order_number || o.id.slice(0, 8),
          total_amount: o.total_amount || 0,
          status: o.status || 'pending',
          created_at: o.created_at,
        })),
        salesByDay: [],
      }
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  return {
    analytics: analytics || getEmptyAnalytics(),
    isLoading,
    error,
    refetch
  }
}

function getEmptyAnalytics(): RealAnalytics {
  return {
    revenue: 0, orders: 0, customers: 0, products: 0,
    averageOrderValue: 0, conversionRate: 0,
    topProducts: [], recentOrders: [], salesByDay: []
  }
}
