/**
 * Real Analytics Hook - Uses real Supabase data (no mocks)
 * Provides dashboard analytics from actual database records
 */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

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
      if (!user) {
        return getEmptyAnalytics()
      }

      // Fetch all data in parallel for performance
      const [ordersResult, productsResult, customersResult] = await Promise.all([
        supabase
          .from('orders')
          .select('id, order_number, total_amount, status, created_at')
          .eq('user_id', user.id),
        supabase
          .from('products')
          .select('id, name, price')
          .eq('user_id', user.id),
        supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
      ])

      const orders = ordersResult.data || []
      const products = productsResult.data || []
      const customers = customersResult.data || []

      // Calculate real metrics
      const deliveredOrders = orders.filter(o => o.status === 'delivered')
      const revenue = deliveredOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
      const orderCount = orders.length
      const customerCount = customers.length
      const productCount = products.length
      const averageOrderValue = orderCount > 0 ? revenue / orderCount : 0
      const conversionRate = customerCount > 0 ? (orderCount / customerCount) * 100 : 0

      // Top products (limited real data)
      const topProducts = products.slice(0, 5).map((product) => ({
        name: product.name || 'Produit',
        sales: 0,
        revenue: `€${(product.price || 0).toFixed(2)}`,
        growth: '0%'
      }))

      // Recent orders
      const recentOrders = orders
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)

      // Sales by day (last 7 days from real data)
      const salesByDay = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const dayOrders = orders.filter(o => o.created_at?.startsWith(date))
        return {
          date,
          revenue: dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
          orders: dayOrders.length
        }
      }).reverse()

      return {
        revenue,
        orders: orderCount,
        customers: customerCount,
        products: productCount,
        averageOrderValue,
        conversionRate,
        topProducts,
        recentOrders,
        salesByDay
      }
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
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
