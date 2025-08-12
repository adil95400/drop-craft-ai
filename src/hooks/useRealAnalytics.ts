import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { ApiService } from '@/services/api'

export const useRealAnalytics = (dateRange?: { from: Date; to: Date }) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['real-analytics', dateRange],
    queryFn: async () => {
      const [orders, products, customers] = await Promise.all([
        ApiService.getOrders(dateRange),
        ApiService.getProducts(),
        ApiService.getCustomers()
      ])

      const revenue = orders.reduce((sum, order) => sum + order.total_amount, 0)
      const averageOrderValue = orders.length > 0 ? revenue / orders.length : 0
      
      return {
        revenue,
        orders: orders.length,
        customers: customers.length,
        products: products.length,
        averageOrderValue,
        conversionRate: customers.length > 0 ? (orders.length / customers.length) * 100 : 0,
        topProducts: products
          .sort((a, b) => ((b as any).sales_count || 0) - ((a as any).sales_count || 0))
          .slice(0, 5),
        recentOrders: orders.slice(0, 10),
        salesByDay: generateSalesByDay(orders, dateRange)
      }
    }
  })

  const generateReport = useMutation({
    mutationFn: async (reportType: string) => {
      return ApiService.callEdgeFunction('generate-report', { 
        type: reportType, 
        dateRange 
      })
    },
    onSuccess: () => {
      toast({
        title: "Rapport généré",
        description: "Le rapport sera téléchargé dans quelques instants"
      })
    }
  })

  return {
    analytics: analytics || {
      revenue: 0,
      orders: 0,
      customers: 0,
      products: 0,
      averageOrderValue: 0,
      conversionRate: 0,
      topProducts: [],
      recentOrders: [],
      salesByDay: []
    },
    isLoading,
    generateReport: generateReport.mutate,
    isGeneratingReport: generateReport.isPending
  }
}

function generateSalesByDay(orders: any[], dateRange?: { from: Date; to: Date }) {
  const salesMap = new Map()
  
  orders.forEach(order => {
    const date = new Date(order.created_at).toISOString().split('T')[0]
    salesMap.set(date, (salesMap.get(date) || 0) + order.total_amount)
  })

  return Array.from(salesMap.entries()).map(([date, amount]) => ({
    date,
    amount
  })).sort((a, b) => a.date.localeCompare(b.date))
}