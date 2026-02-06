/**
 * Real Analytics Hook - Uses FastAPI backend (no direct Supabase queries)
 * Provides dashboard analytics from the API
 */
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'

export interface RealAnalytics {
  revenue: number
  orders: number
  customers: number
  products: number
  averageOrderValue: number
  conversionRate: number
  topProducts: Array<{
    name: string
    sales: number
    revenue: string
    growth: string
  }>
  recentOrders: Array<{
    id: string
    order_number: string
    total_amount: number
    status: string
    created_at: string
  }>
  salesByDay: Array<{
    date: string
    revenue: number
    orders: number
  }>
}

export const useRealAnalytics = () => {
  const { user } = useAuth()

  const { data: analytics, isLoading, error, refetch } = useQuery({
    queryKey: ['real-analytics', user?.id],
    queryFn: async (): Promise<RealAnalytics> => {
      if (!user) return getEmptyAnalytics()

      const res = await shopOptiApi.getAnalyticsDashboard('30d')
      if (!res.success || !res.data) return getEmptyAnalytics()

      // Map API response to expected format
      const d = res.data as any
      return {
        revenue: d.revenue ?? 0,
        orders: d.orders ?? 0,
        customers: d.customers ?? 0,
        products: d.products ?? 0,
        averageOrderValue: d.averageOrderValue ?? d.average_order_value ?? 0,
        conversionRate: d.conversionRate ?? d.conversion_rate ?? 0,
        topProducts: d.topProducts ?? d.top_products ?? [],
        recentOrders: d.recentOrders ?? d.recent_orders ?? [],
        salesByDay: d.salesByDay ?? d.sales_by_day ?? [],
      }
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000
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
    revenue: 0,
    orders: 0,
    customers: 0,
    products: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    topProducts: [],
    recentOrders: [],
    salesByDay: []
  }
}
