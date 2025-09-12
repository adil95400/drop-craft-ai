import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package } from 'lucide-react'
import { useRealAnalytics } from '@/hooks/useRealAnalytics'

export function AnalyticsCharts() {
  const { analytics, isLoading } = useRealAnalytics()

  if (isLoading || !analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const kpiCards = [
    {
      title: 'CA ce mois',
      value: formatCurrency(analytics.revenue),
      change: '+12,5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-success'
    },
    {
      title: 'Commandes',
      value: analytics.orders.toString(),
      change: '+8,3%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'text-primary'
    },
    {
      title: 'Taux de conversion',
      value: `${analytics.conversionRate.toFixed(1)}%`,
      change: '-1,2%',
      trend: 'down',
      icon: TrendingUp,
      color: 'text-warning'
    },
    {
      title: 'Panier moyen',
      value: formatCurrency(analytics.averageOrderValue),
      change: '+3,1%',
      trend: 'up',
      icon: Package,
      color: 'text-info'
    }
  ]

  // Données pour les graphiques
  const salesData = analytics.salesByDay.map(day => ({
    ...day,
    date: new Date(day.date).toLocaleDateString('fr-FR', { 
      month: 'short', 
      day: 'numeric' 
    })
  }))

  const channelData = [
    { name: 'Recherche organique', value: 45, color: '#0ea5e9' },
    { name: 'Réseaux sociaux', value: 25, color: '#10b981' },
    { name: 'Email marketing', value: 20, color: '#f59e0b' },
    { name: 'Publicité payante', value: 10, color: '#ef4444' }
  ]

  const topCategoriesData = [
    { name: 'Électronique', sales: 1850, revenue: 89500 },
    { name: 'Mode', sales: 1420, revenue: 67200 },
    { name: 'Maison', sales: 980, revenue: 45300 },
    { name: 'Sport', sales: 760, revenue: 32100 },
    { name: 'Beauté', sales: 540, revenue: 28900 }
  ]

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon
          const TrendIcon = kpi.trend === 'up' ? TrendingUp : TrendingDown
          
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.title}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{kpi.value}</p>
                      <div className={`flex items-center gap-1 text-sm ${
                        kpi.trend === 'up' ? 'text-success' : 'text-destructive'
                      }`}>
                        <TrendIcon className="h-3 w-3" />
                        {kpi.change}
                      </div>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full bg-muted ${kpi.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des ventes */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des ventes (7 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value as number) : value,
                    name === 'revenue' ? 'Chiffre d\'affaires' : 'Commandes'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  dot={{ fill: '#0ea5e9' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sources de trafic */}
        <Card>
          <CardHeader>
            <CardTitle>Sources de trafic</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Analyses détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top catégories */}
        <Card>
          <CardHeader>
            <CardTitle>Top catégories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCategoriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value as number) : value,
                    name === 'revenue' ? 'Chiffre d\'affaires' : 'Ventes'
                  ]}
                />
                <Bar dataKey="sales" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Produits les plus vendus */}
        <Card>
          <CardHeader>
            <CardTitle>Produits les plus vendus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.sales} ventes
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{product.revenue}</div>
                    <div className="text-sm text-success">{product.growth}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commandes récentes */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">#{order.order_number}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {formatCurrency(order.total_amount)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order.status === 'delivered' ? 'Livrée' : 
                     order.status === 'shipped' ? 'Expédiée' : 
                     order.status === 'processing' ? 'En cours' : 'En attente'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}