import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { TrendingUp, DollarSign } from 'lucide-react'

interface RevenueChartProps {
  data?: Array<{
    date: string
    revenue: number
    orders: number
  }>
  height?: number
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data = [], height = 200 }) => {
  // Données par défaut si pas de données disponibles
  const defaultData = [
    { date: '01/01', revenue: 2400, orders: 24 },
    { date: '02/01', revenue: 1398, orders: 13 },
    { date: '03/01', revenue: 9800, orders: 98 },
    { date: '04/01', revenue: 3908, orders: 39 },
    { date: '05/01', revenue: 4800, orders: 48 },
    { date: '06/01', revenue: 3800, orders: 38 },
    { date: '07/01', revenue: 4300, orders: 43 },
  ]

  const chartData = data.length > 0 ? data.map(item => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    revenue: item.revenue,
    orders: item.orders
  })) : defaultData

  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0)
  const avgRevenue = totalRevenue / chartData.length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Évolution du Chiffre d'Affaires
            </CardTitle>
            <CardDescription>
              Revenus des 7 derniers jours
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">
              €{totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +12.5% vs semaine précédente
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `€${value}`}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{`Date: ${label}`}</p>
                      <p className="text-green-600">
                        {`Revenus: €${payload[0].value?.toLocaleString()}`}
                      </p>
                      <p className="text-blue-600">
                        {`Commandes: ${payload[0].payload.orders}`}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="hsl(var(--primary))" 
              fillOpacity={1} 
              fill="url(#colorRevenue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}