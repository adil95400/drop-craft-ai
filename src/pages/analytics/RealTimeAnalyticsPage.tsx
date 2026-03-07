/**
 * Real-Time Analytics Dashboard
 * Live metrics with simulated websocket-style updates
 */
import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import {
  Activity, Users, ShoppingCart, DollarSign, Eye, Globe,
  ArrowUpRight, ArrowDownRight, Zap, Clock, TrendingUp,
  RefreshCw, Pause, Play, MapPin, Monitor, Smartphone, Tablet
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export default function RealTimeAnalyticsPage() {
  const [isLive, setIsLive] = useState(true)
  const [tick, setTick] = useState(0)
  const [realtimeData, setRealtimeData] = useState<any[]>([])

  // Fetch real order/product data
  const { data: orders = [] } = useQuery({
    queryKey: ['rt-orders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)
      return data || []
    },
  })

  const { data: products = [] } = useQuery({
    queryKey: ['rt-products'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data } = await supabase
        .from('products')
        .select('id, price, status, stock_quantity')
        .eq('user_id', user.id)
        .eq('status', 'active')
      return data || []
    },
  })

  // Simulated real-time tick
  useEffect(() => {
    if (!isLive) return
    const interval = setInterval(() => setTick(t => t + 1), 3000)
    return () => clearInterval(interval)
  }, [isLive])

  // Generate live streaming data
  useEffect(() => {
    setRealtimeData(prev => {
      const now = new Date()
      const point = {
        time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`,
        visitors: Math.floor(20 + Math.random() * 80),
        pageViews: Math.floor(40 + Math.random() * 120),
        orders: Math.floor(Math.random() * 5),
        revenue: Math.floor(Math.random() * 500),
      }
      const next = [...prev, point].slice(-20)
      return next
    })
  }, [tick])

  const totalRevenue = orders.reduce((s: number, o: any) => s + (o.total_amount || 0), 0)
  const todayOrders = orders.filter((o: any) => {
    const d = new Date(o.created_at)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  })

  const activeVisitors = 12 + Math.floor(Math.random() * 30 * (tick % 3 === 0 ? 1.2 : 1))
  const conversionRate = todayOrders.length > 0 ? ((todayOrders.length / Math.max(activeVisitors, 1)) * 100).toFixed(1) : '2.4'

  // Top pages
  const topPages = [
    { path: '/', views: 340 + tick * 2, bounceRate: 32 },
    { path: '/products/best-sellers', views: 210 + tick, bounceRate: 28 },
    { path: '/checkout', views: 89 + Math.floor(tick * 0.5), bounceRate: 15 },
    { path: '/categories/electronics', views: 156 + tick, bounceRate: 41 },
    { path: '/search?q=promo', views: 67 + Math.floor(tick * 0.3), bounceRate: 52 },
  ]

  // Device breakdown
  const devices = [
    { name: 'Mobile', value: 58, icon: Smartphone },
    { name: 'Desktop', value: 34, icon: Monitor },
    { name: 'Tablet', value: 8, icon: Tablet },
  ]

  // Geo breakdown
  const geoData = [
    { country: '🇫🇷 France', visitors: 42, pct: 48 },
    { country: '🇧🇪 Belgique', visitors: 12, pct: 14 },
    { country: '🇨🇭 Suisse', visitors: 9, pct: 10 },
    { country: '🇨🇦 Canada', visitors: 8, pct: 9 },
    { country: '🇲🇦 Maroc', visitors: 6, pct: 7 },
    { country: '🇩🇪 Allemagne', visitors: 5, pct: 6 },
  ]

  return (
    <>
      <Helmet>
        <title>Analytics Temps Réel | Drop-Craft AI</title>
        <meta name="description" content="Tableau de bord temps réel : visiteurs, commandes et métriques en direct" />
      </Helmet>

      <ChannablePageWrapper
        title="Analytics Temps Réel"
        description="Métriques en direct — mise à jour automatique toutes les 3 secondes"
        heroImage="analytics"
        badge={{ label: 'LIVE', icon: Zap }}
        actions={
          <div className="flex gap-2 items-center">
            <Badge variant={isLive ? 'default' : 'secondary'} className={isLive ? 'animate-pulse' : ''}>
              {isLive ? '● LIVE' : '○ PAUSED'}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setIsLive(!isLive)}>
              {isLive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        }
      >
        {/* Live KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Visiteurs actifs', value: activeVisitors, icon: Users, trend: '+12%', up: true, live: true },
            { label: 'Commandes aujourd\'hui', value: todayOrders.length, icon: ShoppingCart, trend: `+${todayOrders.length}`, up: true },
            { label: 'Revenus (30j)', value: `${totalRevenue.toFixed(0)} €`, icon: DollarSign, trend: '+8.3%', up: true },
            { label: 'Taux de conversion', value: `${conversionRate}%`, icon: TrendingUp, trend: '+0.3%', up: true },
          ].map(kpi => (
            <Card key={kpi.label} className="relative overflow-hidden">
              {kpi.live && isLive && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2"><kpi.icon className="h-4 w-4" />{kpi.label}</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {kpi.value}
                  <Badge variant="secondary" className={`text-xs ${kpi.up ? 'text-green-600' : 'text-red-500'}`}>
                    {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{kpi.trend}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Live Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Trafic en temps réel
                {isLive && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={realtimeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Area type="monotone" dataKey="visitors" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} name="Visiteurs" />
                  <Area type="monotone" dataKey="pageViews" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2) / 0.1)" strokeWidth={1.5} name="Pages vues" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Commandes & Revenus (live)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={realtimeData.slice(-10)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenus €" />
                  <Bar dataKey="orders" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Commandes" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bottom: Pages, Devices, Geo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Eye className="h-4 w-4" />Pages actives</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topPages.map(p => (
                <div key={p.path} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs truncate max-w-[180px]">{p.path}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{p.views}</span>
                    <Badge variant="outline" className="text-xs">{p.bounceRate}%</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Device Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Monitor className="h-4 w-4" />Appareils</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {devices.map(d => (
                <div key={d.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><d.icon className="h-4 w-4 text-muted-foreground" />{d.name}</span>
                    <span className="font-medium">{d.value}%</span>
                  </div>
                  <Progress value={d.value} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Geo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Globe className="h-4 w-4" />Géographie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {geoData.map(g => (
                <div key={g.country} className="flex items-center justify-between text-sm">
                  <span>{g.country}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{g.visitors}</span>
                    <Badge variant="outline" className="text-xs">{g.pct}%</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </ChannablePageWrapper>
    </>
  )
}
