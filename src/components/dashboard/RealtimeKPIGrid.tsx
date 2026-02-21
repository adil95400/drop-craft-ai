/**
 * RealtimeKPIGrid — Live dashboard KPIs with Supabase Realtime subscription
 */
import { useEffect, useState, useCallback } from 'react'
import { DollarSign, Users, ShoppingCart, Package, Activity, Target } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { RealtimeKPICard } from './RealtimeKPICard'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface KPIState {
  revenue: number
  prevRevenue: number
  orders: number
  prevOrders: number
  customers: number
  products: number
  avgOrderValue: number
  conversionRate: number
}

export function RealtimeKPIGrid() {
  const { user } = useUnifiedAuth()
  const [kpis, setKpis] = useState<KPIState>({
    revenue: 0, prevRevenue: 0, orders: 0, prevOrders: 0,
    customers: 0, products: 0, avgOrderValue: 0, conversionRate: 0,
  })
  const [loading, setLoading] = useState(true)

  const loadKPIs = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const now = new Date()
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const sixtyDaysAgo = new Date(now)
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

      const [orders, prevOrders, customers, products] = await Promise.all([
        supabase.from('orders').select('id, total_amount')
          .eq('user_id', user.id)
          .gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('orders').select('id, total_amount')
          .eq('user_id', user.id)
          .gte('created_at', sixtyDaysAgo.toISOString())
          .lt('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('customers').select('id').eq('user_id', user.id),
        supabase.from('products').select('id').eq('user_id', user.id),
      ])

      const currentOrders = orders.data || []
      const previousOrders = prevOrders.data || []
      const revenue = currentOrders.reduce((s, o) => s + (o.total_amount || 0), 0)
      const prevRevenue = previousOrders.reduce((s, o) => s + (o.total_amount || 0), 0)
      const totalProducts = products.data?.length || 0

      setKpis({
        revenue,
        prevRevenue,
        orders: currentOrders.length,
        prevOrders: previousOrders.length,
        customers: customers.data?.length || 0,
        products: totalProducts,
        avgOrderValue: currentOrders.length > 0 ? revenue / currentOrders.length : 0,
        conversionRate: totalProducts > 0 ? (currentOrders.length / totalProducts) * 100 : 0,
      })
    } catch (e) {
      console.error('KPI load error:', e)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { loadKPIs() }, [loadKPIs])

  // Realtime subscription for orders
  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel('kpi-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        loadKPIs()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, loadKPIs])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">KPIs Temps Réel</h2>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs text-emerald-600 font-medium">LIVE</span>
        </div>
        <Button variant="ghost" size="sm" onClick={loadKPIs} disabled={loading} aria-label="Rafraîchir les KPIs">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <RealtimeKPICard
          title="Chiffre d'Affaires"
          value={kpis.revenue}
          previousValue={kpis.prevRevenue}
          format="currency"
          icon={<DollarSign className="h-5 w-5" />}
          color="text-emerald-600"
          pulse
          delay={0}
        />
        <RealtimeKPICard
          title="Commandes"
          value={kpis.orders}
          previousValue={kpis.prevOrders}
          format="number"
          icon={<ShoppingCart className="h-5 w-5" />}
          color="text-blue-600"
          pulse
          delay={1}
        />
        <RealtimeKPICard
          title="Clients"
          value={kpis.customers}
          format="number"
          icon={<Users className="h-5 w-5" />}
          color="text-violet-600"
          delay={2}
        />
        <RealtimeKPICard
          title="Produits"
          value={kpis.products}
          format="number"
          icon={<Package className="h-5 w-5" />}
          color="text-amber-600"
          delay={3}
        />
        <RealtimeKPICard
          title="Panier Moyen"
          value={kpis.avgOrderValue}
          format="currency"
          icon={<Target className="h-5 w-5" />}
          color="text-pink-600"
          delay={4}
        />
        <RealtimeKPICard
          title="Conversion"
          value={kpis.conversionRate}
          format="percentage"
          icon={<Activity className="h-5 w-5" />}
          color="text-cyan-600"
          delay={5}
        />
      </div>
    </div>
  )
}
