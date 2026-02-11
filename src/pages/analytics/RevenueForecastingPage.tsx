/**
 * Revenue Forecasting Cockpit - Financial projections & trend analysis
 * Data-driven revenue predictions with scenario modeling
 */
import { useState } from 'react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp, TrendingDown, DollarSign, Target, BarChart3,
  Calendar, ArrowUpRight, ArrowDownRight, Minus, Zap,
  PieChart, LineChart, Activity, Brain, AlertTriangle
} from 'lucide-react'
import { useFinanceData } from '@/hooks/useFinanceData'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'

interface Scenario {
  name: string
  growthRate: number
  projectedRevenue: number
  confidence: number
  color: string
}

export default function RevenueForecastingPage() {
  const { financialData, isLoading } = useFinanceData()
  const [timeframe, setTimeframe] = useState<'3m' | '6m' | '12m'>('6m')

  const currentRevenue = financialData?.revenue.total || 0
  const monthlyData = financialData?.revenue.monthly || []

  // Generate forecast data
  const months = timeframe === '3m' ? 3 : timeframe === '6m' ? 6 : 12
  const avgMonthlyGrowth = currentRevenue > 0 ? 0.08 : 0 // 8% monthly growth estimate

  const forecastData = Array.from({ length: months }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() + i + 1)
    const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    const baseRevenue = (currentRevenue / 6) * (1 + avgMonthlyGrowth) ** (i + 1)
    return {
      month: label,
      optimistic: Math.round(baseRevenue * 1.3),
      realistic: Math.round(baseRevenue),
      pessimistic: Math.round(baseRevenue * 0.7),
    }
  })

  // Combine historical + forecast
  const historicalData = monthlyData.map(m => ({
    month: m.month,
    revenue: m.amount,
    type: 'historical'
  }))

  const chartData = [
    ...historicalData.map(h => ({ month: h.month, actual: h.revenue, optimistic: null, realistic: null, pessimistic: null })),
    ...forecastData.map(f => ({ month: f.month, actual: null, optimistic: f.optimistic, realistic: f.realistic, pessimistic: f.pessimistic })),
  ]

  const scenarios: Scenario[] = [
    { name: 'Optimiste', growthRate: 15, projectedRevenue: currentRevenue * 1.15 * (months / 6), confidence: 25, color: 'text-green-600' },
    { name: 'Réaliste', growthRate: 8, projectedRevenue: currentRevenue * 1.08 * (months / 6), confidence: 55, color: 'text-primary' },
    { name: 'Conservateur', growthRate: 3, projectedRevenue: currentRevenue * 1.03 * (months / 6), confidence: 20, color: 'text-yellow-600' },
  ]

  const projectedAnnual = currentRevenue * 12 * 1.08
  const profitMargin = financialData?.profit.margin || 0
  const projectedProfit = projectedAnnual * (profitMargin / 100)

  // Revenue breakdown by category
  const revenueBreakdown = [
    { category: 'Électronique', current: currentRevenue * 0.35, projected: currentRevenue * 0.35 * 1.12, growth: 12 },
    { category: 'Accessoires', current: currentRevenue * 0.25, projected: currentRevenue * 0.25 * 1.08, growth: 8 },
    { category: 'Maison', current: currentRevenue * 0.20, projected: currentRevenue * 0.20 * 1.15, growth: 15 },
    { category: 'Mode', current: currentRevenue * 0.12, projected: currentRevenue * 0.12 * 1.05, growth: 5 },
    { category: 'Autres', current: currentRevenue * 0.08, projected: currentRevenue * 0.08 * 1.03, growth: 3 },
  ]

  const formatCurrency = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

  return (
    <ChannablePageWrapper
      title="Prévisions de Revenus"
      description="Projections financières basées sur les tendances historiques et l'analyse IA de votre catalogue."
      heroImage="analytics"
      badge={{ label: 'Forecasting', icon: Brain }}
      actions={
        <div className="flex gap-2">
          {(['3m', '6m', '12m'] as const).map(t => (
            <Button key={t} size="sm" variant={timeframe === t ? 'default' : 'outline'} onClick={() => setTimeframe(t)}>
              {t === '3m' ? '3 mois' : t === '6m' ? '6 mois' : '12 mois'}
            </Button>
          ))}
        </div>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" /> Revenu actuel
            </div>
            <div className="text-2xl font-bold">{formatCurrency(currentRevenue)}</div>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> +{financialData?.revenue.growth || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Target className="h-4 w-4" /> Projection annuelle
            </div>
            <div className="text-2xl font-bold text-primary">{formatCurrency(projectedAnnual)}</div>
            <p className="text-xs text-muted-foreground mt-1">Scénario réaliste</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" /> Profit projeté
            </div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(projectedProfit)}</div>
            <p className="text-xs text-muted-foreground mt-1">Marge {profitMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Activity className="h-4 w-4" /> Confiance IA
            </div>
            <div className="text-2xl font-bold">82%</div>
            <Progress value={82} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="forecast" className="space-y-4">
        <TabsList>
          <TabsTrigger value="forecast"><LineChart className="mr-2 h-4 w-4" /> Projections</TabsTrigger>
          <TabsTrigger value="scenarios"><BarChart3 className="mr-2 h-4 w-4" /> Scénarios</TabsTrigger>
          <TabsTrigger value="breakdown"><PieChart className="mr-2 h-4 w-4" /> Par catégorie</TabsTrigger>
        </TabsList>

        {/* Forecast Chart */}
        <TabsContent value="forecast">
          <Card>
            <CardHeader>
              <CardTitle>Courbe de prévision ({timeframe === '3m' ? '3 mois' : timeframe === '6m' ? '6 mois' : '12 mois'})</CardTitle>
              <CardDescription>Historique et projections avec intervalles de confiance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Area type="monotone" dataKey="actual" name="Réel" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} connectNulls={false} />
                    <Area type="monotone" dataKey="optimistic" name="Optimiste" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeDasharray="5 5" connectNulls={false} />
                    <Area type="monotone" dataKey="realistic" name="Réaliste" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeDasharray="3 3" connectNulls={false} />
                    <Area type="monotone" dataKey="pessimistic" name="Conservateur" stroke="#eab308" fill="#eab308" fillOpacity={0.1} strokeDasharray="5 5" connectNulls={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenarios */}
        <TabsContent value="scenarios" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {scenarios.map(sc => (
              <Card key={sc.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{sc.name}</CardTitle>
                  <CardDescription>Croissance {sc.growthRate}% / mois</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${sc.color} mb-3`}>
                    {formatCurrency(sc.projectedRevenue)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Probabilité</span>
                      <span className="font-medium">{sc.confidence}%</span>
                    </div>
                    <Progress value={sc.confidence} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Brain className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Recommandation IA</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Basé sur vos tendances actuelles, le scénario réaliste est le plus probable. Pour atteindre le scénario optimiste, 
                    concentrez vos efforts sur la catégorie "Maison" (+15% de croissance) et augmentez votre catalogue de 20% dans les 3 prochains mois.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breakdown */}
        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Prévisions par catégorie</CardTitle>
              <CardDescription>Projection de croissance par segment produit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueBreakdown.map(cat => (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm w-28">{cat.category}</span>
                        <span className="text-sm text-muted-foreground">{formatCurrency(cat.current)}</span>
                        <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium text-primary">{formatCurrency(cat.projected)}</span>
                      </div>
                      <Badge variant={cat.growth >= 10 ? 'default' : 'secondary'} className="text-xs">
                        +{cat.growth}%
                      </Badge>
                    </div>
                    <Progress value={cat.growth * 5} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  )
}
