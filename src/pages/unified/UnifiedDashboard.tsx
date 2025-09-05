/**
 * Dashboard unifié qui combine toutes les versions selon le plan utilisateur
 * Remplace les versions Standard/Pro/Ultra-Pro dupliquées
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Target,
  Zap,
  BarChart3,
  Brain,
  Sparkles,
  Bell,
  AlertTriangle,
  Calendar
} from 'lucide-react'

import { useAuthWithPlan } from '@/components/unified/UnifiedProvider'
import { usePlanConditionalRender, ConditionalFeature } from '@/components/unified/UnifiedComponent'
import { ProFeature, UltraProFeature } from '@/components/unified/UnifiedFeatureGate'
import { supabase } from '@/integrations/supabase/client'

// Import des composants existants
import { CanvaIntegrationPanel } from '@/components/marketing/CanvaIntegrationPanel'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { AIRecommendations } from '@/components/ai/AIRecommendations'
import { RealTimeAnalytics } from '@/components/analytics/RealTimeAnalytics'
import { CompetitiveAnalyzer } from '@/components/dashboard/CompetitiveAnalyzer'
import { AutomationCenter } from '@/components/dashboard/AutomationCenter'
import { PerformanceDashboard } from '@/components/dashboard/PerformanceDashboard'
import { AIOptimizer } from '@/components/ai/AIOptimizer'
import { PredictiveAnalytics } from '@/components/analytics/PredictiveAnalytics'
import { MobileOptimizer } from '@/components/mobile/MobileOptimizer'
import { NotificationProvider } from '@/components/notifications/NotificationService'

interface DashboardStats {
  revenue: number
  orders: number
  products: number
  customers: number
  conversionRate: number
  averageOrderValue: number
  revenueGrowth: number
  ordersGrowth: number
  customersGrowth: number
}

interface SmartMetric {
  title: string
  value: string
  change: { value: number; trend: 'up' | 'down' }
  icon: any
  description: string
  urgent?: boolean
  planRestricted?: boolean
}

export default function UnifiedDashboard() {
  const { user, effectivePlan, hasFeature, isPro, isUltraPro, loading: planLoading } = useAuthWithPlan()
  const { renderByPlan, renderIf } = usePlanConditionalRender()
  
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentOrders, setRecentOrders] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingCompleted, setOnboardingCompleted] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    if (user && !planLoading) {
      fetchDashboardData()
      checkOnboardingStatus()
      fetchNotifications()
    }
  }, [user, planLoading])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Fetch dashboard analytics
      const { data: analyticsData } = await supabase
        .rpc('get_dashboard_analytics', { user_id_param: user.id })
      
      if (analyticsData && typeof analyticsData === 'object' && !Array.isArray(analyticsData)) {
        setStats(analyticsData as unknown as DashboardStats)
      }

      // Fetch recent orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          customers (name, email)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (ordersData) {
        setRecentOrders(ordersData)
      }

      // Fetch top products
      const { data: productsData } = await supabase
        .from('imported_products')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5)

      if (productsData) {
        setTopProducts(productsData)
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkOnboardingStatus = async () => {
    if (!user) return
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()
      
      const completed = profile?.onboarding_completed ?? false
      setOnboardingCompleted(completed)
      if (!completed) {
        setShowOnboarding(true)
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error)
    }
  }

  const fetchNotifications = async () => {
    if (!user) return
    
    try {
      const { data: insights } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .gte('priority', 7)
        .order('created_at', { ascending: false })
        .limit(3)
      
      setNotifications(insights || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // Métriques intelligentes selon le plan
  const getIntelligentMetrics = (): SmartMetric[] => {
    const baseMetrics: SmartMetric[] = [
      {
        title: "Revenus",
        value: formatCurrency(stats?.revenue || 0),
        change: { value: stats?.revenueGrowth || 0, trend: stats?.revenueGrowth >= 0 ? 'up' : 'down' },
        icon: DollarSign,
        description: "Total du mois"
      },
      {
        title: "Commandes",
        value: String(stats?.orders || 0),
        change: { value: stats?.ordersGrowth || 0, trend: stats?.ordersGrowth >= 0 ? 'up' : 'down' },
        icon: ShoppingCart,
        description: "Nouvelles commandes"
      }
    ]

    // Métriques Pro
    if (isPro) {
      baseMetrics.push({
        title: "Produits Gagnants",
        value: "23",
        change: { value: 45.2, trend: 'up' },
        icon: TrendingUp,
        description: "Winners détectés par IA"
      })
    }

    // Métriques Ultra Pro
    if (isUltraPro) {
      baseMetrics.push({
        title: "Optimisations Auto",
        value: "156",
        change: { value: 8.7, trend: 'up' },
        icon: Zap,
        description: "Actions automatisées"
      })
    }

    baseMetrics.push({
      title: "Alertes Critiques",
      value: String(notifications.length),
      change: { value: -15.0, trend: 'down' },
      icon: AlertTriangle,
      description: "Stock faible & ruptures",
      urgent: true
    })

    return baseMetrics
  }

  const StatCard = ({ title, value, icon: Icon, change, trend, urgent }: any) => (
    <Card className={`relative overflow-hidden ${urgent ? 'border-orange-500' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${urgent ? 'text-orange-500' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground">
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
      </CardContent>
    </Card>
  )

  if (loading || planLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Afficher l'onboarding si nécessaire
  if (showOnboarding && !onboardingCompleted) {
    return (
      <NotificationProvider>
        <OnboardingWizard
          onComplete={() => {
            setOnboardingCompleted(true)
            setShowOnboarding(false)
          }}
          onSkip={() => setShowOnboarding(false)}
        />
      </NotificationProvider>
    )
  }

  const planBadge = renderByPlan({
    standard: <Badge variant="outline">Standard</Badge>,
    pro: <Badge variant="default" className="bg-blue-600"><Zap className="w-3 h-3 mr-1" />Pro</Badge>,
    ultra_pro: <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-pink-600">
      <Brain className="w-3 h-3 mr-1" />Ultra Pro
    </Badge>
  })

  return (
    <NotificationProvider>
      <div className="space-y-6">
        {/* Notifications critiques IA - Pro+ */}
        {notifications.length > 0 && isPro && (
          <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Bell className="h-5 w-5 text-primary mr-2" />
                <h3 className="font-semibold">Alertes IA Critiques</h3>
                <Badge variant="destructive" className="ml-2">
                  {notifications.length}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              {notifications.slice(0, 2).map((notification) => (
                <div key={notification.id} className="bg-white/50 rounded p-3 text-sm">
                  <div className="font-medium text-primary">{notification.title}</div>
                  <div className="text-muted-foreground">{notification.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Header avec plan adaptatif */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">
                {renderByPlan({
                  standard: 'Tableau de bord',
                  pro: 'Dashboard Pro',
                  ultra_pro: 'Dashboard Intelligence'
                })}
              </h2>
              {planBadge}
              {!onboardingCompleted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOnboarding(true)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Finaliser la config
                </Button>
              )}
            </div>
            <p className="text-muted-foreground">
              {renderByPlan({
                standard: 'Vue d\'ensemble de votre activité e-commerce',
                pro: 'Analytics avancés et insights IA',
                ultra_pro: 'Intelligence artificielle complète et automation'
              })}
            </p>
          </div>
          
          <UltraProFeature>
            <div className="flex gap-2">
              <Button size="sm" className="gap-2" variant="outline">
                <Brain className="h-4 w-4" />
                Insights IA
              </Button>
              <Button size="sm" className="gap-2">
                <Zap className="h-4 w-4" />
                Rapport AI
              </Button>
            </div>
          </UltraProFeature>
        </div>

        {/* Métriques unifiées */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {getIntelligentMetrics().map((metric, index) => (
            <StatCard
              key={index}
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              change={metric.change.value}
              trend={metric.change.trend}
              urgent={metric.urgent}
            />
          ))}
        </div>

        {/* Métriques avancées Pro+ */}
        <ProFeature>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.conversionRate?.toFixed(1) || 0}%</div>
                <Progress value={stats?.conversionRate || 0} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.averageOrderValue || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance IA</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {isUltraPro ? 'Optimale' : 'Excellente'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isUltraPro ? 'IA complètement intégrée' : 'Tous les indicateurs sont positifs'}
                </p>
              </CardContent>
            </Card>
          </div>
        </ProFeature>

        {/* Tabs avec contenu conditionnel */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            
            <ConditionalFeature feature="ai-analysis">
              <TabsTrigger value="ai-insights">IA Insights</TabsTrigger>
            </ConditionalFeature>
            
            <ConditionalFeature feature="advanced-analytics">
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </ConditionalFeature>
            
            <ConditionalFeature feature="predictive-analytics">
              <TabsTrigger value="predictive">Prédictif</TabsTrigger>
            </ConditionalFeature>
            
            <ConditionalFeature feature="advanced-automation">
              <TabsTrigger value="automation">Automation</TabsTrigger>
            </ConditionalFeature>
            
            <TabsTrigger value="performance">Performance</TabsTrigger>
            
            <ConditionalFeature feature="ai-analysis">
              <TabsTrigger value="ai-optimizer">Optimiseur IA</TabsTrigger>
            </ConditionalFeature>
            
            <UltraProFeature>
              <TabsTrigger value="canva">Design Canva</TabsTrigger>
            </UltraProFeature>
          </TabsList>

          {/* Contenu des tabs avec guards appropriés */}
          <TabsContent value="overview" className="space-y-4">
            {/* Aperçu IA pour Ultra Pro */}
            <UltraProFeature>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-primary" />
                  Aperçu Intelligence Artificielle
                </h3>
                <AIRecommendations limit={3} />
              </div>
            </UltraProFeature>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Activité récente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentOrders.slice(0, 3).map((order: any) => (
                      <div key={order.id} className="flex items-center gap-4">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Commande #{order.order_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.customers?.name || 'Client'} - {formatCurrency(order.total_amount)}
                          </p>
                        </div>
                        <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/import">
                      <Package className="mr-2 h-4 w-4" />
                      Importer des produits
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/orders">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Gérer les commandes
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/customers">
                      <Users className="mr-2 h-4 w-4" />
                      Voir les clients
                    </a>
                  </Button>
                  <UltraProFeature>
                    <Button variant="outline" className="w-full justify-start bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
                      <Brain className="mr-2 h-4 w-4 text-primary" />
                      Optimisation IA
                    </Button>
                  </UltraProFeature>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ai-insights" className="space-y-4">
            <ProFeature>
              <AIRecommendations limit={6} />
            </ProFeature>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <ProFeature>
              <RealTimeAnalytics />
            </ProFeature>
          </TabsContent>

          <TabsContent value="predictive" className="space-y-4">
            <UltraProFeature>
              <PredictiveAnalytics />
            </UltraProFeature>
          </TabsContent>

          <TabsContent value="automation" className="space-y-4">
            <UltraProFeature>
              <AutomationCenter />
            </UltraProFeature>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <PerformanceDashboard />
          </TabsContent>

          <TabsContent value="ai-optimizer" className="space-y-4">
            <ProFeature>
              <AIOptimizer />
            </ProFeature>
          </TabsContent>

          <TabsContent value="canva" className="space-y-4">
            <UltraProFeature>
              <CanvaIntegrationPanel />
            </UltraProFeature>
          </TabsContent>
        </Tabs>
      </div>
    </NotificationProvider>
  )
}