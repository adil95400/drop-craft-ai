/**
 * useDashboardData — Récupère les données réelles du dashboard depuis la base de données
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { ActivityEvent } from '@/components/channable/ChannableActivityFeed'
import { SyncEvent } from '@/components/channable/ChannableSyncTimeline'
import { ChannableStat } from '@/components/channable/types'
import { DollarSign, ShoppingCart, Users, Target, Package, AlertTriangle } from 'lucide-react'

interface DashboardStats {
  revenue: { today: number; change: number }
  orders: { today: number; change: number }
  customers: { active: number; change: number }
  conversionRate: { rate: number; change: number }
  products: { active: number; change: number }
  alerts: { count: number; resolved: number }
}

interface ChannelHealthMetric {
  id: string
  label: string
  score: number
  maxScore: number
  status: 'good' | 'warning' | 'critical'
  description?: string
}

export function useDashboardData() {
  const { user } = useUnifiedAuth()

  // Récupérer les statistiques principales
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-real-stats', user?.id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user?.id) return getEmptyStats()

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

      // Requêtes parallèles pour les stats
      const [ordersResult, productsResult, customersResult, alertsResult] = await Promise.all([
        // Commandes
        supabase
          .from('orders')
          .select('total_amount, status, created_at')
          .eq('user_id', user.id),
        // Produits
        supabase
          .from('products')
          .select('id, status, created_at')
          .eq('user_id', user.id),
        // Clients
        supabase
          .from('customers')
          .select('id, total_orders, created_at')
          .eq('user_id', user.id),
        // Alertes
        supabase
          .from('active_alerts')
          .select('id, acknowledged, status')
          .eq('user_id', user.id)
      ])

      const orders = ordersResult.data || []
      const products = productsResult.data || []
      const customers = customersResult.data || []
      const alerts = alertsResult.data || []

      // Calculer les revenus
      const ordersToday = orders.filter(o => new Date(o.created_at) >= today)
      const ordersYesterday = orders.filter(o => 
        new Date(o.created_at) >= yesterday && new Date(o.created_at) < today
      )
      
      const revenueToday = ordersToday
        .filter(o => ['delivered', 'completed', 'processing', 'shipped'].includes(o.status || ''))
        .reduce((sum, o) => sum + (o.total_amount || 0), 0)
      
      const revenueYesterday = ordersYesterday
        .filter(o => ['delivered', 'completed', 'processing', 'shipped'].includes(o.status || ''))
        .reduce((sum, o) => sum + (o.total_amount || 0), 0)
      
      const revenueChange = revenueYesterday > 0 
        ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100 
        : 0

      // Commandes aujourd'hui
      const ordersTodayCount = ordersToday.length
      const ordersYesterdayCount = ordersYesterday.length
      const ordersChange = ordersYesterdayCount > 0 
        ? ((ordersTodayCount - ordersYesterdayCount) / ordersYesterdayCount) * 100 
        : 0

      // Clients actifs
      const activeCustomers = customers.filter(c => (c.total_orders || 0) > 0).length
      const customersThisMonth = customers.filter(c => new Date(c.created_at) >= thisMonth).length
      const customersLastMonth = customers.filter(c => 
        new Date(c.created_at) >= lastMonth && new Date(c.created_at) < thisMonth
      ).length
      const customerChange = customersLastMonth > 0 
        ? ((customersThisMonth - customersLastMonth) / customersLastMonth) * 100 
        : 0

      // Taux de conversion
      const totalVisitors = customers.length || 1
      const conversionRate = (orders.length / totalVisitors) * 100
      
      // Produits actifs
      const activeProducts = products.filter(p => p.status === 'active').length
      const productsThisMonth = products.filter(p => new Date(p.created_at) >= thisMonth).length

      // Alertes
      const unresolvedAlerts = alerts.filter(a => !a.acknowledged && a.status === 'active').length
      const resolvedAlerts = alerts.filter(a => a.acknowledged).length

      return {
        revenue: { today: revenueToday, change: revenueChange },
        orders: { today: ordersTodayCount, change: ordersChange },
        customers: { active: activeCustomers, change: customerChange },
        conversionRate: { rate: conversionRate, change: 0 },
        products: { active: activeProducts, change: productsThisMonth },
        alerts: { count: unresolvedAlerts, resolved: resolvedAlerts }
      }
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000
  })

  // Récupérer l'activité récente
  const { data: activityEvents, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard-activity', user?.id],
    queryFn: async (): Promise<ActivityEvent[]> => {
      if (!user?.id) return []

      const [ordersResult, productsResult, alertsResult] = await Promise.all([
        supabase
          .from('orders')
          .select('id, order_number, total_amount, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('products')
          .select('id, title, price, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('active_alerts')
          .select('id, title, message, severity, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)
      ])

      const events: ActivityEvent[] = []

      // Ajouter les commandes
      for (const order of ordersResult.data || []) {
        events.push({
          id: `order-${order.id}`,
          type: 'order',
          action: 'new_order',
          title: `Commande ${order.order_number}`,
          description: `Montant: ${(order.total_amount || 0).toFixed(2)} €`,
          timestamp: order.created_at,
          metadata: { value: `${(order.total_amount || 0).toFixed(2)} €`, trend: 'up' as const },
          status: order.status === 'delivered' ? 'success' : 'info'
        })
      }

      // Ajouter les produits
      for (const product of productsResult.data || []) {
        events.push({
          id: `product-${product.id}`,
          type: 'product',
          action: 'product_added',
          title: `Produit ajouté`,
          description: product.title || 'Sans titre',
          timestamp: product.created_at,
          metadata: { value: `${(product.price || 0).toFixed(2)} €` },
          status: 'success'
        })
      }

      // Ajouter les alertes
      for (const alert of alertsResult.data || []) {
        events.push({
          id: `alert-${alert.id}`,
          type: 'alert',
          action: 'alert',
          title: alert.title,
          description: alert.message || undefined,
          timestamp: alert.created_at,
          status: alert.severity === 'critical' ? 'error' : 'warning'
        })
      }

      // Trier par date
      return events.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 10)
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000
  })

  // Récupérer les événements de synchronisation
  const { data: syncEvents, isLoading: syncLoading } = useQuery({
    queryKey: ['dashboard-sync-events', user?.id],
    queryFn: async (): Promise<SyncEvent[]> => {
      if (!user?.id) return []

      // Essayer de récupérer depuis activity_logs
      const { data: logs } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .in('action', ['sync', 'import', 'export', 'update'])
        .order('created_at', { ascending: false })
        .limit(10)

      if (logs && logs.length > 0) {
        return logs.map((log, index) => ({
          id: log.id,
          type: (log.action === 'sync' ? 'full' : log.action) as 'full' | 'products' | 'prices' | 'inventory',
          status: log.severity === 'error' ? 'error' as const : 'success' as const,
          timestamp: log.created_at,
          items_processed: (log.details as any)?.count || 0,
          duration_ms: (log.details as any)?.duration || 0,
          message: log.description || log.action
        }))
      }

      // Retourner un tableau vide si pas de données
      return []
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000
  })

  // Récupérer les métriques de santé des canaux
  const { data: healthMetrics, isLoading: healthLoading } = useQuery({
    queryKey: ['dashboard-health-metrics', user?.id],
    queryFn: async (): Promise<ChannelHealthMetric[]> => {
      if (!user?.id) return getDefaultHealthMetrics()

      // Vérifier les différentes connexions
      const [suppliersResult, productsResult, ordersResult] = await Promise.all([
        supabase
          .from('suppliers')
          .select('id, status')
          .eq('user_id', user.id),
        supabase
          .from('products')
          .select('id, status')
          .eq('user_id', user.id),
        supabase
          .from('orders')
          .select('id, status')
          .eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ])

      const suppliers = suppliersResult.data || []
      const products = productsResult.data || []
      const recentOrders = ordersResult.data || []

      // Calculer les scores
      const activeSuppliers = suppliers.filter(s => s.status === 'active').length
      const connectionScore = suppliers.length > 0 ? Math.min(10, activeSuppliers * 2) : 5
      
      const activeProducts = products.filter(p => p.status === 'active').length
      const dataQualityScore = products.length > 0 ? Math.min(10, Math.round((activeProducts / products.length) * 10)) : 5

      const successfulOrders = recentOrders.filter(o => !['cancelled', 'failed'].includes(o.status || '')).length
      const syncScore = recentOrders.length > 0 ? Math.min(10, Math.round((successfulOrders / recentOrders.length) * 10)) : 8

      const performanceScore = 9 // Base performance

      return [
        {
          id: 'connection',
          label: 'Connexion',
          score: connectionScore,
          maxScore: 10,
          status: connectionScore >= 7 ? 'good' : connectionScore >= 4 ? 'warning' : 'critical',
          description: 'État des connexions aux fournisseurs'
        },
        {
          id: 'sync',
          label: 'Synchronisation',
          score: syncScore,
          maxScore: 10,
          status: syncScore >= 7 ? 'good' : syncScore >= 4 ? 'warning' : 'critical',
          description: 'Succès des commandes récentes'
        },
        {
          id: 'data-quality',
          label: 'Qualité données',
          score: dataQualityScore,
          maxScore: 10,
          status: dataQualityScore >= 7 ? 'good' : dataQualityScore >= 4 ? 'warning' : 'critical',
          description: 'Produits actifs vs total'
        },
        {
          id: 'performance',
          label: 'Performance',
          score: performanceScore,
          maxScore: 10,
          status: 'good',
          description: 'Performance système'
        },
      ]
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000
  })

  // Convertir les stats en format ChannableStat
  const dashboardStats: ChannableStat[] = stats ? [
    {
      label: 'Revenus du jour',
      value: `${stats.revenue.today.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
      icon: DollarSign,
      color: 'success',
      change: Math.round(stats.revenue.change * 10) / 10,
      trend: stats.revenue.change >= 0 ? 'up' : 'down',
      changeLabel: 'vs hier'
    },
    {
      label: 'Commandes',
      value: stats.orders.today.toString(),
      icon: ShoppingCart,
      color: 'primary',
      change: Math.round(stats.orders.change * 10) / 10,
      trend: stats.orders.change >= 0 ? 'up' : 'down',
      changeLabel: 'vs hier'
    },
    {
      label: 'Clients actifs',
      value: stats.customers.active.toLocaleString('fr-FR'),
      icon: Users,
      color: 'info',
      change: Math.round(stats.customers.change * 10) / 10,
      trend: stats.customers.change >= 0 ? 'up' : 'down',
      changeLabel: 'ce mois'
    },
    {
      label: 'Taux conversion',
      value: `${stats.conversionRate.rate.toFixed(1)}%`,
      icon: Target,
      color: 'warning',
      change: stats.conversionRate.change,
      trend: stats.conversionRate.change >= 0 ? 'up' : 'down',
      changeLabel: 'vs hier'
    },
    {
      label: 'Produits actifs',
      value: stats.products.active.toLocaleString('fr-FR'),
      icon: Package,
      color: 'primary',
      change: stats.products.change,
      trend: 'up',
      changeLabel: 'nouveaux'
    },
    {
      label: 'Alertes',
      value: stats.alerts.count.toString(),
      icon: AlertTriangle,
      color: stats.alerts.count > 0 ? 'destructive' : 'success',
      change: -stats.alerts.resolved,
      trend: 'down',
      changeLabel: 'résolues'
    }
  ] : []

  return {
    stats: dashboardStats,
    rawStats: stats,
    activityEvents: activityEvents || [],
    syncEvents: syncEvents || [],
    healthMetrics: healthMetrics || getDefaultHealthMetrics(),
    isLoading: statsLoading || activityLoading || syncLoading || healthLoading,
  }
}

function getEmptyStats(): DashboardStats {
  return {
    revenue: { today: 0, change: 0 },
    orders: { today: 0, change: 0 },
    customers: { active: 0, change: 0 },
    conversionRate: { rate: 0, change: 0 },
    products: { active: 0, change: 0 },
    alerts: { count: 0, resolved: 0 }
  }
}

function getDefaultHealthMetrics(): ChannelHealthMetric[] {
  return [
    { id: 'connection', label: 'Connexion', score: 10, maxScore: 10, status: 'good', description: 'État de la connexion' },
    { id: 'sync', label: 'Synchronisation', score: 10, maxScore: 10, status: 'good', description: 'État des syncs' },
    { id: 'data-quality', label: 'Qualité données', score: 10, maxScore: 10, status: 'good', description: 'Qualité des données' },
    { id: 'performance', label: 'Performance', score: 10, maxScore: 10, status: 'good', description: 'Performance système' },
  ]
}
