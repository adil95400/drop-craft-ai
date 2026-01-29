import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/integrations/supabase/client'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts'
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  RefreshCw
} from 'lucide-react'

interface SupplierAnalytics {
  supplier_id: string
  supplier_name: string
  total_orders: number
  total_revenue: number
  success_rate: number
  avg_delivery_days: number
  error_count: number
  products_count: number
  last_sync: string
}

export function SupplierAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<SupplierAnalytics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('supplier_analytics')
        .select('*')
        .gte('period_start', getDateFromRange(timeRange))
        .order('total_revenue', { ascending: false })

      if (error) throw error

      // Grouper par fournisseur
      const grouped = (data || []).reduce((acc: any, item: any) => {
        const key = item.supplier_id
        if (!acc[key]) {
          acc[key] = {
            supplier_id: item.supplier_id,
            supplier_name: item.supplier_name || `Fournisseur ${item.supplier_id}`,
            total_orders: 0,
            total_revenue: 0,
            success_rate: 0,
            avg_delivery_days: 0,
            error_count: 0,
            products_count: 0,
            last_sync: item.created_at
          }
        }
        acc[key].total_orders += item.total_orders || 0
        acc[key].total_revenue += item.total_revenue || 0
        acc[key].error_count += item.error_count || 0
        acc[key].products_count = item.products_synced || 0
        return acc
      }, {})

      const analyticsArray = Object.values(grouped).map((item: any) => ({
        ...item,
        success_rate: item.total_orders > 0 
          ? ((item.total_orders - item.error_count) / item.total_orders * 100) 
          : 100,
        avg_delivery_days: 5 // Mock pour le moment
      }))

      setAnalytics(analyticsArray)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDateFromRange = (range: string): string => {
    const now = new Date()
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const date = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return date.toISOString()
  }

  const totalRevenue = analytics.reduce((sum, a) => sum + a.total_revenue, 0)
  const totalOrders = analytics.reduce((sum, a) => sum + a.total_orders, 0)
  const avgSuccessRate = analytics.length > 0
    ? analytics.reduce((sum, a) => sum + a.success_rate, 0) / analytics.length
    : 0

  const revenueData = analytics.map(a => ({
    name: a.supplier_name.slice(0, 15),
    revenue: a.total_revenue,
    orders: a.total_orders
  }))

  const successRateData = analytics.map(a => ({
    name: a.supplier_name.slice(0, 15),
    rate: a.success_rate
  }))

  const COLORS = [
    'hsl(var(--primary))', 
    'hsl(var(--secondary))', 
    'hsl(var(--accent))',
    '#8b5cf6',
    '#ec4899',
    '#f59e0b'
  ]

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Analytics Fournisseurs</h3>
        <Tabs value={timeRange} onValueChange={setTimeRange}>
          <TabsList>
            <TabsTrigger value="7d">7 jours</TabsTrigger>
            <TabsTrigger value="30d">30 jours</TabsTrigger>
            <TabsTrigger value="90d">90 jours</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenu total</p>
                <p className="text-2xl font-bold">{totalRevenue.toFixed(0)}€</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commandes</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de succès</p>
                <p className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fournisseurs actifs</p>
                <p className="text-2xl font-bold">{analytics.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenu par Fournisseur</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => [`${value}€`, 'Revenu']}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Success Rate Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taux de Succès</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={successRateData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis className="text-xs" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => [`${value.toFixed(1)}%`, 'Taux']}
                />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance Détaillée</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.map((analytic, index) => (
              <div 
                key={analytic.supplier_id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{analytic.supplier_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {analytic.products_count} produits • {analytic.total_orders} commandes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Revenu</p>
                    <p className="font-bold text-green-600">{analytic.total_revenue.toFixed(0)}€</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Succès</p>
                    <p className="font-bold">{analytic.success_rate.toFixed(1)}%</p>
                  </div>
                  <div>
                    {analytic.success_rate >= 95 ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Excellent
                      </Badge>
                    ) : analytic.success_rate >= 85 ? (
                      <Badge className="bg-blue-100 text-blue-800">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Bon
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Moyen
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {analytics.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucune donnée analytique disponible</p>
                <p className="text-sm mt-2">Connectez des fournisseurs pour voir leurs performances</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
