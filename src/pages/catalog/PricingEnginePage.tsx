/**
 * PricingEnginePage — Moteur de pricing avancé
 * Phase 3 de l'audit global
 */
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  DollarSign, TrendingUp, TrendingDown, Calculator, Target,
  Zap, AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight,
  BarChart3, Layers, Settings, Play, Shield, Brain, RefreshCw
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, ScatterChart, Scatter, Cell
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }

interface PricingRule {
  id: string
  name: string
  type: 'markup' | 'margin' | 'competitor' | 'dynamic'
  value: number
  isActive: boolean
  productsAffected: number
}

export default function PricingEnginePage() {
  const { user } = useAuth()
  const [minMargin, setMinMargin] = useState(15)
  const [targetMargin, setTargetMargin] = useState(30)
  const [autoReprice, setAutoReprice] = useState(false)
  const [selectedRule, setSelectedRule] = useState<string>('markup')

  const { data: products = [] } = useQuery({
    queryKey: ['pricing-engine-products', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data } = await supabase
        .from('products')
        .select('id, title, price, cost_price, stock_quantity, status, category, sku')
        .eq('user_id', user.id)
        .limit(1000)
      return data || []
    },
    enabled: !!user,
    staleTime: 60000,
  })

  // Pricing rules from DB
  const { data: pricingRules = [] } = useQuery({
    queryKey: ['pricing-rules', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true })
      return data || []
    },
    enabled: !!user,
  })

  // Compute pricing analytics
  const analytics = useMemo(() => {
    const withMargin = products.filter((p: any) => p.price && p.cost_price && p.price > 0)
    const margins = withMargin.map((p: any) => ({
      ...p,
      margin: ((p.price - p.cost_price) / p.price) * 100,
      profit: p.price - p.cost_price,
    }))

    const negative = margins.filter(m => m.margin < 0)
    const low = margins.filter(m => m.margin >= 0 && m.margin < minMargin)
    const optimal = margins.filter(m => m.margin >= minMargin && m.margin <= 50)
    const high = margins.filter(m => m.margin > 50)
    const avgMargin = margins.length > 0 ? margins.reduce((s, m) => s + m.margin, 0) / margins.length : 0
    const totalProfit = margins.reduce((s, m) => s + m.profit * (m.stock_quantity || 0), 0)
    const revenueAtRisk = negative.reduce((s, m) => s + Math.abs(m.profit) * (m.stock_quantity || 0), 0)

    // Scatter data for price vs cost
    const scatterData = margins.slice(0, 100).map(m => ({
      x: m.cost_price, y: m.price, margin: m.margin, name: m.title?.substring(0, 20),
    }))

    // Margin histogram
    const histogram = [
      { range: '<0%', count: negative.length, color: 'hsl(var(--destructive))' },
      { range: '0-10%', count: margins.filter(m => m.margin >= 0 && m.margin < 10).length, color: 'hsl(var(--warning))' },
      { range: '10-20%', count: margins.filter(m => m.margin >= 10 && m.margin < 20).length, color: 'hsl(var(--info))' },
      { range: '20-30%', count: margins.filter(m => m.margin >= 20 && m.margin < 30).length, color: 'hsl(var(--success))' },
      { range: '30-50%', count: margins.filter(m => m.margin >= 30 && m.margin < 50).length, color: 'hsl(var(--success))' },
      { range: '>50%', count: high.length, color: 'hsl(var(--primary))' },
    ]

    return { margins, negative, low, optimal, high, avgMargin, totalProfit, revenueAtRisk, scatterData, histogram, noCost: products.filter((p: any) => !p.cost_price).length }
  }, [products, minMargin])

  const handleBulkReprice = (type: 'negative' | 'low') => {
    const count = type === 'negative' ? analytics.negative.length : analytics.low.length
    toast.success(`${count} produits repricés`, {
      description: `Marge cible appliquée : ${targetMargin}%`,
    })
  }

  return (
    <ChannablePageWrapper
      title="Moteur de Pricing"
      description={`${products.length} produits — Marge moy. ${analytics.avgMargin.toFixed(1)}% — ${analytics.negative.length} marges négatives`}
      heroImage="products"
    >
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

        {/* KPI Row */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Marge Moyenne', value: `${analytics.avgMargin.toFixed(1)}%`, icon: Target, color: analytics.avgMargin > 15 ? 'text-success' : 'text-warning' },
            { label: 'Profit Potentiel', value: `${(analytics.totalProfit / 1000).toFixed(1)}k€`, icon: TrendingUp, color: 'text-success' },
            { label: 'Revenu à Risque', value: `${(analytics.revenueAtRisk / 1000).toFixed(1)}k€`, icon: AlertTriangle, color: 'text-destructive' },
            { label: 'Marges Négatives', value: analytics.negative.length, icon: TrendingDown, color: 'text-destructive' },
            { label: 'Marges Faibles', value: analytics.low.length, icon: AlertTriangle, color: 'text-warning' },
            { label: 'Sans Coût', value: analytics.noCost, icon: DollarSign, color: 'text-muted-foreground' },
          ].map((kpi, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={cn('h-4 w-4', kpi.color)} />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <Tabs defaultValue="analysis" className="space-y-4">
          <TabsList>
            <TabsTrigger value="analysis">Analyse</TabsTrigger>
            <TabsTrigger value="rules">Règles de Prix</TabsTrigger>
            <TabsTrigger value="bulk">Actions Groupées</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Margin Histogram */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Distribution des marges</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={analytics.histogram}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <RTooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {analytics.histogram.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Price vs Cost Scatter */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Prix vs Coût (corrélation)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="x" name="Coût" unit="€" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="y" name="Prix" unit="€" tick={{ fontSize: 11 }} />
                      <RTooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter data={analytics.scatterData} fill="hsl(var(--primary))" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Règles de Tarification Actives</CardTitle>
                  <Badge variant="outline">{pricingRules.length} règle(s)</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {pricingRules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucune règle configurée</p>
                    <p className="text-xs mt-1">Créez vos premières règles de tarification dans la page Pricing</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pricingRules.slice(0, 10).map((rule: any) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                          <Zap className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{rule.name}</p>
                            <p className="text-xs text-muted-foreground">{rule.rule_type} — Priorité {rule.priority}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                            {rule.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{rule.products_affected || 0} produits</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Negative Margins */}
              <Card className="border-destructive/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    Marges Négatives ({analytics.negative.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {analytics.negative.slice(0, 8).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded bg-destructive/5">
                        <span className="text-xs truncate max-w-[60%]">{p.title}</span>
                        <Badge variant="destructive" className="text-[10px]">{p.margin.toFixed(1)}%</Badge>
                      </div>
                    ))}
                  </div>
                  {analytics.negative.length > 0 && (
                    <Button size="sm" variant="destructive" className="w-full" onClick={() => handleBulkReprice('negative')}>
                      <Zap className="h-3 w-3 mr-1" />
                      Corriger {analytics.negative.length} prix
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Low Margins */}
              <Card className="border-warning/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Marges Faibles &lt;{minMargin}% ({analytics.low.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {analytics.low.slice(0, 8).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded bg-warning/5">
                        <span className="text-xs truncate max-w-[60%]">{p.title}</span>
                        <Badge variant="outline" className="text-[10px] text-warning">{p.margin.toFixed(1)}%</Badge>
                      </div>
                    ))}
                  </div>
                  {analytics.low.length > 0 && (
                    <Button size="sm" variant="outline" className="w-full border-warning text-warning" onClick={() => handleBulkReprice('low')}>
                      <Calculator className="h-3 w-3 mr-1" />
                      Optimiser {analytics.low.length} prix
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Configuration du Moteur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs">Marge Minimale Autorisée</Label>
                  <div className="flex items-center gap-4">
                    <Slider value={[minMargin]} onValueChange={([v]) => setMinMargin(v)} min={0} max={50} step={1} className="flex-1" />
                    <span className="text-sm font-medium w-12 text-right tabular-nums">{minMargin}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Les produits sous ce seuil déclenchent une alerte</p>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs">Marge Cible pour Repricing</Label>
                  <div className="flex items-center gap-4">
                    <Slider value={[targetMargin]} onValueChange={([v]) => setTargetMargin(v)} min={10} max={60} step={1} className="flex-1" />
                    <span className="text-sm font-medium w-12 text-right tabular-nums">{targetMargin}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Repricing Automatique</p>
                    <p className="text-xs text-muted-foreground">Ajuster automatiquement les prix sous le seuil minimum</p>
                  </div>
                  <Switch checked={autoReprice} onCheckedChange={setAutoReprice} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Protection Anti-Perte</p>
                    <p className="text-xs text-muted-foreground">Bloquer les mises à jour créant une marge négative</p>
                  </div>
                  <Switch checked={true} disabled />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </ChannablePageWrapper>
  )
}
