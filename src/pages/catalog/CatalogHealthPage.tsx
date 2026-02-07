/**
 * CatalogHealthPage - Santé du Catalogue
 * Migré sur socle PageLayout + StatCard + PageBanner
 */
import { useState } from 'react'
import { PageLayout, StatCard, PageBanner } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HeartPulse, CheckCircle, AlertTriangle, XCircle, Activity, Download, TrendingUp, Image, Tag, Package, Brain, Sparkles } from 'lucide-react'
import { useCatalogHealth } from '@/hooks/catalog'
import { CatalogHealthAIPanel } from '@/components/catalog'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function CatalogHealthPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const { metrics, evolution, isLoading } = useCatalogHealth()

  const detailedKPIs = metrics ? [
    { label: 'Produits optimisés', value: metrics.optimizedPercent, count: metrics.optimizedCount, icon: CheckCircle, color: 'success' as const },
    { label: 'À traiter', value: metrics.toProcessPercent, count: metrics.toProcessCount, icon: AlertTriangle, color: 'warning' as const },
    { label: 'Bloquants', value: metrics.blockingPercent, count: metrics.blockingCount, icon: XCircle, color: 'destructive' as const },
  ] : []

  const completenessDetails = metrics?.details ? [
    { label: 'Avec images', value: metrics.details.withImages, total: metrics.total, icon: Image },
    { label: 'Avec catégorie', value: metrics.details.withCategory, total: metrics.total, icon: Tag },
    { label: 'En stock', value: metrics.details.withStock, total: metrics.total, icon: Package },
    { label: 'Marge > 10%', value: metrics.details.withMargin, total: metrics.total, icon: TrendingUp },
  ] : []

  return (
    <PageLayout
      title="Santé du Catalogue"
      subtitle={`${metrics?.total || 0} produits — Score global : ${metrics?.globalScore || 0}%`}
      actions={
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />Exporter
        </Button>
      }
    >
      <PageBanner
        icon={HeartPulse}
        title="Pilotez la qualité de votre catalogue"
        description="Intelligence IA pour identifier et corriger les fiches produits à optimiser"
        theme="green"
      />

      {/* KPIs — StatCard socle */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {detailedKPIs.map((kpi) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={`${kpi.value}%`}
            sub={`${kpi.count} produits`}
            icon={kpi.icon}
            color={kpi.color}
          />
        ))}
      </div>

      <Tabs defaultValue="ai" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Intelligence IA
            <Sparkles className="h-3 w-3 text-violet-500" />
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4" />
            Détails
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai">
          <CatalogHealthAIPanel />
        </TabsContent>

        <TabsContent value="details">
          <div className="space-y-6">
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
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Évolution du score
                  </CardTitle>
                  <div className="flex gap-1">
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
                      <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} name="Score" />
                      <Area type="monotone" dataKey="optimized" stroke="hsl(142, 76%, 36%)" fill="hsl(142, 76%, 36%, 0.1)" strokeWidth={2} name="Optimisés %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}
