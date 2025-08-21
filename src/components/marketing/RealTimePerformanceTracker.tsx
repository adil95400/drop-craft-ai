import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Zap, 
  Activity,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  ShoppingCart,
  DollarSign,
  RefreshCw,
  Bell,
  BarChart3,
  Target
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { useRealTimeMarketing } from '@/hooks/useRealTimeMarketing'

interface RealTimeMetric {
  id: string
  name: string
  value: number
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  unit: string
  target?: number
  status: 'good' | 'warning' | 'critical'
}

const mockRealTimeData = [
  { time: '14:50', impressions: 1250, clicks: 67, conversions: 4, revenue: 280 },
  { time: '14:55', impressions: 1340, clicks: 73, conversions: 5, revenue: 350 },
  { time: '15:00', impressions: 1420, clicks: 78, conversions: 6, revenue: 420 },
  { time: '15:05', impressions: 1380, clicks: 71, conversions: 4, revenue: 280 },
  { time: '15:10', impressions: 1460, clicks: 82, conversions: 7, revenue: 490 }
]

const mockMetrics: RealTimeMetric[] = [
  {
    id: 'impressions',
    name: 'Impressions',
    value: 1680,
    change: 12.5,
    changeType: 'increase',
    unit: '/h',
    target: 2000,
    status: 'good'
  },
  {
    id: 'clicks',
    name: 'Clics',
    value: 101,
    change: -3.2,
    changeType: 'decrease',
    unit: '/h',
    target: 120,
    status: 'warning'
  },
  {
    id: 'conversions',
    name: 'Conversions',
    value: 11,
    change: 22.2,
    changeType: 'increase',
    unit: '/h',
    target: 15,
    status: 'good'
  }
]

export function RealTimePerformanceTracker() {
  const { stats, campaigns } = useRealTimeMarketing()
  const [isLiveMode, setIsLiveMode] = useState(true)
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Generate real-time data from campaigns
  const realTimeData = campaigns.slice(0, 6).map((campaign, index) => {
    const metrics = campaign.metrics as any || {}
    const now = new Date()
    const timeStr = new Date(now.getTime() - (index * 5 * 60000)).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    
    return {
      time: timeStr,
      impressions: metrics.impressions || 0,
      clicks: metrics.clicks || 0,
      conversions: metrics.conversions || 0,
      revenue: (metrics.conversions || 0) * 70 // Estimé à 70€ par conversion
    }
  }).reverse()

  // Generate real metrics from campaigns data
  const realTimeMetrics: RealTimeMetric[] = [
    {
      id: 'impressions',
      name: 'Impressions',
      value: stats.totalImpressions,
      change: 12.5, // TODO: Calculate from historical data
      changeType: 'increase',
      unit: '/h',
      target: stats.totalImpressions * 1.2,
      status: 'good'
    },
    {
      id: 'clicks',
      name: 'Clics',
      value: stats.totalClicks,
      change: stats.totalClicks > 0 ? 8.3 : -3.2,
      changeType: stats.totalClicks > 0 ? 'increase' : 'decrease',
      unit: '/h',
      target: stats.totalClicks * 1.1,
      status: stats.totalClicks > 0 ? 'good' : 'warning'
    },
    {
      id: 'conversions',
      name: 'Conversions',
      value: Math.floor(stats.totalClicks * (stats.conversionRate || 0.05)),
      change: 22.2,
      changeType: 'increase',
      unit: '/h',
      target: Math.floor(stats.totalClicks * 0.08),
      status: 'good'
    }
  ]

  useEffect(() => {
    if (isLiveMode) {
      const interval = setInterval(() => {
        setCurrentTime(new Date())
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isLiveMode])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getMetricIcon = (metricId: string) => {
    switch (metricId) {
      case 'impressions': return <Eye className="h-4 w-4" />
      case 'clicks': return <MousePointer className="h-4 w-4" />
      case 'conversions': return <ShoppingCart className="h-4 w-4" />
      case 'revenue': return <DollarSign className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Performance Temps Réel
          </h2>
          <p className="text-muted-foreground">
            Suivi live de vos campagnes marketing • {currentTime.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch 
              checked={isLiveMode} 
              onCheckedChange={setIsLiveMode}
              id="live-mode"
            />
            <label htmlFor="live-mode" className="text-sm font-medium">
              Mode Live
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch 
              checked={alertsEnabled} 
              onCheckedChange={setAlertsEnabled}
              id="alerts"
            />
            <label htmlFor="alerts" className="text-sm font-medium">
              <Bell className="h-4 w-4 inline mr-1" />
              Alertes
            </label>
          </div>

          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLiveMode ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {realTimeMetrics.map((metric) => (
          <Card key={metric.id} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getMetricIcon(metric.id)}
                  {metric.name}
                </div>
                {isLiveMode && <Activity className="h-3 w-3 text-green-500 animate-pulse" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">{metric.value}{metric.unit}</span>
                  <div className={`flex items-center gap-1 text-sm ${
                    metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.changeType === 'increase' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(metric.change)}%
                  </div>
                </div>
                
                {metric.target && (
                  <div className="text-xs text-muted-foreground">
                    Objectif: {metric.target}{metric.unit} • {((metric.value / metric.target) * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Live
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={realTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="conversions" 
                  stackId="1" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary)/0.3)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenus Temps Réel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={realTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {alertsEnabled && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Bell className="h-5 w-5" />
              Alertes Actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-yellow-800">
                <TrendingDown className="h-4 w-4" />
                <span>CTR en baisse de 5% sur la campagne Google Ads depuis 1h</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}