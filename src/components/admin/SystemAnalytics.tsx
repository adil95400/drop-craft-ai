import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from 'recharts'
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Package,
  DollarSign,
  Globe,
  RefreshCw,
  Download,
  Clock,
  Target,
  Loader2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))']

export const SystemAnalytics = () => {
  const [dateRange, setDateRange] = useState('7d')
  const { toast } = useToast()

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['system-analytics', dateRange],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const daysBack = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90

      // Fetch orders for sales data
      const since = new Date()
      since.setDate(since.getDate() - daysBack)
      
      const [ordersRes, productsRes, customersRes, profilesRes] = await Promise.all([
        supabase.from('orders').select('id, total_amount, created_at, status')
          .eq('user_id', user.id).gte('created_at', since.toISOString()),
        supabase.from('products').select('id, title, price, stock_quantity, status')
          .eq('user_id', user.id),
        supabase.from('customers').select('id, created_at')
          .eq('user_id', user.id),
        supabase.from('profiles').select('id, subscription_plan')
      ])

      const orders = ordersRes.data || []
      const products = productsRes.data || []
      const customers = customersRes.data || []
      const profiles = profilesRes.data || []

      // Build daily sales data
      const dailySales: Record<string, { sales: number; orders: number }> = {}
      const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
      for (let i = 0; i < Math.min(daysBack, 7); i++) {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        const key = dayNames[d.getDay()]
        dailySales[key] = { sales: 0, orders: 0 }
      }
      for (const o of orders) {
        const d = new Date(o.created_at)
        const key = dayNames[d.getDay()]
        if (dailySales[key]) {
          dailySales[key].sales += o.total_amount || 0
          dailySales[key].orders += 1
        }
      }
      const salesData = Object.entries(dailySales).map(([day, v]) => ({
        day, sales: Math.round(v.sales), orders: v.orders, avg: v.orders > 0 ? Math.round(v.sales / v.orders) : 0
      }))

      // Top products by stock value
      const topProducts = [...products]
        .sort((a, b) => ((b.price || 0) * (b.stock_quantity || 0)) - ((a.price || 0) * (a.stock_quantity || 0)))
        .slice(0, 5)
        .map(p => ({
          name: p.title || 'Sans nom',
          stock: p.stock_quantity || 0,
          value: Math.round((p.price || 0) * (p.stock_quantity || 0)),
          status: p.status || 'draft'
        }))

      // Plan distribution from profiles
      const planCounts: Record<string, number> = {}
      for (const p of profiles) {
        const plan = (p as any).subscription_plan || 'free'
        planCounts[plan] = (planCounts[plan] || 0) + 1
      }
      const planData = Object.entries(planCounts).map(([name, value], i) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: COLORS[i % COLORS.length]
      }))

      // Customer growth by month
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
      const growthMap: Record<string, number> = {}
      for (const c of customers) {
        const d = new Date(c.created_at)
        const key = monthNames[d.getMonth()]
        growthMap[key] = (growthMap[key] || 0) + 1
      }
      // Last 6 months
      const now = new Date()
      const userGrowthData = []
      for (let i = 5; i >= 0; i--) {
        const m = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = monthNames[m.getMonth()]
        userGrowthData.push({ month: key, customers: growthMap[key] || 0 })
      }

      // KPIs
      const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0)
      const totalOrders = orders.length
      const totalCustomers = customers.length
      const activeProducts = products.filter(p => p.status === 'active').length

      return {
        salesData,
        topProducts,
        planData,
        userGrowthData,
        totalRevenue,
        totalOrders,
        totalCustomers,
        activeProducts,
        totalProducts: products.length
      }
    }
  })

  const handleExport = () => {
    toast({ title: "Export en cours", description: "Le rapport d'analytics sera téléchargé dans quelques instants" })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analytics Avancées</h2>
          <p className="text-muted-foreground">Données réelles de votre plateforme</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="sales">Ventes</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(data?.totalRevenue || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
                <p className="text-xs text-muted-foreground">{data?.totalOrders || 0} commandes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commandes</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.totalOrders || 0}</div>
                <p className="text-xs text-muted-foreground">sur la période</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.totalCustomers || 0}</div>
                <p className="text-xs text-muted-foreground">clients enregistrés</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produits Actifs</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.activeProducts || 0}</div>
                <p className="text-xs text-muted-foreground">/ {data?.totalProducts || 0} total</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Croissance Clients (6 mois)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data?.userGrowthData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Area type="monotone" dataKey="customers" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par Plan</CardTitle>
              </CardHeader>
              <CardContent>
                {(data?.planData?.length || 0) > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data?.planData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {(data?.planData || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Aucune donnée de plan disponible
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ventes par Jour (Cette Semaine)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data?.salesData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="orders" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Produits (par valeur stock)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(data?.topProducts || []).length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">Aucun produit trouvé</div>
                ) : (
                  (data?.topProducts || []).map((product: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">{product.stock} en stock</p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{product.value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
                        <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {product.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
