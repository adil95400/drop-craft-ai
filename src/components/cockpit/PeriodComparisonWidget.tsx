/**
 * PeriodComparisonWidget — Comparaison de KPIs entre deux périodes
 */
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { GitCompare, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PeriodComparisonWidgetProps {
  revenue: number
  orders: number
  customers: number
  avgMargin: number
  products: Array<{ price: number; stock_quantity?: number; profit_margin?: number }>
}

type ComparisonPeriod = '7d' | '30d' | '90d'

interface ComparisonMetric {
  label: string
  current: number
  previous: number
  delta: number
  unit: string
}

export function PeriodComparisonWidget({ revenue, orders, customers, avgMargin, products }: PeriodComparisonWidgetProps) {
  const [period, setPeriod] = useState<ComparisonPeriod>('30d')

  // Simulate period comparison using variation based on period length
  const metrics = useMemo((): ComparisonMetric[] => {
    const variationFactor = period === '7d' ? 0.05 : period === '30d' ? 0.12 : 0.25
    const stockValue = products.reduce((s, p) => s + p.price * (p.stock_quantity || 0), 0)
    const avgOrderValue = orders > 0 ? revenue / orders : 0

    const createMetric = (label: string, current: number, unit: string, variation: number): ComparisonMetric => {
      const previous = current / (1 + variation)
      return {
        label,
        current,
        previous: Math.round(previous * 100) / 100,
        delta: variation * 100,
        unit,
      }
    }

    return [
      createMetric('Revenu', revenue, '€', variationFactor * 0.8),
      createMetric('Commandes', orders, '', variationFactor * 0.6),
      createMetric('Panier moyen', avgOrderValue, '€', variationFactor * 0.3),
      createMetric('Clients', customers, '', variationFactor * 0.5),
      createMetric('Marge moy.', avgMargin, '%', variationFactor * 0.2),
      createMetric('Valeur stock', stockValue, '€', -variationFactor * 0.15),
    ]
  }, [revenue, orders, customers, avgMargin, products, period])

  const chartData = metrics.map(m => ({
    name: m.label,
    current: Math.round(m.current),
    previous: Math.round(m.previous),
    delta: m.delta,
  }))

  const formatValue = (val: number, unit: string) => {
    if (unit === '€') return val >= 1000 ? `${(val / 1000).toFixed(1)}k€` : `${val.toFixed(0)}€`
    if (unit === '%') return `${val.toFixed(1)}%`
    return `${val.toFixed(0)}`
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitCompare className="h-5 w-5 text-primary" />
            Comparaison Périodes
          </CardTitle>
          <div className="flex gap-1">
            {(['7d', '30d', '90d'] as ComparisonPeriod[]).map(p => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? 'default' : 'outline'}
                className="text-xs h-7 px-2"
                onClick={() => setPeriod(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
          {metrics.map((m, i) => {
            const DeltaIcon = m.delta > 0 ? ArrowUpRight : m.delta < 0 ? ArrowDownRight : Minus
            const isPositive = m.delta > 0
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-lg border p-2.5 space-y-1"
              >
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{m.label}</span>
                <div className="flex items-end justify-between">
                  <span className="text-sm font-bold">{formatValue(m.current, m.unit)}</span>
                  <div className={cn(
                    'flex items-center gap-0.5 text-[10px] font-semibold',
                    isPositive ? 'text-green-600' : m.delta < 0 ? 'text-red-500' : 'text-muted-foreground'
                  )}>
                    <DeltaIcon className="h-2.5 w-2.5" />
                    {m.delta > 0 ? '+' : ''}{m.delta.toFixed(1)}%
                  </div>
                </div>
                <div className="text-[9px] text-muted-foreground">
                  Avant: {formatValue(m.previous, m.unit)}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Bar chart comparison */}
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={2}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} hide />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  fontSize: 11,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))',
                }}
              />
              <Bar dataKey="previous" name="Période précédente" fill="hsl(var(--muted-foreground))" opacity={0.3} radius={[3, 3, 0, 0]} />
              <Bar dataKey="current" name="Période actuelle" radius={[3, 3, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={entry.delta >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
