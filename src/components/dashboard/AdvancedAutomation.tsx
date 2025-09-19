/**
 * Centre d'Automatisation Avancé
 * Workflows intelligents et automatisation marketing
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { 
  Bot, Zap, Settings, Play, Pause, BarChart3, Users, 
  ShoppingCart, Mail, MessageSquare, Target, Clock,
  CheckCircle2, XCircle, AlertTriangle, TrendingUp,
  Workflow, Sparkles, Brain, ArrowRight, Plus
} from 'lucide-react'

interface AutomationRule {
  id: string
  name: string
  description: string
  category: 'marketing' | 'inventory' | 'customer' | 'pricing'
  trigger: string
  actions: string[]
  isActive: boolean
  performance: {
    executions: number
    successRate: number
    revenue: number
    savings: number
  }
  lastRun: Date
  nextRun?: Date
}

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  roi: number
  tags: string[]
  steps: number
}

interface AutomationMetric {
  title: string
  value: string
  change: number
  icon: React.ElementType
  color: string
}

export const AdvancedAutomation: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([])
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [metrics, setMetrics] = useState<AutomationMetric[]>([])

  useEffect(() => {
    loadAutomationData()
  }, [])

  const loadAutomationData = async () => {
    setLoading(true)
    
    // Simulation de données d'automatisation avancées
    const mockRules: AutomationRule[] = [
      {
        id: '1',
        name: 'Campagne Panier Abandonné Premium',
        description: 'Séquence email personnalisée avec remise progressive pour paniers >€100',
        category: 'marketing',
        trigger: 'Panier abandonné > €100',
        actions: ['Email immédiat', 'Email J+1 (-5%)', 'Email J+3 (-10%)', 'SMS J+7 (-15%)'],
        isActive: true,
        performance: {
          executions: 347,
          successRate: 23.4,
          revenue: 15680,
          savings: 0
        },
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 4 * 60 * 60 * 1000)
      },
      {
        id: '2',
        name: 'Réapprovisionnement Intelligent',
        description: 'Commande automatique basée sur les prévisions IA',
        category: 'inventory',
        trigger: 'Stock < seuil + prévision demande',
        actions: ['Analyse prévisions IA', 'Calcul quantité optimale', 'Commande fournisseur', 'Notification'],
        isActive: true,
        performance: {
          executions: 89,
          successRate: 94.4,
          revenue: 0,
          savings: 8900
        },
        lastRun: new Date(Date.now() - 6 * 60 * 60 * 1000)
      },
      {
        id: '3',
        name: 'Segmentation Client Avancée',
        description: 'Classification automatique et actions personnalisées',
        category: 'customer',
        trigger: 'Nouveau comportement client',
        actions: ['Analyse comportement', 'Mise à jour segment', 'Campagne ciblée', 'Score LTV'],
        isActive: true,
        performance: {
          executions: 1247,
          successRate: 89.2,
          revenue: 12400,
          savings: 0
        },
        lastRun: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        id: '4',
        name: 'Prix Dynamique Concurrentiel',
        description: 'Ajustement automatique basé sur la veille concurrentielle',
        category: 'pricing',
        trigger: 'Changement prix concurrent',
        actions: ['Analyse concurrence', 'Calcul prix optimal', 'Mise à jour prix', 'Notification'],
        isActive: false,
        performance: {
          executions: 23,
          successRate: 78.3,
          revenue: 3200,
          savings: 0
        },
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ]

    const mockTemplates: WorkflowTemplate[] = [
      {
        id: '1',
        name: 'Welcome Series E-commerce',
        description: 'Séquence d\'accueil pour nouveaux clients avec onboarding',
        category: 'Marketing',
        difficulty: 'beginner',
        estimatedTime: '15 min',
        roi: 340,
        tags: ['Email', 'Onboarding', 'Conversion'],
        steps: 5
      },
      {
        id: '2',
        name: 'Système de Reviews Automatisé',
        description: 'Collecte automatique d\'avis après livraison avec incitations',
        category: 'Customer Care',
        difficulty: 'intermediate',
        estimatedTime: '30 min',
        roi: 280,
        tags: ['Reviews', 'Email', 'SMS'],
        steps: 7
      },
      {
        id: '3',
        name: 'Cross-Sell IA Avancé',
        description: 'Recommandations personnalisées basées sur l\'IA comportementale',
        category: 'Revenue',
        difficulty: 'advanced',
        estimatedTime: '45 min',
        roi: 520,
        tags: ['IA', 'Personnalisation', 'Revenue'],
        steps: 9
      }
    ]

    const mockMetrics: AutomationMetric[] = [
      {
        title: 'Revenus Automatisés',
        value: '€47,320',
        change: 23.5,
        icon: DollarSign,
        color: 'text-green-600'
      },
      {
        title: 'Temps Économisé',
        value: '156h',
        change: 45.2,
        icon: Clock,
        color: 'text-blue-600'
      },
      {
        title: 'Taux de Conversion',
        value: '8.4%',
        change: 12.8,
        icon: TrendingUp,
        color: 'text-purple-600'
      },
      {
        title: 'Clients Engagés',
        value: '2,847',
        change: 18.3,
        icon: Users,
        color: 'text-orange-600'
      }
    ]

    setTimeout(() => {
      setAutomationRules(mockRules)
      setTemplates(mockTemplates)
      setMetrics(mockMetrics)
      setLoading(false)
    }, 1000)
  }

  const toggleRule = (ruleId: string) => {
    setAutomationRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, isActive: !rule.isActive }
        : rule
    ))
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'marketing': return Mail
      case 'inventory': return Package
      case 'customer': return Users
      case 'pricing': return DollarSign
      default: return Bot
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'marketing': return 'text-blue-600 bg-blue-50'
      case 'inventory': return 'text-green-600 bg-green-50'
      case 'customer': return 'text-purple-600 bg-purple-50'
      case 'pricing': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-50'
      case 'intermediate': return 'text-yellow-600 bg-yellow-50'
      case 'advanced': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Chargement des automatisations...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Automatisation */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Bot className="h-6 w-6 text-purple-600" />
                Centre d'Automatisation Avancé
              </h2>
              <p className="text-muted-foreground">Workflows intelligents et optimisation automatisée</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-600">24/7</div>
              <div className="text-sm text-muted-foreground">Toujours Actif</div>
            </div>
          </div>
          
          {/* Métriques Clés */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            {metrics.map((metric, index) => {
              const Icon = metric.icon
              return (
                <div key={index} className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <Icon className={`h-6 w-6 mx-auto mb-2 ${metric.color}`} />
                  <div className="font-semibold">{metric.value}</div>
                  <div className="text-xs text-green-600">+{metric.change}%</div>
                  <div className="text-xs text-muted-foreground">{metric.title}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="rules">Règles Actives</TabsTrigger>
          <TabsTrigger value="templates">Modèles</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Dashboard Automatisation */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Règles Actives */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5" />
                  Workflows en Cours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {automationRules.filter(rule => rule.isActive).slice(0, 4).map((rule) => {
                    const CategoryIcon = getCategoryIcon(rule.category)
                    return (
                      <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getCategoryColor(rule.category)}`}>
                            <CategoryIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-medium">{rule.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {rule.performance.executions} exécutions • {rule.performance.successRate}% succès
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="animate-pulse">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                            Actif
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Prochaines Exécutions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Prochaines Exécutions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {automationRules
                    .filter(rule => rule.nextRun)
                    .sort((a, b) => (a.nextRun?.getTime() || 0) - (b.nextRun?.getTime() || 0))
                    .slice(0, 5)
                    .map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{rule.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {rule.nextRun?.toLocaleTimeString()}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {Math.round((rule.nextRun!.getTime() - Date.now()) / (1000 * 60))}min
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance par Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['marketing', 'inventory', 'customer', 'pricing'].map((category) => {
                    const categoryRules = automationRules.filter(r => r.category === category)
                    const totalRevenue = categoryRules.reduce((sum, r) => sum + r.performance.revenue + r.performance.savings, 0)
                    const avgSuccess = categoryRules.reduce((sum, r) => sum + r.performance.successRate, 0) / categoryRules.length || 0
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm capitalize">{category}</span>
                          <span className="text-sm font-medium">€{totalRevenue.toLocaleString()}</span>
                        </div>
                        <Progress value={avgSuccess} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{categoryRules.length} règles</span>
                          <span>{avgSuccess.toFixed(1)}% succès</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI Automatisation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold text-green-600">€{
                    automationRules.reduce((sum, r) => sum + r.performance.revenue + r.performance.savings, 0).toLocaleString()
                  }</div>
                  <p className="text-sm text-muted-foreground">Revenus + Économies ce mois</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="font-semibold text-green-600">€{
                        automationRules.reduce((sum, r) => sum + r.performance.revenue, 0).toLocaleString()
                      }</div>
                      <div className="text-xs text-muted-foreground">Revenus Générés</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="font-semibold text-blue-600">€{
                        automationRules.reduce((sum, r) => sum + r.performance.savings, 0).toLocaleString()
                      }</div>
                      <div className="text-xs text-muted-foreground">Coûts Économisés</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Règles Actives */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Règles d'Automatisation</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Règle
            </Button>
          </div>

          <div className="space-y-4">
            {automationRules.map((rule) => {
              const CategoryIcon = getCategoryIcon(rule.category)
              return (
                <Card key={rule.id} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-xl ${getCategoryColor(rule.category)}`}>
                          <CategoryIcon className="h-6 w-6" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{rule.name}</h3>
                            <Badge className={getCategoryColor(rule.category)}>
                              {rule.category}
                            </Badge>
                            <Switch 
                              checked={rule.isActive}
                              onCheckedChange={() => toggleRule(rule.id)}
                            />
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
                          
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Exécutions</div>
                              <div className="font-medium">{rule.performance.executions}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Taux Succès</div>
                              <div className="font-medium">{rule.performance.successRate}%</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Revenus</div>
                              <div className="font-medium text-green-600">
                                €{rule.performance.revenue.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Dernière Exec.</div>
                              <div className="font-medium">
                                {rule.lastRun.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <div className="text-sm font-medium mb-2">Actions</div>
                            <div className="flex flex-wrap gap-2">
                              {rule.actions.map((action, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {action}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Stats
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Modèles */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Modèles de Workflow</h3>
            <Button variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Créer Modèle
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={getDifficultyColor(template.difficulty)}>
                      {template.difficulty === 'beginner' ? 'Débutant' :
                       template.difficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé'}
                    </Badge>
                    <div className="text-right">
                      <div className="font-bold text-green-600">+{template.roi}%</div>
                      <div className="text-xs text-muted-foreground">ROI Moyen</div>
                    </div>
                  </div>

                  <h3 className="font-semibold mb-2">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{template.description}</p>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Temps Setup</span>
                      <span className="font-medium">{template.estimatedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Étapes</span>
                      <span className="font-medium">{template.steps} étapes</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Utiliser ce Modèle
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Performances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Graphique d'évolution des performances</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Impact par Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { canal: 'Email Marketing', impact: 45, revenue: 18500 },
                    { canal: 'SMS Automation', impact: 23, revenue: 9200 },
                    { canal: 'Push Notifications', impact: 18, revenue: 7100 },
                    { canal: 'Remarketing', impact: 14, revenue: 5600 }
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">{item.canal}</span>
                        <span className="text-sm font-medium">€{item.revenue.toLocaleString()}</span>
                      </div>
                      <Progress value={item.impact} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdvancedAutomation