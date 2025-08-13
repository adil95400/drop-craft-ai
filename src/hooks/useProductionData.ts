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
          inventory(stock, warehouse)
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

  // Shipments/Tracking data - disabled until table exists
  const { data: shipments = [], isLoading: isLoadingShipments } = useQuery({
    queryKey: ['production-shipments'],
    queryFn: async () => {
      // Return empty array until shipments table is created via migration
      return []
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
    isLoadingOrders,
    customers,
    isLoadingCustomers,
    shipments,
    isLoadingShipments,
    seedDatabase: seedDatabase.mutate,
    isSeeding: seedDatabase.isPending
  }
}

// Shopify integration hooks
export const useShopifyIntegration = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const connectShopify = useMutation({
    mutationFn: async ({ shop, code, state }: { shop: string, code: string, state: string }) => {
      const { data, error } = await supabase.functions.invoke('shopify-auth', {
        body: { shop, code, state }
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast({
        title: "Shopify connected!",
        description: "Your Shopify store has been successfully connected"
      })
      queryClient.invalidateQueries({ queryKey: ['shops'] })
    }
  })

  const syncShopify = useMutation({
    mutationFn: async ({ action, productIds, shopId, range }: any) => {
      const { data, error } = await supabase.functions.invoke('sync-shopify', {
        body: { action, productIds, shopId, range }
      })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast({
        title: "Sync completed!",
        description: data.message
      })
      queryClient.invalidateQueries()
    }
  })

  return {
    connectShopify: connectShopify.mutate,
    syncShopify: syncShopify.mutate,
    isConnecting: connectShopify.isPending,
    isSyncing: syncShopify.isPending
  }
}

// BigBuy integration hooks
export const useBigBuyIntegration = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const importFromBigBuy = useMutation({
    mutationFn: async ({ category, keywords, page = 1 }: { category?: string, keywords?: string, page?: number }) => {
      const { data, error } = await supabase.functions.invoke('import-bigbuy', {
        body: { category, keywords, page }
      })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast({
        title: "Import completed!",
        description: `Successfully imported ${data.products.length} products from BigBuy`
      })
      queryClient.invalidateQueries({ queryKey: ['production-products'] })
    }
  })

  return {
    importFromBigBuy: importFromBigBuy.mutate,
    isImporting: importFromBigBuy.isPending
  }
}

// Tracking integration hooks
export const useTrackingIntegration = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const syncTracking = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('track-sync')
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast({
        title: "Tracking sync completed!",
        description: `Updated ${data.stats.updated} out of ${data.stats.checked} shipments`
      })
      queryClient.invalidateQueries({ queryKey: ['production-shipments'] })
    }
  })

  return {
    syncTracking: syncTracking.mutate,
    isSyncing: syncTracking.isPending
  }
}