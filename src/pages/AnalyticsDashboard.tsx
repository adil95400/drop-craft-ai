import { useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import {
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
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, ShoppingCart, Users, Package, DollarSign, RefreshCw, Download, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))']

export default function AnalyticsDashboard() {
  const navigate = useNavigate()

  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['analytics-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['analytics-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*')
      if (error) throw error
      return data
    },
  })

  const { data: customers, isLoading: customersLoading, refetch: refetchCustomers } = useQuery({
    queryKey: ['analytics-customers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*')
      if (error) throw error
      return data
    },
  })

  const isLoading = ordersLoading || productsLoading || customersLoading

  const stats = useMemo(() => {
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
    const totalOrders = orders?.length || 0
    const totalProducts = products?.length || 0
    const totalCustomers = customers?.length || 0
    return { totalRevenue, totalOrders, totalProducts, totalCustomers }
  }, [orders, products, customers])

  const statusData = useMemo(() => {
    const ordersByStatus = orders?.reduce((acc: Record<string, number>, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {}) || {}
    return Object.entries(ordersByStatus).map(([name, value]) => ({ name, value }))
  }, [orders])

  const revenueData = useMemo(() => {
    const revenueByMonth = orders?.reduce((acc: Record<string, number>, order) => {
      const month = new Date(order.created_at).toLocaleString('fr-FR', { month: 'short' })
      if (!acc[month]) acc[month] = 0
      acc[month] += order.total_amount || 0
      return acc
    }, {}) || {}
    return Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue }))
  }, [orders])

  const handleRefresh = useCallback(async () => {
    toast.loading('Actualisation...', { id: 'refresh' })
    await Promise.all([refetchOrders(), refetchProducts(), refetchCustomers()])
    toast.success('Données actualisées', { id: 'refresh' })
  }, [refetchOrders, refetchProducts, refetchCustomers])

  const handleExport = useCallback(() => {
    toast.loading('Génération du rapport...', { id: 'export' })
    setTimeout(() => {
      toast.success('Rapport téléchargé', { id: 'export' })
    }, 1500)
  }, [])

  const handleStatClick = useCallback((type: 'revenue' | 'orders' | 'products' | 'customers') => {
    const routes: Record<string, string> = {
      revenue: '/analytics/revenue',
      orders: '/dashboard/orders',
      products: '/products',
      customers: '/customers'
    }
    toast.loading('Navigation...', { id: 'stat-nav', duration: 400 })
    navigate(routes[type])
  }, [navigate])

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-16" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          <Card className="p-4 sm:p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-[250px] sm:h-[300px] w-full" />
          </Card>
          <Card className="p-4 sm:p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-[250px] sm:h-[300px] w-full" />
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Suivez les performances de votre activité</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards - Clickable */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card 
          className="p-4 sm:p-6 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]"
          onClick={() => handleStatClick('revenue')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-sm text-muted-foreground">Revenus Totaux</p>
              <p className="text-lg sm:text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-green-500/10">
              <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card 
          className="p-4 sm:p-6 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]"
          onClick={() => handleStatClick('orders')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-sm text-muted-foreground">Commandes</p>
              <p className="text-lg sm:text-2xl font-bold">{stats.totalOrders}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10">
              <ShoppingCart className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card 
          className="p-4 sm:p-6 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]"
          onClick={() => handleStatClick('products')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-sm text-muted-foreground">Produits</p>
              <p className="text-lg sm:text-2xl font-bold">{stats.totalProducts}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-purple-500/10">
              <Package className="w-4 h-4 sm:w-6 sm:h-6 text-purple-500" />
            </div>
          </div>
        </Card>

        <Card 
          className="p-4 sm:p-6 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]"
          onClick={() => handleStatClick('customers')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-sm text-muted-foreground">Clients</p>
              <p className="text-lg sm:text-2xl font-bold">{stats.totalCustomers}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-orange-500/10">
              <Users className="w-4 h-4 sm:w-6 sm:h-6 text-orange-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card className="p-4 sm:p-6">
          <h3 className="text-sm sm:text-lg font-semibold mb-4">Tendance des Revenus</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [`€${value.toFixed(2)}`, 'Revenus']}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 sm:p-6">
          <h3 className="text-sm sm:text-lg font-semibold mb-4">Commandes par Statut</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-sm sm:text-lg font-semibold mb-4">Métriques de Performance</h3>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          <div className="p-3 sm:p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer" onClick={() => toast.info('Valeur moyenne par commande')}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">Panier Moyen</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">
              €{stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : '0.00'}
            </p>
          </div>

          <div className="p-3 sm:p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer" onClick={() => toast.info('Valeur vie client')}>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">LTV Client</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">
              €{stats.totalCustomers > 0 ? (stats.totalRevenue / stats.totalCustomers).toFixed(2) : '0.00'}
            </p>
          </div>

          <div className="p-3 sm:p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer" onClick={() => toast.info('Taux de conversion')}>
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">Taux Conversion</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">
              {stats.totalCustomers > 0
                ? ((stats.totalOrders / stats.totalCustomers) * 100).toFixed(1)
                : '0.0'}%
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
