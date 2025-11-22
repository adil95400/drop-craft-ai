import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  Server,
  Database,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  Bell,
  Settings,
  Download,
  RefreshCw
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Helmet } from 'react-helmet-async'

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#ef4444']

export default function EnterpriseObservability() {
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000)
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Refresh data
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  // System Health Metrics
  const systemHealth = {
    overall: 98.5,
    api: 99.2,
    database: 98.8,
    cache: 99.5,
    storage: 97.3,
    network: 98.9
  }

  // Performance Metrics
  const performanceData = [
    { time: '00:00', response_time: 45, throughput: 1200, error_rate: 0.2 },
    { time: '04:00', response_time: 38, throughput: 890, error_rate: 0.1 },
    { time: '08:00', response_time: 72, throughput: 2300, error_rate: 0.4 },
    { time: '12:00', response_time: 85, throughput: 3200, error_rate: 0.6 },
    { time: '16:00', response_time: 68, throughput: 2800, error_rate: 0.3 },
    { time: '20:00', response_time: 52, throughput: 1900, error_rate: 0.2 }
  ]

  // Error Distribution
  const errorDistribution = [
    { name: '4xx Errors', value: 234, color: '#f59e0b' },
    { name: '5xx Errors', value: 45, color: '#ef4444' },
    { name: 'Timeouts', value: 23, color: '#8b5cf6' },
    { name: 'Network', value: 12, color: '#0ea5e9' }
  ]

  // Resource Utilization
  const resourceData = [
    { time: '00:00', cpu: 42, memory: 65, disk: 58, network: 45 },
    { time: '04:00', cpu: 35, memory: 62, disk: 58, network: 38 },
    { time: '08:00', cpu: 68, memory: 72, disk: 59, network: 65 },
    { time: '12:00', cpu: 82, memory: 85, disk: 61, network: 78 },
    { time: '16:00', cpu: 74, memory: 78, disk: 60, network: 72 },
    { time: '20:00', cpu: 56, memory: 68, disk: 59, network: 54 }
  ]

  // API Endpoints Performance
  const apiPerformance = [
    { endpoint: '/api/products', avg_time: 45, calls: 12500, errors: 23 },
    { endpoint: '/api/orders', avg_time: 68, calls: 8900, errors: 12 },
    { endpoint: '/api/customers', avg_time: 52, calls: 6700, errors: 8 },
    { endpoint: '/api/sync', avg_time: 125, calls: 2300, errors: 45 },
    { endpoint: '/api/analytics', avg_time: 95, calls: 4500, errors: 18 }
  ]

  // Database Queries
  const databaseMetrics = [
    { time: '00:00', query_time: 12, connections: 45, cache_hit: 94 },
    { time: '04:00', query_time: 10, connections: 32, cache_hit: 96 },
    { time: '08:00', query_time: 18, connections: 68, cache_hit: 92 },
    { time: '12:00', query_time: 22, connections: 85, cache_hit: 90 },
    { time: '16:00', query_time: 19, connections: 72, cache_hit: 93 },
    { time: '20:00', query_time: 14, connections: 54, cache_hit: 95 }
  ]

  // Alerts
  const activeAlerts = [
    { id: '1', severity: 'warning', message: 'High CPU usage on node-3', timestamp: '2024-01-16 10:45:00' },
    { id: '2', severity: 'info', message: 'Scheduled maintenance in 2 hours', timestamp: '2024-01-16 10:30:00' },
    { id: '3', severity: 'critical', message: 'Database connection pool saturation', timestamp: '2024-01-16 10:15:00' }
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'info': return <CheckCircle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-background">
      <Helmet>
        <title>Observabilité Enterprise - Drop Craft AI</title>
        <meta name="description" content="Surveillance et monitoring en temps réel de votre infrastructure" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Eye className="h-8 w-8" />
              Observabilité Enterprise
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitoring et analyse en temps réel de votre infrastructure
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'border-green-500' : ''}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto ON' : 'Auto OFF'}
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Configurer
            </Button>
          </div>
        </div>

        {/* System Health Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(systemHealth).map(([key, value]) => (
            <Card key={key} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${value > 98 ? 'text-green-600' : value > 95 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {value}%
                </div>
                <div className="text-sm text-muted-foreground capitalize">{key}</div>
                <Progress value={value} className="mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Alertes Actives ({activeAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-3 border rounded-lg ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(alert.severity)}
                        <span className="font-medium">{alert.message}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3 w-3" />
                        {alert.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="resources">Ressources</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Temps de Réponse</CardTitle>
                  <CardDescription>Latence moyenne des requêtes (ms)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="response_time" 
                        stroke="#0ea5e9" 
                        strokeWidth={2} 
                        name="Response Time (ms)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Débit (Throughput)</CardTitle>
                  <CardDescription>Requêtes traitées par minute</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="throughput" 
                        stroke="#8b5cf6" 
                        fillOpacity={1} 
                        fill="url(#colorThroughput)" 
                        name="Throughput (req/min)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Taux d'Erreur</CardTitle>
                  <CardDescription>Pourcentage d'erreurs sur les requêtes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="error_rate" 
                        stroke="#ef4444" 
                        strokeWidth={2} 
                        name="Error Rate (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distribution des Erreurs</CardTitle>
                  <CardDescription>Types d'erreurs rencontrées</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={errorDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.name}: ${((entry.value / errorDistribution.reduce((sum, e) => sum + e.value, 0)) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {errorDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Utilisation des Ressources</CardTitle>
                <CardDescription>CPU, Mémoire, Disque et Réseau en temps réel</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={resourceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="cpu" stroke="#0ea5e9" strokeWidth={2} name="CPU %" />
                    <Line type="monotone" dataKey="memory" stroke="#8b5cf6" strokeWidth={2} name="Memory %" />
                    <Line type="monotone" dataKey="disk" stroke="#10b981" strokeWidth={2} name="Disk %" />
                    <Line type="monotone" dataKey="network" stroke="#f59e0b" strokeWidth={2} name="Network %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance des Endpoints API</CardTitle>
                <CardDescription>Top endpoints par volume et latence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apiPerformance.map((api, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm">{api.endpoint}</span>
                        <Badge variant={api.avg_time > 100 ? 'destructive' : 'secondary'}>
                          {api.avg_time}ms
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>
                          <div className="text-xs">Appels</div>
                          <div className="font-semibold text-foreground">{api.calls.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs">Erreurs</div>
                          <div className="font-semibold text-foreground">{api.errors}</div>
                        </div>
                        <div>
                          <div className="text-xs">Taux d'erreur</div>
                          <div className="font-semibold text-foreground">
                            {((api.errors / api.calls) * 100).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Temps de Requête</CardTitle>
                  <CardDescription>Latence moyenne des requêtes SQL (ms)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={databaseMetrics}>
                      <defs>
                        <linearGradient id="colorQuery" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="query_time" 
                        stroke="#10b981" 
                        fillOpacity={1} 
                        fill="url(#colorQuery)" 
                        name="Query Time (ms)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Connexions Actives</CardTitle>
                  <CardDescription>Pool de connexions database</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={databaseMetrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))'
                        }}
                      />
                      <Bar dataKey="connections" fill="#0ea5e9" name="Connections" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle className="text-base">Taux de Cache Hit</CardTitle>
                  <CardDescription>Performance du cache database (%)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={databaseMetrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" domain={[85, 100]} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cache_hit" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        name="Cache Hit Rate (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
