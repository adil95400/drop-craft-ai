import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Real production data hooks
export const useProductionData = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Dashboard stats
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [
        { count: totalProducts },
        { count: totalOrders },
        { count: totalCustomers },
        { data: recentOrders },
        { data: topProducts }
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('orders')
          .select('*, customers(name)')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false }),
        supabase.from('products')
          .select('*, order_items(qty)')
          .limit(5)
      ])

      const revenue7d = recentOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
      
      return {
        totalProducts: totalProducts || 0,
        totalOrders: totalOrders || 0,
        totalCustomers: totalCustomers || 0,
        revenue7d,
        recentOrders: recentOrders || [],
        topProducts: topProducts || []
      }
    }
  })

  // Products with real data
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['production-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          suppliers(name, slug),
          inventory_levels(stock, warehouse)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    }
  })

  // Orders with real data
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['production-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers(name, email, country),
          order_items(*, products(title, sku)),
          shipments(tracking_number, carrier, status)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return data || []
    }
  })

  // Get shipments data
  const { data: shipmentsData = [], isLoading: isLoadingShipments } = useQuery({
    queryKey: ['production-shipments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          orders!inner(
            id,
            order_number,
            total_amount,
            customers(name, email)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (error) throw error
      return data || []
    }
  })

  // Customers with real data
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['production-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          orders(total_amount, status, created_at)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data?.map(customer => ({
        ...customer,
        total_spent: customer.orders?.reduce((sum: number, order: any) => sum + Number(order.total_amount), 0) || 0,
        total_orders: customer.orders?.length || 0
      })) || []
    }
  })

  // Seed database mutation
  const seedDatabase = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('seed-dev')
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast({
        title: "Database seeded successfully!",
        description: `Created ${data.data.products} products, ${data.data.orders} orders, ${data.data.customers} customers`
      })
      queryClient.invalidateQueries()
    },
    onError: (error) => {
      toast({
        title: "Seeding failed",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  return {
    dashboardStats,
    isLoadingStats,
    products,
    isLoadingProducts,
    orders,
    ordersData: orders, // Alias for compatibility
    isLoadingOrders,
    customers,
    customersData: customers, // Alias for compatibility  
    isLoadingCustomers,
    shipmentsData,
    isLoadingShipments,
    seedDatabase: seedDatabase.mutate,
    isSeeding: seedDatabase.isPending
  }
}