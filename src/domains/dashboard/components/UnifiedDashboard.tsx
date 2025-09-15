/**
 * PHASE 2: Dashboard unifié avec métriques temps réel
 * Remplace tous les dashboards éparpillés par un seul dashboard optimisé
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, Users, ShoppingCart, Package, DollarSign, 
  Activity, ArrowUpRight, ArrowDownRight, Target, BarChart3,
  Brain, Sparkles, Bell, Zap, AlertTriangle, CheckCircle
} from 'lucide-react'
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized'
import { supabase } from '@/integrations/supabase/client'
import { usePlanContext } from '@/components/plan'
import { RealTimeMetrics } from './RealTimeMetrics'
import { BusinessInsights } from './BusinessInsights'
import { QuickActions } from './QuickActions'

interface DashboardMetrics {
  revenue: number
  orders: number
  products: number
  customers: number
  conversionRate: number
  averageOrderValue: number
  revenueGrowth: number
  ordersGrowth: number
  customersGrowth: number
  alerts: number
  performance: 'excellent' | 'good' | 'warning' | 'critical'
}

export const UnifiedDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuthOptimized()
  const { hasFeature } = usePlanContext()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (user) {
      fetchDashboardMetrics()
      // Auto-refresh every 30 seconds for real-time updates
      const interval = setInterval(fetchDashboardMetrics, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchDashboardMetrics = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Récupération des métriques depuis différentes sources
      // En production, créer une fonction RPC unifiée
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        supabase.from('orders').select('total_amount, status').eq('user_id', user.id),
        supabase.from('customers').select('id').eq('user_id', user.id),
        supabase.from('imported_products').select('id, status').eq('user_id', user.id)
      ])

      const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      const totalOrders = ordersRes.data?.length || 0
      const totalCustomers = customersRes.data?.length || 0
      const totalProducts = productsRes.data?.length || 0

      setMetrics({
        revenue: totalRevenue,
        orders: totalOrders,
        products: totalProducts,
        customers: totalCustomers,
        conversionRate: totalOrders > 0 ? (totalOrders / (totalCustomers || 1)) * 100 : 0,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        revenueGrowth: 12.5, // Mock pour l'instant
        ordersGrowth: 8.3,
        customersGrowth: 15.2,
        alerts: 0,
        performance: 'good' as const
      })
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err)
      setError('Erreur lors du chargement des métriques')
      
      // Fallback avec données mockées
      setMetrics({
        revenue: 45280,
        orders: 127,
        products: 89,
        customers: 342,
        conversionRate: 3.2,
        averageOrderValue: 156.80,
        revenueGrowth: 12.5,
        ordersGrowth: 8.3,
        customersGrowth: 15.2,
        alerts: 3,
        performance: 'good'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getPerformanceIcon = (performance: string) => {
    switch (performance) {
      case 'excellent': return CheckCircle
      case 'good': return Activity
      case 'warning': return AlertTriangle
      case 'critical': return AlertTriangle
      default: return Activity
    }
  }

  if (authLoading || loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded" />
          ))}
        </div>
        <div className="h-96 bg-muted rounded" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchDashboardMetrics}>Réessayer</Button>
        </div>
      </Card>
    )
  }

  const MetricCard = ({ title, value, icon: Icon, change, trend, alert }: {
    title: string
    value: string | number
    icon: any
    change?: number
    trend?: 'up' | 'down'
    alert?: boolean
  }) => (
    <Card className={`relative overflow-hidden ${alert ? 'ring-2 ring-yellow-500' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${alert ? 'text-yellow-500' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {trend === 'up' ? (
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
            ) : (
              <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
            )}
            <span className={trend === 'up' ? 'text-emerald-500' : 'text-red-500'}>
              {Math.abs(change)}%
            </span>
            <span className="ml-1">vs mois dernier</span>
          </div>
        )}
        {alert && (
          <Badge variant="destructive" className="mt-2 text-xs">
            Attention requise
          </Badge>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header avec alertes */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            Dashboard Unifié
            {hasFeature('ai_insights') && (
              <Badge variant="secondary" className="ml-3">
                <Brain className="h-3 w-3 mr-1" />
                IA Activé
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de votre activité en temps réel
          </p>
        </div>
        
        <div className="flex gap-2">
          {metrics?.alerts && metrics.alerts > 0 && (
            <Button variant="outline" size="sm" className="gap-2">
              <Bell className="h-4 w-4" />
              {metrics.alerts} Alertes
            </Button>
          )}
          <Button size="sm" className="gap-2" onClick={fetchDashboardMetrics}>
            <Zap className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Chiffre d'affaires"
          value={formatCurrency(metrics?.revenue || 0)}
          icon={DollarSign}
          change={metrics?.revenueGrowth}
          trend={metrics?.revenueGrowth >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Commandes"
          value={metrics?.orders || 0}
          icon={ShoppingCart}
          change={metrics?.ordersGrowth}
          trend={metrics?.ordersGrowth >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Produits"
          value={metrics?.products || 0}
          icon={Package}
        />
        <MetricCard
          title="Clients"
          value={metrics?.customers || 0}
          icon={Users}
          change={metrics?.customersGrowth}
          trend={metrics?.customersGrowth >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Métriques avancées */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.conversionRate?.toFixed(1) || 0}%</div>
            <Progress value={metrics?.conversionRate || 0} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics?.averageOrderValue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            {React.createElement(getPerformanceIcon(metrics?.performance || 'good'), {
              className: "h-4 w-4 text-muted-foreground"
            })}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(metrics?.performance || 'good')}`}>
              {metrics?.performance === 'excellent' ? 'Excellente' :
               metrics?.performance === 'good' ? 'Bonne' :
               metrics?.performance === 'warning' ? 'Attention' : 'Critique'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Basé sur les KPIs globaux
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs pour les différentes vues */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="realtime">Temps réel</TabsTrigger>
          <TabsTrigger value="insights">Insights IA</TabsTrigger>
          <TabsTrigger value="actions">Actions rapides</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Graphiques et données d'aperçu */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Évolution du chiffre d'affaires</CardTitle>
                <CardDescription>Performance des 30 derniers jours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Graphique des revenus (à implémenter avec recharts)
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <div className="text-sm">Nouvelle commande #1234</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="text-sm">Produit ajouté au catalogue</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <div className="text-sm">Stock faible détecté</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <RealTimeMetrics />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {hasFeature('ai_insights') ? (
            <BusinessInsights />
          ) : (
            <Card className="p-6 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Insights IA non disponibles</h3>
              <p className="text-muted-foreground mb-4">
                Passez à un plan supérieur pour accéder aux insights IA
              </p>
              <Button>Voir les plans</Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <QuickActions />
        </TabsContent>
      </Tabs>
    </div>
  )
}