import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Activity, 
  TrendingUp, 
  DollarSign, 
  Users, 
  ShoppingCart,
  Eye,
  Clock,
  Zap
} from "lucide-react"
import { motion } from "framer-motion"
import { supabase } from "@/integrations/supabase/client"

interface RealTimeMetricsProps {
  integration: any
}

export const RealTimeMetrics = ({ integration }: RealTimeMetricsProps) => {
  const [liveData, setLiveData] = useState<{
    isActive: boolean
    lastUpdate: Date
    metrics: Record<string, any>
  }>({
    isActive: true,
    lastUpdate: new Date(),
    metrics: {}
  })

  useEffect(() => {
    if (integration.status !== 'connected') return

    const loadRealMetrics = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const [ordersRes, customersRes] = await Promise.all([
          supabase.from('orders').select('id, total_amount')
            .eq('user_id', user.id)
            .gte('created_at', today.toISOString()),
          supabase.from('customers').select('id')
            .eq('user_id', user.id)
        ])

        const ordersToday = ordersRes.data?.length || 0
        const revenueToday = ordersRes.data?.reduce((s, o) => s + (o.total_amount || 0), 0) || 0
        const totalCustomers = customersRes.data?.length || 0

        setLiveData({
          isActive: true,
          lastUpdate: new Date(),
          metrics: {
            ordersToday,
            revenue: Math.round(revenueToday),
            totalCustomers
          }
        })
      } catch (e) {
        console.error('RealTimeMetrics error:', e)
      }
    }

    loadRealMetrics()
    const interval = setInterval(loadRealMetrics, 30000) // Refresh every 30s from DB
    return () => clearInterval(interval)
  }, [integration])

  const getMetricIcon = (key: string) => {
    switch (key) {
      case 'totalCustomers': return <Users className="w-4 h-4" />
      case 'ordersToday': return <ShoppingCart className="w-4 h-4" />
      case 'revenue': return <DollarSign className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getMetricLabel = (key: string) => {
    switch (key) {
      case 'totalCustomers': return 'Clients total'
      case 'ordersToday': return "Commandes aujourd'hui"
      case 'revenue': return "Revenu aujourd'hui"
      default: return key
    }
  }

  const formatMetricValue = (key: string, value: any) => {
    if (key === 'revenue') return `€${Number(value).toLocaleString()}`
    return Number(value).toLocaleString()
  }

  if (integration.status !== 'connected') {
    return (
      <Card className="border-muted-foreground/20">
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Connectez l'intégration pour voir les métriques en temps réel</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            Métriques temps réel
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            <Activity className="w-3 h-3 mr-1" />
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(liveData.metrics).map(([key, value], index) => (
          <motion.div 
            key={key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-2 rounded-lg bg-card/50"
          >
            <div className="flex items-center gap-2">
              {getMetricIcon(key)}
              <span className="text-sm">{getMetricLabel(key)}</span>
            </div>
            <span className="text-sm font-medium">
              {formatMetricValue(key, value)}
            </span>
          </motion.div>
        ))}
        
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Dernière maj:</span>
            <span>{liveData.lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
