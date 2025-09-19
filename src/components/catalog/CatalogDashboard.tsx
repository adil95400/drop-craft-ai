import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Package, TrendingUp, Star, Users, 
  DollarSign, ShoppingCart, Globe, 
  Zap, Crown, AlertTriangle, CheckCircle,
  BarChart3, PieChart, Activity, Target
} from 'lucide-react'
import { CatalogNavigation } from './CatalogNavigation'

export function CatalogDashboard() {
  const dashboardStats = [
    {
      title: 'Produits totaux',
      value: '12,847',
      change: '+12%',
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      trend: 'up'
    },
    {
      title: 'Chiffre d\'affaires',
      value: '€2.4M',
      change: '+23%',
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-100',
      trend: 'up'
    },
    {
      title: 'Fournisseurs actifs',
      value: '156',
      change: '+8%',
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      trend: 'up'
    },
    {
      title: 'Taux de conversion',
      value: '3.2%',
      change: '-0.5%',
      icon: Target,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      trend: 'down'
    }
  ]

  const topCategories = [
    { name: 'Électronique', products: 3420, revenue: '€1.2M', growth: '+18%' },
    { name: 'Mode & Accessoires', products: 2890, revenue: '€850K', growth: '+25%' },
    { name: 'Maison & Jardin', products: 2156, revenue: '€420K', growth: '+12%' },
    { name: 'Sports & Loisirs', products: 1890, revenue: '€380K', growth: '+15%' },
    { name: 'Beauté & Santé', products: 1645, revenue: '€290K', growth: '+8%' }
  ]

  const recentActivity = [
    { action: 'Nouveau produit ajouté', item: 'iPhone 15 Pro Max', time: '2h', type: 'product' },
    { action: 'Fournisseur activé', item: 'Tech Global Ltd', time: '4h', type: 'supplier' },
    { action: 'Prix mis à jour', item: '145 produits', time: '6h', type: 'pricing' },
    { action: 'Stock synchronisé', item: 'Electronique', time: '1j', type: 'sync' },
    { action: 'Rapport généré', item: 'Analytics Q1', time: '2j', type: 'report' }
  ]

  const performanceMetrics = [
    { metric: 'Produits les plus vendus', value: '842', description: 'Ce mois' },
    { metric: 'Taux de retour', value: '2.1%', description: 'Sous la moyenne' },
    { metric: 'Note moyenne', value: '4.6/5', description: 'Excellente satisfaction' },
    { metric: 'Délai de livraison', value: '5.2j', description: 'Moyenne industrie' }
  ]

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tableau de Bord Catalogue</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de votre catalogue et performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Rapports
          </Button>
          <Button>
            <Zap className="h-4 w-4 mr-2" />
            Optimiser avec IA
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <CatalogNavigation />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {dashboardStats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="flex items-center p-6">
                  <div className={`p-3 rounded-full ${stat.bg} mr-4`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className={`h-3 w-3 mr-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`} />
                      <span className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="categories">Catégories</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="alerts">Alertes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Activité récente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              activity.type === 'product' ? 'bg-blue-100' :
                              activity.type === 'supplier' ? 'bg-green-100' :
                              activity.type === 'pricing' ? 'bg-yellow-100' :
                              activity.type === 'sync' ? 'bg-purple-100' :
                              'bg-gray-100'
                            }`}>
                              {activity.type === 'product' && <Package className="h-4 w-4 text-blue-600" />}
                              {activity.type === 'supplier' && <Users className="h-4 w-4 text-green-600" />} 
                              {activity.type === 'pricing' && <DollarSign className="h-4 w-4 text-yellow-600" />}
                              {activity.type === 'sync' && <Zap className="h-4 w-4 text-purple-600" />}
                              {activity.type === 'report' && <BarChart3 className="h-4 w-4 text-gray-600" />}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{activity.action}</p>
                              <p className="text-sm text-muted-foreground">{activity.item}</p>
                            </div>
                          </div>
                          <Badge variant="outline">{activity.time}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Métriques de performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {performanceMetrics.map((metric, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">{metric.metric}</p>
                            <p className="text-xs text-muted-foreground">{metric.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{metric.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Catégories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {category.products.toLocaleString()} produits
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{category.revenue}</p>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <span className="text-sm text-green-600">{category.growth}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Produits performants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">iPhone 15 Pro</span>
                        <Badge className="bg-green-100 text-green-800">Top ventes</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Samsung Galaxy S24</span>
                        <Badge className="bg-blue-100 text-blue-800">Tendance</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">AirPods Pro</span>
                        <Badge className="bg-purple-100 text-purple-800">Bestseller</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Fournisseurs top</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Global Electronics</span>
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          <Crown className="h-3 w-3 mr-1" />Pro
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Fashion Forward</span>
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                          <Zap className="h-3 w-3 mr-1" />Premium
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Home & Garden</span>
                        <Badge variant="secondary">Standard</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-6">
              <div className="space-y-4">
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="flex items-center p-4">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                    <div className="flex-1">
                      <p className="font-medium text-red-800">Stock faible détecté</p>
                      <p className="text-sm text-red-600">12 produits en rupture de stock</p>
                    </div>
                    <Button variant="outline" size="sm">Voir</Button>
                  </CardContent>
                </Card>

                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="flex items-center p-4">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                    <div className="flex-1">
                      <p className="font-medium text-yellow-800">Prix non compétitifs</p>
                      <p className="text-sm text-yellow-600">25 produits avec prix supérieurs à la concurrence</p>
                    </div>
                    <Button variant="outline" size="sm">Optimiser</Button>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="flex items-center p-4">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <div className="flex-1">
                      <p className="font-medium text-green-800">Synchronisation réussie</p>
                      <p className="text-sm text-green-600">1,245 produits mis à jour avec succès</p>
                    </div>
                    <Button variant="outline" size="sm">Détails</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}