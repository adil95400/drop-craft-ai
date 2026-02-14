/**
 * ImportStatsChart — Graphiques de tendances d'import avec Recharts
 */
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import { BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ImportStatsChartProps {
  imports: any[]
  className?: string
}

export function ImportStatsChart({ imports, className }: ImportStatsChartProps) {
  // Daily import volume (last 14 days)
  const dailyData = useMemo(() => {
    const days: { date: string; label: string; total: number; success: number; failed: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayImports = imports.filter(imp => {
        const impDate = format(new Date(imp.created_at), 'yyyy-MM-dd')
        return impDate === dateStr
      })
      days.push({
        date: dateStr,
        label: format(date, 'dd MMM', { locale: fr }),
        total: dayImports.length,
        success: dayImports.filter(i => i.status === 'completed').length,
        failed: dayImports.filter(i => i.status === 'failed').length,
      })
    }
    return days
  }, [imports])

  // Source distribution
  const sourceData = useMemo(() => {
    const counts: Record<string, number> = {}
    imports.forEach(imp => {
      const src = imp.source_type || imp.job_type || 'Autre'
      counts[src] = (counts[src] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [imports])

  // Products imported trend
  const productsTrend = useMemo(() => {
    const days: { label: string; products: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayImports = imports.filter(imp => format(new Date(imp.created_at), 'yyyy-MM-dd') === dateStr)
      const products = dayImports.reduce((sum, imp) => sum + (imp.success_rows || imp.items_succeeded || 0), 0)
      days.push({ label: format(date, 'dd', { locale: fr }), products })
    }
    return days
  }, [imports])

  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--chart-2, 280 65% 60%))',
    'hsl(var(--chart-3, 200 70% 55%))',
    'hsl(var(--chart-4, 40 80% 55%))',
    'hsl(var(--chart-5, 150 60% 45%))',
    'hsl(var(--muted-foreground))',
  ]

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-4', className)}>
      {/* Volume d'imports */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="w-4 h-4 text-primary" />
            Volume d'imports (14 jours)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Bar dataKey="success" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} name="Réussis" />
              <Bar dataKey="failed" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Échoués" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Répartition par source */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <PieIcon className="w-4 h-4 text-primary" />
            Par source
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {sourceData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    dataKey="value"
                    stroke="none"
                  >
                    {sourceData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {sourceData.map((item, i) => (
                  <Badge key={item.name} variant="outline" className="text-[9px] gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {item.name} ({item.value})
                  </Badge>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
              Aucune donnée
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tendance produits importés */}
      <Card className="lg:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-primary" />
            Produits importés (14 jours)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={productsTrend}>
              <defs>
                <linearGradient id="importGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Area
                type="monotone"
                dataKey="products"
                stroke="hsl(var(--primary))"
                fill="url(#importGradient)"
                strokeWidth={2}
                name="Produits"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
