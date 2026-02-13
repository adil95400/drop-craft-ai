/**
 * SEO Score Evolution Chart — Shows score trends over time
 * Uses seo_history_snapshots data via API V1
 */
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { ProductSeoHistoryItem } from '@/services/api/seoApi'

interface SeoScoreEvolutionChartProps {
  items: ProductSeoHistoryItem[]
  productName?: string
}

export function SeoScoreEvolutionChart({ items, productName }: SeoScoreEvolutionChartProps) {
  const chartData = useMemo(() => {
    return [...items]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(item => ({
        date: new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        version: item.version,
        global: item.fields?.score?.global ?? 0,
        seo: item.fields?.score?.seo ?? 0,
        content: item.fields?.score?.content ?? 0,
        images: item.fields?.score?.images ?? 0,
        source: item.source,
      }))
  }, [items])

  const trend = useMemo(() => {
    if (chartData.length < 2) return { direction: 'neutral' as const, delta: 0 }
    const first = chartData[0].global
    const last = chartData[chartData.length - 1].global
    const delta = last - first
    return {
      direction: delta > 0 ? 'up' as const : delta < 0 ? 'down' as const : 'neutral' as const,
      delta,
    }
  }, [chartData])

  const TrendIcon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Aucun historique SEO disponible</p>
          <p className="text-xs mt-1">Lancez un audit pour commencer le suivi</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Évolution SEO
            {productName && <span className="text-muted-foreground font-normal">— {productName}</span>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1">
              {chartData.length} version{chartData.length > 1 ? 's' : ''}
            </Badge>
            <Badge variant={trend.direction === 'up' ? 'default' : trend.direction === 'down' ? 'destructive' : 'secondary'} className="text-xs gap-1">
              <TrendIcon className="h-3 w-3" />
              {trend.delta > 0 ? '+' : ''}{trend.delta} pts
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <defs>
                <linearGradient id="seoGlobalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="seoContentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area
                type="monotone" dataKey="global" name="Score global"
                stroke="hsl(var(--primary))" fill="url(#seoGlobalGrad)" strokeWidth={2}
              />
              <Area
                type="monotone" dataKey="seo" name="SEO"
                stroke="hsl(var(--chart-1))" fill="none" strokeWidth={1.5} strokeDasharray="4 2"
              />
              <Area
                type="monotone" dataKey="content" name="Contenu"
                stroke="hsl(var(--chart-2))" fill="url(#seoContentGrad)" strokeWidth={1.5} strokeDasharray="4 2"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-3 h-0.5 rounded bg-primary" /> Global
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-0.5 rounded bg-[hsl(var(--chart-1))]" style={{ borderStyle: 'dashed' }} /> SEO
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-0.5 rounded bg-[hsl(var(--chart-2))]" style={{ borderStyle: 'dashed' }} /> Contenu
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
