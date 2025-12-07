import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  BarChart3,
  Activity
} from 'lucide-react'

interface MetricCard {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

interface AnalyticsDashboardProps {
  metrics?: MetricCard[]
  recentActivity?: { action: string; timestamp: string }[]
}

const defaultMetrics: MetricCard[] = [
  { 
    title: 'Chiffre d\'affaires', 
    value: '45,230€', 
    change: 12.5, 
    changeLabel: 'vs mois précédent',
    icon: <DollarSign className="h-5 w-5" />,
    trend: 'up'
  },
  { 
    title: 'Commandes', 
    value: '1,247', 
    change: 8.3, 
    changeLabel: 'vs mois précédent',
    icon: <ShoppingCart className="h-5 w-5" />,
    trend: 'up'
  },
  { 
    title: 'Produits actifs', 
    value: '3,892', 
    change: 2.1, 
    changeLabel: 'nouveaux ce mois',
    icon: <Package className="h-5 w-5" />,
    trend: 'up'
  },
  { 
    title: 'Clients', 
    value: '892', 
    change: -1.2, 
    changeLabel: 'vs mois précédent',
    icon: <Users className="h-5 w-5" />,
    trend: 'down'
  }
]

const defaultActivity = [
  { action: 'Nouvelle commande #12847', timestamp: 'Il y a 2 min' },
  { action: 'Produit synchronisé vers Shopify', timestamp: 'Il y a 5 min' },
  { action: 'Stock mis à jour (25 produits)', timestamp: 'Il y a 12 min' },
  { action: 'Prix ajustés automatiquement', timestamp: 'Il y a 30 min' },
  { action: 'Nouvelle connexion fournisseur', timestamp: 'Il y a 1h' }
]

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  metrics = defaultMetrics,
  recentActivity = defaultActivity
}) => {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {metric.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change !== undefined && (
                <div className="flex items-center gap-1 mt-1">
                  {metric.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : metric.trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : null}
                  <span className={`text-sm ${
                    metric.trend === 'up' ? 'text-green-500' : 
                    metric.trend === 'down' ? 'text-red-500' : 
                    'text-muted-foreground'
                  }`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                  <span className="text-xs text-muted-foreground">{metric.changeLabel}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart Placeholder */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Évolution des ventes
                </CardTitle>
                <CardDescription>Derniers 30 jours</CardDescription>
              </div>
              <Badge variant="outline">+12.5%</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-between gap-1 px-2">
              {[65, 45, 78, 52, 89, 67, 82, 95, 73, 88, 92, 100].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>1 Dec</span>
              <span>7 Dec</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activité récente
            </CardTitle>
            <CardDescription>Dernières actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm">{activity.action}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Métriques de performance</CardTitle>
          <CardDescription>Indicateurs clés de la plateforme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Taux de conversion</span>
                <span className="text-sm text-muted-foreground">3.2%</span>
              </div>
              <Progress value={32} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Panier moyen</span>
                <span className="text-sm text-muted-foreground">87€</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Marge moyenne</span>
                <span className="text-sm text-muted-foreground">24%</span>
              </div>
              <Progress value={48} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AnalyticsDashboard
