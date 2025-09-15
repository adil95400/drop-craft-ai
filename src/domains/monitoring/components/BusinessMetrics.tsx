import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  LineChart,
  Zap,
  Target,
  Globe,
  Activity
} from 'lucide-react'
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

interface BusinessMetric {
  id: string
  name: string
  value: number
  previousValue: number
  target?: number
  unit: string
  format: 'currency' | 'number' | 'percentage'
  trend: 'up' | 'down' | 'stable'
  category: 'revenue' | 'traffic' | 'conversion' | 'operations'
  status: 'healthy' | 'warning' | 'critical'
  description: string
}

interface SystemHealth {
  uptime: number
  responseTime: number
  errorRate: number
  throughput: number
  status: 'healthy' | 'degraded' | 'down'
}

interface Alert {
  id: string
  type: 'business' | 'system' | 'security'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  timestamp: string
  resolved: boolean
}

export function BusinessMetrics() {
  const [metrics, setMetrics] = useState<BusinessMetric[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [timeRange, setTimeRange] = useState('24h')
  const [loading, setLoading] = useState(true)

  // Mock data pour la démo
  useEffect(() => {
    const mockMetrics: BusinessMetric[] = [
      {
        id: 'revenue',
        name: 'Revenus totaux',
        value: 145670,
        previousValue: 132450,
        target: 150000,
        unit: '€',
        format: 'currency',
        trend: 'up',
        category: 'revenue',
        status: 'healthy',
        description: 'Revenus bruts des dernières 24h'
      },
      {
        id: 'orders',
        name: 'Commandes',
        value: 342,
        previousValue: 298,
        target: 400,
        unit: '',
        format: 'number',
        trend: 'up',
        category: 'conversion',
        status: 'healthy',
        description: 'Nombre de commandes confirmées'
      },
      {
        id: 'conversion_rate',
        name: 'Taux de conversion',
        value: 3.8,
        previousValue: 3.2,
        target: 4.0,
        unit: '%',
        format: 'percentage',
        trend: 'up',
        category: 'conversion',
        status: 'healthy',
        description: 'Pourcentage de visiteurs convertis'
      },
      {
        id: 'traffic',
        name: 'Visiteurs uniques',
        value: 12450,
        previousValue: 11230,
        target: 15000,
        unit: '',
        format: 'number',
        trend: 'up',
        category: 'traffic',
        status: 'healthy',
        description: 'Visiteurs uniques sur la période'
      },
      {
        id: 'aov',
        name: 'Panier moyen',
        value: 87.50,
        previousValue: 92.30,
        target: 95.00,
        unit: '€',
        format: 'currency',
        trend: 'down',
        category: 'revenue',
        status: 'warning',
        description: 'Valeur moyenne des commandes'
      },
      {
        id: 'bounce_rate',
        name: 'Taux de rebond',
        value: 68.2,
        previousValue: 72.5,
        target: 60.0,
        unit: '%',
        format: 'percentage',
        trend: 'up',
        category: 'traffic',
        status: 'warning',
        description: 'Visiteurs quittant après une page'
      }
    ]

    const mockSystemHealth: SystemHealth = {
      uptime: 99.8,
      responseTime: 120,
      errorRate: 0.2,
      throughput: 450,
      status: 'healthy'
    }

    const mockAlerts: Alert[] = [
      {
        id: '1',
        type: 'business',
        severity: 'medium',
        title: 'Baisse du panier moyen',
        description: 'Le panier moyen a diminué de 5% par rapport à hier',
        timestamp: '2024-03-15T10:30:00Z',
        resolved: false
      },
      {
        id: '2',
        type: 'system',
        severity: 'low',
        title: 'Latence élevée API',
        description: 'Temps de réponse API légèrement au-dessus de la normale',
        timestamp: '2024-03-15T09:45:00Z',
        resolved: false
      },
      {
        id: '3',
        type: 'business',
        severity: 'high',
        title: 'Pic de trafic détecté',
        description: 'Augmentation inhabituelle du trafic (+150%)',
        timestamp: '2024-03-15T08:20:00Z',
        resolved: true
      }
    ]

    setMetrics(mockMetrics)
    setSystemHealth(mockSystemHealth)
    setAlerts(mockAlerts)
    setLoading(false)
  }, [])

  const formatValue = (value: number, format: string, unit: string) => {
    switch (format) {
      case 'currency':
        return `${value.toLocaleString()}${unit}`
      case 'percentage':
        return `${value.toFixed(1)}${unit}`
      default:
        return `${value.toLocaleString()}${unit}`
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  // Données mock pour les graphiques
  const chartData = [
    { time: '00:00', revenue: 4200, orders: 12, traffic: 450 },
    { time: '04:00', revenue: 3800, orders: 8, traffic: 320 },
    { time: '08:00', revenue: 6200, orders: 18, traffic: 680 },
    { time: '12:00', revenue: 8900, orders: 25, traffic: 920 },
    { time: '16:00', revenue: 7200, orders: 21, traffic: 760 },
    { time: '20:00', revenue: 5400, orders: 16, traffic: 580 }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Métriques Business</h1>
          <p className="text-muted-foreground">
            Surveillance en temps réel des performances business et système
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 heure</SelectItem>
              <SelectItem value="24h">24 heures</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* System Health Status */}
      {systemHealth && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Santé du système
              </CardTitle>
              <Badge className={getStatusColor(systemHealth.status)}>
                {systemHealth.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{systemHealth.uptime}%</div>
                <p className="text-sm text-muted-foreground">Uptime</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{systemHealth.responseTime}ms</div>
                <p className="text-sm text-muted-foreground">Temps de réponse</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{systemHealth.errorRate}%</div>
                <p className="text-sm text-muted-foreground">Taux d'erreur</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{systemHealth.throughput}/s</div>
                <p className="text-sm text-muted-foreground">Requêtes/sec</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Alerts */}
      {alerts.filter(alert => !alert.resolved).length > 0 && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Alertes actives ({alerts.filter(alert => !alert.resolved).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.filter(alert => !alert.resolved).slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{alert.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {alert.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Résoudre
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const changePercent = ((metric.value - metric.previousValue) / metric.previousValue) * 100
          const targetProgress = metric.target ? (metric.value / metric.target) * 100 : null
          
          return (
            <Card key={metric.id} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.name}
                  </CardTitle>
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {formatValue(metric.value, metric.format, metric.unit)}
                    </div>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(metric.trend)}
                      <span className={`text-sm ${
                        changePercent > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  {metric.target && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Objectif</span>
                        <span>{formatValue(metric.target, metric.format, metric.unit)}</span>
                      </div>
                      <Progress value={Math.min(targetProgress || 0, 100)} className="h-1" />
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="traffic">Trafic</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Évolution des revenus
              </CardTitle>
              <CardDescription>
                Revenus par tranche horaire sur les dernières 24h
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`€${value}`, 'Revenus']} />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="traffic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Trafic utilisateurs
              </CardTitle>
              <CardDescription>
                Visiteurs uniques par tranche horaire
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Visiteurs']} />
                  <Line type="monotone" dataKey="traffic" stroke="#10b981" strokeWidth={2} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Commandes
              </CardTitle>
              <CardDescription>
                Nombre de commandes par tranche horaire
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Commandes']} />
                  <Area type="monotone" dataKey="orders" stroke="#f59e0b" fill="#fbbf24" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}