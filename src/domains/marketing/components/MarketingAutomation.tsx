/**
 * PHASE 2: Marketing Automation de base avec campagnes intelligentes
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Mail, Users, Target, TrendingUp, Play, Pause, 
  Settings, BarChart3, Eye, Clock, CheckCircle,
  ArrowRight, Zap, Brain, AlertTriangle
} from 'lucide-react'
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized'
import { usePlanContext } from '@/components/plan'

interface Campaign {
  id: string
  name: string
  type: 'email' | 'sms' | 'push' | 'retargeting'
  status: 'draft' | 'active' | 'paused' | 'completed'
  trigger: 'manual' | 'automated' | 'scheduled'
  audience: {
    total: number
    criteria: string[]
  }
  performance: {
    sent: number
    opened: number
    clicked: number
    converted: number
    revenue: number
  }
  schedule?: {
    start: string
    frequency?: string
  }
  created_at: string
}

interface AutomationRule {
  id: string
  name: string
  trigger: string
  conditions: string[]
  actions: string[]
  isActive: boolean
  performance: {
    triggered: number
    executed: number
    success_rate: number
  }
}

export const MarketingAutomation: React.FC = () => {
  const { user } = useAuthOptimized()
  const { hasFeature } = usePlanContext()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('campaigns')
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)

  useEffect(() => {
    if (user) {
      fetchMarketingData()
    }
  }, [user])

  const fetchMarketingData = async () => {
    setLoading(true)
    
    // Mock data - en production, récupérer depuis l'API
    const mockCampaigns: Campaign[] = [
      {
        id: '1',
        name: 'Bienvenue nouveaux clients',
        type: 'email',
        status: 'active',
        trigger: 'automated',
        audience: {
          total: 1247,
          criteria: ['Nouveau client', 'Première commande < 7 jours']
        },
        performance: {
          sent: 156,
          opened: 89,
          clicked: 23,
          converted: 12,
          revenue: 1840
        },
        created_at: '2024-01-15'
      },
      {
        id: '2',
        name: 'Panier abandonné - Récupération',
        type: 'email',
        status: 'active',
        trigger: 'automated',
        audience: {
          total: 892,
          criteria: ['Panier > 50€', 'Abandonné > 2h', 'Pas d\'achat']
        },
        performance: {
          sent: 234,
          opened: 178,
          clicked: 67,
          converted: 34,
          revenue: 5420
        },
        created_at: '2024-01-10'
      },
      {
        id: '3',
        name: 'Réactivation clients inactifs',
        type: 'email',
        status: 'draft',
        trigger: 'scheduled',
        audience: {
          total: 456,
          criteria: ['Pas d\'achat > 60 jours', 'Client VIP']
        },
        performance: {
          sent: 0,
          opened: 0,
          clicked: 0,
          converted: 0,
          revenue: 0
        },
        schedule: {
          start: '2024-01-20',
          frequency: 'weekly'
        },
        created_at: '2024-01-16'
      }
    ]

    const mockAutomationRules: AutomationRule[] = [
      {
        id: '1',
        name: 'Nouveau client - Séquence onboarding',
        trigger: 'Première commande',
        conditions: ['Commande validée', 'Email opt-in'],
        actions: ['Envoyer email bienvenue', 'Ajouter tag "nouveau"', 'Programmer follow-up'],
        isActive: true,
        performance: {
          triggered: 89,
          executed: 87,
          success_rate: 97.8
        }
      },
      {
        id: '2',
        name: 'Panier abandonné - Alerte',
        trigger: 'Panier abandonné > 2h',
        conditions: ['Valeur panier > 30€', 'Client connecté'],
        actions: ['Envoyer email rappel', 'Créer notification push'],
        isActive: true,
        performance: {
          triggered: 145,
          executed: 142,
          success_rate: 97.9
        }
      }
    ]

    setCampaigns(mockCampaigns)
    setAutomationRules(mockAutomationRules)
    setLoading(false)
  }

  const handleCampaignAction = (campaignId: string, action: 'start' | 'pause' | 'stop') => {
    setCampaigns(prev => 
      prev.map(campaign => 
        campaign.id === campaignId 
          ? { 
              ...campaign, 
              status: action === 'start' ? 'active' : action === 'pause' ? 'paused' : 'completed'
            }
          : campaign
      )
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'paused': return 'bg-yellow-500'
      case 'draft': return 'bg-gray-500'
      case 'completed': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active'
      case 'paused': return 'En pause'
      case 'draft': return 'Brouillon'
      case 'completed': return 'Terminée'
      default: return status
    }
  }

  const calculateROI = (campaign: Campaign) => {
    const cost = campaign.performance.sent * 0.05 // Coût estimé par envoi
    return campaign.performance.revenue > 0 
      ? ((campaign.performance.revenue - cost) / cost * 100).toFixed(1)
      : '0'
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Target className="h-8 w-8 mr-3 text-primary" />
            Marketing Automation
          </h1>
          <p className="text-muted-foreground">
            Automatisez vos campagnes et optimisez vos conversions
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={() => setShowCreateCampaign(true)}>
            <Zap className="h-4 w-4 mr-2" />
            Nouvelle campagne
          </Button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campagnes actives</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.filter(c => c.status === 'active').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audience totale</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.audience.total, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'ouverture</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.length > 0 ? (
                (campaigns.reduce((sum, c) => sum + (c.performance.sent > 0 ? (c.performance.opened / c.performance.sent) : 0), 0) / campaigns.filter(c => c.performance.sent > 0).length * 100).toFixed(1)
              ) : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus générés</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.performance.revenue, 0).toLocaleString()}€
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="automation">Automatisation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="audience">Audiences</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {campaigns.map(campaign => (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {campaign.name}
                        <Badge className={`${getStatusColor(campaign.status)} text-white`}>
                          {getStatusText(campaign.status)}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {campaign.type.toUpperCase()} • {campaign.trigger === 'automated' ? 'Automatisée' : 'Manuelle'}
                      </CardDescription>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCampaignAction(
                        campaign.id, 
                        campaign.status === 'active' ? 'pause' : 'start'
                      )}
                    >
                      {campaign.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Audience */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">Audience cible</span>
                      <span>{campaign.audience.total.toLocaleString()} contacts</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {campaign.audience.criteria.join(' • ')}
                    </div>
                  </div>

                  {/* Performance */}
                  {campaign.performance.sent > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Performance</div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Envoyés</div>
                          <div className="font-medium">{campaign.performance.sent}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Ouverts</div>
                          <div className="font-medium">
                            {campaign.performance.opened} ({((campaign.performance.opened / campaign.performance.sent) * 100).toFixed(1)}%)
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Clics</div>
                          <div className="font-medium">
                            {campaign.performance.clicked} ({((campaign.performance.clicked / campaign.performance.sent) * 100).toFixed(1)}%)
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">ROI</div>
                          <div className="font-medium text-green-600">+{calculateROI(campaign)}%</div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Revenus générés</span>
                          <span className="font-medium">{campaign.performance.revenue}€</span>
                        </div>
                        <Progress 
                          value={(campaign.performance.converted / campaign.performance.sent) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="h-3 w-3 mr-1" />
                      Modifier
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      Analyser
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <div className="grid gap-4">
            {automationRules.map(rule => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {rule.name}
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Déclenché par: {rule.trigger}
                      </CardDescription>
                    </div>
                    <Button size="sm" variant="outline">
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <div className="text-sm font-medium mb-2">Conditions</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {rule.conditions.map((condition, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {condition}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">Actions</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {rule.actions.map((action, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <ArrowRight className="h-3 w-3 text-blue-500" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">Performance</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Déclenchements</span>
                          <span className="font-medium">{rule.performance.triggered}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Exécutions</span>
                          <span className="font-medium">{rule.performance.executed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Taux de succès</span>
                          <span className="font-medium text-green-600">{rule.performance.success_rate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Marketing</CardTitle>
              <CardDescription>Analyse détaillée des performances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Graphiques et analyses détaillées à implémenter
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion d'audience</CardTitle>
              <CardDescription>Segments et critères de ciblage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Interface de segmentation à implémenter
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Promotion IA */}
      {hasFeature('ai_marketing') && (
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-700">
              <Brain className="h-5 w-5 mr-2" />
              Marketing IA Disponible
            </CardTitle>
            <CardDescription>
              Optimisez automatiquement vos campagnes avec l'intelligence artificielle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Optimisation automatique activée</div>
                <div className="text-sm text-muted-foreground">
                  Timing, contenu et audience optimisés par IA
                </div>
              </div>
              <Button>
                <Zap className="h-4 w-4 mr-2" />
                Configurer l'IA
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}