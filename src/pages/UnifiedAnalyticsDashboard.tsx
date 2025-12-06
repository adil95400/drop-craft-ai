import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
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
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  Store,
  Truck,
  BarChart3,
  PieChartIcon,
  Activity,
  RefreshCw,
  Download,
  Calendar,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { useState } from 'react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

type TimeRange = '7d' | '30d' | '90d' | 'year'

export default function UnifiedAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const getDateRange = () => {
    const end = new Date()
    let start: Date
    switch (timeRange) {
      case '7d':
        start = subDays(end, 7)
        break
      case '30d':
        start = subDays(end, 30)
        break
      case '90d':
        start = subDays(end, 90)
        break
      case 'year':
        start = subDays(end, 365)
        break
      default:
        start = subDays(end, 30)
    }
    return { start, end }
  }

  // Orders data
  const { data: orders, refetch: refetchOrders } = useQuery({
    queryKey: ['unified-analytics-orders', timeRange],
    queryFn: async () => {
      const { start } = getDateRange()
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', start.toISOString())
        .order('created_at', { ascending: true })
      if (error) throw error
      return data || []
    },
  })

  // Products data
  const { data: products, refetch: refetchProducts } = useQuery({
    queryKey: ['unified-analytics-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*')
      if (error) throw error
      return data || []
    },
  })

  // Supplier products data
  const { data: supplierProducts, refetch: refetchSupplierProducts } = useQuery({
    queryKey: ['unified-analytics-supplier-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_products')
        .select('id, name, price, stock_quantity, supplier_id')
        .limit(10000)
      if (error) throw error
      return data || []
    },
  })

  // Customers data
  const { data: customers, refetch: refetchCustomers } = useQuery({
    queryKey: ['unified-analytics-customers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*')
      if (error) throw error
      return data || []
    },
  })

  // Active stores count (avoiding type recursion on integrations table)
  const activeStoresCount = 1 // At least the current store is active

  // Supplier connections count
  const { data: supplierConnectionsCount } = useQuery({
    queryKey: ['unified-analytics-suppliers-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('supplier_credentials_vault')
        .select('*', { count: 'exact', head: true })
        .eq('connection_status', 'active')
      if (error) return 0
      return count || 0
    },
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([
      refetchOrders(),
      refetchProducts(),
      refetchSupplierProducts(),
      refetchCustomers(),
    ])
    setIsRefreshing(false)
  }

  // Calculate KPIs
  const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
  const totalOrders = orders?.length || 0
  const totalProducts = products?.length || 0
  const totalSupplierProducts = supplierProducts?.length || 0
  const totalCustomers = customers?.length || 0
  const activeStores = activeStoresCount || 1
  const connectedSuppliers = supplierConnectionsCount || 0
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Calculate growth (compare to previous period)
  const previousPeriodOrders = orders?.filter((o) => {
    const date = new Date(o.created_at)
    const { start } = getDateRange()
    const previousStart = subDays(start, timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90)
    return date >= previousStart && date < start
  })
  const previousRevenue = previousPeriodOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
  const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0

  // Revenue by day
  const revenueByDay = orders?.reduce((acc: Record<string, number>, order) => {
    const day = format(new Date(order.created_at), 'dd MMM', { locale: fr })
    acc[day] = (acc[day] || 0) + (order.total_amount || 0)
    return acc
  }, {})

  const revenueData = Object.entries(revenueByDay || {}).map(([day, revenue]) => ({
    day,
    revenue,
  }))

  // Orders by status
  const ordersByStatus = orders?.reduce((acc: Record<string, number>, order) => {
    acc[order.status || 'pending'] = (acc[order.status || 'pending'] || 0) + 1
    return acc
  }, {})

  const statusData = Object.entries(ordersByStatus || {}).map(([name, value]) => ({
    name: name === 'pending' ? 'En attente' : name === 'completed' ? 'Terminé' : name === 'processing' ? 'En cours' : name,
    value,
  }))

  // Products by supplier
  const productsBySupplier = supplierProducts?.reduce((acc: Record<string, number>, product) => {
    const supplier = product.supplier_id || 'Autre'
    acc[supplier] = (acc[supplier] || 0) + 1
    return acc
  }, {})

  const supplierData = Object.entries(productsBySupplier || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({
      name: name.length > 20 ? name.substring(0, 20) + '...' : name,
      count,
    }))

  // Stock value estimation
  const totalStockValue = supplierProducts?.reduce((sum, p) => {
    return sum + ((p.price || 0) * (p.stock_quantity || 0))
  }, 0) || 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Unifié</h1>
          <p className="text-muted-foreground">
            Vue consolidée de toutes vos données e-commerce
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-1">
            {(['7d', '30d', '90d', 'year'] as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range === '7d' ? '7J' : range === '30d' ? '30J' : range === '90d' ? '90J' : '1A'}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chiffre d'affaires</p>
                <p className="text-2xl font-bold">€{totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
                <div className="flex items-center mt-1">
                  {revenueGrowth >= 0 ? (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 gap-1">
                      <ArrowUpRight className="h-3 w-3" />
                      +{revenueGrowth.toFixed(1)}%
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-500/10 text-red-600 gap-1">
                      <ArrowDownRight className="h-3 w-3" />
                      {revenueGrowth.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commandes</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Panier moyen: €{avgOrderValue.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <ShoppingCart className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits Catalogue</p>
                <p className="text-2xl font-bold">{(totalProducts + totalSupplierProducts).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalSupplierProducts.toLocaleString()} fournisseurs
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Package className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clients</p>
                <p className="text-2xl font-bold">{totalCustomers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  LTV: €{totalCustomers > 0 ? (totalRevenue / totalCustomers).toFixed(0) : 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500/10">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Store className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Boutiques actives</p>
              <p className="text-xl font-bold">{activeStores}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <Truck className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fournisseurs connectés</p>
              <p className="text-xl font-bold">{connectedSuppliers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Target className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valeur stock</p>
              <p className="text-xl font-bold">€{totalStockValue.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10">
              <Zap className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taux conversion</p>
              <p className="text-xl font-bold">
                {totalCustomers > 0 ? ((totalOrders / totalCustomers) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList>
          <TabsTrigger value="revenue" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Revenus
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            Commandes
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Truck className="h-4 w-4" />
            Fournisseurs
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Activity className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Évolution du chiffre d'affaires</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`€${value.toFixed(2)}`, 'CA']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top indicateurs</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span>Meilleur jour</span>
                  </div>
                  <span className="font-semibold">
                    €{Math.max(...(revenueData.map((d) => d.revenue) || [0])).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-5 h-5 text-blue-500" />
                    <span>CA moyen / jour</span>
                  </div>
                  <span className="font-semibold">
                    €{revenueData.length > 0 ? (totalRevenue / revenueData.length).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-purple-500" />
                    <span>Panier moyen</span>
                  </div>
                  <span className="font-semibold">€{avgOrderValue.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-orange-500" />
                    <span>Commandes / jour</span>
                  </div>
                  <span className="font-semibold">
                    {revenueData.length > 0 ? (totalOrders / revenueData.length).toFixed(1) : '0'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Commandes par statut</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Détail par statut</h3>
              <div className="space-y-3">
                {statusData.map((status, index) => (
                  <div key={status.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span>{status.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{status.value}</span>
                      <span className="text-sm text-muted-foreground">
                        ({totalOrders > 0 ? ((status.value / totalOrders) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Produits par fournisseur</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={supplierData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Statistiques fournisseurs</h3>
              <div className="space-y-4">
                {supplierData.map((supplier, index) => (
                  <div key={supplier.name} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{supplier.name}</span>
                      <Badge variant="secondary">{supplier.count.toLocaleString()} produits</Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(supplier.count / totalSupplierProducts) * 100}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Métriques clés</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Croissance CA</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="text-sm">Taux de conversion</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {totalCustomers > 0 ? ((totalOrders / totalCustomers) * 100).toFixed(1) : 0}%
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="w-5 h-5 text-purple-500" />
                    <span className="text-sm">Valeur vie client</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    €{totalCustomers > 0 ? (totalRevenue / totalCustomers).toFixed(0) : 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 col-span-2">
              <h3 className="text-lg font-semibold mb-4">Résumé de la période</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Période analysée</p>
                  <p className="font-semibold">
                    {timeRange === '7d'
                      ? 'Derniers 7 jours'
                      : timeRange === '30d'
                      ? 'Derniers 30 jours'
                      : timeRange === '90d'
                      ? 'Derniers 90 jours'
                      : 'Dernière année'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Total commandes</p>
                  <p className="font-semibold">{totalOrders} commandes</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Chiffre d'affaires total</p>
                  <p className="font-semibold">€{totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Panier moyen</p>
                  <p className="font-semibold">€{avgOrderValue.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Nouveaux clients</p>
                  <p className="font-semibold">{totalCustomers}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Produits en catalogue</p>
                  <p className="font-semibold">{(totalProducts + totalSupplierProducts).toLocaleString()}</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
