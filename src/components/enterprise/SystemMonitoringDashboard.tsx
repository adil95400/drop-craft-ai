import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRealSystemMonitoring } from "@/hooks/useRealSystemMonitoring"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Activity, Server, Cpu, HardDrive, Wifi, AlertTriangle, CheckCircle, Zap } from "lucide-react"

export function SystemMonitoringDashboard() {
  const { logs, alerts, health, isLoading, refetch } = useRealSystemMonitoring()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'default'
      case 'warning': return 'secondary'
      case 'critical': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monitoring Système</h2>
          <p className="text-muted-foreground">
            Surveillance en temps réel de la santé et des performances
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => refetch()}
            variant="outline"
          >
            <Activity className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">Santé Système</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="monitoring">Surveillance</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          {health && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Base de données
                  </CardTitle>
                  {getStatusIcon(health.database_health)}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant={health.database_health === 'good' ? 'default' : 'destructive'}>
                      {health.database_health}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    API
                  </CardTitle>
                  {getStatusIcon(health.api_health)}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant={health.api_health === 'good' ? 'default' : 'destructive'}>
                      {health.api_health}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Temps de réponse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{health.response_time.toFixed(0)}ms</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Taux d'erreur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{health.error_rate.toFixed(1)}%</div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Logs Récents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {logs.slice(0, 10).map((log, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant={
                    log.level === 'error' ? 'destructive' :
                    log.level === 'warning' ? 'secondary' :
                    log.level === 'success' ? 'default' : 'outline'
                  }>
                    {log.level}
                  </Badge>
                  <div>
                    <div className="font-medium">{log.category}</div>
                    <div className="text-sm text-muted-foreground">{log.message}</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {health && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Uptime</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{health.uptime}%</div>
                  <Progress value={health.uptime} className="h-2 mt-2" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Temps de réponse</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{health.response_time.toFixed(0)}ms</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Taux d'erreur</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{health.error_rate.toFixed(1)}%</div>
                  <Progress value={health.error_rate} className="h-2 mt-2" />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Alertes Système</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-4 h-4 ${
                          alert.severity === 'critical' ? 'text-red-500' :
                          alert.severity === 'high' ? 'text-orange-500' :
                          'text-yellow-500'
                        }`} />
                        <div>
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-sm text-muted-foreground">{alert.description}</div>
                        </div>
                      </div>
                      <Badge variant={
                        alert.severity === 'critical' ? 'destructive' :
                        alert.severity === 'high' ? 'secondary' : 'outline'
                      }>
                        {alert.severity}
                      </Badge>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                      Aucune alerte système
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistiques Générales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {health && (
                    <>
                      <div className="flex justify-between items-center">
                        <span>Uptime</span>
                        <span className="font-medium">{health.uptime}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Statut</span>
                        <Badge variant={health.status === 'healthy' ? 'default' : 'destructive'}>
                          {health.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Alertes actives</span>
                        <span className="font-medium text-red-500">{alerts.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Utilisateurs actifs</span>
                        <span className="font-medium">{health.active_users}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}