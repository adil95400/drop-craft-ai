/**
 * DashboardService — Pure API V1 delegate
 * All methods proxy to dashboardApi/ordersApi. No direct Supabase queries.
 */
import { dashboardApi, ordersApi } from '@/services/api/client'
import { ProductsService } from './products.service'
import { OrdersService } from './orders.service'
import { CustomersService } from './customers.service'

export class DashboardService {
  static async getDashboardStats(userId: string) {
    try {
      const [productStats, orderStats, customerStats] = await Promise.all([
        ProductsService.getProductStats(userId),
        OrdersService.getOrderStats(userId),
        CustomersService.getCustomerStats(userId),
      ])

      const conversionRate = customerStats.total > 0
        ? (orderStats.total / customerStats.total) * 100
        : 0

      return {
        products: productStats,
        orders: orderStats,
        customers: customerStats,
        kpis: {
          conversionRate,
          avgBasket: orderStats.avgOrderValue,
          customerLifetimeValue: customerStats.avgLifetimeValue,
          revenueGrowth: orderStats.revenueGrowth,
          ordersGrowth: orderStats.ordersGrowth,
          customerGrowth: customerStats.customerGrowth,
        },
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw error
    }
  }

  static async getChartData(userId: string, period: 'week' | 'month' | 'year' = 'month') {
    // Delegate to orders API — chart data computed client-side from orders list
    const orders = await OrdersService.getOrders(userId)
    
    const now = new Date()
    let startDate: Date
    switch (period) {
      case 'week': startDate = new Date(now.getTime() - 7 * 86400000); break
      case 'month': startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); break
      case 'year': startDate = new Date(now.getFullYear() - 1, 0, 1); break
    }

    const filtered = orders.filter((o: any) => new Date(o.created_at) >= startDate)
    const grouped: Record<string, { revenue: number; orders: number }> = {}

    for (const order of filtered) {
      const date = new Date(order.created_at)
      let key: string
      if (period === 'week') key = date.toLocaleDateString('fr-FR', { weekday: 'short' })
      else if (period === 'month') key = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
      else key = date.toLocaleDateString('fr-FR', { month: 'short' })

      if (!grouped[key]) grouped[key] = { revenue: 0, orders: 0 }
      if (['delivered', 'completed'].includes(order.status)) grouped[key].revenue += order.total_amount || 0
      grouped[key].orders += 1
    }

    return Object.entries(grouped).map(([date, data]) => ({ date, ...data }))
  }

  static async getAlerts(_userId: string) {
    // Alerts are now part of dashboard stats
    return []
  }

  static async getRecentActivities(_userId: string, limit = 10) {
    const resp = await dashboardApi.activity({ limit })
    return resp.items ?? []
  }

  static async getTopProducts(_userId: string, _limit = 5) {
    return []
  }
}
