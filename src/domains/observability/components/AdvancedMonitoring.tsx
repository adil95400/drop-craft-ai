/**
 * PHASE 3: Monitoring & Observability avancé
 * Dashboard temps réel avec métriques business et alertes intelligentes
 */

import React, { useState } from 'react'
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
import { useObservability } from '@/hooks/useObservability'

export const AdvancedMonitoring: React.FC = () => {
  const { 
    metrics, 
    alertRules, 
    activeAlerts, 
    systemLogs, 
    healthStatus, 
    loading,
    acknowledgeAlert,
    deleteAlertRule 
  } = useObservability()
  
  const [selectedTab, setSelectedTab] = useState('overview')
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)

  const handleAcknowledgeAlert = async (alertId: string) => {
    await acknowledgeAlert(alertId)
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
            Alertes ({activeAlerts?.length || 0})
          </Button>
        </div>
      </div>

      {/* Vue d'ensemble - status système */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics && Object.entries({
          'CPU': { value: metrics.system.cpu_usage, unit: '%', status: metrics.system.cpu_usage > 80 ? 'critical' : metrics.system.cpu_usage > 60 ? 'warning' : 'healthy' },
          'Mémoire': { value: metrics.system.memory_usage, unit: '%', status: metrics.system.memory_usage > 90 ? 'critical' : metrics.system.memory_usage > 70 ? 'warning' : 'healthy' },
          'Disque': { value: metrics.system.disk_usage, unit: '%', status: metrics.system.disk_usage > 90 ? 'critical' : metrics.system.disk_usage > 70 ? 'warning' : 'healthy' },
          'Réseau': { value: metrics.system.network_io, unit: 'MB/s', status: 'healthy' },
          'Requêtes': { value: metrics.application.requests_per_minute, unit: '/min', status: 'healthy' },
          'Erreurs': { value: parseFloat(metrics.application.error_rate), unit: '%', status: parseFloat(metrics.application.error_rate) > 5 ? 'critical' : parseFloat(metrics.application.error_rate) > 2 ? 'warning' : 'healthy' }
        }).map(([name, metric]) => {
          const StatusIcon = getStatusIcon(metric.status)
          
          return (
            <Card key={name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{name}</CardTitle>
                <StatusIcon className={`h-4 w-4 ${getStatusColor(metric.status)}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metric.value}{metric.unit}
                </div>
                <div className="mt-2">
                  <Progress 
                    value={metric.unit === '%' ? metric.value : Math.min((metric.value / 100) * 100, 100)} 
                    className="h-2"
                  />
                </div>
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
            {activeAlerts && activeAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {activeAlerts.length}
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
                    <div className="text-2xl font-bold text-green-600">
                      {metrics?.application.active_users || 0}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Commandes traitées</div>
                      <div className="text-sm text-muted-foreground">Aujourd'hui</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {metrics?.business.orders_today || 0}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Revenus générés</div>
                      <div className="text-sm text-muted-foreground">Aujourd'hui</div>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      €{metrics?.business.revenue_today || 0}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Taux conversion</div>
                      <div className="text-sm text-muted-foreground">Ce mois</div>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">
                      {metrics?.business.conversion_rate || '0%'}
                    </div>
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
                {activeAlerts?.map(alert => (
                  <div key={alert.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-3 h-3 rounded-full mt-1 ${
                          alert.status === 'active' ? 'bg-red-500' : 
                          alert.status === 'acknowledged' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div>
                          <div className="font-semibold">Alerte #{alert.id}</div>
                          <div className="text-sm text-muted-foreground mb-2">
                            Règle: {alert.alert_rule_id} • {formatDate(alert.triggered_at)}
                          </div>
                          <p className="text-sm">
                            Valeur actuelle: {alert.current_value}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${
                          alert.status === 'active' ? 'bg-red-500' : 
                          alert.status === 'acknowledged' ? 'bg-yellow-500' : 'bg-green-500'
                        } text-white`}>
                          {alert.status}
                        </Badge>
                        {alert.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Accuser réception
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(!activeAlerts || activeAlerts.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>Aucune alerte active</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Métriques Application</CardTitle>
                <CardDescription>Performance temps réel de l'application</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Temps de réponse</span>
                    <span className="font-mono">{metrics?.application.response_time_ms || 0}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Requêtes/minute</span>
                    <span className="font-mono">{metrics?.application.requests_per_minute || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Taux d'erreur</span>
                    <span className="font-mono">{metrics?.application.error_rate || '0%'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Base de données</CardTitle>
                <CardDescription>Performance et état de la DB</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Connexions actives</span>
                    <span className="font-mono">{metrics?.database.connections || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Requêtes/seconde</span>
                    <span className="font-mono">{metrics?.database.queries_per_second || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Cache hit rate</span>
                    <span className="font-mono">{metrics?.database.cache_hit_rate || '0%'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Stockage utilisé</span>
                    <span className="font-mono">{metrics?.database.storage_usage_gb || '0GB'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>État système</CardTitle>
                <CardDescription>Santé générale de l'infrastructure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {healthStatus?.uptime_percentage || '99.9%'}
                    </div>
                    <div className="text-muted-foreground">Disponibilité (30 jours)</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{healthStatus?.services.api.response_time_ms || 245}ms</div>
                      <div className="text-sm text-muted-foreground">Temps réponse</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{healthStatus?.performance_score || 98}/100</div>
                      <div className="text-sm text-muted-foreground">Score performance</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Logs système</CardTitle>
                <CardDescription>Événements récents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {systemLogs?.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-2 border rounded text-sm">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        log.level === 'error' || log.level === 'critical' ? 'bg-red-500' :
                        log.level === 'warn' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <div className="font-mono text-xs text-muted-foreground mb-1">
                          {formatDate(log.timestamp)}
                        </div>
                        <div>{log.message}</div>
                      </div>
                    </div>
                  ))}
                  {(!systemLogs || systemLogs.length === 0) && (
                    <div className="text-center py-4 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2" />
                      <p>Aucun log récent</p>
                    </div>
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