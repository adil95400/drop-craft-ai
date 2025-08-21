import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { useRealTimeMarketing } from '@/hooks/useRealTimeMarketing'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  CheckCircle2,
  Target,
  Users,
  Mail,
  BarChart3,
  Zap,
  Bell,
  Settings,
  Pause,
  Play,
  RefreshCw
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface PerformanceAlert {
  id: string
  type: 'performance' | 'budget' | 'audience' | 'technical'
  severity: 'critical' | 'warning' | 'info'
  title: string
  message: string
  campaign?: string
  metric: string
  currentValue: number
  threshold: number
  trend: 'up' | 'down' | 'stable'
  timestamp: Date
  acknowledged: boolean
  actionable: boolean
}

interface RealTimeMetric {
  name: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  status: 'good' | 'warning' | 'critical' | 'info'
  target?: number
  unit: string
  icon: any
}

export const RealTimePerformanceTracker = () => {
  const { toast } = useToast()
  const { campaigns, stats, refreshData } = useRealTimeMarketing()
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [liveMetrics, setLiveMetrics] = useState<RealTimeMetric[]>([])
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([])

  // Simulate real-time metrics
  useEffect(() => {
    const updateMetrics = () => {
      const newMetrics: RealTimeMetric[] = [
        {
          name: 'ROAS Temps Réel',
          value: 3.2 + (Math.random() - 0.5) * 0.8,
          change: (Math.random() - 0.5) * 20,
          trend: Math.random() > 0.5 ? 'up' : 'down',
          status: 'good',
          target: 3.0,
          unit: 'x',
          icon: TrendingUp
        },
        {
          name: 'CTR Live',
          value: 2.1 + (Math.random() - 0.5) * 0.6,
          change: (Math.random() - 0.5) * 15,
          trend: Math.random() > 0.5 ? 'up' : 'down',
          status: 'good',
          target: 2.0,
          unit: '%',
          icon: Target
        },
        {
          name: 'CPA Actuel',
          value: 15.5 + (Math.random() - 0.5) * 8,
          change: (Math.random() - 0.5) * 25,
          trend: Math.random() > 0.5 ? 'down' : 'up',
          status: 'warning',
          target: 12.0,
          unit: '€',
          icon: BarChart3
        },
        {
          name: 'Conversions/h',
          value: Math.floor(8 + Math.random() * 12),
          change: (Math.random() - 0.5) * 30,
          trend: Math.random() > 0.5 ? 'up' : 'down',
          status: 'good',
          target: 10,
          unit: '',
          icon: CheckCircle2
        },
        {
          name: 'Budget Remaining',
          value: 67 + (Math.random() - 0.5) * 20,
          change: -2.5,
          trend: 'down',
          status: 'info',
          target: 50,
          unit: '%',
          icon: Zap
        },
        {
          name: 'Audience Active',
          value: Math.floor(1200 + Math.random() * 400),
          change: (Math.random() - 0.5) * 40,
          trend: Math.random() > 0.5 ? 'up' : 'down',
          status: 'good',
          target: 1000,
          unit: '',
          icon: Users
        }
      ]
      setLiveMetrics(newMetrics)

      // Update performance history
      const now = new Date()
      const newHistoryPoint = {
        time: now.toLocaleTimeString(),
        roas: newMetrics[0].value,
        ctr: newMetrics[1].value,
        cpa: newMetrics[2].value,
        conversions: newMetrics[3].value,
        timestamp: now.getTime()
      }

      setPerformanceHistory(prev => {
        const updated = [...prev, newHistoryPoint]
        // Keep only last 20 points
        return updated.slice(-20)
      })

      // Generate alerts based on metrics
      newMetrics.forEach(metric => {
        if (metric.target && Math.abs(metric.value - metric.target) / metric.target > 0.2) {
          const alert: PerformanceAlert = {
            id: `alert-${Date.now()}-${Math.random()}`,
            type: 'performance',
            severity: Math.abs(metric.value - metric.target) / metric.target > 0.4 ? 'critical' : 'warning',
            title: `${metric.name} hors cible`,
            message: `${metric.name} est à ${metric.value.toFixed(2)}${metric.unit}, objectif: ${metric.target}${metric.unit}`,
            metric: metric.name,
            currentValue: metric.value,
            threshold: metric.target,
            trend: metric.trend,
            timestamp: now,
            acknowledged: false,
            actionable: true
          }

          setAlerts(prev => {
            // Avoid duplicate alerts
            const exists = prev.some(a => a.metric === metric.name && !a.acknowledged)
            if (!exists) {
              return [alert, ...prev].slice(0, 10) // Keep only 10 most recent
            }
            return prev
          })
        }
      })
    }

    if (isMonitoring) {
      const interval = setInterval(updateMetrics, 3000) // Update every 3 seconds
      updateMetrics() // Initial update
      return () => clearInterval(interval)
    }
  }, [isMonitoring])

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ))
    toast({
      title: "Alerte acquittée",
      description: "L'alerte a été marquée comme vue",
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'warning': return 'default'
      case 'info': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      case 'info': return 'text-blue-600'
      default: return 'text-muted-foreground'
    }
  }

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged)

  return (
    <div className="space-y-6 p-6">
      {/* Header with monitoring controls */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Tracker Performance Temps Réel
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm text-muted-foreground">
              {isMonitoring ? 'Monitoring actif' : 'Monitoring en pause'}
            </span>
            {unacknowledgedAlerts.length > 0 && (
              <>
                <span>•</span>
                <Bell className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">{unacknowledgedAlerts.length} alertes</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsMonitoring(!isMonitoring)}
            className="gap-2"
          >
            {isMonitoring ? (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Reprendre
              </>
            )}
          </Button>
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Config Alertes
          </Button>
          <Button onClick={refreshData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync Données
          </Button>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {unacknowledgedAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertes Actives ({unacknowledgedAlerts.length})
              </CardTitle>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => unacknowledgedAlerts.forEach(a => acknowledgeAlert(a.id))}
              >
                Acquitter tout
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {unacknowledgedAlerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={getSeverityColor(alert.severity)}>
                    {alert.severity}
                  </Badge>
                  <div>
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => acknowledgeAlert(alert.id)}>
                  OK
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Real-time metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {liveMetrics.map((metric, index) => {
          const IconComponent = metric.icon
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <IconComponent className={`h-4 w-4 ${getStatusColor(metric.status)}`} />
                    {metric.name}
                  </CardTitle>
                  {isMonitoring && (
                    <Activity className="h-3 w-3 text-green-500 animate-pulse" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                    {metric.unit === '€' && metric.unit}
                    {metric.value.toFixed(metric.name.includes('Conversions') ? 0 : 1)}
                    {metric.unit !== '€' && metric.unit}
                  </span>
                  <div className="flex items-center gap-1 text-sm">
                    {metric.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : metric.trend === 'down' ? (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    ) : null}
                    <span className={metric.change > 0 ? 'text-green-600' : 'text-red-600'}>
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                {metric.target && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Objectif: {metric.target}{metric.unit}</span>
                      <span>{((metric.value / metric.target) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={Math.min((metric.value / metric.target) * 100, 100)} 
                      className="h-1"
                    />
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Dernière mise à jour: {new Date().toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Performance History Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Historique Performance Temps Réel
          </CardTitle>
          <CardDescription>
            Evolution des métriques clés sur les dernières {performanceHistory.length * 3} secondes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="roas" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
                name="ROAS"
              />
              <Line 
                type="monotone" 
                dataKey="ctr" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={false}
                name="CTR %"
              />
              <Line 
                type="monotone" 
                dataKey="conversions" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={false}
                name="Conversions/h"
              />
              {liveMetrics[0]?.target && (
                <ReferenceLine 
                  y={liveMetrics[0].target} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  label="Objectif ROAS"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Historique des Alertes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.slice(0, 8).map((alert) => (
              <div 
                key={alert.id} 
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  alert.acknowledged ? 'bg-muted/50 opacity-60' : 'bg-background'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Badge variant={getSeverityColor(alert.severity)}>
                    {alert.severity}
                  </Badge>
                  <div>
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {alert.acknowledged ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      Acquitter
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
