import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { 
  Activity, 
  TrendingUp, 
  ShoppingCart, 
  AlertTriangle,
  Clock,
  Zap
} from 'lucide-react'

interface RealtimeStats {
  ordersToday: number
  revenueToday: number
  pendingOrders: number
  lowStockProducts: number
}

interface RecentEvent {
  id: string
  source: string
  event_type: string
  created_at: string
}

export function RealTimeAnalytics() {
  const [stats, setStats] = useState<RealtimeStats>({
    ordersToday: 0,
    revenueToday: 0,
    pendingOrders: 0,
    lowStockProducts: 0
  })
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([])
  const [isLive, setIsLive] = useState(true)

  useEffect(() => {
    loadStats()
    loadRecentEvents()

    const ordersChannel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadStats()
      })
      .subscribe()

    const interval = setInterval(loadStats, 30000)

    return () => {
      supabase.removeChannel(ordersChannel)
      clearInterval(interval)
    }
  }, [])

  async function loadStats() {
    const today = new Date().toISOString().split('T')[0]

    try {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', today)
      
      const { count: pendingCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
      
      const { count: lowStockCount } = await supabase
        .from('supplier_products')
        .select('id', { count: 'exact', head: true })
        .lt('stock_quantity', 10)

      const orders = ordersData || []
      const revenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)

      setStats({
        ordersToday: orders.length,
        revenueToday: revenue,
        pendingOrders: pendingCount || 0,
        lowStockProducts: lowStockCount || 0
      })
    } catch (e) {
      console.error('Failed to load stats:', e)
    }
  }

  async function loadRecentEvents() {
    try {
      const { data } = await supabase
        .from('activity_logs')
        .select('id, action, source, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      if (data) {
        setRecentEvents(data.map(d => ({
          id: d.id,
          source: d.source || 'system',
          event_type: d.action,
          created_at: d.created_at
        })))
      }
    } catch (e) {
      console.error('Failed to load events:', e)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Analytics Temps Réel
        </h3>
        <Badge variant={isLive ? 'default' : 'secondary'} className="animate-pulse">
          {isLive ? '● LIVE' : 'Pausé'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Commandes (24h)</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.ordersToday}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Revenus (24h)</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.revenueToday.toFixed(0)}€</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">En attente</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.pendingOrders}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Stock faible</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.lowStockProducts}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Événements récents
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-48 overflow-y-auto">
            {recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">Aucun événement récent</p>
            ) : (
              recentEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 px-4 py-2 border-b last:border-0">
                  <Badge variant="outline" className="text-xs">
                    {event.source}
                  </Badge>
                  <span className="text-sm flex-1 truncate">{event.event_type}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
