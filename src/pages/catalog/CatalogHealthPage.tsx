/**
 * CatalogHealthPage - Santé du Catalogue avec données réelles
 * Dashboard macro des KPIs catalogue
 */
import { useState } from 'react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HeartPulse, CheckCircle, AlertTriangle, XCircle, Activity, Download, TrendingUp, Image, Tag, Package } from 'lucide-react'
import { useCatalogHealth } from '@/hooks/catalog'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function CatalogHealthPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const { metrics, evolution, isLoading } = useCatalogHealth()

  // KPIs détaillés calculés depuis les vraies données
  const detailedKPIs = metrics ? [
    { 
      label: 'Produits optimisés', 
      value: metrics.optimizedPercent, 
      count: metrics.optimizedCount, 
      icon: CheckCircle, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10',
      trend: '+' + Math.round(metrics.trend) + '%'
    },
    { 
      label: 'À traiter', 
      value: metrics.toProcessPercent, 
      count: metrics.toProcessCount, 
      icon: AlertTriangle, 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10',
      trend: '-12%'
    },
    { 
      label: 'Bloquants', 
      value: metrics.blockingPercent, 
      count: metrics.blockingCount, 
      icon: XCircle, 
      color: 'text-red-500', 
      bg: 'bg-red-500/10',
      trend: '-5%'
    },
  ] : []

  // Détails de complétude
  const completenessDetails = metrics?.details ? [
    { label: 'Avec images', value: metrics.details.withImages, total: metrics.total, icon: Image },
    { label: 'Avec catégorie', value: metrics.details.withCategory, total: metrics.total, icon: Tag },
    { label: 'En stock', value: metrics.details.withStock, total: metrics.total, icon: Package },
    { label: 'Marge > 10%', value: metrics.details.withMargin, total: metrics.total, icon: TrendingUp },
  ] : []

  return (
    <ChannablePageWrapper 
      title="Santé du Catalogue" 
      subtitle="Vue macro & KPIs" 
      description="Pilotez la qualité de votre catalogue avec des données réelles" 
      heroImage="analytics"
      badge={{ 
        label: `Score: ${metrics?.globalScore || 0}%`, 
        variant: (metrics?.globalScore || 0) >= 70 ? 'default' : 'destructive' 
      }}
      actions={
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />Exporter
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Score global */}
        <Card className="bg-gradient-to-br from-primary/5 via-violet-500/5 to-purple-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-24 h-24 rounded-full border-8 flex items-center justify-center",
                  (metrics?.globalScore || 0) >= 70 ? "border-emerald-500/20" :
                  (metrics?.globalScore || 0) >= 50 ? "border-amber-500/20" : "border-red-500/20"
                )}>
                  <div className="text-center">
                    <span className={cn(
                      "text-3xl font-bold",
                      (metrics?.globalScore || 0) >= 70 ? "text-emerald-500" :
                      (metrics?.globalScore || 0) >= 50 ? "text-amber-500" : "text-red-500"
                    )}>
                      {metrics?.globalScore || 0}
                    </span>
                    <span className="text-sm text-muted-foreground block">/ 100</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Score global de santé</h3>
                  <p className="text-muted-foreground">{metrics?.total || 0} produits analysés</p>
                  <div className="flex gap-2 mt-3">
                    {(['7d', '30d', '90d'] as const).map((range) => (
                      <Button 
                        key={range} 
                        variant={timeRange === range ? 'default' : 'outline'} 
                        size="sm" 
                        onClick={() => setTimeRange(range)}
                      >
                        {range}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <HeartPulse className="h-16 w-16 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        {/* KPIs principaux */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {detailedKPIs.map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={cn("p-3 rounded-xl", kpi.bg)}>
                    <kpi.icon className={cn("h-6 w-6", kpi.color)} />
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", kpi.trend.startsWith('+') ? "text-emerald-600" : "text-red-600")}
                  >
                    {kpi.trend}
                  </Badge>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className={cn("text-3xl font-bold", kpi.color)}>{kpi.value}%</span>
                    <span className="text-sm text-muted-foreground">({kpi.count})</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{kpi.label}</p>
                </div>
                <Progress value={kpi.value} className="h-2 mt-3" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Détails de complétude */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Détails de complétude</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {completenessDetails.map((detail) => {
                const percent = detail.total > 0 ? Math.round((detail.value / detail.total) * 100) : 0
                return (
                  <div key={detail.label} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <detail.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{detail.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{detail.value}</span>
                      <span className="text-sm text-muted-foreground">/ {detail.total}</span>
                    </div>
                    <Progress value={percent} className="h-1.5" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Graphique d'évolution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Évolution du score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.1)" 
                    strokeWidth={2}
                    name="Score"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="optimized" 
                    stroke="hsl(142, 76%, 36%)" 
                    fill="hsl(142, 76%, 36%, 0.1)" 
                    strokeWidth={2}
                    name="Optimisés %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </ChannablePageWrapper>
  )
}
