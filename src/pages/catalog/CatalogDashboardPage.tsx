/**
 * CatalogDashboardPage — Dashboard unifié catalogue avec alertes temps réel
 * Phase 2 de l'audit global
 */
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  LayoutDashboard, AlertTriangle, TrendingUp, TrendingDown, Package,
  DollarSign, BarChart3, Bell, BellRing, CheckCircle, XCircle,
  ArrowUpRight, ArrowDownRight, Eye, Zap, RefreshCw, Clock,
  ShoppingCart, Target, Activity, Layers, Brain, Shield
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }

const ALERT_SEVERITY_STYLES = {
  critical: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30', icon: XCircle },
  warning: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30', icon: AlertTriangle },
  info: { bg: 'bg-info/10', text: 'text-info', border: 'border-info/30', icon: Bell },
}

interface CatalogAlert {
  id: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  message: string
  metric?: number
  threshold?: number
  timestamp: Date
  acknowledged: boolean
}

export default function CatalogDashboardPage() {
  const { user } = useAuth()
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  // Fetch product stats
  const { data: products = [] } = useQuery({
    queryKey: ['catalog-dashboard-products', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data } = await supabase
        .from('products')
        .select('id, title, price, cost_price, stock_quantity, status, category, created_at, updated_at')
        .eq('user_id', user.id)
        .limit(1000)
      return data || []
    },
    enabled: !!user,
    staleTime: 60000,
  })

  // Compute KPIs
  const kpis = useMemo(() => {
    const total = products.length
    const active = products.filter((p: any) => p.status === 'active').length
    const draft = products.filter((p: any) => p.status === 'draft').length
    const outOfStock = products.filter((p: any) => (p.stock_quantity ?? 0) === 0).length
    const lowStock = products.filter((p: any) => (p.stock_quantity ?? 0) > 0 && (p.stock_quantity ?? 0) < 5).length
    const noPrice = products.filter((p: any) => !p.price || p.price === 0).length
    const noCost = products.filter((p: any) => !p.cost_price || p.cost_price === 0).length
    const totalValue = products.reduce((s: number, p: any) => s + (p.price || 0) * (p.stock_quantity || 0), 0)
    const totalCost = products.reduce((s: number, p: any) => s + (p.cost_price || 0) * (p.stock_quantity || 0), 0)
    const avgMargin = totalValue > 0 ? ((totalValue - totalCost) / totalValue) * 100 : 0

    return { total, active, draft, outOfStock, lowStock, noPrice, noCost, totalValue, totalCost, avgMargin }
  }, [products])

  // Generate alerts from data
  const alerts = useMemo<CatalogAlert[]>(() => {
    const list: CatalogAlert[] = []
    if (kpis.outOfStock > 0) {
      list.push({
        id: 'oos', type: 'stock', severity: 'critical',
        title: `${kpis.outOfStock} produit(s) en rupture de stock`,
        message: `Ces produits ne peuvent pas être vendus. Réapprovisionnez immédiatement.`,
        metric: kpis.outOfStock, threshold: 0, timestamp: new Date(), acknowledged: false,
      })
    }
    if (kpis.lowStock > 3) {
      list.push({
        id: 'low', type: 'stock', severity: 'warning',
        title: `${kpis.lowStock} produit(s) en stock faible (<5)`,
        message: `Risque de rupture imminente. Planifiez un réapprovisionnement.`,
        metric: kpis.lowStock, threshold: 5, timestamp: new Date(), acknowledged: false,
      })
    }
    if (kpis.noPrice > 0) {
      list.push({
        id: 'noprice', type: 'pricing', severity: 'warning',
        title: `${kpis.noPrice} produit(s) sans prix`,
        message: `Ces produits ne peuvent pas être mis en vente.`,
        metric: kpis.noPrice, timestamp: new Date(), acknowledged: false,
      })
    }
    if (kpis.avgMargin < 15 && kpis.total > 0) {
      list.push({
        id: 'margin', type: 'pricing', severity: 'warning',
        title: `Marge moyenne faible : ${kpis.avgMargin.toFixed(1)}%`,
        message: `La marge est inférieure au seuil recommandé de 15%.`,
        metric: kpis.avgMargin, threshold: 15, timestamp: new Date(), acknowledged: false,
      })
    }
    if (kpis.draft > kpis.active && kpis.total > 0) {
      list.push({
        id: 'draft', type: 'catalog', severity: 'info',
        title: `Plus de brouillons que de produits actifs`,
        message: `${kpis.draft} brouillons vs ${kpis.active} actifs. Publiez vos produits.`,
        timestamp: new Date(), acknowledged: false,
      })
    }
    return list
  }, [kpis])

  // Status distribution for pie chart
  const statusDistribution = useMemo(() => [
    { name: 'Actifs', value: kpis.active, color: 'hsl(var(--success))' },
    { name: 'Brouillons', value: kpis.draft, color: 'hsl(var(--warning))' },
    { name: 'Rupture', value: kpis.outOfStock, color: 'hsl(var(--destructive))' },
    { name: 'Stock faible', value: kpis.lowStock, color: 'hsl(var(--info))' },
  ].filter(d => d.value > 0), [kpis])

  // Category distribution
  const categoryDistribution = useMemo(() => {
    const cats: Record<string, number> = {}
    products.forEach((p: any) => {
      const cat = p.category || 'Non catégorisé'
      cats[cat] = (cats[cat] || 0) + 1
    })
    return Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }))
  }, [products])

  // Margin distribution
  const marginDistribution = useMemo(() => {
    const buckets = { 'Négatif': 0, '0-10%': 0, '10-20%': 0, '20-30%': 0, '30-50%': 0, '>50%': 0 }
    products.forEach((p: any) => {
      if (!p.price || !p.cost_price) return
      const margin = ((p.price - p.cost_price) / p.price) * 100
      if (margin < 0) buckets['Négatif']++
      else if (margin < 10) buckets['0-10%']++
      else if (margin < 20) buckets['10-20%']++
      else if (margin < 30) buckets['20-30%']++
      else if (margin < 50) buckets['30-50%']++
      else buckets['>50%']++
    })
    return Object.entries(buckets).map(([name, value]) => ({ name, value }))
  }, [products])

  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length
  const warningAlerts = alerts.filter(a => a.severity === 'warning').length

  return (
    <ChannablePageWrapper
      title="Dashboard Catalogue"
      description={`${kpis.total} produits — ${criticalAlerts} alertes critiques — Marge moy. ${kpis.avgMargin.toFixed(1)}%`}
      heroImage="products"
    >
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

        {/* KPI Cards */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Produits', value: kpis.total, icon: Package, color: 'text-primary' },
            { label: 'Actifs', value: kpis.active, icon: CheckCircle, color: 'text-success' },
            { label: 'Brouillons', value: kpis.draft, icon: Clock, color: 'text-warning' },
            { label: 'Rupture', value: kpis.outOfStock, icon: XCircle, color: 'text-destructive' },
            { label: 'Valeur Stock', value: `${(kpis.totalValue / 1000).toFixed(1)}k€`, icon: DollarSign, color: 'text-success' },
            { label: 'Marge Moy.', value: `${kpis.avgMargin.toFixed(1)}%`, icon: TrendingUp, color: kpis.avgMargin > 15 ? 'text-success' : 'text-warning' },
          ].map((kpi, i) => (
            <Card key={i} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={cn('h-4 w-4', kpi.color)} />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{kpi.label}</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Alerts Panel */}
        {alertsEnabled && alerts.length > 0 && (
          <motion.div variants={fadeUp}>
            <Card className="border-warning/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-warning" />
                    Alertes Intelligentes ({alerts.length})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Alertes</span>
                    <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {alerts.map(alert => {
                  const style = ALERT_SEVERITY_STYLES[alert.severity]
                  const Icon = style.icon
                  return (
                    <div key={alert.id} className={cn('flex items-start gap-3 p-3 rounded-lg border', style.bg, style.border)}>
                      <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', style.text)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {alert.type}
                      </Badge>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Charts */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="pricing">Pricing & Marges</TabsTrigger>
            <TabsTrigger value="inventory">Inventaire</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Status Pie */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Répartition par statut</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                        {statusDistribution.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <RTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Bar */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Top Catégories</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={categoryDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                      <RTooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Margin Distribution */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Distribution des marges</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={marginDistribution}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <RTooltip />
                      <Bar dataKey="value" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pricing Health */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Santé Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'Produits avec prix', value: kpis.total - kpis.noPrice, max: kpis.total, color: 'bg-success' },
                    { label: 'Produits avec coût', value: kpis.total - kpis.noCost, max: kpis.total, color: 'bg-info' },
                    { label: 'Marge > 15%', value: products.filter((p: any) => p.price && p.cost_price && ((p.price - p.cost_price) / p.price) > 0.15).length, max: kpis.total, color: 'bg-success' },
                    { label: 'Marge négative', value: products.filter((p: any) => p.price && p.cost_price && p.cost_price > p.price).length, max: kpis.total, color: 'bg-destructive' },
                  ].map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium tabular-nums">{item.value}/{item.max}</span>
                      </div>
                      <Progress value={item.max > 0 ? (item.value / item.max) * 100 : 0} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Stock Health Cards */}
              {[
                { label: 'En stock', count: kpis.total - kpis.outOfStock - kpis.lowStock, icon: CheckCircle, color: 'text-success', pct: kpis.total > 0 ? ((kpis.total - kpis.outOfStock - kpis.lowStock) / kpis.total * 100) : 0 },
                { label: 'Stock faible', count: kpis.lowStock, icon: AlertTriangle, color: 'text-warning', pct: kpis.total > 0 ? (kpis.lowStock / kpis.total * 100) : 0 },
                { label: 'Rupture', count: kpis.outOfStock, icon: XCircle, color: 'text-destructive', pct: kpis.total > 0 ? (kpis.outOfStock / kpis.total * 100) : 0 },
              ].map((item, i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <item.icon className={cn('h-5 w-5', item.color)} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <p className="text-3xl font-bold tabular-nums">{item.count}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.pct.toFixed(1)}% du catalogue</p>
                    <Progress value={item.pct} className="h-1.5 mt-3" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Top produits en rupture */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Produits en rupture nécessitant une action</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {products.filter((p: any) => (p.stock_quantity ?? 0) === 0).slice(0, 10).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.category || 'Sans catégorie'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">{(p.price || 0).toFixed(2)}€</p>
                        <Badge variant="destructive" className="text-[10px]">Rupture</Badge>
                      </div>
                    </div>
                  ))}
                  {products.filter((p: any) => (p.stock_quantity ?? 0) === 0).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucun produit en rupture 🎉</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </ChannablePageWrapper>
  )
}
