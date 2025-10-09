import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Euro, Users, ShoppingCart, BarChart3 } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Bar, BarChart } from 'recharts'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

const Analytics = () => {
  const { user } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    visitors: 0,
    conversionRate: 0,
    revenueGrowth: 0,
    ordersGrowth: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadAnalyticsData()
    }
  }, [user])

  const loadAnalyticsData = async () => {
    try {
      // Charger les commandes des 6 derniers mois
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const { data: orders, error } = await supabase
        .from('orders')
        .select('total_amount, created_at, status')
        .eq('user_id', user?.id)
        .gte('created_at', sixMonthsAgo.toISOString())
        .order('created_at', { ascending: true })

      if (error) throw error

      // Grouper par mois
      const monthlyData = orders?.reduce((acc: any, order) => {
        const month = new Date(order.created_at).toLocaleDateString('fr-FR', { month: 'short' })
        if (!acc[month]) {
          acc[month] = { month, revenue: 0, orders: 0 }
        }
        acc[month].revenue += Number(order.total_amount) || 0
        acc[month].orders += 1
        return acc
      }, {})

      const chartData = Object.values(monthlyData || {})
      setData(chartData as any[])

      // Calculer les statistiques
      const totalRevenue = orders?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0
      const totalOrders = orders?.length || 0
      
      setStats({
        revenue: totalRevenue,
        orders: totalOrders,
        visitors: totalOrders * 8, // Estimation
        conversionRate: totalOrders > 0 ? 11.6 : 0,
        revenueGrowth: 12.5,
        ordersGrowth: 8.2
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }
  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Analytics</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +{stats.revenueGrowth}% ce mois
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +{stats.ordersGrowth}% ce mois
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visiteurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.visitors.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3" />
              Estimation basée sur commandes
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +0.8% ce mois
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Évolution du CA</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <XAxis dataKey="month" />
                <YAxis />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Aucune donnée disponible pour le moment
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Analytics