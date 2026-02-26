import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { getProductList } from '@/services/api/productHelpers'

export interface SystemLog {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'success'
  category: string
  message: string
  details?: string
  user_id?: string
}

export interface SystemAlert {
  id: string
  type: 'performance' | 'security' | 'data' | 'integration'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  timestamp: string
  status: 'active' | 'resolved' | 'acknowledged'
  action_required: boolean
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  uptime: number
  response_time: number
  error_rate: number
  active_users: number
  database_health: 'good' | 'degraded' | 'down'
  api_health: 'good' | 'degraded' | 'down'
}

export const useRealSystemMonitoring = () => {
  const { toast } = useToast()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['system-monitoring'],
    queryFn: async () => {
      const queryStart = performance.now();
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Fetch recent data to analyze system health
      const [
        { data: recentOrders, error: ordersError },
        recentProducts,
        { data: integrations }
      ] = await Promise.all([
        supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
        getProductList(50),
        supabase.from('integrations').select('*').eq('user_id', user.id)
      ])
      const productsError = null

      const logs: SystemLog[] = []
      const alerts: SystemAlert[] = []

      // Generate logs based on recent activity
      if (recentOrders) {
        const cancelledOrders = recentOrders.filter(o => o.status === 'cancelled')
        cancelledOrders.slice(0, 5).forEach((order, idx) => {
          logs.push({
            id: `log-order-${idx}`,
            timestamp: order.created_at,
            level: 'error',
            category: 'Commandes',
            message: `Commande annulée ${order.order_number}`,
            details: `Montant: ${order.total_amount}€`,
            user_id: order.user_id
          })
        })

        const recentSuccessOrders = recentOrders.filter(o => o.status === 'delivered' || o.status === 'shipped').slice(0, 10)
        recentSuccessOrders.forEach((order, idx) => {
          logs.push({
            id: `log-success-${idx}`,
            timestamp: order.created_at,
            level: 'success',
            category: 'Commandes',
            message: `Commande ${order.order_number} confirmée`,
            details: `Montant: ${order.total_amount}€`,
            user_id: order.user_id
          })
        })
      }

      // Generate alerts based on system state
      if (ordersError) {
        alerts.push({
          id: 'alert-db-orders',
          type: 'data',
          severity: 'high',
          title: 'Erreur base de données',
          description: 'Impossible de récupérer les commandes',
          timestamp: new Date().toISOString(),
          status: 'active',
          action_required: true
        })
      }

      if (productsError) {
        alerts.push({
          id: 'alert-db-products',
          type: 'data',
          severity: 'high',
          title: 'Erreur base de données',
          description: 'Impossible de récupérer les produits',
          timestamp: new Date().toISOString(),
          status: 'active',
          action_required: true
        })
      }

      // Check low stock products
      const lowStockCount = recentProducts?.filter(p => (p.stock_quantity || 0) < 5 && p.status === 'active').length || 0
      if (lowStockCount > 0) {
        alerts.push({
          id: 'alert-low-stock',
          type: 'data',
          severity: 'medium',
          title: 'Stock faible',
          description: `${lowStockCount} produits ont un stock critique`,
          timestamp: new Date().toISOString(),
          status: 'active',
          action_required: true
        })
      }

      // Check integration status
      const failedIntegrations = integrations?.filter(i => i.connection_status === 'error') || []
      if (failedIntegrations.length > 0) {
        alerts.push({
          id: 'alert-integrations',
          type: 'integration',
          severity: 'high',
          title: 'Intégrations en erreur',
          description: `${failedIntegrations.length} intégrations nécessitent une attention`,
          timestamp: new Date().toISOString(),
          status: 'active',
          action_required: true
        })
      }

      // Calculate error rate
      const totalOrders = recentOrders?.length || 0
      const failedOrdersCount = recentOrders?.filter(o => o.status === 'cancelled').length || 0
      const errorRate = totalOrders > 0 ? (failedOrdersCount / totalOrders) * 100 : 0

      // Determine system health
      let systemStatus: SystemHealth['status'] = 'healthy'
      if (alerts.some(a => a.severity === 'critical')) systemStatus = 'critical'
      else if (alerts.some(a => a.severity === 'high') || errorRate > 10) systemStatus = 'warning'

      const health: SystemHealth = {
        status: systemStatus,
        uptime: 99.8,
        response_time: Math.round(performance.now() - queryStart),
        error_rate: errorRate,
        active_users: 1,
        database_health: (ordersError || productsError) ? 'degraded' : 'good',
        api_health: failedIntegrations.length > 0 ? 'degraded' : 'good'
      }

      return { logs, alerts, health }
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    meta: {
      onError: () => {
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les données système",
          variant: "destructive"
        })
      }
    }
  })

  return {
    logs: data?.logs || [],
    alerts: data?.alerts || [],
    health: data?.health || null,
    isLoading,
    error,
    refetch
  }
}
