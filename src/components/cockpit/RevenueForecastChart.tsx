/**
 * RevenueForecastChart — Forecasting revenus avec 3 scénarios
 */
import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Area, ComposedChart
} from 'recharts'
import { TrendingUp, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RevenueForecastChartProps {
  currentRevenue: number
  orders: number
  avgMargin: number
}

type Horizon = 30 | 60 | 90

export function RevenueForecastChart({ currentRevenue, orders, avgMargin }: RevenueForecastChartProps) {
  const [horizon, setHorizon] = useState<Horizon>(30)

  const chartData = useMemo(() => {
    const days = horizon
    const dailyBase = currentRevenue / 30
    const data: Array<{
      day: string
      optimistic: number
      realistic: number
      pessimistic: number
    }> = []

    for (let d = 0; d <= days; d++) {
      const dayLabel = d === 0 ? 'Auj.' : `J+${d}`
      const progress = d / days

      // Realistic: linear with slight seasonal curve
      const seasonalFactor = 1 + 0.1 * Math.sin(progress * Math.PI)
      const realisticGrowth = avgMargin > 25 ? 1.08 : avgMargin > 15 ? 1.03 : 0.98
      const realistic = dailyBase * d * (1 + (realisticGrowth - 1) * progress) * seasonalFactor

      // Optimistic: +20% envelope
      const optimistic = realistic * 1.2

      // Pessimistic: -15% envelope
      const pessimistic = realistic * 0.85

      data.push({
        day: dayLabel,
        optimistic: Math.round(optimistic),
        realistic: Math.round(realistic),
        pessimistic: Math.round(pessimistic),
      })
    }

    // Sample points to avoid overcrowding
    const step = days <= 30 ? 3 : days <= 60 ? 5 : 7
    return data.filter((_, i) => i === 0 || i === data.length - 1 || i % step === 0)
  }, [currentRevenue, avgMargin, horizon])

  const finalRealistic = chartData[chartData.length - 1]?.realistic || 0
  const finalOptimistic = chartData[chartData.length - 1]?.optimistic || 0
  const finalPessimistic = chartData[chartData.length - 1]?.pessimistic || 0

  const formatEur = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k €` : `${v} €`

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Forecasting Revenus
          </CardTitle>
          <div className="flex gap-1">
            {([30, 60, 90] as Horizon[]).map(h => (
              <Button
                key={h}
                size="sm"
                variant={horizon === h ? 'default' : 'outline'}
                className="text-xs h-7 px-2"
                onClick={() => setHorizon(h)}
              >
                {h}j
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary badges */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Badge variant="outline" className="border-green-500/30 text-green-600 text-xs">
            🟢 Optimiste: {formatEur(finalOptimistic)}
          </Badge>
          <Badge variant="outline" className="border-blue-500/30 text-blue-600 text-xs">
            🔵 Réaliste: {formatEur(finalRealistic)}
          </Badge>
          <Badge variant="outline" className="border-orange-500/30 text-orange-600 text-xs">
            🟠 Pessimiste: {formatEur(finalPessimistic)}
          </Badge>
        </div>

        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [formatEur(value), name]}
                contentStyle={{
                  borderRadius: 8,
                  fontSize: 12,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))',
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="realistic"
                name="Réaliste"
                fill="url(#forecastFill)"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="optimistic"
                name="Optimiste"
                stroke="#22c55e"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="pessimistic"
                name="Pessimiste"
                stroke="#f97316"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
