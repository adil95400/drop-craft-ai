import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  Gauge,
  RefreshCw,
  Search,
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe,
  Server,
  Shield,
  Bell,
  Settings,
  Download,
  Calendar
} from "lucide-react"

export const AdvancedMonitoring = () => {
  const [metrics, setMetrics] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  const timeRanges = [
    { value: '1h', label: '1 heure' },
    { value: '24h', label: '24 heures' },
    { value: '7d', label: '7 jours' },
    { value: '30d', label: '30 jours' }
  ]

  const statusColors = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200'
  }

  useEffect(() => {
    fetchMonitoringData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMonitoringData, 30000)
    return () => clearInterval(interval)
  }, [selectedTimeRange, selectedPlatform])

  const fetchMonitoringData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch real-time metrics
      await Promise.all([
        fetchMetrics(),
        fetchLogs(),
        fetchAlerts()
      ])
      
    } catch (error) {
      console.error('Error fetching monitoring data:', error)
      toast({
        title: "Erreur de monitoring",
        description: "Impossible de récupérer les données de monitoring",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMetrics = async () => {
    // Simulation de métriques en temps réel
    const mockMetrics = [
      {
        id: 'api_calls',
        name: 'Appels API',
        value: Math.floor(Math.random() * 10000) + 5000,
        change: Math.floor(Math.random() * 20) - 10,
        unit: 'calls',
        status: 'success'
      },
      {
        id: 'response_time',
        name: 'Temps de réponse',
        value: Math.floor(Math.random() * 500) + 100,
        change: Math.floor(Math.random() * 20) - 10,
        unit: 'ms',
        status: 'success'
      },
      {
        id: 'error_rate',
        name: 'Taux d\'erreur',
        value: Math.floor(Math.random() * 5) + 1,
        change: Math.floor(Math.random() * 10) - 5,
        unit: '%',
        status: 'warning'
      },
      {
        id: 'sync_success',
        name: 'Sync réussies',
        value: Math.floor(Math.random() * 100) + 85,
        change: Math.floor(Math.random() * 10) - 5,
        unit: '%',
        status: 'success'
      },
      {
        id: 'active_integrations',
        name: 'Intégrations actives',
        value: Math.floor(Math.random() * 20) + 15,
        change: Math.floor(Math.random() * 5) - 2,
        unit: 'count',
        status: 'info'
      },
      {
        id: 'data_processed',
        name: 'Données traitées',
        value: Math.floor(Math.random() * 50000) + 10000,
        change: Math.floor(Math.random() * 25) - 12,
        unit: 'records',
        status: 'success'
      }
    ]
    
    setMetrics(mockMetrics)
  }

  const fetchLogs = async () => {
    // Simulation de logs d'activité
    const platforms = ['Shopify', 'Amazon', 'eBay', 'Stripe', 'PayPal', 'Google Ads']
    const events = ['sync', 'webhook', 'api_call', 'error', 'connection', 'auth']
    const statuses = ['success', 'warning', 'error', 'info']

    const mockLogs = Array.from({ length: 50 }, (_, i) => ({
      id: `log_${i}`,
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      event: events[Math.floor(Math.random() * events.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      message: `Event ${events[Math.floor(Math.random() * events.length)]} processed successfully`,
      duration: Math.floor(Math.random() * 5000) + 100,
      details: {
        user_id: 'user_' + Math.floor(Math.random() * 1000),
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 Chrome/91.0'
      }
    }))

    setLogs(mockLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
  }

  const fetchAlerts = async () => {
    // Simulation d'alertes
    const mockAlerts = [
      {
        id: 'alert_1',
        type: 'error',
        title: 'Taux d\'erreur élevé',
        message: 'Le taux d\'erreur Shopify a dépassé 5% dans la dernière heure',
        platform: 'Shopify',
        severity: 'high',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        acknowledged: false
      },
      {
        id: 'alert_2',
        type: 'warning',
        title: 'Temps de réponse lent',
        message: 'Les API Amazon répondent lentement (>2s en moyenne)',
        platform: 'Amazon',
        severity: 'medium',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        acknowledged: true
      },
      {
        id: 'alert_3',
        type: 'info',
        title: 'Nouvelle intégration',
        message: 'Une nouvelle intégration PayPal a été configurée',
        platform: 'PayPal',
        severity: 'low',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        acknowledged: false
      }
    ]

    setAlerts(mockAlerts)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'info': return <Globe className="w-4 h-4 text-blue-600" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-3 h-3 text-green-600" />
    if (change < 0) return <TrendingDown className="w-3 h-3 text-red-600" />
    return null
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.event.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPlatform = selectedPlatform === 'all' || log.platform === selectedPlatform
    return matchesSearch && matchesPlatform
  })

  const acknowledgeAlert = async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ))
    
    toast({
      title: "Alerte acquittée",
      description: "L'alerte a été marquée comme acquittée"
    })
  }

  const exportLogs = () => {
    const data = filteredLogs.map(log => ({
      timestamp: log.timestamp,
      platform: log.platform,
      event: log.event,
      status: log.status,
      message: log.message,
      duration: log.duration
    }))

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `integration-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitoring Avancé</h2>
          <p className="text-muted-foreground">
            Surveillance en temps réel de vos intégrations
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportLogs}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" onClick={fetchMonitoringData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
          <SelectTrigger className="w-48">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeRanges.map(range => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
          <SelectTrigger className="w-48">
            <Globe className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les plateformes</SelectItem>
            <SelectItem value="Shopify">Shopify</SelectItem>
            <SelectItem value="Amazon">Amazon</SelectItem>
            <SelectItem value="eBay">eBay</SelectItem>
            <SelectItem value="Stripe">Stripe</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher dans les logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Métriques
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alertes {alerts.filter(a => !a.acknowledged).length > 0 && 
              <Badge variant="destructive" className="ml-1">
                {alerts.filter(a => !a.acknowledged).length}
              </Badge>
            }
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {metrics.map(metric => (
              <Card key={metric.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.name}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    {getChangeIcon(metric.change)}
                    {getStatusIcon(metric.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metric.value.toLocaleString()} {metric.unit}
                  </div>
                  {metric.change !== 0 && (
                    <p className={`text-xs ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.change > 0 ? '+' : ''}{metric.change}% vs période précédente
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activité Récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.slice(0, 10).map(log => (
                  <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    {getStatusIcon(log.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{log.platform}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.event}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {log.message}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        {formatTimestamp(log.timestamp)}
                      </div>
                      <div className="text-xs">
                        {log.duration}ms
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {metrics.map(metric => (
              <Card key={metric.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{metric.name}</span>
                    <Badge className={statusColors[metric.status as keyof typeof statusColors]}>
                      {metric.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-3xl font-bold">
                      {metric.value.toLocaleString()} {metric.unit}
                    </div>
                    
                    {/* Simulation d'un graphique simple */}
                    <div className="h-32 bg-muted/30 rounded-lg flex items-end p-2">
                      {Array.from({ length: 24 }, (_, i) => (
                        <div
                          key={i}
                          className="flex-1 mx-0.5 bg-primary/60 rounded-sm"
                          style={{ 
                            height: `${Math.random() * 100 + 20}%`,
                            minHeight: '4px'
                          }}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Dernières 24h</span>
                      <div className="flex items-center gap-1">
                        {getChangeIcon(metric.change)}
                        <span className={metric.change > 0 ? 'text-green-600' : 'text-red-600'}>
                          {metric.change > 0 ? '+' : ''}{metric.change}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs d'Activité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredLogs.map(log => (
                  <Dialog key={log.id}>
                    <DialogTrigger asChild>
                      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                        {getStatusIcon(log.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{log.platform}</span>
                            <Badge variant="outline">{log.event}</Badge>
                            <Badge className={statusColors[log.status as keyof typeof statusColors]}>
                              {log.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {log.message}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatTimestamp(log.timestamp)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {log.duration}ms
                          </div>
                        </div>
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Détails du Log</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Plateforme</label>
                            <p>{log.platform}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Événement</label>
                            <p>{log.event}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Statut</label>
                            <Badge className={statusColors[log.status as keyof typeof statusColors]}>
                              {log.status}
                            </Badge>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Durée</label>
                            <p>{log.duration}ms</p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Message</label>
                          <p className="mt-1 p-3 bg-muted/30 rounded-lg">{log.message}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Détails techniques</label>
                          <pre className="mt-1 p-3 bg-muted/30 rounded-lg text-xs overflow-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <div className="space-y-4">
            {alerts.map(alert => (
              <Card key={alert.id} className={`border-l-4 ${
                alert.severity === 'high' ? 'border-l-red-500' :
                alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {alert.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                      {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                      {alert.type === 'info' && <Globe className="w-5 h-5 text-blue-500" />}
                      
                      <div>
                        <CardTitle className="text-base">{alert.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {alert.platform} • {formatTimestamp(alert.timestamp)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'outline' : 'secondary'}>
                        {alert.severity}
                      </Badge>
                      {!alert.acknowledged && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          Acquitter
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>{alert.message}</p>
                  {alert.acknowledged && (
                    <p className="text-xs text-muted-foreground mt-2">
                      ✓ Alerte acquittée
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}