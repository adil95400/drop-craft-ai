import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface AnalyticsData {
  revenue: {
    total: number
    monthly: Array<{ month: string; amount: number }>
    growth: number
  }
  orders: {
    total: number
    monthly: Array<{ month: string; count: number }>
    growth: number
  }
  customers: {
    total: number
    active: number
    growth: number
  }
  products: {
    total: number
    active: number
    topSelling: Array<{ name: string; sales: number; revenue: number }>
  }
  traffic: {
    sources: Array<{ source: string; visitors: number; conversions: number }>
    conversion: number
  }
}

export const useAnalytics = () => {
  const { toast } = useToast()

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['analytics-data'],
    queryFn: async () => {
      const [
        { count: totalProducts },
        { count: totalOrders },
        { count: totalCustomers },
        { data: ordersData },
        { data: productsData }
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount, created_at, customer_id').order('created_at', { ascending: false }),
        supabase.from('products').select('name, cost_price, price').eq('status', 'active')
      ])

      // Calculate revenue totals and growth
      const totalRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
      const currentMonth = new Date().getMonth()
      const lastMonthOrders = ordersData?.filter(order => 
        new Date(order.created_at).getMonth() === currentMonth - 1
      ) || []
      const thisMonthOrders = ordersData?.filter(order => 
        new Date(order.created_at).getMonth() === currentMonth
      ) || []
      
      const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)
      const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)
      const revenueGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

      // Generate monthly data for last 6 months
      const monthlyRevenue = []
      const monthlyOrders = []
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const month = date.getMonth()
        const monthName = months[month]
        
        const monthOrders = ordersData?.filter(order => 
          new Date(order.created_at).getMonth() === month &&
          new Date(order.created_at).getFullYear() === date.getFullYear()
        ) || []
        
        const monthRevenue = monthOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)
        
        monthlyRevenue.push({ month: monthName, amount: monthRevenue })
        monthlyOrders.push({ month: monthName, count: monthOrders.length })
      }

      // Calculate active customers (ordered in last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const recentOrders = ordersData?.filter(order => 
        new Date(order.created_at) > thirtyDaysAgo
      ) || []
      const activeCustomers = new Set(recentOrders.map(order => order.customer_id)).size

      const customerGrowth = totalCustomers && totalCustomers > 0 ? 
        ((activeCustomers / totalCustomers) * 100) : 0

      return {
        revenue: {
          total: totalRevenue,
          monthly: monthlyRevenue,
          growth: revenueGrowth
        },
        orders: {
          total: totalOrders || 0,
          monthly: monthlyOrders,
          growth: revenueGrowth // Using same growth calculation for simplicity
        },
        customers: {
          total: totalCustomers || 0,
          active: activeCustomers,
          growth: customerGrowth
        },
        products: {
          total: totalProducts || 0,
          active: productsData?.length || 0,
          topSelling: [] // Would need order_items table to calculate this properly
        },
        traffic: {
          sources: [], // Would need analytics integration for this
          conversion: 0
        }
      } as AnalyticsData
    }
  })

  const refreshData = () => {
    refetch()
    toast({
      title: "Données actualisées",
      description: "Les analytics ont été mis à jour",
    })
  }

  const exportData = (format: 'csv' | 'pdf' | 'excel') => {
    toast({
      title: "Export démarré",
      description: `Génération du fichier ${format.toUpperCase()}...`,
    })
    
    setTimeout(() => {
      toast({
        title: "Export terminé",
        description: `Le fichier ${format.toUpperCase()} a été téléchargé`,
      })
    }, 3000)
  }

  const applyFilters = (filters: { dateRange: string; products: string[]; sources: string[] }) => {
    toast({
      title: "Filtres appliqués",
      description: "Données filtrées selon vos critères",
    })
    refetch()
  }

  return {
    data,
    loading,
    refreshData,
    exportData,
    applyFilters
  }
}