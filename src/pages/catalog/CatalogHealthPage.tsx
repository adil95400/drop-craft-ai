/**
 * CatalogHealthPage - Santé du Catalogue (6-Pillar Engine)
 */
import { useState } from 'react'
import { StatCard } from '@/components/shared'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  HeartPulse, CheckCircle, AlertTriangle, XCircle, Activity,
  Download, TrendingUp, Brain, Sparkles, RefreshCw, Loader2,
  Target, ShieldCheck, BarChart3, ArrowRight, Zap
} from 'lucide-react'
import { useCatalogHealthEngine } from '@/hooks/catalog/useCatalogHealthEngine'
import { CatalogHealthAIPanel } from '@/components/catalog'
import { cn } from '@/lib/utils'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { useCatalogHealth } from '@/hooks/catalog'

const GRADE_STYLES: Record<string, { bg: string; text: string }> = {
  A: { bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  B: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
  C: { bg: 'bg-amber-500/10', text: 'text-amber-600' },
  D: { bg: 'bg-orange-500/10', text: 'text-orange-600' },
  F: { bg: 'bg-red-500/10', text: 'text-red-600' },
}

export default function CatalogHealthPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const { summary, productReports, worstProducts, fixableIssuesCount, runBatchScan, isScanningBatch, isLoading } = useCatalogHealthEngine()
  const { evolution } = useCatalogHealth()

  const gradeStyle = summary ? (GRADE_STYLES[summary.grade] || GRADE_STYLES.F) : GRADE_STYLES.F

  return (
    <ChannablePageWrapper
      title="Santé du Catalogue"
      description={`${summary?.totalProducts || 0} produits — Score global : ${summary?.averageScore || 0}%`}
      heroImage="products"
      badge={{ label: 'Santé', icon: HeartPulse }}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={runBatchScan} disabled={isScanningBatch}>
            {isScanningBatch ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Scanner
          </Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Exporter</Button>
        </div>
      }
    >
      {/* Hero KPIs */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center", gradeStyle.bg)}>
                <span className={cn("text-2xl font-black", gradeStyle.text)}>{summary.grade}</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score Moyen</p>
                <p className={cn("text-2xl font-bold", gradeStyle.text)}>{summary.averageScore}%</p>
              </div>
            </div>
          </Card>
          <StatCard label="Excellents" value={`${summary.distribution.excellent}`} sub={`${Math.round((summary.distribution.excellent / summary.totalProducts) * 100)}%`} icon={CheckCircle} color="success" />
          <StatCard label="Attention" value={`${summary.distribution.warning}`} sub={`${Math.round((summary.distribution.warning / summary.totalProducts) * 100)}%`} icon={AlertTriangle} color="warning" />
          <StatCard label="Critiques" value={`${summary.distribution.critical}`} sub={`${Math.round((summary.distribution.critical / summary.totalProducts) * 100)}%`} icon={XCircle} color="destructive" />
        </div>
      )}

      <Tabs defaultValue="pillars" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="pillars" className="flex items-center gap-1.5"><Target className="h-4 w-4" />Piliers</TabsTrigger>
          <TabsTrigger value="worst" className="flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" />Pires</TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-1.5"><Brain className="h-4 w-4" />IA<Sparkles className="h-3 w-3 text-violet-500" /></TabsTrigger>
          <TabsTrigger value="evolution" className="flex items-center gap-1.5"><Activity className="h-4 w-4" />Évolution</TabsTrigger>
        </TabsList>

        {/* Pillar Breakdown */}
        <TabsContent value="pillars">
          {summary && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5" />Radar des 6 piliers</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={summary.pillarAverages.map(p => ({ subject: p.label, score: p.avg, fullMark: 100 }))}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" fillOpacity={0.6} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Pillar Details */}
              <Card>
                <CardHeader><CardTitle className="text-lg">Détail par pilier</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {summary.pillarAverages.map(pillar => (
                    <div key={pillar.key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{pillar.label}</span>
                        <span className={cn("text-sm font-bold tabular-nums",
                          pillar.avg >= 70 ? "text-emerald-600" : pillar.avg >= 50 ? "text-amber-600" : "text-red-600"
                        )}>{pillar.avg}%</span>
                      </div>
                      <Progress value={pillar.avg} className={cn("h-2",
                        pillar.avg >= 70 ? "[&>div]:bg-emerald-500" :
                        pillar.avg >= 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"
                      )} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top Issues */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Problèmes les plus fréquents
                    {fixableIssuesCount > 0 && (
                      <Badge variant="outline" className="ml-2 gap-1"><Zap className="h-3 w-3" />{fixableIssuesCount} auto-fixables</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {summary.topIssues.map((issue, i) => (
                      <div key={i} className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        issue.severity === 'error' ? "border-l-4 border-l-red-500 bg-red-500/5" :
                        issue.severity === 'warning' ? "border-l-4 border-l-amber-500 bg-amber-500/5" :
                        "border-l-4 border-l-blue-500 bg-blue-500/5"
                      )}>
                        <Badge variant="outline" className="shrink-0 tabular-nums">{issue.count}</Badge>
                        <span className="text-sm">{issue.message}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Marketplace Readiness */}
              <Card className="lg:col-span-2 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Prêt pour les marketplaces</span>
                    </div>
                    <span className="text-2xl font-bold text-primary">{summary.readinessPercent}%</span>
                  </div>
                  <Progress value={summary.readinessPercent} className="h-2.5" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {summary.readinessPercent >= 80
                      ? '✅ Votre catalogue est prêt pour la publication sur les marketplaces.'
                      : `⚠️ ${summary.totalProducts - Math.round(summary.readinessPercent * summary.totalProducts / 100)} produits nécessitent des améliorations (score < 70%).`}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Worst Products */}
        <TabsContent value="worst">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                10 produits les plus faibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {worstProducts.map((report, i) => {
                  const gs = GRADE_STYLES[report.grade] || GRADE_STYLES.F
                  return (
                    <div key={report.productId} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <span className="text-sm text-muted-foreground w-6 text-center">#{i + 1}</span>
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold", gs.bg, gs.text)}>
                        {report.grade}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{report.productId.slice(0, 8)}…</p>
                        <p className="text-xs text-muted-foreground">
                          {report.issues.filter(i => i.severity === 'error').length} erreur(s) · {report.issues.filter(i => i.severity === 'warning').length} avertissement(s)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.pillars.filter(p => p.score < 40).slice(0, 3).map(p => (
                          <TooltipProvider key={p.key}>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="text-xs text-red-600">{p.label.slice(0, 3)}</Badge>
                              </TooltipTrigger>
                              <TooltipContent>{p.label}: {p.score}%</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                      <span className={cn("text-lg font-bold tabular-nums", gs.text)}>{report.globalScore}%</span>
                    </div>
                  )
                })}
                {worstProducts.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                    <p>Aucun produit à améliorer</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Panel */}
        <TabsContent value="ai"><CatalogHealthAIPanel /></TabsContent>

        {/* Evolution Chart */}
        <TabsContent value="evolution">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Évolution du score</CardTitle>
                <div className="flex gap-1">
                  {(['7d', '30d', '90d'] as const).map((range) => (
                    <Button key={range} variant={timeRange === range ? 'default' : 'outline'} size="sm" onClick={() => setTimeRange(range)}>{range}</Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evolution}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <RTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} name="Score" />
                    <Area type="monotone" dataKey="optimized" stroke="hsl(142, 76%, 36%)" fill="hsl(142, 76%, 36%, 0.1)" strokeWidth={2} name="Optimisés %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  )
}
