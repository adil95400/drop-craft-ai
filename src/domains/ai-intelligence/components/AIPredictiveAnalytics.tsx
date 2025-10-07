import { useState, useEffect } from 'react'
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  Loader2, 
  TrendingUp,
  Sparkles,
  Target,
  Zap,
  BarChart3,
  LineChart as LineChartIcon,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts'

interface Prediction {
  metric: string
  current: number
  predicted: number
  confidence: number
  trend: 'up' | 'down' | 'stable'
  impact: 'high' | 'medium' | 'low'
}

interface AIInsight {
  id: string
  title: string
  description: string
  type: 'opportunity' | 'warning' | 'recommendation'
  priority: 'high' | 'medium' | 'low'
  impact_score: number
  action_items: string[]
}

export const AIPredictiveAnalytics = () => {
  const { user } = useAuthOptimized()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [insights, setInsights] = useState<AIInsight[]>([])

  useEffect(() => {
    if (user) {
      loadAIData()
    }
  }, [user])

  const loadAIData = async () => {
    try {
      // Simulated AI predictions
      setPredictions([
        { metric: 'Revenus', current: 125000, predicted: 168000, confidence: 94, trend: 'up', impact: 'high' },
        { metric: 'Conversion', current: 3.2, predicted: 4.8, confidence: 89, trend: 'up', impact: 'high' },
        { metric: 'CAC', current: 45, predicted: 38, confidence: 87, trend: 'down', impact: 'medium' },
        { metric: 'Churn', current: 5.2, predicted: 3.8, confidence: 82, trend: 'down', impact: 'high' },
        { metric: 'LTV', current: 890, predicted: 1250, confidence: 91, trend: 'up', impact: 'high' }
      ])

      setInsights([
        {
          id: '1',
          title: 'Opportunité de croissance détectée',
          description: 'L\'IA identifie un segment de clients à fort potentiel dans la catégorie "Tech". Conversion +40% possible.',
          type: 'opportunity',
          priority: 'high',
          impact_score: 95,
          action_items: ['Augmenter budget ads Tech', 'Créer campagne ciblée', 'Optimiser landing page']
        },
        {
          id: '2',
          title: 'Risque de churn dans 30 jours',
          description: '12 clients premium montrent des signaux de désengagement. Action préventive recommandée.',
          type: 'warning',
          priority: 'high',
          impact_score: 88,
          action_items: ['Contacter clients à risque', 'Offre de réengagement', 'Analyse satisfaction']
        },
        {
          id: '3',
          title: 'Optimisation pricing recommandée',
          description: 'L\'analyse prédictive suggère un ajustement de prix pour maximiser les revenus (+23%).',
          type: 'recommendation',
          priority: 'medium',
          impact_score: 76,
          action_items: ['Test A/B pricing', 'Analyse élasticité', 'Segmentation pricing']
        }
      ])
    } catch (error) {
      console.error('Error loading AI data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Enhanced mock data for AI predictions
  const revenueForecastData = [
    { month: 'Jan', actual: 95000, predicted: 98000, lower_bound: 92000, upper_bound: 104000 },
    { month: 'Fev', actual: 102000, predicted: 105000, lower_bound: 98000, upper_bound: 112000 },
    { month: 'Mar', actual: 118000, predicted: 120000, lower_bound: 112000, upper_bound: 128000 },
    { month: 'Avr', actual: 125000, predicted: 128000, lower_bound: 118000, upper_bound: 138000 },
    { month: 'Mai', actual: null, predicted: 142000, lower_bound: 132000, upper_bound: 152000 },
    { month: 'Jun', actual: null, predicted: 156000, lower_bound: 144000, upper_bound: 168000 },
    { month: 'Jul', actual: null, predicted: 168000, lower_bound: 154000, upper_bound: 182000 }
  ]

  const customerBehaviorData = [
    { segment: 'Engagement', score: 82 },
    { segment: 'Satisfaction', score: 91 },
    { segment: 'Loyalty', score: 76 },
    { segment: 'Purchase Intent', score: 88 },
    { segment: 'Brand Affinity', score: 79 }
  ]

  const marketTrendData = [
    { category: 'Electronics', growth: 23, competition: 65, opportunity: 85 },
    { category: 'Fashion', growth: 18, competition: 78, opportunity: 62 },
    { category: 'Home', growth: 31, competition: 52, opportunity: 92 },
    { category: 'Sports', growth: 15, competition: 71, opportunity: 58 },
    { category: 'Beauty', growth: 27, competition: 60, opportunity: 78 }
  ]

  const churnPredictionData = [
    { risk_level: 'Très faible', count: 234, x: 15, y: 95, z: 50 },
    { risk_level: 'Faible', count: 156, x: 35, y: 78, z: 80 },
    { risk_level: 'Moyen', count: 89, x: 55, y: 52, z: 100 },
    { risk_level: 'Élevé', count: 45, x: 75, y: 28, z: 120 },
    { risk_level: 'Critique', count: 12, x: 90, y: 8, z: 150 }
  ]

  const productPerformanceData = [
    { month: 'Jan', bestsellers: 145, trending: 89, declining: 23 },
    { month: 'Fev', bestsellers: 162, trending: 102, declining: 18 },
    { month: 'Mar', bestsellers: 178, trending: 118, declining: 15 },
    { month: 'Avr', bestsellers: 195, trending: 134, declining: 12 }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Intelligence Artificielle Prédictive
          </h1>
          <p className="text-muted-foreground mt-2">
            Analytics avancées et prédictions ML pour optimiser votre business
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          PHASE 5 - AI
        </Badge>
      </div>

      {/* AI Predictions Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 animate-fade-in">
        {predictions.map((pred) => (
          <Card key={pred.metric} className="hover-scale relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                {pred.trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
                {pred.metric}
              </CardDescription>
              <CardTitle className="text-2xl">
                {pred.metric.includes('Revenus') ? `${(pred.predicted / 1000).toFixed(0)}K€` : `${pred.predicted.toFixed(1)}${pred.metric.includes('%') ? '%' : ''}`}
              </CardTitle>
              <div className="flex items-center justify-between mt-2">
                <Badge variant={pred.impact === 'high' ? 'default' : 'secondary'} className="text-xs">
                  {pred.confidence}% confiance
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {pred.impact === 'high' ? 'Impact élevé' : pred.impact === 'medium' ? 'Impact moyen' : 'Impact faible'}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="predictions" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="predictions">Prédictions</TabsTrigger>
          <TabsTrigger value="insights">Insights IA</TabsTrigger>
          <TabsTrigger value="behavior">Comportement</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
          <TabsTrigger value="optimization">Optimisation</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="animate-fade-in col-span-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5" />
                  Prévision Revenus - Machine Learning
                </CardTitle>
                <CardDescription>Prédiction avec intervalle de confiance à 95%</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={revenueForecastData}>
                    <defs>
                      <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="upper_bound" stroke="none" fill="#8b5cf6" fillOpacity={0.1} name="Intervalle haut" />
                    <Area type="monotone" dataKey="lower_bound" stroke="none" fill="#8b5cf6" fillOpacity={0.1} name="Intervalle bas" />
                    <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} name="Réel" />
                    <Line type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" name="Prédiction IA" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="text-base">Risque de Churn - Analyse Prédictive</CardTitle>
                <CardDescription>Classification ML des clients à risque</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" dataKey="x" name="Probabilité churn" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis type="number" dataKey="y" name="Engagement score" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <ZAxis type="number" dataKey="z" range={[50, 150]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Scatter name="Clients" data={churnPredictionData} fill="#8b5cf6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="text-base">Performance Produits - Tendances IA</CardTitle>
                <CardDescription>Classification automatique par IA</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="bestsellers" fill="#10b981" name="Bestsellers" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="trending" fill="#0ea5e9" name="Trending" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="declining" fill="#ef4444" name="En déclin" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {insights.map((insight) => (
              <Card key={insight.id} className="hover-scale animate-fade-in">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {insight.type === 'opportunity' && <Sparkles className="h-6 w-6 text-green-500 mt-1" />}
                      {insight.type === 'warning' && <AlertTriangle className="h-6 w-6 text-yellow-500 mt-1" />}
                      {insight.type === 'recommendation' && <Lightbulb className="h-6 w-6 text-blue-500 mt-1" />}
                      <div>
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <CardDescription className="mt-2">{insight.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={insight.priority === 'high' ? 'default' : 'secondary'}>
                        {insight.priority === 'high' ? 'Priorité haute' : insight.priority === 'medium' ? 'Priorité moyenne' : 'Priorité basse'}
                      </Badge>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{insight.impact_score}</div>
                        <div className="text-xs text-muted-foreground">Score d'impact</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Actions recommandées:
                    </h4>
                    <ul className="space-y-1">
                      {insight.action_items.map((action, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button className="w-full mt-4">
                    <Zap className="h-4 w-4 mr-2" />
                    Appliquer les recommandations
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="text-base">Analyse Comportementale Multi-Dimensionnelle</CardTitle>
                <CardDescription>Radar ML des comportements clients</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={customerBehaviorData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="segment" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Radar name="Score IA" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Segments Comportementaux
                </CardTitle>
                <CardDescription>Identification automatique par ML</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerBehaviorData.map((segment) => (
                    <div key={segment.segment}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{segment.segment}</span>
                        <span className="text-sm text-muted-foreground">{segment.score}%</span>
                      </div>
                      <Progress value={segment.score} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-base">Tendances de Marché - Analyse IA</CardTitle>
              <CardDescription>Opportunités identifiées par machine learning</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={marketTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="growth" fill="#10b981" name="Croissance %" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="competition" fill="#ef4444" name="Compétition %" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="opportunity" fill="#8b5cf6" name="Opportunité %" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover-scale animate-fade-in">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  ROI Optimisé
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">+34.2%</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Amélioration prédite avec recommandations IA
                </p>
                <Progress value={68} className="mt-4" />
              </CardContent>
            </Card>

            <Card className="hover-scale animate-fade-in">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">+50%</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Potentiel avec optimisation ML
                </p>
                <Progress value={75} className="mt-4" />
              </CardContent>
            </Card>

            <Card className="hover-scale animate-fade-in">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Churn Reduction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">-27%</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Réduction prédite avec actions préventives
                </p>
                <Progress value={54} className="mt-4" />
              </CardContent>
            </Card>
          </div>

          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Recommandations d'Optimisation Automatiques
              </CardTitle>
              <CardDescription>Générées par notre moteur d'IA avancé</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold">Optimisation pricing dynamique</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      L'IA recommande d'ajuster les prix de 15 produits pour maximiser la marge (+€42K/mois estimé)
                    </p>
                  </div>
                  <Badge variant="secondary">Impact: +12%</Badge>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold">Campagne de réactivation ciblée</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      45 clients inactifs identifiés avec forte probabilité de retour (78% confiance ML)
                    </p>
                  </div>
                  <Badge variant="secondary">Impact: +8%</Badge>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold">Expansion catégorie "Tech"</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Opportunité de marché détectée: demande croissante +31%, faible compétition
                    </p>
                  </div>
                  <Badge variant="secondary">Impact: +23%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
