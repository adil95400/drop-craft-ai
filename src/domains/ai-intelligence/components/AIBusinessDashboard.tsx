/**
 * AIBusinessDashboard — Advanced AI Intelligence Dashboard (Phase 6)
 * Pricing suggestions, trending detection, performance analysis via API V1
 */
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Brain, Loader2, TrendingUp, TrendingDown, DollarSign, Zap,
  BarChart3, Target, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Sparkles, Activity, ShieldAlert, Lightbulb, Minus
} from 'lucide-react'
import {
  useBusinessSummary,
  useTrendingProducts,
  usePricingSuggestions,
  usePerformanceAnalysis,
} from '@/hooks/useAdvancedAI'
import type { AIPricingSuggestion, AIPerformanceReport } from '@/hooks/useAdvancedAI'

export function AIBusinessDashboard() {
  const { data: summary, isLoading: summaryLoading } = useBusinessSummary()
  const { data: trending, isLoading: trendingLoading } = useTrendingProducts(10)
  const pricingMut = usePricingSuggestions()
  const perfMut = usePerformanceAnalysis()

  const [pricingResults, setPricingResults] = useState<AIPricingSuggestion[]>([])
  const [perfReport, setPerfReport] = useState<AIPerformanceReport | null>(null)

  const handlePricingAnalysis = async () => {
    const result = await pricingMut.mutateAsync({ strategy: 'competitive' })
    setPricingResults(result.items || [])
  }

  const handlePerformanceAnalysis = async () => {
    const result = await perfMut.mutateAsync({ time_range: '30 jours', focus: 'global' })
    setPerfReport(result)
  }

  const velocityIcon = (v: string) => {
    if (v === 'rising') return <ArrowUpRight className="h-4 w-4 text-green-500" />
    if (v === 'declining') return <ArrowDownRight className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Advanced AI Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">
            Pricing IA, détection de tendances et analyse de performance
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-primary/80 to-primary text-primary-foreground px-4 py-2 text-sm">
          PHASE 6 — AI
        </Badge>
      </div>

      {/* Business Summary Cards */}
      {summaryLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                {summary.revenue_trend.direction === 'up'
                  ? <TrendingUp className="h-4 w-4 text-green-500" />
                  : <TrendingDown className="h-4 w-4 text-red-500" />}
                Tendance Revenus
              </CardDescription>
              <CardTitle className="text-2xl">
                {summary.revenue_trend.direction === 'up' ? '+' : '-'}{summary.revenue_trend.percent}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">vs. période précédente</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                Catégorie leader
              </CardDescription>
              <CardTitle className="text-lg">{summary.top_category}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Meilleure performance</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                Score de santé
              </CardDescription>
              <CardTitle className="text-2xl">{summary.health_score}/100</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={summary.health_score} className="h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <ShieldAlert className="h-4 w-4" />
                Alertes risques
              </CardDescription>
              <CardTitle className="text-2xl">{summary.risk_alerts.length}</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.risk_alerts.length > 0 ? (
                <p className="text-xs text-destructive">{summary.risk_alerts[0]}</p>
              ) : (
                <p className="text-xs text-green-600">Aucune alerte</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="trending">🔥 Trending</TabsTrigger>
          <TabsTrigger value="pricing">💰 Pricing IA</TabsTrigger>
          <TabsTrigger value="performance">📊 Performance</TabsTrigger>
          <TabsTrigger value="recommendations">💡 Recommandations</TabsTrigger>
        </TabsList>

        {/* Trending Products */}
        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Produits en tendance
              </CardTitle>
              <CardDescription>Détection automatique basée sur la vélocité des ventes</CardDescription>
            </CardHeader>
            <CardContent>
              {trendingLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : (
                <div className="space-y-3">
                  {(trending?.items || []).map((product, idx) => (
                    <div key={product.product_id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-8">#{idx + 1}</span>
                        <div>
                          <p className="font-medium">{product.product_name}</p>
                          <p className="text-xs text-muted-foreground">{product.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{product.sales_7d} ventes / 7j</p>
                          <p className="text-xs text-muted-foreground">{product.sales_30d} / 30j</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {velocityIcon(product.velocity)}
                          <Badge variant={product.velocity === 'rising' ? 'default' : product.velocity === 'declining' ? 'destructive' : 'secondary'}>
                            {product.trend_score}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!trending?.items?.length) && (
                    <p className="text-center text-muted-foreground py-8">Aucune donnée de vente. Importez des commandes pour activer la détection.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Suggestions */}
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Suggestions de prix IA
                  </CardTitle>
                  <CardDescription>Optimisation dynamique via analyse IA du catalogue</CardDescription>
                </div>
                <Button onClick={handlePricingAnalysis} disabled={pricingMut.isPending}>
                  {pricingMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Analyser les prix
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pricingResults.length > 0 ? (
                <div className="space-y-3">
                  {pricingResults.map((s) => (
                    <div key={s.product_id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div>
                        <p className="font-medium">{s.product_name}</p>
                        <p className="text-xs text-muted-foreground">{s.reason}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm line-through text-muted-foreground">{s.current_price.toFixed(2)}€</p>
                          <p className="text-lg font-bold text-primary">{s.suggested_price.toFixed(2)}€</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={s.potential_revenue_change > 0 ? 'default' : 'destructive'}>
                            {s.potential_revenue_change > 0 ? '+' : ''}{s.potential_revenue_change}%
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">{s.confidence}% confiance</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Cliquez sur "Analyser les prix" pour obtenir des suggestions IA
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Analysis */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Analyse de performance IA
                  </CardTitle>
                  <CardDescription>Diagnostic complet propulsé par l'intelligence artificielle</CardDescription>
                </div>
                <Button onClick={handlePerformanceAnalysis} disabled={perfMut.isPending}>
                  {perfMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                  Lancer l'analyse
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {perfReport ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-primary">{perfReport.score}/100</div>
                    <p className="text-muted-foreground">{perfReport.summary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-green-600 flex items-center gap-1">
                        <ArrowUpRight className="h-4 w-4" /> Forces
                      </h4>
                      {perfReport.strengths.map((s, i) => (
                        <p key={i} className="text-sm pl-5">• {s}</p>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-red-500 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Faiblesses
                      </h4>
                      {perfReport.weaknesses.map((w, i) => (
                        <p key={i} className="text-sm pl-5">• {w}</p>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Actions recommandées</h4>
                    {perfReport.actions.map((a, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Badge variant={a.priority === 'high' ? 'destructive' : a.priority === 'medium' ? 'default' : 'secondary'}>
                            {a.priority}
                          </Badge>
                          <span className="text-sm">{a.action}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{a.impact}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Cliquez sur "Lancer l'analyse" pour un diagnostic IA complet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Recommendations */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Recommandations IA
              </CardTitle>
              <CardDescription>Actions stratégiques basées sur l'analyse de vos données</CardDescription>
            </CardHeader>
            <CardContent>
              {summary?.ai_recommendations?.length ? (
                <div className="space-y-3">
                  {summary.ai_recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-lg border bg-accent/30">
                      <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{rec}</p>
                        <Badge variant="outline" className="mt-2 text-xs">Priorité {i === 0 ? 'haute' : i === 1 ? 'moyenne' : 'standard'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Les recommandations apparaîtront après l'analyse de vos données
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
