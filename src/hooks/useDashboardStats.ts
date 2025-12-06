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

        // Count products from all sources
        const [
          products,
          imported,
          premium,
          catalog,
          shopify,
          published,
          feed,
          supplier
        ] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('imported_products').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          (supabase as any).from('premium_products').select(`*, supplier:premium_suppliers!inner(connections:premium_supplier_connections!inner(user_id))`, { count: 'exact', head: true }).eq('supplier.connections.user_id', user.id).eq('is_active', true),
          supabase.from('catalog_products').select('*', { count: 'exact', head: true }),
          // Use the view with user_id for shopify_products
          (supabase as any).from('shopify_products_with_user').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          (supabase as any).from('published_products').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          (supabase as any).from('feed_products').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          (supabase as any).from('supplier_products').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        ])

        const productsCount = (products.count || 0) + (imported.count || 0) + (premium.count || 0) + 
                              (catalog.count || 0) + (shopify.count || 0) + (published.count || 0) + 
                              (feed.count || 0) + (supplier.count || 0)

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

        // Products count from previous month (all sources)
        const [
          prevProducts,
          prevImported,
          prevPremium,
          prevCatalog,
          prevShopify,
          prevPublished,
          prevFeed,
          prevSupplier
        ] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', user.id).lte('created_at', endOfPrevMonth.toISOString()),
          supabase.from('imported_products').select('*', { count: 'exact', head: true }).eq('user_id', user.id).lte('created_at', endOfPrevMonth.toISOString()),
          (supabase as any).from('premium_products').select(`*, supplier:premium_suppliers!inner(connections:premium_supplier_connections!inner(user_id))`, { count: 'exact', head: true }).eq('supplier.connections.user_id', user.id).eq('is_active', true).lte('created_at', endOfPrevMonth.toISOString()),
          supabase.from('catalog_products').select('*', { count: 'exact', head: true }).lte('created_at', endOfPrevMonth.toISOString()),
          // Use the view with user_id for shopify_products
          (supabase as any).from('shopify_products_with_user').select('*', { count: 'exact', head: true }).eq('user_id', user.id).lte('created_at', endOfPrevMonth.toISOString()),
          (supabase as any).from('published_products').select('*', { count: 'exact', head: true }).eq('user_id', user.id).lte('created_at', endOfPrevMonth.toISOString()),
          (supabase as any).from('feed_products').select('*', { count: 'exact', head: true }).eq('user_id', user.id).lte('created_at', endOfPrevMonth.toISOString()),
          (supabase as any).from('supplier_products').select('*', { count: 'exact', head: true }).eq('user_id', user.id).lte('created_at', endOfPrevMonth.toISOString())
        ])

        const prevMonthProductsCount = (prevProducts.count || 0) + (prevImported.count || 0) + (prevPremium.count || 0) + 
                                        (prevCatalog.count || 0) + (prevShopify.count || 0) + (prevPublished.count || 0) + 
                                        (prevFeed.count || 0) + (prevSupplier.count || 0)

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
