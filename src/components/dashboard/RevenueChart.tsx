import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { TrendingUp, DollarSign, Loader2 } from 'lucide-react'

interface RevenueChartProps {
  height?: number
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ height = 200 }) => {
  const { user } = useAuth()

  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ['revenue-chart-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      // Get last 30 days of order data
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: orders, error } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true })

      if (error) throw error

      // Group by date
      const grouped = (orders || []).reduce((acc, order) => {
        const date = new Date(order.created_at).toLocaleDateString('fr-FR', { 
          day: '2-digit',
          month: '2-digit'
        })
        if (!acc[date]) {
          acc[date] = { revenue: 0, orders: 0 }
        }
        acc[date].revenue += Number(order.total_amount) || 0
        acc[date].orders += 1
        return acc
      }, {} as Record<string, { revenue: number; orders: number }>)

      // Fill in last 30 days with 0 for missing dates
      const result: Array<{ date: string; revenue: number; orders: number }> = []
      for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toLocaleDateString('fr-FR', { 
          day: '2-digit',
          month: '2-digit'
        })
        result.push({
          date: dateStr,
          revenue: grouped[dateStr]?.revenue || 0,
          orders: grouped[dateStr]?.orders || 0
        })
      }

      return result
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000
  })

  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0)
  const totalOrders = chartData.reduce((sum, item) => sum + item.orders, 0)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[280px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

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
              Revenus des 30 derniers jours
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">
              {totalRevenue.toLocaleString('fr-FR')} €
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {totalOrders} commandes
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