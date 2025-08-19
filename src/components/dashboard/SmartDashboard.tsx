import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useSimplePlan } from '@/hooks/useSimplePlan'
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  ArrowUpRight,
  Activity,
  Calendar,
  AlertTriangle,
  Zap
} from 'lucide-react'

interface SmartMetric {
  title: string
  value: string
  change: { value: number; trend: 'up' | 'down' }
  icon: any
  description: string
  urgent?: boolean
  planRestricted?: boolean
}

export const SmartDashboard = () => {
  const { user } = useAuth()
  const { plan, isPro, isUltraPro } = useSimplePlan(user)

  const intelligentMetrics: SmartMetric[] = [
    {
      title: "Revenus Smart",
      value: "€12,345",
      change: { value: 12.5, trend: 'up' },
      icon: DollarSign,
      description: "IA détecte +25% potentiel"
    },
    {
      title: "Produits Gagnants",
      value: "23",
      change: { value: 45.2, trend: 'up' },
      icon: TrendingUp,
      description: "Winners détectés par IA",
      planRestricted: !isPro()
    },
    {
      title: "Optimisations Auto",
      value: "156",
      change: { value: 8.7, trend: 'up' },
      icon: Zap,
      description: "Actions automatisées",
      planRestricted: !isUltraPro()
    },
    {
      title: "Alertes Critiques",
      value: "3",
      change: { value: -15.0, trend: 'down' },
      icon: AlertTriangle,
      description: "Stock faible & ruptures",
      urgent: true
    }
  ]

  const aiInsights = [
    {
      type: "opportunity",
      title: "Opportunité détectée",
      description: "Le produit 'Montre Sport' pourrait générer +€2,500 avec une promotion",
      confidence: 85,
      action: "Créer campagne",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      type: "warning",
      title: "Risque de rupture",
      description: "3 produits bestsellers arrivent en rupture dans 5 jours",
      confidence: 92,
      action: "Réapprovisionner",
      icon: AlertTriangle,
      color: "text-orange-600"
    },
    {
      type: "optimization",
      title: "Prix non optimaux",
      description: "7 produits ont des prix sous-optimisés vs la concurrence",
      confidence: 78,
      action: "Ajuster prix",
      icon: DollarSign,
      color: "text-blue-600"
    }
  ]

  const quickActions = [
    {
      title: "Import Winners IA",
      description: "Importer les produits gagnants détectés",
      icon: Package,
      href: "/import?mode=winners",
      badge: "IA",
      restricted: !isPro()
    },
    {
      title: "Optimisation Automatique",
      description: "Lancer l'optimisation IA de tout le catalogue",
      icon: Zap,
      href: "/automation?action=optimize",
      badge: "Auto",
      restricted: !isUltraPro()
    },
    {
      title: "Analytics Avancés",
      description: "Analyses prédictives et tendances du marché",
      icon: TrendingUp,
      href: "/analytics?mode=advanced",
      badge: "Pro"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Intelligence Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Intelligent</h2>
          <p className="text-muted-foreground">
            Insights IA en temps réel • Plan {plan}
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Activity className="h-3 w-3" />
          IA Active
        </Badge>
      </div>

      {/* Smart Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {intelligentMetrics.map((metric, index) => {
          const IconComponent = metric.icon
          const isRestricted = metric.planRestricted

          return (
            <Card key={index} className={`${metric.urgent ? 'border-orange-500' : ''} ${isRestricted ? 'opacity-50' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {metric.title}
                  {isRestricted && (
                    <Badge variant="outline" className="text-xs">Pro</Badge>
                  )}
                </CardTitle>
                <IconComponent className={`h-4 w-4 ${metric.urgent ? 'text-orange-500' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isRestricted ? '---' : metric.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <ArrowUpRight className={`h-3 w-3 mr-1 ${
                    metric.change.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <span className={metric.change.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                    {metric.change.value}%
                  </span>
                  <span className="ml-1">{metric.description}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Insights IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiInsights.map((insight, index) => {
              const IconComponent = insight.icon
              return (
                <div key={index} className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                  <IconComponent className={`h-5 w-5 mt-0.5 ${insight.color}`} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {insight.confidence}% confiance
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    {insight.action}
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Améliorées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action, index) => {
          const IconComponent = action.icon
          const isRestricted = action.restricted

          return (
            <Card 
              key={index} 
              className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
                isRestricted ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => !isRestricted && (window.location.href = action.href)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <IconComponent className="h-5 w-5" />
                  {action.title}
                  <Badge variant={action.badge === 'IA' ? 'default' : 'secondary'} className="ml-auto">
                    {action.badge}
                  </Badge>
                </CardTitle>
                <CardContent className="px-0 pb-0">
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                  {isRestricted && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Nécessite plan Pro+
                    </Badge>
                  )}
                </CardContent>
              </CardHeader>
            </Card>
          )
        })}
      </div>
    </div>
  )
}