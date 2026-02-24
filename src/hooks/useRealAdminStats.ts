import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { getProductList } from '@/services/api/productHelpers'

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalOrders: number
  revenue: number
  productsCount: number
  suppliersCount: number
  importJobs: number
  systemHealth: number
}

export interface RecentActivity {
  type: 'user_signup' | 'order_placed' | 'import_completed' | 'security_alert' | 'system_backup'
  message: string
  user: string
  time: string
  icon: any
  color: string
}

export const useRealAdminStats = () => {
  const { toast } = useToast()

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Fetch all data in parallel
      const [
        { count: usersCount },
        { data: orders },
        productsList,
        { data: integrations }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*'),
        getProductList(500),
        supabase.from('integrations').select('*')
      ])
      const products = productsList as any[]

      // Calculate active users (users with orders in last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const recentOrders = orders?.filter(o => 
        new Date(o.created_at || '') > thirtyDaysAgo
      ) || []
      const activeUserIds = new Set(recentOrders.map(o => o.user_id))
      const activeUsers = activeUserIds.size

      // Calculate total revenue
      const totalRevenue = orders?.reduce((sum, order) => 
        sum + (order.total_amount || 0), 0
      ) || 0

      // Count active products
      const activeProducts = products?.filter(p => p.status === 'active').length || 0

      // Count connected suppliers
      const connectedSuppliers = integrations?.filter(i => 
        i.connection_status === 'connected' && i.is_active
      ).length || 0

      // Count today's imports from jobs table
      const { count: todayImports } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('job_type', 'import')
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())

      // Get real system health from health-check
      let systemHealthScore = 100;
      try {
        const { data: healthData } = await supabase.functions.invoke('health-check');
        if (healthData?.services) {
          const services = healthData.services as Array<{ status: string }>;
          const healthyCount = services.filter(s => s.status === 'healthy').length;
          systemHealthScore = services.length > 0 ? Math.round((healthyCount / services.length) * 100) : 100;
        }
      } catch {
        systemHealthScore = 0;
      }

      return {
        totalUsers: usersCount || 0,
        activeUsers,
        totalOrders: orders?.length || 0,
        revenue: totalRevenue,
        productsCount: activeProducts,
        suppliersCount: connectedSuppliers,
        importJobs: todayImports || 0,
        systemHealth: systemHealthScore
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    meta: {
      onError: () => {
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les statistiques admin",
          variant: "destructive"
        })
      }
    }
  })

  const getRecentActivities = async (): Promise<RecentActivity[]> => {
    // Fetch recent orders and users for activity feed
    const [
      { data: recentOrders },
      { data: recentProfiles }
    ] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(10)
    ])

    const activities: RecentActivity[] = []

    // Add recent signups
    recentProfiles?.slice(0, 3).forEach((profile) => {
      activities.push({
        type: 'user_signup',
        message: 'Nouvel utilisateur inscrit',
        user: profile.company_name || profile.full_name || 'Utilisateur',
        time: getRelativeTime(profile.created_at || ''),
        icon: null,
        color: 'text-green-600'
      })
    })

    // Add recent orders
    recentOrders?.slice(0, 3).forEach((order) => {
      activities.push({
        type: 'order_placed',
        message: `Nouvelle commande #${order.order_number}`,
        user: 'Client',
        time: getRelativeTime(order.created_at || ''),
        icon: null,
        color: 'text-blue-600'
      })
    })

    return activities.sort((a, b) => {
      const timeA = parseRelativeTime(a.time)
      const timeB = parseRelativeTime(b.time)
      return timeA - timeB
    })
  }

  return {
    stats: stats || {
      totalUsers: 0,
      activeUsers: 0,
      totalOrders: 0,
      revenue: 0,
      productsCount: 0,
      suppliersCount: 0,
      importJobs: 0,
      systemHealth: 0
    },
    isLoading,
    error,
    refetch,
    getRecentActivities
  }
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins} min`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `Il y a ${diffHours}h`
  
  const diffDays = Math.floor(diffHours / 24)
  return `Il y a ${diffDays}j`
}

function parseRelativeTime(timeStr: string): number {
  if (timeStr.includes('instant')) return 0
  if (timeStr.includes('min')) return parseInt(timeStr.match(/\d+/)?.[0] || '0')
  if (timeStr.includes('h')) return parseInt(timeStr.match(/\d+/)?.[0] || '0') * 60
  if (timeStr.includes('j')) return parseInt(timeStr.match(/\d+/)?.[0] || '0') * 1440
  return 99999
}
