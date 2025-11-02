import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface RealTimeMetric {
  id: string
  label: string
  value: number
  previousValue: number
  format: 'currency' | 'number' | 'percentage'
  trend: 'up' | 'down' | 'stable'
  change: number
  icon: any
  color: string
}

export interface RealTimeEvent {
  id: string
  type: 'sale' | 'visitor' | 'signup' | 'product_view'
  message: string
  value?: number
  timestamp: Date
  location?: string
}

export const useRealTimeMetrics = () => {
  const [events, setEvents] = useState<RealTimeEvent[]>([])
  const [isLive, setIsLive] = useState(true)

  // Fetch today's metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['realtime-metrics'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString()

      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString()

      // Fetch today's and yesterday's data
      const [
        { data: todayOrders },
        { data: yesterdayOrders },
        { data: todayCustomers },
        { data: yesterdayCustomers }
      ] = await Promise.all([
        supabase.from('orders').select('*').eq('user_id', user.id).gte('created_at', todayStr),
        supabase.from('orders').select('*').eq('user_id', user.id).gte('created_at', yesterdayStr).lt('created_at', todayStr),
        supabase.from('customers').select('*').eq('user_id', user.id).gte('created_at', todayStr),
        supabase.from('customers').select('*').eq('user_id', user.id).gte('created_at', yesterdayStr).lt('created_at', todayStr)
      ])

      // Calculate metrics
      const todayRevenue = todayOrders?.reduce((sum, o) => sum + o.total_amount, 0) || 0
      const yesterdayRevenue = yesterdayOrders?.reduce((sum, o) => sum + o.total_amount, 0) || 0
      const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0

      const todayVisitors = todayCustomers?.length || 0
      const yesterdayVisitors = yesterdayCustomers?.length || 0
      const visitorsChange = yesterdayVisitors > 0 ? ((todayVisitors - yesterdayVisitors) / yesterdayVisitors) * 100 : 0

      const todayOrdersCount = todayOrders?.length || 0
      const conversionRate = todayVisitors > 0 ? (todayOrdersCount / todayVisitors) * 100 : 0
      const yesterdayOrdersCount = yesterdayOrders?.length || 0
      const yesterdayConversionRate = yesterdayVisitors > 0 ? (yesterdayOrdersCount / yesterdayVisitors) * 100 : 0
      const conversionChange = yesterdayConversionRate > 0 ? ((conversionRate - yesterdayConversionRate) / yesterdayConversionRate) * 100 : 0

      // Mock cart abandonment (would need cart_sessions table)
      const cartAbandonmentRate = 68.2
      const prevCartAbandonmentRate = 72.1

      const realTimeMetrics: RealTimeMetric[] = [
        {
          id: 'revenue',
          label: 'CA Temps Réel',
          value: todayRevenue,
          previousValue: yesterdayRevenue,
          format: 'currency',
          trend: revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'stable',
          change: revenueChange,
          icon: null,
          color: 'text-green-600'
        },
        {
          id: 'visitors',
          label: 'Visiteurs Actifs',
          value: todayVisitors,
          previousValue: yesterdayVisitors,
          format: 'number',
          trend: visitorsChange > 0 ? 'up' : visitorsChange < 0 ? 'down' : 'stable',
          change: visitorsChange,
          icon: null,
          color: 'text-blue-600'
        },
        {
          id: 'conversion',
          label: 'Taux de Conversion',
          value: conversionRate,
          previousValue: yesterdayConversionRate,
          format: 'percentage',
          trend: conversionChange > 0 ? 'up' : conversionChange < 0 ? 'down' : 'stable',
          change: conversionChange,
          icon: null,
          color: 'text-purple-600'
        },
        {
          id: 'cart_abandonment',
          label: 'Abandon Panier',
          value: cartAbandonmentRate,
          previousValue: prevCartAbandonmentRate,
          format: 'percentage',
          trend: cartAbandonmentRate < prevCartAbandonmentRate ? 'down' : 'up',
          change: ((cartAbandonmentRate - prevCartAbandonmentRate) / prevCartAbandonmentRate) * 100,
          icon: null,
          color: 'text-orange-600'
        }
      ]

      return realTimeMetrics
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000 // Refresh every minute
  })

  // Subscribe to real-time events
  useEffect(() => {
    if (!isLive) return

    let ordersChannel: any
    let customersChannel: any

    // Subscribe to new orders
    ordersChannel = supabase
      .channel('realtime-orders')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders'
        },
        (payload) => {
          const order = payload.new as any
          const newEvent: RealTimeEvent = {
            id: order.id,
            type: 'sale',
            message: `Nouvelle commande de €${order.total_amount.toFixed(2)}`,
            value: order.total_amount,
            timestamp: new Date(),
            location: 'France'
          }
          setEvents(prev => [newEvent, ...prev.slice(0, 9)])
        }
      )
      .subscribe()

    // Subscribe to new customers
    customersChannel = supabase
      .channel('realtime-customers')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customers'
        },
        (payload) => {
          const customer = payload.new as any
          const newEvent: RealTimeEvent = {
            id: customer.id,
            type: 'signup',
            message: 'Nouvelle inscription newsletter',
            timestamp: new Date()
          }
          setEvents(prev => [newEvent, ...prev.slice(0, 9)])
        }
      )
      .subscribe()

    return () => {
      if (ordersChannel) ordersChannel.unsubscribe()
      if (customersChannel) customersChannel.unsubscribe()
    }
  }, [isLive])

  return {
    metrics: metrics || [],
    events,
    isLive,
    setIsLive,
    isLoading
  }
}
