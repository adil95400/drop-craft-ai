import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSystemMonitoring } from "@/hooks/useSystemMonitoring"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Activity, Server, Cpu, HardDrive, Wifi, AlertTriangle, CheckCircle, Zap } from "lucide-react"

export function SystemMonitoringDashboard() {
  const {
    healthMetrics,
    performanceMetrics,
    isLoading,
    runHealthCheck,
    optimizePerformance,
    isRunningHealthCheck,
    isOptimizingPerformance
  } = useSystemMonitoring()

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
            onClick={() => runHealthCheck()}
            disabled={isRunningHealthCheck}
            variant="outline"
          >
            <Activity className="w-4 h-4 mr-2" />
            {isRunningHealthCheck ? "Vérification..." : "Contrôle Santé"}
          </Button>
          <Button 
            onClick={() => optimizePerformance()}
            disabled={isOptimizingPerformance}
          >
            <Zap className="w-4 h-4 mr-2" />
            {isOptimizingPerformance ? "Optimisation..." : "Optimiser"}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {healthMetrics?.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {metric.component_name === 'database' && <Server className="h-4 w-4" />}
                    {metric.component_name === 'api' && <Wifi className="h-4 w-4" />}
                    {metric.component_name === 'storage' && <HardDrive className="h-4 w-4" />}
                    {metric.component_name === 'cpu' && <Cpu className="h-4 w-4" />}
                    {metric.component_name || 'Composant'}
                  </CardTitle>
                  {getStatusIcon(metric.health_status)}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                  <Badge variant={metric.health_status === 'healthy' ? 'default' : 'destructive'}>
                      {metric.health_status}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      Dernière vérification: {new Date(metric.last_check_at).toLocaleTimeString()}
                    </div>
                    {metric.metrics_data && (
                      <div className="text-xs">
                        Données: {JSON.stringify(metric.metrics_data).slice(0, 50)}...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {healthMetrics && healthMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Évolution de la Santé Système</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={healthMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="component_name" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="uptime_percentage" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))"
                      fillOpacity={0.1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performanceMetrics?.map((metric, index) => (
              <Card key={index}>
                <CardHeader>
                <CardTitle className="text-sm">{metric.metric_name}</CardTitle>
                  <CardDescription>
                    Type: {metric.metric_type}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">{Number(metric.metric_value).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      {metric.metric_unit}
                    </div>
                    <Progress 
                      value={Number(metric.metric_value)} 
                      max={100} 
                      className="h-2"
                    />
                    <div className="text-xs text-muted-foreground">
                      Limite: {metric.metric_unit}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {performanceMetrics && performanceMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Métriques de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric_name" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="metric_value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
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
                  {healthMetrics?.filter(m => m.health_status !== 'healthy').map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(alert.health_status)}
                        <div>
                          <div className="font-medium">{alert.component_name}</div>
                          <div className="text-sm text-muted-foreground">
                            Statut: {alert.health_status}
                          </div>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(alert.health_status)}>
                        {alert.health_status}
                      </Badge>
                    </div>
                  )) || (
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
                  <div className="flex justify-between items-center">
                    <span>Uptime moyen</span>
                    <span className="font-medium">
                      {healthMetrics ? 
                        (healthMetrics.reduce((acc, m) => acc + (m.uptime_percentage || 0), 0) / healthMetrics.length).toFixed(1) + '%'
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Composants surveillés</span>
                    <span className="font-medium">{healthMetrics?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Alertes actives</span>
                    <span className="font-medium text-red-500">
                      {healthMetrics?.filter(m => m.health_status !== 'healthy').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Dernière optimisation</span>
                    <span className="font-medium">Il y a 2h</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}