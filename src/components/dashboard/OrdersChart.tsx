import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ShoppingCart, TrendingUp } from 'lucide-react'

interface OrdersChartProps {
  data?: Array<{
    date: string
    revenue: number
    orders: number
  }>
}

export const OrdersChart: React.FC<OrdersChartProps> = ({ data = [] }) => {
  // Données par défaut
  const defaultData = [
    { date: '01/01', orders: 24, status: 'completed' },
    { date: '02/01', orders: 13, status: 'completed' },
    { date: '03/01', orders: 98, status: 'completed' },
    { date: '04/01', orders: 39, status: 'completed' },
    { date: '05/01', orders: 48, status: 'pending' },
    { date: '06/01', orders: 38, status: 'completed' },
    { date: '07/01', orders: 43, status: 'completed' },
  ]

  const chartData = data.length > 0 ? data.map(item => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    orders: item.orders,
    status: 'completed'
  })) : defaultData

  const totalOrders = chartData.reduce((sum, item) => sum + item.orders, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              Évolution des Commandes
            </CardTitle>
            <CardDescription>
              Commandes des 7 derniers jours
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">
              {totalOrders}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +8.2% vs semaine précédente
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{`Date: ${label}`}</p>
                      <p className="text-blue-600">
                        {`Commandes: ${payload[0].value}`}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar 
              dataKey="orders" 
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}