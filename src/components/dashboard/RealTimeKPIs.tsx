/**
 * KPIs temps réel avec WebSocket
 * Mise à jour instantanée des métriques clés
 */

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  Activity,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPIData {
  revenue: { value: number; change: number; trend: 'up' | 'down' | 'stable' }
  orders: { value: number; change: number; trend: 'up' | 'down' | 'stable' }
  products: { value: number; change: number; trend: 'up' | 'down' | 'stable' }
  customers: { value: number; change: number; trend: 'up' | 'down' | 'stable' }
}

export function RealTimeKPIs() {
  const [kpis, setKpis] = useState<KPIData>({
    revenue: { value: 0, change: 0, trend: 'stable' },
    orders: { value: 0, change: 0, trend: 'stable' },
    products: { value: 0, change: 0, trend: 'stable' },
    customers: { value: 0, change: 0, trend: 'stable' }
  })
  const [isLive, setIsLive] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Load initial data
  const loadKPIs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Today's orders and revenue
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', today)

      // Yesterday's orders for comparison
      const { data: yesterdayOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', yesterday)
        .lt('created_at', today)

      // Products count from ALL sources (unified)
      const [
        productsRes,
        importedRes,
        catalogRes,
        customersRes
      ] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('imported_products').select('id', { count: 'exact', head: true }),
        supabase.from('catalog_products').select('id', { count: 'exact', head: true }),
        supabase.from('customers').select('id', { count: 'exact', head: true })
      ])

      const productsCount = (productsRes.count || 0) + (importedRes.count || 0) + 
                            (catalogRes.count || 0)
      const customersCount = customersRes.count || 0

      const todayRevenue = (todayOrders || []).reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
      const yesterdayRevenue = (yesterdayOrders || []).reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
      
      const revenueChange = yesterdayRevenue > 0 
        ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
        : 0

      const ordersChange = (yesterdayOrders?.length || 0) > 0
        ? (((todayOrders?.length || 0) - (yesterdayOrders?.length || 0)) / (yesterdayOrders?.length || 1)) * 100
        : 0

      setKpis({
        revenue: { 
          value: todayRevenue, 
          change: revenueChange,
          trend: revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'stable'
        },
        orders: { 
          value: todayOrders?.length || 0, 
          change: ordersChange,
          trend: ordersChange > 0 ? 'up' : ordersChange < 0 ? 'down' : 'stable'
        },
        products: { 
          value: productsCount || 0, 
          change: 0,
          trend: 'stable'
        },
        customers: { 
          value: customersCount || 0, 
          change: 0,
          trend: 'stable'
        }
      })
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to load KPIs:', error)
    }
  }

  useEffect(() => {
    loadKPIs()

    // Subscribe to real-time updates
    const ordersChannel = supabase
      .channel('kpi-orders')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'orders' 
      }, (payload) => {
        // Instantly update KPIs on new order
        setKpis(prev => ({
          ...prev,
          orders: { 
            ...prev.orders, 
            value: prev.orders.value + 1,
            trend: 'up'
          },
          revenue: { 
            ...prev.revenue, 
            value: prev.revenue.value + (Number(payload.new.total_amount) || 0),
            trend: 'up'
          }
        }))
        setLastUpdate(new Date())
      })
      .subscribe()

    // Refresh every 30 seconds
    const interval = setInterval(loadKPIs, 30000)

    return () => {
      supabase.removeChannel(ordersChannel)
      clearInterval(interval)
    }
  }, [])

  const kpiConfig = [
    { 
      key: 'revenue', 
      label: 'Revenus (24h)', 
      icon: DollarSign, 
      color: 'text-green-600',
      format: (v: number) => `${v.toLocaleString('fr-FR')}€`
    },
    { 
      key: 'orders', 
      label: 'Commandes', 
      icon: ShoppingCart, 
      color: 'text-blue-600',
      format: (v: number) => v.toString()
    },
    { 
      key: 'products', 
      label: 'Produits', 
      icon: Package, 
      color: 'text-purple-600',
      format: (v: number) => v.toLocaleString('fr-FR')
    },
    { 
      key: 'customers', 
      label: 'Clients', 
      icon: Users, 
      color: 'text-orange-600',
      format: (v: number) => v.toLocaleString('fr-FR')
    }
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span className="text-xs sm:text-sm font-medium">KPIs Temps Réel</span>
        </div>
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs gap-1",
            isLive && "bg-green-500/10 text-green-700 border-green-500/50"
          )}
        >
          <Zap className={cn("h-3 w-3", isLive && "animate-pulse")} />
          {isLive ? 'LIVE' : 'Offline'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {kpiConfig.map((config) => {
          const data = kpis[config.key as keyof KPIData]
          const Icon = config.icon
          const TrendIcon = data.trend === 'up' ? TrendingUp : data.trend === 'down' ? TrendingDown : null

          return (
            <Card 
              key={config.key}
              className="relative overflow-hidden hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
              onClick={() => {
                const routes: Record<string, string> = {
                  revenue: '/analytics',
                  orders: '/dashboard/orders',
                  products: '/products',
                  customers: '/customers'
                }
                window.location.href = routes[config.key] || '/dashboard'
              }}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-1 sm:mb-2">
                  <div className={cn(
                    "p-1.5 sm:p-2 rounded-lg",
                    config.color.replace('text-', 'bg-') + '/10'
                  )}>
                    <Icon className={cn("h-3 w-3 sm:h-4 sm:w-4", config.color)} />
                  </div>
                  {TrendIcon && (
                    <TrendIcon className={cn(
                      "h-3 w-3 sm:h-4 sm:w-4",
                      data.trend === 'up' ? 'text-green-500' : 'text-red-500'
                    )} />
                  )}
                </div>
                <p className="text-lg sm:text-2xl font-bold truncate">{config.format(data.value)}</p>
                <div className="flex items-center justify-between mt-1 gap-1">
                  <p className="text-xs text-muted-foreground truncate">{config.label}</p>
                  {data.change !== 0 && (
                    <span className={cn(
                      "text-xs font-medium flex-shrink-0",
                      data.change > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}%
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
      </p>
    </div>
  )
}
