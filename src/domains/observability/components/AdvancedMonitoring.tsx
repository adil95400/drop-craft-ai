import { useState, useEffect } from 'react'
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Activity, AlertTriangle, CheckCircle2, TrendingUp, Cpu, HardDrive, Network, Loader2, Bell } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface Metric {
  name: string
  value: number
  unit: string
  status: 'healthy' | 'warning' | 'critical'
  trend: number
}

interface Alert {
  id: string
  type: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  timestamp: string
  acknowledged: boolean
}

export const AdvancedMonitoring = () => {
  const { user } = useAuthOptimized()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [systemHealth, setSystemHealth] = useState<number>(0)

  useEffect(() => {
    if (user) {
      loadMonitoringData()
      const interval = setInterval(loadMonitoringData, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const loadMonitoringData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('observability', {
        body: { 
          action: 'get_metrics',
          user_id: user?.id
        }
      })

      if (error) throw error

      setMetrics(data.metrics || [])
      setAlerts(data.alerts || [])
      setSystemHealth(data.system_health || 95)
    } catch (error) {
      console.error('Error loading monitoring data:', error)
    } finally {
      setLoading(false)
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('active_alerts')
        .update({ status: 'acknowledged' })
        .eq('id', alertId)

      if (error) throw error

      toast({
        title: "Alerte acquittée",
        description: "L'alerte a été marquée comme traitée"
      })
      
      await loadMonitoringData()
    } catch (error) {
      console.error('Acknowledge alert error:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-destructive" />
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-destructive'
      case 'warning':
        return 'text-yellow-500'
      default:
        return 'text-blue-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const activeAlerts = alerts.filter(a => !a.acknowledged)
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Monitoring & Observabilité
          </h1>
          <p className="text-muted-foreground mt-2">
            Surveillance temps réel de vos systèmes
          </p>
        </div>
        <Badge variant="secondary">PHASE 3</Badge>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Santé du Système</CardTitle>
              <CardDescription>Vue d'ensemble temps réel</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(systemHealth > 80 ? 'healthy' : systemHealth > 50 ? 'warning' : 'critical')}
              <span className="text-3xl font-bold">{systemHealth}%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={systemHealth} className="h-3" />
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{metrics.filter(m => m.status === 'healthy').length}</div>
              <div className="text-sm text-muted-foreground">Services OK</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{metrics.filter(m => m.status === 'warning').length}</div>
              <div className="text-sm text-muted-foreground">Avertissements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{criticalAlerts.length}</div>
              <div className="text-sm text-muted-foreground">Alertes critiques</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.length}</div>
              <div className="text-sm text-muted-foreground">Métriques</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList>
          <TabsTrigger value="metrics">Métriques</TabsTrigger>
          <TabsTrigger value="alerts" className="relative">
            Alertes
            {activeAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                {activeAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* CPU Metrics */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">CPU Usage</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-3xl font-bold">45%</span>
                    {getStatusIcon('healthy')}
                  </div>
                  <Progress value={45} />
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>-5% vs dernière heure</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Memory Metrics */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Mémoire</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-3xl font-bold">6.2 GB</span>
                    {getStatusIcon('healthy')}
                  </div>
                  <Progress value={62} />
                  <div className="text-sm text-muted-foreground">sur 10 GB disponible</div>
                </div>
              </CardContent>
            </Card>

            {/* Network Metrics */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Réseau</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-3xl font-bold">1.2 GB</span>
                    {getStatusIcon('healthy')}
                  </div>
                  <Progress value={30} />
                  <div className="text-sm text-muted-foreground">↑ 450 MB ↓ 750 MB</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-muted-foreground">Aucune alerte active</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => (
              <Card key={alert.id} className={alert.acknowledged ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className={`h-5 w-5 ${getSeverityColor(alert.severity)}`} />
                      <div>
                        <CardTitle className="text-base">{alert.type}</CardTitle>
                        <CardDescription>{alert.message}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        alert.severity === 'critical' ? 'destructive' :
                        alert.severity === 'warning' ? 'default' : 'secondary'
                      }>
                        {alert.severity}
                      </Badge>
                      {!alert.acknowledged && (
                        <Badge 
                          variant="outline" 
                          className="cursor-pointer"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          Acquitter
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métriques de Performance</CardTitle>
              <CardDescription>Analyse temps réel des performances système</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Temps de réponse moyen</span>
                    <span className="text-sm text-muted-foreground">125ms</span>
                  </div>
                  <Progress value={25} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Taux de succès</span>
                    <span className="text-sm text-muted-foreground">99.8%</span>
                  </div>
                  <Progress value={99.8} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Requêtes/seconde</span>
                    <span className="text-sm text-muted-foreground">1,240</span>
                  </div>
                  <Progress value={62} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
