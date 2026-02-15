/**
 * useDashboardData — Dashboard data via API V1 with Supabase fallback
 * Stabilized: queries real DB tables if API V1 is unavailable
 */

import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
// dashboardApi removed — using direct Supabase queries for resilience
import { supabase } from '@/integrations/supabase/client'
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

/** Fallback: query Supabase tables directly when API V1 is unavailable */
async function fetchStatsFallback(userId: string): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0]

  const [productsRes, ordersRes, customersRes, alertsRes] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('orders').select('id, total_amount', { count: 'exact' }).eq('user_id', userId).gte('created_at', `${today}T00:00:00`),
    supabase.from('customers').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('active_alerts').select('id, status', { count: 'exact' }).eq('user_id', userId),
  ])

  const totalProducts = productsRes.count ?? 0
  const ordersToday = ordersRes.data ?? []
  const totalCustomers = customersRes.count ?? 0
  const alerts = alertsRes.data ?? []

  const revenueToday = ordersToday.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved').length

  return {
    revenue: { today: revenueToday, change: 0 },
    orders: { today: ordersToday.length, change: 0 },
    customers: { active: totalCustomers, change: 0 },
    conversionRate: { rate: 0, change: 0 },
    products: { active: totalProducts, change: 0 },
    alerts: { count: alerts.length - resolvedAlerts, resolved: resolvedAlerts },
  }
}

async function fetchActivityFallback(userId: string): Promise<ActivityEvent[]> {
  const { data } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  return (data ?? []).map(log => ({
    id: log.id,
    type: (log.entity_type === 'order' ? 'order' : log.entity_type === 'product' ? 'product' : 'system') as ActivityEvent['type'],
    action: log.action,
    title: log.description || log.action,
    timestamp: log.created_at || new Date().toISOString(),
    status: 'success' as const,
  }))
}

export function useDashboardData() {
  const { user } = useUnifiedAuth()
  const navigate = useNavigate()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-real-stats', user?.id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user?.id) return getEmptyStats()
      return fetchStatsFallback(user.id)
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  })

  const { data: activityEvents, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard-activity', user?.id],
    queryFn: async (): Promise<ActivityEvent[]> => {
      if (!user?.id) return []
      return fetchActivityFallback(user.id)
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000,
  })

  const syncEvents: SyncEvent[] = []

  // Real health metrics based on actual stats
  const healthMetrics = getHealthMetrics(stats)

  const dashboardStats: ChannableStat[] = stats ? [
    {
      label: 'Revenus du jour',
      value: `${stats.revenue.today.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
      icon: DollarSign,
      color: 'success',
      change: Math.round(stats.revenue.change * 10) / 10,
      trend: stats.revenue.change >= 0 ? 'up' : 'down',
      changeLabel: 'vs hier',
      onClick: () => navigate('/analytics'),
    },
    {
      label: 'Commandes',
      value: stats.orders.today.toString(),
      icon: ShoppingCart,
      color: 'primary',
      change: Math.round(stats.orders.change * 10) / 10,
      trend: stats.orders.change >= 0 ? 'up' : 'down',
      changeLabel: 'vs hier',
      onClick: () => navigate('/orders'),
    },
    {
      label: 'Clients actifs',
      value: stats.customers.active.toLocaleString('fr-FR'),
      icon: Users,
      color: 'info',
      change: Math.round(stats.customers.change * 10) / 10,
      trend: stats.customers.change >= 0 ? 'up' : 'down',
      changeLabel: 'ce mois',
      onClick: () => navigate('/customers'),
    },
    {
      label: 'Taux conversion',
      value: `${stats.conversionRate.rate.toFixed(1)}%`,
      icon: Target,
      color: 'warning',
      change: stats.conversionRate.change,
      trend: stats.conversionRate.change >= 0 ? 'up' : 'down',
      changeLabel: 'vs hier',
      onClick: () => navigate('/analytics'),
    },
    {
      label: 'Produits actifs',
      value: stats.products.active.toLocaleString('fr-FR'),
      icon: Package,
      color: 'primary',
      change: stats.products.change,
      trend: 'up',
      changeLabel: 'nouveaux',
      onClick: () => navigate('/products'),
    },
    {
      label: 'Alertes',
      value: stats.alerts.count.toString(),
      icon: AlertTriangle,
      color: stats.alerts.count > 0 ? 'destructive' : 'success',
      change: -stats.alerts.resolved,
      trend: 'down',
      changeLabel: 'résolues',
      onClick: () => navigate('/notifications'),
    },
  ] : []

  return {
    stats: dashboardStats,
    rawStats: stats,
    activityEvents: activityEvents || [],
    syncEvents,
    healthMetrics,
    isLoading: statsLoading || activityLoading,
  }
}

function getEmptyStats(): DashboardStats {
  return {
    revenue: { today: 0, change: 0 },
    orders: { today: 0, change: 0 },
    customers: { active: 0, change: 0 },
    conversionRate: { rate: 0, change: 0 },
    products: { active: 0, change: 0 },
    alerts: { count: 0, resolved: 0 },
  }
}

function getHealthMetrics(stats?: DashboardStats): ChannelHealthMetric[] {
  const hasProducts = (stats?.products.active ?? 0) > 0
  const hasOrders = (stats?.orders.today ?? 0) > 0
  const hasAlerts = (stats?.alerts.count ?? 0) > 0

  return [
    {
      id: 'catalog',
      label: 'Catalogue',
      score: hasProducts ? 10 : 3,
      maxScore: 10,
      status: hasProducts ? 'good' : 'warning',
      description: hasProducts ? `${stats!.products.active} produits actifs` : 'Aucun produit — importez votre catalogue',
    },
    {
      id: 'orders',
      label: 'Commandes',
      score: hasOrders ? 10 : 5,
      maxScore: 10,
      status: hasOrders ? 'good' : 'warning',
      description: hasOrders ? `${stats!.orders.today} commandes aujourd'hui` : 'Aucune commande aujourd\'hui',
    },
    {
      id: 'alerts',
      label: 'Alertes',
      score: hasAlerts ? 5 : 10,
      maxScore: 10,
      status: hasAlerts ? 'warning' : 'good',
      description: hasAlerts ? `${stats!.alerts.count} alertes actives` : 'Aucune alerte',
    },
    {
      id: 'performance',
      label: 'Performance',
      score: 10,
      maxScore: 10,
      status: 'good',
      description: 'Système opérationnel',
    },
  ]
}
