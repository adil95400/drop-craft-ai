import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Zap, 
  BarChart3, 
  Globe, 
  Users, 
  Mail,
  MessageSquare,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Play,
  Pause,
  Settings
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

interface OptimizationRecommendation {
  id: string
  type: 'budget' | 'audience' | 'creative' | 'timing' | 'channel'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  effort: string
  potentialROI: number
  confidence: number
  actions: string[]
  estimatedLift: string
}

interface AIInsight {
  id: string
  category: string
  insight: string
  confidence: number
  impact: 'positive' | 'negative' | 'neutral'
  actionable: boolean
  timestamp: Date
}

export const AIMarketingOptimizer = () => {
  const { toast } = useToast()
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationProgress, setOptimizationProgress] = useState(0)
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])
  const [activeOptimization, setActiveOptimization] = useState<string | null>(null)
  
  // Mock data for AI recommendations
  const recommendations: OptimizationRecommendation[] = [
    {
      id: '1',
      type: 'budget',
      priority: 'high',
      title: 'Réallocation Budgétaire Optimale',
      description: 'L\'IA recommande de déplacer 23% du budget des campagnes Facebook vers Google Ads pour maximiser le ROAS',
      impact: 'Revenue +€2,340/mois',
      effort: 'Facile',
      potentialROI: 280,
      confidence: 89,
      actions: [
        'Réduire budget Facebook de €800',
        'Augmenter budget Google Ads de €800',
        'Surveiller performances 48h'
      ],
      estimatedLift: '+23% ROAS'
    },
    {
      id: '2',
      type: 'audience',
      priority: 'high',
      title: 'Nouveau Segment d\'Audience Détecté',
      description: 'Identification d\'un segment haute valeur: "Professionnels Tech 25-35 ans" avec 340% de LTV supérieur',
      impact: 'Conversions +45%',
      effort: 'Moyen',
      potentialROI: 340,
      confidence: 92,
      actions: [
        'Créer campagne dédiée segment',
        'Adapter créatifs pour tech',
        'Tester audiences lookalike'
      ],
      estimatedLift: '+45% taux conversion'
    },
    {
      id: '3',
      type: 'timing',
      priority: 'medium',
      title: 'Optimisation Horaires d\'Envoi',
      description: 'Les emails envoyés le mardi à 14h30 génèrent 67% plus d\'ouvertures que la moyenne actuelle',
      impact: 'Ouvertures +67%',
      effort: 'Facile',
      potentialROI: 156,
      confidence: 85,
      actions: [
        'Programmer envois mardi 14h30',
        'Test A/B autres créneaux',
        'Adapter par timezone'
      ],
      estimatedLift: '+67% taux ouverture'
    },
    {
      id: '4',
      type: 'creative',
      priority: 'medium',
      title: 'Optimisation Créatifs Visuels',
      description: 'Les créatifs avec couleurs chaudes (orange/rouge) performent 34% mieux sur votre audience cible',
      impact: 'CTR +34%',
      effort: 'Moyen',
      potentialROI: 198,
      confidence: 78,
      actions: [
        'Créer variants couleurs chaudes',
        'Test A/B créatifs actuels',
        'Analyser préférences couleurs'
      ],
      estimatedLift: '+34% CTR'
    }
  ]

  const insights: AIInsight[] = [
    {
      id: '1',
      category: 'Performance',
      insight: 'Vos campagnes email génèrent le meilleur ROAS le mardi entre 14h-16h',
      confidence: 94,
      impact: 'positive',
      actionable: true,
      timestamp: new Date()
    },
    {
      id: '2',
      category: 'Audience',
      insight: 'Segment "Abandons Panier" sous-exploité - potentiel +€1,200/mois',
      confidence: 88,
      impact: 'positive', 
      actionable: true,
      timestamp: new Date()
    },
    {
      id: '3',
      category: 'Compétition',
      insight: 'Concurrent XYZ a augmenté ses enchères de 15% cette semaine',
      confidence: 76,
      impact: 'negative',
      actionable: true,
      timestamp: new Date()
    }
  ]

  // Performance data simulation
  const performanceData = [
    { time: '00h', baseline: 100, optimized: 100, predicted: 105 },
    { time: '04h', baseline: 98, optimized: 102, predicted: 108 },
    { time: '08h', baseline: 105, optimized: 118, predicted: 125 },
    { time: '12h', baseline: 110, optimized: 128, predicted: 142 },
    { time: '16h', baseline: 108, optimized: 135, predicted: 155 },
    { time: '20h', baseline: 95, optimized: 125, predicted: 148 },
    { time: '24h', baseline: 90, optimized: 115, predicted: 145 }
  ]

  const handleStartOptimization = async (recommendationId: string) => {
    setActiveOptimization(recommendationId)
    setIsOptimizing(true)
    setOptimizationProgress(0)

    const recommendation = recommendations.find(r => r.id === recommendationId)
    
    // Simulate optimization process
    for (let i = 0; i <= 100; i += 10) {
      setOptimizationProgress(i)
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    setIsOptimizing(false)
    setActiveOptimization(null)
    
    toast({
      title: "Optimisation terminée",
      description: `${recommendation?.title} a été appliquée avec succès`,
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'budget': return <BarChart3 className="h-4 w-4" />
      case 'audience': return <Users className="h-4 w-4" />
      case 'creative': return <Globe className="h-4 w-4" />
      case 'timing': return <Calendar className="h-4 w-4" />
      case 'channel': return <Target className="h-4 w-4" />
      default: return <Brain className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Optimiseur Marketing IA
          </h1>
          <p className="text-muted-foreground mt-2">
            Intelligence artificielle avancée pour optimiser vos performances marketing
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Paramètres IA
          </Button>
          <Button 
            onClick={() => handleStartOptimization('global')}
            disabled={isOptimizing}
            className="gap-2 bg-gradient-to-r from-primary to-purple-600"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Optimisation...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Optimisation Globale
              </>
            )}
          </Button>
        </div>
      </div>

      {/* AI Status Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-600" />
              IA Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">24/7</div>
            <p className="text-xs text-blue-600">Monitoring continu</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Amélioration ROAS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">+{((Math.random() * 40) + 15).toFixed(1)}%</div>
            <p className="text-xs text-green-600">vs période précédente</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-600" />
              Optimisations Actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{recommendations.length}</div>
            <p className="text-xs text-purple-600">Recommandations en cours</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-600" />
              Score IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{Math.floor(Math.random() * 15) + 85}/100</div>
            <p className="text-xs text-orange-600">Performance globale</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">Recommandations IA</TabsTrigger>
          <TabsTrigger value="insights">Insights Temps Réel</TabsTrigger>
          <TabsTrigger value="performance">Performance Prédictive</TabsTrigger>
          <TabsTrigger value="automation">Auto-Optimization</TabsTrigger>
        </TabsList>

        {/* Recommandations IA */}
        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid gap-6">
            {recommendations.map((rec) => (
              <Card key={rec.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        {getTypeIcon(rec.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{rec.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getPriorityColor(rec.priority)}>
                            Priorité {rec.priority}
                          </Badge>
                          <Badge variant="outline">
                            Confiance: {rec.confidence}%
                          </Badge>
                          <Badge variant="secondary">
                            {rec.estimatedLift}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleStartOptimization(rec.id)}
                      disabled={isOptimizing && activeOptimization === rec.id}
                      className="gap-2"
                    >
                      {isOptimizing && activeOptimization === rec.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          {optimizationProgress}%
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Appliquer
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{rec.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Impact</p>
                      <p className="font-medium">{rec.impact}</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Effort</p>
                      <p className="font-medium">{rec.effort}</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">ROI Potentiel</p>
                      <p className="font-medium">{rec.potentialROI}%</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Confiance</p>
                      <p className="font-medium">{rec.confidence}%</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-medium mb-2">Actions recommandées:</p>
                    <ul className="space-y-1">
                      {rec.actions.map((action, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isOptimizing && activeOptimization === rec.id && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progression</span>
                        <span>{optimizationProgress}%</span>
                      </div>
                      <Progress value={optimizationProgress} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Insights Temps Réel */}
        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-2 ${
                      insight.impact === 'positive' ? 'bg-green-500' :
                      insight.impact === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{insight.category}</h4>
                        <Badge variant="outline" className="text-xs">
                          {insight.confidence}% confiance
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{insight.insight}</p>
                      <p className="text-xs text-muted-foreground">
                        {insight.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {insight.actionable && (
                    <Button size="sm" variant="outline">
                      Action
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Performance Prédictive */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Prédictive vs Baseline
              </CardTitle>
              <CardDescription>
                Comparaison entre performances actuelles et prédictions IA optimisées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="baseline" 
                    stackId="1"
                    stroke="#94a3b8" 
                    fill="#94a3b8"
                    fillOpacity={0.3}
                    name="Baseline"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="optimized" 
                    stackId="2"
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))"
                    fillOpacity={0.4}
                    name="IA Optimisé"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="predicted" 
                    stackId="3"
                    stroke="#22c55e" 
                    fill="#22c55e"
                    fillOpacity={0.3}
                    name="Prédiction 24h"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Amélioration Attendue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">+{((Math.random() * 25) + 15).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">ROAS dans les 24h</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Économies Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">€{Math.floor(Math.random() * 500 + 200)}</div>
                <p className="text-xs text-muted-foreground">Par optimisation auto</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Confiance IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{Math.floor(Math.random() * 10 + 85)}%</div>
                <p className="text-xs text-muted-foreground">Précision prédictions</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Auto-Optimization */}
        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Règles d'Optimisation Automatique
              </CardTitle>
              <CardDescription>
                Configuration des optimisations IA automatiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Budget Auto-Reallocation</h4>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Redistribue automatiquement le budget vers les campagnes les plus performantes
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Configurer
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Bid Optimization</h4>
                    <Badge variant="secondary">Pause</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Ajuste automatiquement les enchères selon les performances temps réel
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Activer
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Creative Rotation</h4>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Teste et optimise automatiquement les créatifs selon l'audience
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Configurer
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Audience Expansion</h4>
                    <Badge variant="outline">Test</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Découvre et teste automatiquement de nouveaux segments d'audience
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Configurer
                  </Button>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}