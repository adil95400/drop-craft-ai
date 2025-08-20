import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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

interface RealTimeMetricsProps {
  integration: any
}

export const RealTimeMetrics = ({ integration }: RealTimeMetricsProps) => {
  const [liveData, setLiveData] = useState({
    isActive: true,
    lastUpdate: new Date(),
    metrics: integration.realTimeData || {}
  })

  useEffect(() => {
    if (integration.status === 'connected') {
      const interval = setInterval(() => {
        setLiveData(prev => ({
          ...prev,
          lastUpdate: new Date(),
          metrics: {
            ...prev.metrics,
            // Simulation de données en temps réel
            activeUsers: integration.realTimeData?.activeUsers + Math.floor(Math.random() * 10 - 5),
            ordersToday: integration.realTimeData?.ordersToday + Math.floor(Math.random() * 3),
            conversionRate: (parseFloat(integration.realTimeData?.conversionRate) + (Math.random() - 0.5) * 0.2).toFixed(2) + "%"
          }
        }))
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [integration])

  const getMetricIcon = (key: string) => {
    switch (key) {
      case 'activeUsers': return <Users className="w-4 h-4" />
      case 'ordersToday': return <ShoppingCart className="w-4 h-4" />
      case 'conversionRate': return <TrendingUp className="w-4 h-4" />
      case 'revenue': return <DollarSign className="w-4 h-4" />
      case 'scannedToday': return <Eye className="w-4 h-4" />
      case 'newWinners': return <Zap className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const formatMetricValue = (key: string, value: any) => {
    if (typeof value === 'number') {
      if (key.includes('revenue') || key.includes('aov')) {
        return `€${value.toLocaleString()}`
      }
      return value.toLocaleString()
    }
    return value
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
              <span className="text-sm capitalize">
                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </span>
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