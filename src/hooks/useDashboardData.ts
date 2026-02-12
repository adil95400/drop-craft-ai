/**
 * useDashboardData — Dashboard data via API V1
 */

import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { dashboardApi } from '@/services/api/client'
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
  const navigate = useNavigate()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-real-stats', user?.id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user?.id) return getEmptyStats()
      return await dashboardApi.stats()
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000
  })

  const { data: activityEvents, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard-activity', user?.id],
    queryFn: async (): Promise<ActivityEvent[]> => {
      if (!user?.id) return []
      const resp = await dashboardApi.activity({ limit: 10 })
      return (resp.items ?? []) as ActivityEvent[]
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000
  })

  const syncEvents: SyncEvent[] = []
  const healthMetrics = getDefaultHealthMetrics()

  const dashboardStats: ChannableStat[] = stats ? [
    {
      label: 'Revenus du jour',
      value: `${stats.revenue.today.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
      icon: DollarSign,
      color: 'success',
      change: Math.round(stats.revenue.change * 10) / 10,
      trend: stats.revenue.change >= 0 ? 'up' : 'down',
      changeLabel: 'vs hier',
      onClick: () => navigate('/analytics')
    },
    {
      label: 'Commandes',
      value: stats.orders.today.toString(),
      icon: ShoppingCart,
      color: 'primary',
      change: Math.round(stats.orders.change * 10) / 10,
      trend: stats.orders.change >= 0 ? 'up' : 'down',
      changeLabel: 'vs hier',
      onClick: () => navigate('/orders')
    },
    {
      label: 'Clients actifs',
      value: stats.customers.active.toLocaleString('fr-FR'),
      icon: Users,
      color: 'info',
      change: Math.round(stats.customers.change * 10) / 10,
      trend: stats.customers.change >= 0 ? 'up' : 'down',
      changeLabel: 'ce mois',
      onClick: () => navigate('/customers')
    },
    {
      label: 'Taux conversion',
      value: `${stats.conversionRate.rate.toFixed(1)}%`,
      icon: Target,
      color: 'warning',
      change: stats.conversionRate.change,
      trend: stats.conversionRate.change >= 0 ? 'up' : 'down',
      changeLabel: 'vs hier',
      onClick: () => navigate('/analytics')
    },
    {
      label: 'Produits actifs',
      value: stats.products.active.toLocaleString('fr-FR'),
      icon: Package,
      color: 'primary',
      change: stats.products.change,
      trend: 'up',
      changeLabel: 'nouveaux',
      onClick: () => navigate('/products')
    },
    {
      label: 'Alertes',
      value: stats.alerts.count.toString(),
      icon: AlertTriangle,
      color: stats.alerts.count > 0 ? 'destructive' : 'success',
      change: -stats.alerts.resolved,
      trend: 'down',
      changeLabel: 'résolues',
      onClick: () => navigate('/notifications')
    }
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
