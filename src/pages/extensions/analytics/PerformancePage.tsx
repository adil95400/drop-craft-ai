import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'
import { Zap, Clock, AlertTriangle, CheckCircle, Activity, Gauge, RefreshCw, TrendingDown } from 'lucide-react'

export default function PerformancePage() {
  const [selectedMetric, setSelectedMetric] = useState('response_time')
  const [timeRange, setTimeRange] = useState('24h')

  const performanceMetrics = [
    {
      name: 'Temps de Réponse Moyen',
      value: '245ms',
      change: '-12%',
      trend: 'improving',
      icon: Clock,
      status: 'good'
    },
    {
      name: 'Utilisation CPU',
      value: '23%',
      change: '+5%',
      trend: 'stable',
      icon: Gauge,
      status: 'good'
    },
    {
      name: 'Utilisation Mémoire',
      value: '156MB',
      change: '+8%',
      trend: 'increasing',
      icon: Activity,
      status: 'warning'
    },
    {
      name: 'Taux d\'Erreur',
      value: '0.3%',
      change: '-45%',
      trend: 'improving',
      icon: AlertTriangle,
      status: 'excellent'
    }
  ]

  const responseTimeData = [
    { time: '00:00', avg: 180, p95: 320, p99: 580 },
    { time: '04:00', avg: 165, p95: 285, p99: 510 },
    { time: '08:00', avg: 220, p95: 380, p99: 650 },
    { time: '12:00', avg: 280, p95: 480, p99: 820 },
    { time: '16:00', avg: 310, p95: 520, p99: 890 },
    { time: '20:00', avg: 245, p95: 420, p99: 720 },
  ]

  const resourceUsageData = [
    { time: '00:00', cpu: 15, memory: 120, network: 45 },
    { time: '04:00', cpu: 12, memory: 115, network: 38 },
    { time: '08:00', cpu: 25, memory: 145, network: 62 },
    { time: '12:00', cpu: 35, memory: 180, network: 85 },
    { time: '16:00', cpu: 40, memory: 195, network: 95 },
    { time: '20:00', cpu: 28, memory: 160, network: 72 },
  ]

  const extensionPerformance = [
    {
      name: 'Data Scraper Pro',
      loadTime: 245,
      memoryUsage: 45.2,
      cpuUsage: 12.5,
      errorRate: 0.2,
      status: 'excellent'
    },
    {
      name: 'Review Importer',
      loadTime: 189,
      memoryUsage: 28.7,
      cpuUsage: 8.3,
      errorRate: 0.1,
      status: 'excellent'
    },
    {
      name: 'Price Monitor',
      loadTime: 380,
      memoryUsage: 62.1,
      cpuUsage: 18.9,
      errorRate: 0.5,
      status: 'warning'
    },
    {
      name: 'SEO Optimizer',
      loadTime: 298,
      memoryUsage: 38.4,
      cpuUsage: 14.2,
      errorRate: 0.3,
      status: 'good'
    }
  ]

  const alertRules = [
    {
      metric: 'Temps de réponse',
      threshold: '> 500ms',
      status: 'active',
      triggered: 0,
      lastAlert: 'Jamais'
    },
    {
      metric: 'Utilisation CPU',
      threshold: '> 80%',
      status: 'active',
      triggered: 2,
      lastAlert: '2024-01-12 14:30'
    },
    {
      metric: 'Taux d\'erreur',
      threshold: '> 5%',
      status: 'active',
      triggered: 0,
      lastAlert: 'Jamais'
    },
    {
      metric: 'Utilisation mémoire',
      threshold: '> 500MB',
      status: 'inactive',
      triggered: 1,
      lastAlert: '2024-01-10 09:15'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500'
      case 'good': return 'bg-blue-500'
      case 'warning': return 'bg-orange-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return 'Excellent'
      case 'good': return 'Bon'
      case 'warning': return 'Attention'
      case 'critical': return 'Critique'
      default: return 'Inconnu'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'stable':
        return <Activity className="w-4 h-4 text-blue-500" />
      case 'increasing':
        return <TrendingDown className="w-4 h-4 text-orange-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Monitoring Performance
          </h1>
          <p className="text-muted-foreground mt-2">
            Surveillez les performances de vos extensions en temps réel
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 heure</SelectItem>
              <SelectItem value="6h">6 heures</SelectItem>
              <SelectItem value="24h">24 heures</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  {getTrendIcon(metric.trend)}
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{metric.name}</p>
                    <Badge variant={metric.change.startsWith('+') ? 'secondary' : 'default'}>
                      {metric.change}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(metric.status)}`} />
                    <span className="text-xs text-muted-foreground">{getStatusText(metric.status)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="extensions">Par Extension</TabsTrigger>
          <TabsTrigger value="resources">Ressources</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Temps de Réponse</CardTitle>
              <CardDescription>
                Analyse des latences (moyenne, 95e percentile, 99e percentile)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="avg" stroke="#3b82f6" strokeWidth={2} name="Moyenne" />
                  <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={2} name="95e percentile" />
                  <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={2} name="99e percentile" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Utilisation des Ressources</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={resourceUsageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="cpu" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="CPU %" />
                    <Area type="monotone" dataKey="memory" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Memory (MB)" />
                    <Area type="monotone" dataKey="network" stackId="3" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Network (KB/s)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métriques en Temps Réel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">99.7%</div>
                    <p className="text-sm text-muted-foreground">Disponibilité</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">156</div>
                    <p className="text-sm text-muted-foreground">Req/min</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">12</div>
                    <p className="text-sm text-muted-foreground">Extensions actives</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">4.2s</div>
                    <p className="text-sm text-muted-foreground">Temps de démarrage</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="extensions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance par Extension</CardTitle>
              <CardDescription>
                Analyse détaillée des performances de chaque extension
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {extensionPerformance.map((ext, index) => (
                  <Card key={index} className="border-l-4 border-l-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold">{ext.name}</h3>
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(ext.status)}`} />
                          <span className="text-sm text-muted-foreground">{getStatusText(ext.status)}</span>
                        </div>
                        <Button variant="outline" size="sm">Optimiser</Button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold">{ext.loadTime}ms</div>
                          <p className="text-xs text-muted-foreground">Temps de chargement</p>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{ext.memoryUsage}MB</div>
                          <p className="text-xs text-muted-foreground">Mémoire</p>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{ext.cpuUsage}%</div>
                          <p className="text-xs text-muted-foreground">CPU</p>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{ext.errorRate}%</div>
                          <p className="text-xs text-muted-foreground">Erreurs</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Détail des Ressources Système</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={resourceUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cpu" fill="#3b82f6" name="CPU %" />
                  <Bar dataKey="memory" fill="#10b981" name="Mémoire (MB)" />
                  <Bar dataKey="network" fill="#f59e0b" name="Réseau (KB/s)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stockage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Extensions</span>
                    <span className="text-sm font-mono">245 MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cache</span>
                    <span className="text-sm font-mono">89 MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Logs</span>
                    <span className="text-sm font-mono">23 MB</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-sm">Total</span>
                      <span className="text-sm font-mono">357 MB</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Réseau</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Bande passante utilisée</span>
                    <span className="text-sm font-mono">1.2 MB/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Requêtes/minute</span>
                    <span className="text-sm font-mono">156</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Latence moyenne</span>
                    <span className="text-sm font-mono">45ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Connexions actives</span>
                    <span className="text-sm font-mono">23</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Processus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Worker threads</span>
                    <span className="text-sm font-mono">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Background scripts</span>
                    <span className="text-sm font-mono">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Content scripts</span>
                    <span className="text-sm font-mono">24</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Event listeners</span>
                    <span className="text-sm font-mono">156</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Règles d'Alerte</CardTitle>
              <CardDescription>
                Configurez des alertes pour surveiller les performances critiques
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertRules.map((rule, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold">{rule.metric}</h3>
                            <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                              {rule.status === 'active' ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Seuil : {rule.threshold}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>Déclenchements : {rule.triggered}</span>
                            <span>Dernière alerte : {rule.lastAlert}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Modifier</Button>
                          <Button 
                            variant={rule.status === 'active' ? 'secondary' : 'default'} 
                            size="sm"
                          >
                            {rule.status === 'active' ? 'Désactiver' : 'Activer'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Button className="w-full mt-4">
                <Zap className="w-4 h-4 mr-2" />
                Créer une nouvelle règle d'alerte
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}