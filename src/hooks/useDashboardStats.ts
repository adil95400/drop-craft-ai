import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

interface DashboardStats {
  productsCount: number
  ordersCount: number
  customersCount: number
  monthlyRevenue: number
  productsChange: number
  ordersChange: number
  customersChange: number
  revenueChange: number
}

export function useDashboardStats() {
  const { user } = useAuth()
  const { toast } = useToast()

  return useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      try {
        // Date calculations
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0)

        // Count products
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        // Count orders
        const { count: ordersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        // Count customers
        const { count: customersCount } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        // Monthly revenue (current month)
        const { data: currentMonthOrders } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('user_id', user.id)
          .eq('status', 'delivered')
          .gte('created_at', startOfMonth.toISOString())

        const monthlyRevenue = currentMonthOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

        // Previous month revenue
        const { data: prevMonthOrders } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('user_id', user.id)
          .eq('status', 'delivered')
          .gte('created_at', startOfPrevMonth.toISOString())
          .lte('created_at', endOfPrevMonth.toISOString())

        const prevMonthRevenue = prevMonthOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

        // Products count from previous month
        const { count: prevMonthProductsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .lte('created_at', endOfPrevMonth.toISOString())

        // Orders count from previous month
        const { count: prevMonthOrdersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .lte('created_at', endOfPrevMonth.toISOString())

        // Customers count from previous month
        const { count: prevMonthCustomersCount } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .lte('created_at', endOfPrevMonth.toISOString())

        // Calculate percentage changes
        const calculateChange = (current: number, previous: number) => {
          if (previous === 0) return current > 0 ? 100 : 0
          return ((current - previous) / previous) * 100
        }

        const productsChange = calculateChange(productsCount || 0, prevMonthProductsCount || 0)
        const ordersChange = calculateChange(ordersCount || 0, prevMonthOrdersCount || 0)
        const customersChange = calculateChange(customersCount || 0, prevMonthCustomersCount || 0)
        const revenueChange = calculateChange(monthlyRevenue, prevMonthRevenue)

        return {
          productsCount: productsCount || 0,
          ordersCount: ordersCount || 0,
          customersCount: customersCount || 0,
          monthlyRevenue,
          productsChange,
          ordersChange,
          customersChange,
          revenueChange
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les statistiques du tableau de bord',
          variant: 'destructive'
        })
        throw error
      }
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  })
}
