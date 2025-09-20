/**
 * PHASE 3: Monitoring & Observability avancé
 * Dashboard temps réel avec métriques business et alertes intelligentes
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { 
  Activity, AlertTriangle, CheckCircle, Clock, 
  Zap, TrendingUp, TrendingDown, Server, 
  Database, Globe, Cpu, HardDrive, Wifi,
  Bell, Shield, Eye, Settings
} from 'lucide-react'
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized'

interface SystemMetric {
  id: string
  name: string
  value: number
  unit: string
  status: 'healthy' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  threshold_warning: number
  threshold_critical: number
  last_updated: string
}

interface Alert {
  id: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  component: string
  status: 'open' | 'acknowledged' | 'resolved'
  created_at: string
  updated_at: string
  metrics: Record<string, any>
}

interface PerformanceData {
  timestamp: string
  response_time: number
  throughput: number
  error_rate: number
  cpu_usage: number
  memory_usage: number
}

export const AdvancedMonitoring: React.FC = () => {
  const { user } = useAuthOptimized()
  const [metrics, setMetrics] = useState<SystemMetric[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)

  useEffect(() => {
    if (user) {
      fetchMonitoringData()
      
      // Auto-refresh en temps réel
      const interval = setInterval(() => {
        if (realTimeEnabled) {
          fetchMetrics()
          fetchPerformanceData()
        }
      }, 5000)
      
      return () => clearInterval(interval)
    }
  }, [user, realTimeEnabled])

  const fetchMonitoringData = async () => {
    setLoading(true)
    await Promise.all([
      fetchMetrics(),
      fetchAlerts(),
      fetchPerformanceData()
    ])
    setLoading(false)
  }

  const fetchMetrics = async () => {
    // Mock data - en production, récupérer depuis l'API de monitoring
    const mockMetrics: SystemMetric[] = [
      {
        id: 'response-time',
        name: 'Temps de réponse API',
        value: 245,
        unit: 'ms',
        status: 'healthy',
        trend: 'stable',
        threshold_warning: 500,
        threshold_critical: 1000,
        last_updated: new Date().toISOString()
      },
      {
        id: 'throughput',
        name: 'Requêtes/minute',
        value: 1247,
        unit: 'req/min',
        status: 'healthy',
        trend: 'up',
        threshold_warning: 2000,
        threshold_critical: 5000,
        last_updated: new Date().toISOString()
      },
      {
        id: 'error-rate',
        name: 'Taux d\'erreur',
        value: 0.8,
        unit: '%',
        status: 'healthy',
        trend: 'down',
        threshold_warning: 2,
        threshold_critical: 5,
        last_updated: new Date().toISOString()
      },
      {
        id: 'cpu-usage',
        name: 'Usage CPU',
        value: 67,
        unit: '%',
        status: 'warning',
        trend: 'up',
        threshold_warning: 70,
        threshold_critical: 90,
        last_updated: new Date().toISOString()
      },
      {
        id: 'memory-usage',
        name: 'Usage mémoire',
        value: 82,
        unit: '%',
        status: 'warning',
        trend: 'up',
        threshold_warning: 80,
        threshold_critical: 95,
        last_updated: new Date().toISOString()
      },
      {
        id: 'db-connections',
        name: 'Connexions DB',
        value: 156,
        unit: 'conn',
        status: 'healthy',
        trend: 'stable',
        threshold_warning: 200,
        threshold_critical: 300,
        last_updated: new Date().toISOString()
      }
    ]

    setMetrics(mockMetrics)
  }

  const fetchAlerts = async () => {
    const mockAlerts: Alert[] = [
      {
        id: 'alert-1',
        title: 'Usage CPU élevé',
        description: 'Le serveur principal affiche une utilisation CPU de 67%, proche du seuil d\'alerte.',
        severity: 'warning',
        component: 'API Server',
        status: 'open',
        created_at: '2024-01-20T14:30:00Z',
        updated_at: '2024-01-20T14:30:00Z',
        metrics: { cpu_usage: 67, threshold: 70 }
      },
      {
        id: 'alert-2',
        title: 'Usage mémoire critique',
        description: 'La mémoire du serveur de base de données atteint 82% d\'utilisation.',
        severity: 'warning',
        component: 'Database',
        status: 'acknowledged',
        created_at: '2024-01-20T13:45:00Z',
        updated_at: '2024-01-20T14:00:00Z',
        metrics: { memory_usage: 82, threshold: 80 }
      },
      {
        id: 'alert-3',
        title: 'Synchronisation marketplace réussie',
        description: 'La synchronisation Amazon a été complétée avec succès (1247 produits).',
        severity: 'info',
        component: 'Marketplace Sync',
        status: 'resolved',
        created_at: '2024-01-20T13:30:00Z',
        updated_at: '2024-01-20T13:45:00Z',
        metrics: { products_synced: 1247, success_rate: 100 }
      }
    ]

    setAlerts(mockAlerts)
  }

  const fetchPerformanceData = async () => {
    // Générer des données de performance simulées
    const now = Date.now()
    const mockData: PerformanceData[] = []
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now - i * 5 * 60 * 1000).toISOString()
      mockData.push({
        timestamp,
        response_time: 200 + Math.random() * 100,
        throughput: 1000 + Math.random() * 500,
        error_rate: Math.random() * 2,
        cpu_usage: 50 + Math.random() * 30,
        memory_usage: 60 + Math.random() * 25
      })
    }
    
    setPerformanceData(mockData)
  }

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
    ))
  }

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'resolved' } : alert
    ))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle
      case 'warning': return AlertTriangle
      case 'critical': return AlertTriangle
      default: return Activity
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp
      case 'down': return TrendingDown
      default: return Activity
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-blue-500'
      case 'warning': return 'bg-yellow-500'
      case 'error': return 'bg-orange-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getAlertStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-500'
      case 'acknowledged': return 'bg-yellow-500'
      case 'resolved': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR')
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Activity className="h-8 w-8 mr-3 text-primary" />
            Monitoring Avancé
            <Badge variant="secondary" className="ml-3">
              TEMPS RÉEL
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Surveillance système et métriques business en temps réel
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch 
              checked={realTimeEnabled}
              onCheckedChange={setRealTimeEnabled}
              id="real-time"
            />
            <label htmlFor="real-time" className="text-sm font-medium">
              Temps réel
            </label>
          </div>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </Button>
          <Button>
            <Bell className="h-4 w-4 mr-2" />
            Alertes ({alerts.filter(a => a.status === 'open').length})
          </Button>
        </div>
      </div>

      {/* Vue d'ensemble - status système */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map(metric => {
          const StatusIcon = getStatusIcon(metric.status)
          const TrendIcon = getTrendIcon(metric.trend)
          
          return (
            <Card key={metric.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                <div className="flex items-center gap-1">
                  <TrendIcon className={`h-4 w-4 ${
                    metric.trend === 'up' ? 'text-green-500' : 
                    metric.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                  }`} />
                  <StatusIcon className={`h-4 w-4 ${getStatusColor(metric.status)}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metric.value.toFixed(metric.unit === '%' || metric.unit === 'ms' ? 1 : 0)}{metric.unit}
                </div>
                <div className="mt-2">
                  <Progress 
                    value={(metric.value / (metric.threshold_critical || 100)) * 100} 
                    className="h-2"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Seuil: {metric.threshold_warning}{metric.unit} / {metric.threshold_critical}{metric.unit}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="alerts">
            Alertes 
            {alerts.filter(a => a.status === 'open').length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alerts.filter(a => a.status === 'open').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Statut des services</CardTitle>
                <CardDescription>État de santé des composants principaux</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'API Server', status: 'healthy', icon: Server },
                    { name: 'Database', status: 'warning', icon: Database },
                    { name: 'Edge Functions', status: 'healthy', icon: Zap },
                    { name: 'File Storage', status: 'healthy', icon: HardDrive },
                    { name: 'CDN', status: 'healthy', icon: Globe },
                    { name: 'Marketplace Sync', status: 'healthy', icon: Wifi }
                  ].map(service => {
                    const ServiceIcon = service.icon
                    const StatusIcon = getStatusIcon(service.status)
                    
                    return (
                      <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <ServiceIcon className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{service.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-4 w-4 ${getStatusColor(service.status)}`} />
                          <Badge variant="outline" className={getStatusColor(service.status)}>
                            {service.status === 'healthy' ? 'Opérationnel' : 
                             service.status === 'warning' ? 'Attention' : 'Critique'}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métriques business</CardTitle>
                <CardDescription>KPIs temps réel de votre activité</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Utilisateurs actifs</div>
                      <div className="text-sm text-muted-foreground">Dernière heure</div>
                    </div>
                    <div className="text-2xl font-bold text-green-600">247</div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Commandes traitées</div>
                      <div className="text-sm text-muted-foreground">Aujourd'hui</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">89</div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Revenus générés</div>
                      <div className="text-sm text-muted-foreground">Aujourd'hui</div>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">€12,450</div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Produits synchronisés</div>
                      <div className="text-sm text-muted-foreground">Dernière sync</div>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">1,247</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Centre d'alertes</CardTitle>
              <CardDescription>Gestion des alertes système et business</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map(alert => (
                  <div key={alert.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-3 h-3 rounded-full mt-1 ${getSeverityColor(alert.severity)}`} />
                        <div>
                          <div className="font-semibold">{alert.title}</div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {alert.component} • {formatDate(alert.created_at)}
                          </div>
                          <p className="text-sm">{alert.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getAlertStatusColor(alert.status)} text-white`}>
                          {alert.status}
                        </Badge>
                        <Badge variant="outline">
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>
                    
                    {alert.status === 'open' && (
                      <div className="flex gap-2 pt-3 border-t">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          Acquitter
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          Résoudre
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Graphiques de performance</CardTitle>
              <CardDescription>Évolution des métriques système sur 2 heures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground border border-dashed rounded">
                Graphiques de performance temps réel
                <br />
                (Intégration Recharts à implémenter)
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ressources serveur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics.filter(m => ['cpu-usage', 'memory-usage', 'db-connections'].includes(m.id)).map(metric => (
                  <div key={metric.id}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{metric.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {metric.value.toFixed(1)}{metric.unit}
                      </span>
                    </div>
                    <Progress value={(metric.value / metric.threshold_critical) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Réseau & API</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics.filter(m => ['response-time', 'throughput', 'error-rate'].includes(m.id)).map(metric => (
                  <div key={metric.id}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{metric.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {metric.value.toFixed(metric.unit === '%' ? 1 : 0)}{metric.unit}
                      </span>
                    </div>
                    <Progress 
                      value={metric.id === 'error-rate' ? 
                        (metric.value / metric.threshold_critical) * 100 :
                        Math.min((metric.value / metric.threshold_warning) * 50, 100)
                      } 
                      className="h-2" 
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}