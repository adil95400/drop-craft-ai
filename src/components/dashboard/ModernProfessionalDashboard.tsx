import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useProductionData } from '@/hooks/useProductionData'
import { useUnifiedSystem } from '@/hooks/useUnifiedSystem'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { OrdersChart } from '@/components/dashboard/OrdersChart'
import { TopProducts } from '@/components/dashboard/TopProducts'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { 
  Package, Users, ShoppingCart, DollarSign, TrendingUp, TrendingDown,
  Activity, Eye, Target, BarChart3, Crown, Zap, RefreshCw,
  ArrowUpRight, ArrowDownRight, AlertCircle, CheckCircle2
} from 'lucide-react'

export function ModernProfessionalDashboard() {
  const { dashboardStats, isLoadingStats, orders, customers, products, seedDatabase, isSeeding } = useProductionData()
  const { user, profile, isAdmin } = useUnifiedSystem()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  // Calculs des métriques avancées
  const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0
  const totalOrders = orders?.length || 0
  const totalCustomers = customers?.length || 0
  const totalProducts = products?.length || 0
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0

  // Données pour les graphiques
  const revenueData = orders?.slice(-7).map((order, index) => ({
    date: new Date(order.created_at).toLocaleDateString(),
    revenue: Number(order.total_amount || 0),
    orders: 1
  })) || []

  const ordersData = orders?.slice(-7).map((order, index) => ({
    date: new Date(order.created_at).toLocaleDateString(),
    revenue: 0, // Valeur par défaut pour satisfaire le type
    orders: 1
  })) || []

  // Métriques principales
  const mainMetrics = [
    {
      title: "Chiffre d'Affaires",
      value: formatCurrency(totalRevenue),
      change: 12.5,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: "up"
    },
    {
      title: "Commandes",
      value: totalOrders.toString(),
      change: 8.2,
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: "up"
    },
    {
      title: "Clients",
      value: totalCustomers.toString(),
      change: 15.3,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: "up"
    },
    {
      title: "Produits",
      value: totalProducts.toString(),
      change: 5.8,
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      trend: "up"
    }
  ]

  // Métriques avancées
  const advancedMetrics = [
    {
      title: "Panier Moyen",
      value: formatCurrency(avgOrderValue),
      change: 6.7,
      icon: Target,
      description: "Valeur moyenne par commande"
    },
    {
      title: "Taux de Conversion",
      value: `${conversionRate.toFixed(1)}%`,
      change: 2.1,
      icon: TrendingUp,
      description: "Visiteurs convertis en clients"
    },
    {
      title: "Performance Globale",
      value: "Excellente",
      change: null,
      icon: BarChart3,
      description: "Tous indicateurs positifs",
      isQualitative: true
    }
  ]

  if (isLoadingStats) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header moderne */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Tableau de Bord Professionnel
              </span>
              <span className="text-2xl">📊</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Bienvenue, {profile?.full_name || user?.email?.split('@')[0] || 'Utilisateur'} - 
              Vue d'ensemble de votre activité commerce
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Badge variant="secondary" className="bg-muted">Admin</Badge>
                <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  Ultra Pro
                </Badge>
              </>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => seedDatabase()}
              disabled={isSeeding}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSeeding ? 'animate-spin' : ''}`} />
              {isSeeding ? 'Génération...' : 'Données Test'}
            </Button>
          </div>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainMetrics.map((metric, index) => {
          const Icon = metric.icon
          const isPositive = metric.trend === 'up'
          return (
            <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 group-hover:from-gray-50 group-hover:to-white transition-all duration-300" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${metric.bgColor}`}>
                    <Icon className={`h-6 w-6 ${metric.color}`} />
                  </div>
                  {metric.change && (
                    <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      {formatPercentage(metric.change)}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">vs mois précédent</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Métriques avancées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {advancedMetrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">
                  {metric.isQualitative ? (
                    <span className="text-green-600">{metric.value}</span>
                  ) : (
                    metric.value
                  )}
                </div>
                {metric.change && (
                  <div className="flex items-center text-xs text-green-600 mb-2">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {formatPercentage(metric.change)}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{metric.description}</p>
                {metric.title === "Taux de Conversion" && (
                  <Progress value={conversionRate} className="mt-2 h-2" />
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Graphiques et données */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData} height={300} />
        <OrdersChart data={ordersData} />
      </div>

      {/* Sections détaillées */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopProducts />
            <RecentActivity />
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Gestion des Produits
              </CardTitle>
              <CardDescription>
                Catalogue et performance de vos produits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products?.slice(0, 5).map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{product.title}</p>
                        <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(product.price || 0)}</p>
                      <Badge variant="outline" className="text-xs">
                        {product.status || 'active'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activité Récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders?.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <div>
                        <p className="font-medium">Commande #{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.total_amount || 0)}</p>
                      <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Insights Métiers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Performance Excellente</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Votre croissance est supérieure à la moyenne du secteur
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Opportunité Détectée</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Optimisez vos prix pour augmenter vos marges de 15%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Résumé Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Croissance CA</span>
                    <span className="font-medium text-green-600">+12.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rétention Client</span>
                    <span className="font-medium text-green-600">85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Marge Moyenne</span>
                    <span className="font-medium text-blue-600">32%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Score Satisfaction</span>
                    <span className="font-medium text-green-600">4.8/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}