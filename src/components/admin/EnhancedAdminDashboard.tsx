import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { 
  Users, ShoppingCart, Package, TrendingUp, Shield, Database, Activity,
  RefreshCw, DollarSign, Download, Upload, Zap, CheckCircle, AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface SystemMetrics {
  totalUsers: number
  activeUsers: number
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  totalSuppliers: number
  systemLoad: number
  databaseSize: number
  apiCalls: number
  errorRate: number
  ordersToday: number
  importsRunning: number
}

export const EnhancedAdminDashboard = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0, activeUsers: 0, totalOrders: 0, totalRevenue: 0,
    totalProducts: 0, totalSuppliers: 0, systemLoad: 0, databaseSize: 0,
    apiCalls: 0, errorRate: 0, ordersToday: 0, importsRunning: 0
  })
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [trafficData, setTrafficData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const { toast } = useToast()

  const loadMetrics = async () => {
    try {
      setLoading(true)

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const [
        usersRes, ordersRes, productsRes, suppliersRes,
        apiLogsRes, apiErrorsRes, ordersTodayRes, importsRes, revenueOrdersRes
      ] = await Promise.all([
        (supabase.from('profiles').select('id', { count: 'exact' }) as any),
        supabase.from('orders').select('id, total_amount', { count: 'exact' }),
        supabase.from('products').select('id', { count: 'exact' }),
        (supabase.from('suppliers').select('id', { count: 'exact' }) as any),
        (supabase.from('api_logs').select('id', { count: 'exact' }) as any),
        (supabase.from('api_logs').select('id', { count: 'exact' }).gte('status_code', 400) as any),
        (supabase.from('orders').select('id', { count: 'exact' }).gte('created_at', today.toISOString()) as any),
        (supabase.from('jobs').select('id', { count: 'exact' }).eq('status', 'processing') as any),
        (supabase.from('orders').select('total_amount, created_at, status').gte('created_at', sixMonthsAgo.toISOString()).order('created_at') as any),
      ])

      const totalOrders = ordersRes.count || 0
      const totalRevenue = (ordersRes.data || []).reduce((s: number, o: any) => s + (o.total_amount || 0), 0)
      const totalApiCalls = apiLogsRes.count || 0
      const totalApiErrors = apiErrorsRes.count || 0
      const errorRate = totalApiCalls > 0 ? totalApiErrors / totalApiCalls : 0

      setMetrics({
        totalUsers: usersRes.count || 0,
        activeUsers: ordersTodayRes.count || 0,
        totalOrders,
        totalRevenue,
        totalProducts: productsRes.count || 0,
        totalSuppliers: suppliersRes.count || 0,
        systemLoad: totalApiCalls > 0 ? Math.min(95, Math.round((totalApiCalls / 10000) * 100)) : 0,
        databaseSize: 2.4,
        apiCalls: totalApiCalls,
        errorRate,
        ordersToday: ordersTodayRes.count || 0,
        importsRunning: importsRes.count || 0,
      })

      // Build monthly revenue chart from real orders
      const orders = revenueOrdersRes.data || []
      const monthlyMap: Record<string, { revenue: number; orders: number }> = {}
      for (const o of orders) {
        const d = new Date(o.created_at)
        const key = d.toLocaleDateString('fr-FR', { month: 'short' })
        if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, orders: 0 }
        monthlyMap[key].orders += 1
        if (['delivered', 'completed', 'paid'].includes(o.status)) {
          monthlyMap[key].revenue += o.total_amount || 0
        }
      }
      setRevenueData(Object.entries(monthlyMap).map(([name, d]) => ({ name, ...d })))

      // Build traffic data from activity_logs sources
      const { data: activitySources } = await supabase
        .from('activity_logs')
        .select('source')
        .order('created_at', { ascending: false })
        .limit(500)

      const sourceMap: Record<string, number> = {}
      for (const a of activitySources || []) {
        const src = (a.source as string) || 'direct'
        sourceMap[src] = (sourceMap[src] || 0) + 1
      }
      const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE']
      setTrafficData(
        Object.entries(sourceMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }))
      )

      setLastUpdate(new Date())
      toast({ title: 'Métriques mises à jour', description: 'Données du tableau de bord actualisées' })
    } catch (error) {
      console.error('Error loading admin metrics:', error)
      toast({ title: 'Erreur', description: 'Impossible de charger les métriques', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMetrics() }, [])

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600'
    if (value <= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Tableau de Bord Administrateur
          </h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble complète et gestion système • Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadMetrics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            Système Opérationnel
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Totaux</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span>{metrics.activeUsers.toLocaleString()} actifs</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalOrders.toLocaleString()}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>+{metrics.ordersToday} aujourd'hui</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{metrics.totalRevenue > 1000000 ? (metrics.totalRevenue / 1000000).toFixed(1) + 'M' : metrics.totalRevenue.toLocaleString('fr-FR')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProducts.toLocaleString()}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Upload className="h-3 w-3 text-blue-600" />
              <span>{metrics.totalSuppliers} fournisseurs</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenus et Commandes (6 derniers mois)</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} name="Revenus" />
                  <Line type="monotone" dataKey="orders" stroke="hsl(var(--secondary))" strokeWidth={2} name="Commandes" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">Aucune donnée de commande disponible</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sources d'Activité</CardTitle>
          </CardHeader>
          <CardContent>
            {trafficData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={trafficData}
                    cx="50%" cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80} fill="#8884d8" dataKey="value"
                  >
                    {trafficData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">Aucune donnée d'activité</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Performance Système</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Charge CPU</span>
                <span className={getStatusColor(metrics.systemLoad, { good: 50, warning: 80 })}>{metrics.systemLoad.toFixed(0)}%</span>
              </div>
              <Progress value={metrics.systemLoad} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Appels API totaux</span>
                <span>{metrics.apiCalls.toLocaleString()}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Taux d'erreur</span>
                <span className={getStatusColor(metrics.errorRate, { good: 0.01, warning: 0.05 })}>{(metrics.errorRate * 100).toFixed(2)}%</span>
              </div>
              <Progress value={metrics.errorRate * 1000} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />État des Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {['API Principale', 'Base de données', 'Stockage'].map(svc => (
              <div key={svc} className="flex items-center justify-between">
                <span className="text-sm">{svc}</span>
                <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Opérationnel</Badge>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span className="text-sm">Edge Functions</span>
              <Badge variant="secondary" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />OK</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" />Activité Récente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm flex justify-between"><span>Commandes aujourd'hui</span><span className="font-medium">+{metrics.ordersToday}</span></div>
            <div className="text-sm flex justify-between"><span>Imports en cours</span><span className="font-medium">{metrics.importsRunning}</span></div>
            <div className="text-sm flex justify-between"><span>Fournisseurs</span><span className="font-medium">{metrics.totalSuppliers}</span></div>
            <div className="text-sm flex justify-between"><span>Produits</span><span className="font-medium">{metrics.totalProducts.toLocaleString()}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" />Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2"><Users className="h-6 w-6" /><span className="text-sm">Gérer Utilisateurs</span></Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2"><Database className="h-6 w-6" /><span className="text-sm">Backup BDD</span></Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2"><Shield className="h-6 w-6" /><span className="text-sm">Scan Sécurité</span></Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2"><Download className="h-6 w-6" /><span className="text-sm">Export Données</span></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}