import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Lightbulb,
  ArrowRight,
  Star,
  Zap
} from 'lucide-react'

interface AIInsightsWidgetProps {
  insights?: any[]
}

export const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({ insights = [] }) => {
  // Insights par défaut si pas de données
  const defaultInsights = [
    {
      id: 1,
      type: 'opportunity',
      title: 'Opportunité de Croissance',
      description: 'Le segment "Accessoires Tech" montre une croissance de 34% ce mois. Recommandation: augmenter le stock de 25%.',
      confidence: 92,
      impact: 'high',
      category: 'Ventes',
      recommendation: 'Réapprovisionner maintenant',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Alerte Inventaire',
      description: '3 produits bestsellers risquent une rupture de stock dans les 5 prochains jours.',
      confidence: 89,
      impact: 'medium',
      category: 'Inventaire',
      recommendation: 'Commander 150 unités',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: 3,
      type: 'optimization',
      title: 'Optimisation Prix',
      description: 'L\'IA détecte que 7 produits ont des prix 15% sous la moyenne du marché. Potentiel: +€2,340/mois.',
      confidence: 76,
      impact: 'high',
      category: 'Pricing',
      recommendation: 'Ajuster les prix',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 4,
      type: 'insight',
      title: 'Tendance Saisonnière',
      description: 'Les ventes de "Produits Fitness" augmentent de 45% début janvier. Préparez vos campagnes.',
      confidence: 85,
      impact: 'medium',
      category: 'Marketing',
      recommendation: 'Planifier campagne',
      icon: Lightbulb,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  const displayInsights = insights.length > 0 ? insights : defaultInsights

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">Impact Élevé</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Impact Moyen</Badge>
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Impact Faible</Badge>
      default:
        return <Badge variant="secondary">Impact Inconnu</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'optimization':
        return <Target className="h-4 w-4 text-blue-600" />
      case 'insight':
        return <Lightbulb className="h-4 w-4 text-purple-600" />
      default:
        return <Sparkles className="h-4 w-4 text-primary" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Intelligence Artificielle
          </CardTitle>
          <CardDescription>
            Insights et recommandations personnalisés pour optimiser votre business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">4</div>
              <div className="text-sm text-muted-foreground">Insights Actifs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">€3,240</div>
              <div className="text-sm text-muted-foreground">Potentiel Détecté</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">86%</div>
              <div className="text-sm text-muted-foreground">Précision IA</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayInsights.map((insight, index) => {
          const Icon = insight.icon
          return (
            <Card key={insight.id} className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${insight.bgColor}`}>
                      <Icon className={`h-5 w-5 ${insight.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {insight.category}
                        </Badge>
                        {getImpactBadge(insight.impact)}
                      </div>
                    </div>
                  </div>
                  {getTypeIcon(insight.type)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {insight.description}
                </p>

                {/* Niveau de confiance */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Niveau de confiance IA</span>
                    <span className="font-medium">{insight.confidence}%</span>
                  </div>
                  <Progress value={insight.confidence} className="h-2" />
                </div>

                {/* Action recommandée */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Action Recommandée</p>
                    <p className="text-xs text-muted-foreground">{insight.recommendation}</p>
                  </div>
                  <Button size="sm" className="gap-2">
                    <Zap className="h-3 w-3" />
                    Appliquer
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Actions Rapides IA */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides IA</CardTitle>
          <CardDescription>
            Optimisations automatiques disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <Target className="h-6 w-6 text-blue-600" />
              <span className="font-medium">Optimisation Prix</span>
              <span className="text-xs text-muted-foreground">7 produits à ajuster</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <span className="font-medium">Détection Tendances</span>
              <span className="text-xs text-muted-foreground">3 opportunités trouvées</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <span className="font-medium">Gestion Stock</span>
              <span className="text-xs text-muted-foreground">Alertes intelligentes</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}