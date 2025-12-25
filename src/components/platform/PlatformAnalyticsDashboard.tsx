import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Activity, AlertCircle, Loader2 } from 'lucide-react'
import { usePlatformManagement } from '@/hooks/usePlatformManagement'
import { format } from 'date-fns'

export function PlatformAnalyticsDashboard() {
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [dateRange, setDateRange] = useState('30')
  const { metrics, loading, platforms, fetchMetrics } = usePlatformManagement()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchMetrics(selectedPlatform, parseInt(dateRange))
  }, [selectedPlatform, dateRange, fetchMetrics])

  const refreshData = async () => {
    setRefreshing(true)
    await fetchMetrics(selectedPlatform, parseInt(dateRange))
    setRefreshing(false)
  }

  const summary = calculateSummary(metrics)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Analytics des Plateformes</h2>
          <p className="text-muted-foreground">Performance détaillée par marketplace</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {platforms.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="90">90 derniers jours</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={refreshData} disabled={loading || refreshing}>
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Activity className="w-4 h-4 mr-2" />
            )}
            {!refreshing && 'Actualiser'}
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.revenue)}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {summary.revenueGrowth >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                )}
                <span className={summary.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {summary.revenueGrowth.toFixed(1)}%
                </span>
                <span className="ml-1">vs période précédente</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Net</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.profit)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Marge: {((summary.profit / summary.revenue) * 100 || 0).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.orders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Panier moyen: {formatCurrency(summary.avgOrderValue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.conversionRate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                ROAS: {summary.roas.toFixed(2)}x
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenus dans le temps</CardTitle>
            <CardDescription>Évolution des revenus par jour</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="metric_date" 
                  tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => format(new Date(label), 'dd MMM yyyy')}
                />
                <Legend />
                <Line type="monotone" dataKey="total_revenue" stroke="hsl(var(--primary))" name="Revenus" />
                <Line type="monotone" dataKey="total_profit" stroke="hsl(var(--chart-2))" name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance par plateforme</CardTitle>
            <CardDescription>Comparaison des revenus</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={groupByPlatform(metrics)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenus" />
                <Bar dataKey="profit" fill="hsl(var(--chart-2))" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {!metrics.length && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Aucune donnée disponible</p>
            <p className="text-muted-foreground text-center mb-4">
              Cliquez sur "Actualiser" pour récupérer les métriques depuis les plateformes
            </p>
            <Button onClick={refreshData}>
              <Activity className="w-4 h-4 mr-2" />
              Récupérer les métriques
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function calculateSummary(metrics: any[]) {
  if (!metrics.length) return null

  const totals = metrics.reduce((acc, m) => ({
    revenue: acc.revenue + Number(m.total_revenue || 0),
    orders: acc.orders + Number(m.total_orders || 0),
    profit: acc.profit + Number(m.total_profit || 0),
    fees: acc.fees + Number(m.total_fees || 0),
    views: acc.views + Number(m.views || 0)
  }), { revenue: 0, orders: 0, profit: 0, fees: 0, views: 0 })

  const avgMetrics = {
    conversionRate: metrics.reduce((sum, m) => sum + Number(m.conversion_rate || 0), 0) / metrics.length,
    roas: metrics.reduce((sum, m) => sum + Number(m.roas || 0), 0) / metrics.length,
    avgOrderValue: totals.revenue / totals.orders || 0
  }

  const midPoint = Math.floor(metrics.length / 2)
  const firstHalf = metrics.slice(0, midPoint)
  const secondHalf = metrics.slice(midPoint)

  const firstHalfRevenue = firstHalf.reduce((sum, m) => sum + Number(m.total_revenue || 0), 0)
  const secondHalfRevenue = secondHalf.reduce((sum, m) => sum + Number(m.total_revenue || 0), 0)
  const revenueGrowth = firstHalfRevenue > 0 
    ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 
    : 0

  return {
    ...totals,
    ...avgMetrics,
    revenueGrowth
  }
}

function groupByPlatform(metrics: any[]) {
  const grouped = metrics.reduce((acc, m) => {
    const platform = m.platform
    if (!acc[platform]) {
      acc[platform] = { platform, revenue: 0, profit: 0, orders: 0 }
    }
    acc[platform].revenue += Number(m.total_revenue || 0)
    acc[platform].profit += Number(m.total_profit || 0)
    acc[platform].orders += Number(m.total_orders || 0)
    return acc
  }, {} as Record<string, any>)

  return Object.values(grouped)
}
