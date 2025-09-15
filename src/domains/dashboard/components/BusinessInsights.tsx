/**
 * PHASE 2: Insights business avec IA et recommandations automatiques
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, TrendingUp, AlertTriangle, Target, Zap, 
  ArrowUpRight, ArrowDownRight, CheckCircle, Clock, 
  DollarSign, Users, ShoppingCart, Eye
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized'

interface BusinessInsight {
  id: string
  type: 'opportunity' | 'warning' | 'success' | 'trend'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  confidence: number
  category: 'revenue' | 'customers' | 'products' | 'marketing'
  recommendation: string
  actionable: boolean
  estimatedGain?: number
}

interface KPI {
  name: string
  value: number
  target: number
  trend: 'up' | 'down' | 'stable'
  change: number
  status: 'good' | 'warning' | 'critical'
}

export const BusinessInsights: React.FC = () => {
  const { user } = useAuthOptimized()
  const [insights, setInsights] = useState<BusinessInsight[]>([])
  const [kpis, setKpis] = useState<KPI[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    if (user) {
      fetchBusinessInsights()
    }
  }, [user])

  const fetchBusinessInsights = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // En production, ceci appellerait votre service IA
      const mockInsights: BusinessInsight[] = [
        {
          id: '1',
          type: 'opportunity',
          priority: 'high',
          title: 'Optimisation prix produit tendance',
          description: 'Le produit "Chaise Gaming RGB" pourrait augmenter son prix de 15% selon l\'analyse concurrentielle.',
          impact: '+2,400€ de revenus supplémentaires',
          confidence: 87,
          category: 'revenue',
          recommendation: 'Augmenter le prix de 89€ à 102€ progressivement sur 2 semaines',
          actionable: true,
          estimatedGain: 2400
        },
        {
          id: '2',
          type: 'warning',
          priority: 'high',
          title: 'Risque de churn client segment Premium',
          description: '23% des clients Premium n\'ont pas commandé depuis 45 jours.',
          impact: 'Risque de perte de 15,600€',
          confidence: 92,
          category: 'customers',
          recommendation: 'Lancer une campagne de réactivation avec remise 10%',
          actionable: true
        },
        {
          id: '3',
          type: 'success',
          priority: 'medium',
          title: 'Performance marketing exceptionnelle',
          description: 'Le canal Facebook Ads génère 3.2x plus de conversions que prévu.',
          impact: 'ROI: 340% vs 120% attendu',
          confidence: 95,
          category: 'marketing',
          recommendation: 'Augmenter le budget de ce canal de 40%',
          actionable: true,
          estimatedGain: 5200
        },
        {
          id: '4',
          type: 'trend',
          priority: 'medium',
          title: 'Tendance saisonnière détectée',
          description: 'Les ventes de produits fitness augmentent de 45% en janvier.',
          impact: 'Opportunité de stock et pricing',
          confidence: 78,
          category: 'products',
          recommendation: 'Préparer le stock et ajuster les prix pour janvier',
          actionable: false
        }
      ]

      const mockKPIs: KPI[] = [
        { name: 'Chiffre d\'affaires', value: 45280, target: 50000, trend: 'up', change: 12.5, status: 'good' },
        { name: 'Nouveaux clients', value: 89, target: 100, trend: 'up', change: 8.3, status: 'good' },
        { name: 'Taux de conversion', value: 3.2, target: 4.0, trend: 'down', change: -0.3, status: 'warning' },
        { name: 'Panier moyen', value: 156.8, target: 160, trend: 'up', change: 4.2, status: 'good' },
        { name: 'Coût acquisition', value: 23.50, target: 20.00, trend: 'up', change: 8.7, status: 'warning' },
        { name: 'Satisfaction client', value: 4.6, target: 4.5, trend: 'stable', change: 0.1, status: 'good' }
      ]

      setInsights(mockInsights)
      setKpis(mockKPIs)
    } catch (error) {
      console.error('Error fetching business insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return TrendingUp
      case 'warning': return AlertTriangle
      case 'success': return CheckCircle
      case 'trend': return Eye
      default: return Brain
    }
  }

  const getInsightColor = (type: string, priority: string) => {
    if (type === 'opportunity') return priority === 'high' ? 'border-green-500 bg-green-50' : 'border-green-300 bg-green-25'
    if (type === 'warning') return priority === 'high' ? 'border-red-500 bg-red-50' : 'border-red-300 bg-red-25'
    if (type === 'success') return 'border-blue-500 bg-blue-50'
    return 'border-gray-300 bg-gray-50'
  }

  const getKPIStatus = (kpi: KPI) => {
    const percentage = (kpi.value / kpi.target) * 100
    return {
      color: kpi.status === 'good' ? 'text-green-600' : kpi.status === 'warning' ? 'text-yellow-600' : 'text-red-600',
      bg: kpi.status === 'good' ? 'bg-green-100' : kpi.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100',
      percentage
    }
  }

  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.category === selectedCategory)

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPIs Overview */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-primary" />
          KPIs Critiques
        </h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi, index) => {
            const status = getKPIStatus(kpi)
            return (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{kpi.name}</span>
                  <Badge variant={kpi.status === 'good' ? 'default' : 'destructive'} className="text-xs">
                    {kpi.status === 'good' ? 'OK' : kpi.status === 'warning' ? 'Attention' : 'Critique'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl font-bold">{kpi.value.toLocaleString()}</span>
                  <div className="flex items-center text-sm">
                    {kpi.trend === 'up' ? (
                      <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                    ) : kpi.trend === 'down' ? (
                      <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                    ) : null}
                    <span className={kpi.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {Math.abs(kpi.change)}%
                    </span>
                  </div>
                </div>
                <Progress value={status.percentage} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  Objectif: {kpi.target.toLocaleString()}
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Insights IA */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Brain className="h-5 w-5 mr-2 text-primary" />
            Insights Intelligence Artificielle
          </h3>
          
          <div className="flex gap-2">
            <Button 
              variant={selectedCategory === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              Tous
            </Button>
            <Button 
              variant={selectedCategory === 'revenue' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedCategory('revenue')}
            >
              Revenus
            </Button>
            <Button 
              variant={selectedCategory === 'customers' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedCategory('customers')}
            >
              Clients
            </Button>
            <Button 
              variant={selectedCategory === 'marketing' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedCategory('marketing')}
            >
              Marketing
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {filteredInsights.map((insight) => {
            const Icon = getInsightIcon(insight.type)
            return (
              <Card key={insight.id} className={`${getInsightColor(insight.type, insight.priority)} border-l-4`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 mt-1 text-primary" />
                      <div>
                        <CardTitle className="text-base">{insight.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={insight.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                            {insight.priority === 'high' ? 'Priorité haute' : 
                             insight.priority === 'medium' ? 'Priorité moyenne' : 'Priorité basse'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Confiance: {insight.confidence}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3">
                    {insight.description}
                  </p>
                  
                  <div className="bg-white/60 rounded p-3 mb-3">
                    <div className="text-sm font-medium text-primary mb-1">Impact estimé</div>
                    <div className="text-sm">{insight.impact}</div>
                  </div>

                  <div className="text-sm mb-3">
                    <span className="font-medium">Recommandation: </span>
                    {insight.recommendation}
                  </div>

                  {insight.actionable && (
                    <Button size="sm" className="w-full">
                      <Zap className="h-3 w-3 mr-2" />
                      Appliquer la recommandation
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Actions rapides basées sur les insights */}
      <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-primary" />
            Actions recommandées par l'IA
          </CardTitle>
          <CardDescription>
            Optimisations automatiques disponibles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white/60 rounded">
            <div>
              <div className="font-medium">Optimisation pricing automatique</div>
              <div className="text-sm text-muted-foreground">3 produits identifiés pour ajustement</div>
            </div>
            <Button size="sm">Activer</Button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white/60 rounded">
            <div>
              <div className="font-medium">Campagne de réactivation clients</div>
              <div className="text-sm text-muted-foreground">47 clients inactifs ciblés</div>
            </div>
            <Button size="sm">Lancer</Button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white/60 rounded">
            <div>
              <div className="font-medium">Réallocation budget publicitaire</div>
              <div className="text-sm text-muted-foreground">+40% sur Facebook, -20% sur Google</div>
            </div>
            <Button size="sm">Appliquer</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}