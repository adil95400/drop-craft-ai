import { useState, useEffect } from 'react'
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Server, Loader2, Zap, Database, Cpu, Network,
  TrendingUp, Activity, Settings, Globe, Shield,
  BarChart3, Gauge
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface LoadBalancer {
  id: string
  name: string
  status: 'active' | 'inactive'
  region: string
  instances: number
  requests_per_second: number
  health_score: number
}

export const EnterpriseScalability = () => {
  const { user } = useAuthOptimized()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<any>(null)

  useEffect(() => {
    if (user) {
      loadRealMetrics()
    }
  }, [user])

  const loadRealMetrics = async () => {
    try {
      if (!user?.id) return

      // Fetch real application metrics from the database
      const [
        { count: totalOrders },
        { count: totalProducts },
        { count: totalCustomers },
        { data: recentOrders },
        { data: apiLogs },
        { count: totalAlerts }
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('orders').select('total_amount, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('api_logs').select('endpoint, duration_ms, status_code, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(200),
        supabase.from('active_alerts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active')
      ])

      // Calculate API performance metrics
      const logs = apiLogs || []
      const avgResponseTime = logs.length > 0
        ? Math.round(logs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / logs.length)
        : 0
      const errorRate = logs.length > 0
        ? ((logs.filter(l => (l.status_code || 0) >= 400).length / logs.length) * 100).toFixed(1)
        : '0'
      const totalRPS = logs.length > 0
        ? Math.round(logs.length / Math.max(1, (Date.now() - new Date(logs[logs.length - 1]?.created_at || Date.now()).getTime()) / 1000))
        : 0

      // Build hourly request distribution from API logs
      const hourlyRequests: Record<string, { total: number; errors: number; avgMs: number; count: number }> = {}
      logs.forEach(log => {
        const hour = new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(/:\d{2}$/, ':00')
        if (!hourlyRequests[hour]) hourlyRequests[hour] = { total: 0, errors: 0, avgMs: 0, count: 0 }
        hourlyRequests[hour].total++
        hourlyRequests[hour].count++
        hourlyRequests[hour].avgMs += (log.duration_ms || 0)
        if ((log.status_code || 0) >= 400) hourlyRequests[hour].errors++
      })

      const requestTrend = Object.entries(hourlyRequests).sort(([a], [b]) => a.localeCompare(b)).map(([time, data]) => ({
        time,
        requests: data.total,
        errors: data.errors,
        latency: data.count > 0 ? Math.round(data.avgMs / data.count) : 0
      }))

      // Build revenue trend from orders
      const ordersByDay: Record<string, number> = {}
      ;(recentOrders || []).forEach(o => {
        const day = new Date(o.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        ordersByDay[day] = (ordersByDay[day] || 0) + (o.total_amount || 0)
      })
      const revenueTrend = Object.entries(ordersByDay).slice(-14).map(([day, revenue]) => ({ day, revenue: Math.round(revenue) }))

      // Endpoint distribution
      const endpointCounts: Record<string, number> = {}
      logs.forEach(l => {
        const ep = l.endpoint || 'unknown'
        endpointCounts[ep] = (endpointCounts[ep] || 0) + 1
      })
      const endpointDistribution = Object.entries(endpointCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([endpoint, requests]) => ({ endpoint: endpoint.replace(/^\//, '').slice(0, 20), requests }))

      setMetrics({
        totalOrders: totalOrders || 0,
        totalProducts: totalProducts || 0,
        totalCustomers: totalCustomers || 0,
        totalAlerts: totalAlerts || 0,
        avgResponseTime,
        errorRate,
        totalRPS,
        requestTrend,
        revenueTrend,
        endpointDistribution,
        healthScore: parseFloat(errorRate) < 5 ? 98 : parseFloat(errorRate) < 10 ? 90 : 75
      })

    } catch (error) {
      console.error('Error loading metrics:', error)
      toast({ title: 'Erreur', description: 'Impossible de charger les métriques', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Server className="h-8 w-8" />
            Métriques de Performance
          </h1>
          <p className="text-muted-foreground mt-2">
            Métriques réelles de votre application
          </p>
        </div>
        <Button variant="outline" onClick={loadRealMetrics}>
          <Activity className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Real Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
        <Card className="hover-scale">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Entités totales
            </CardDescription>
            <CardTitle className="text-3xl">
              {(metrics.totalOrders + metrics.totalProducts + metrics.totalCustomers).toLocaleString()}
            </CardTitle>
            <div className="text-xs text-muted-foreground mt-1">
              {metrics.totalOrders} commandes · {metrics.totalProducts} produits · {metrics.totalCustomers} clients
            </div>
          </CardHeader>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Temps de réponse moyen
            </CardDescription>
            <CardTitle className="text-3xl">{metrics.avgResponseTime}ms</CardTitle>
            <Badge variant="secondary" className="mt-2">
              {metrics.avgResponseTime < 200 ? '✅ Excellent' : metrics.avgResponseTime < 500 ? '⚠️ Correct' : '🔴 Lent'}
            </Badge>
          </CardHeader>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Santé système
            </CardDescription>
            <CardTitle className={`text-3xl ${metrics.healthScore > 95 ? 'text-green-600' : 'text-yellow-600'}`}>
              {metrics.healthScore}%
            </CardTitle>
            <Progress value={metrics.healthScore} className="mt-2" />
          </CardHeader>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Taux d'erreur
            </CardDescription>
            <CardTitle className="text-3xl">{metrics.errorRate}%</CardTitle>
            <Badge variant={parseFloat(metrics.errorRate) < 5 ? 'secondary' : 'destructive'} className="mt-2">
              {parseFloat(metrics.errorRate) < 1 ? 'Excellent' : parseFloat(metrics.errorRate) < 5 ? 'Acceptable' : 'Critique'}
            </Badge>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="api">Performance API</TabsTrigger>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-4">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-base">Requêtes API - Temps réel</CardTitle>
              <CardDescription>Volume et latence des requêtes récentes</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.requestTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.requestTrend}>
                    <defs>
                      <linearGradient id="colorReqs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <Area type="monotone" dataKey="requests" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorReqs)" name="Requêtes" />
                    <Line type="monotone" dataKey="errors" stroke="hsl(var(--destructive))" strokeWidth={2} name="Erreurs" />
                    <Line type="monotone" dataKey="latency" stroke="hsl(var(--chart-3))" strokeWidth={2} strokeDasharray="5 5" name="Latence (ms)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">Pas de données API disponibles</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-base">Revenus journaliers</CardTitle>
              <CardDescription>Basé sur vos commandes réelles</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.revenueTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenus (€)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">Pas de données de revenus</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-base">Top Endpoints</CardTitle>
              <CardDescription>Endpoints les plus sollicités</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.endpointDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.endpointDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="endpoint" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={150} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="requests" fill="hsl(var(--chart-2))" name="Requêtes" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">Pas de données d'endpoints</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
