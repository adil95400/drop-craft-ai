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
import { productionLogger } from '@/utils/productionLogger';
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
    const interval = setInterval(fetchMonitoringData, 30000)
    return () => clearInterval(interval)
  }, [selectedTimeRange, selectedPlatform])

  const getTimeRangeFilter = () => {
    const now = new Date()
    switch (selectedTimeRange) {
      case '1h': return new Date(now.getTime() - 3600000).toISOString()
      case '24h': return new Date(now.getTime() - 86400000).toISOString()
      case '7d': return new Date(now.getTime() - 7 * 86400000).toISOString()
      case '30d': return new Date(now.getTime() - 30 * 86400000).toISOString()
      default: return new Date(now.getTime() - 86400000).toISOString()
    }
  }

  const fetchMonitoringData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([fetchMetrics(), fetchLogs(), fetchAlerts()])
    } catch (error) {
      productionLogger.error('Failed to fetch monitoring data', error as Error, 'AdvancedMonitoring')
      toast({ title: "Erreur de monitoring", description: "Impossible de récupérer les données de monitoring", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMetrics = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const since = getTimeRangeFilter()

    // Fetch real data from multiple tables in parallel
    const [syncRes, integRes, apiLogRes] = await Promise.all([
      supabase.from('unified_sync_queue').select('id, status, created_at').eq('user_id', user.id).gte('created_at', since),
      supabase.from('integrations').select('id, is_active').eq('user_id', user.id),
      supabase.from('api_logs').select('id, status_code, response_time_ms').eq('user_id', user.id).gte('created_at', since)
    ])

    const syncs = syncRes.data || []
    const integrations = integRes.data || []
    const apiLogs = apiLogRes.data || []

    const totalSyncs = syncs.length
    const successSyncs = syncs.filter(s => s.status === 'completed' || s.status === 'synced').length
    const syncRate = totalSyncs > 0 ? Math.round((successSyncs / totalSyncs) * 100) : 100

    const totalApiCalls = apiLogs.length
    const failedCalls = apiLogs.filter(l => (l.status_code || 0) >= 400).length
    const errorRate = totalApiCalls > 0 ? Math.round((failedCalls / totalApiCalls) * 100) : 0
    const avgResponseTime = apiLogs.length > 0
      ? Math.round(apiLogs.reduce((s, l) => s + (l.response_time_ms || 0), 0) / apiLogs.length)
      : 0

    const activeIntegrations = integrations.filter(i => i.is_active).length

    setMetrics([
      { id: 'api_calls', name: 'Appels API', value: totalApiCalls, change: 0, unit: 'calls', status: 'success' },
      { id: 'response_time', name: 'Temps de réponse', value: avgResponseTime, change: 0, unit: 'ms', status: avgResponseTime > 1000 ? 'warning' : 'success' },
      { id: 'error_rate', name: "Taux d'erreur", value: errorRate, change: 0, unit: '%', status: errorRate > 5 ? 'error' : errorRate > 2 ? 'warning' : 'success' },
      { id: 'sync_success', name: 'Sync réussies', value: syncRate, change: 0, unit: '%', status: syncRate < 90 ? 'warning' : 'success' },
      { id: 'active_integrations', name: 'Intégrations actives', value: activeIntegrations, change: 0, unit: 'count', status: 'info' },
      { id: 'data_processed', name: 'Données traitées', value: totalSyncs, change: 0, unit: 'records', status: 'success' }
    ])
  }

  const fetchLogs = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const since = getTimeRangeFilter()

    // Real logs from unified_sync_queue
    const { data: syncLogs } = await supabase
      .from('unified_sync_queue')
      .select('id, sync_type, entity_type, action, status, channels, created_at, completed_at')
      .eq('user_id', user.id)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50)

    const realLogs = (syncLogs || []).map((log: any) => {
      const channels = log.channels || []
      const platform = channels[0]?.platform || log.entity_type || 'System'
      const duration = log.completed_at
        ? new Date(log.completed_at).getTime() - new Date(log.created_at).getTime()
        : 0

      return {
        id: log.id,
        timestamp: log.created_at,
        platform,
        event: `${log.sync_type || 'sync'}_${log.action || 'update'}`,
        status: log.status === 'completed' || log.status === 'synced' ? 'success'
          : log.status === 'failed' ? 'error'
          : log.status === 'pending' ? 'info' : 'warning',
        message: `${log.action || 'Sync'} ${log.entity_type || ''} — ${log.status}`,
        duration,
        details: { sync_type: log.sync_type, entity_type: log.entity_type }
      }
    })

    setLogs(realLogs)
  }

  const fetchAlerts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: activeAlerts } = await supabase
      .from('active_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    const realAlerts = (activeAlerts || []).map((alert: any) => ({
      id: alert.id,
      type: alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info',
      title: alert.title,
      message: alert.message || '',
      platform: (alert.metadata as any)?.platform || 'System',
      severity: alert.severity || 'low',
      timestamp: alert.created_at,
      acknowledged: alert.acknowledged || false
    }))

    setAlerts(realAlerts)
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
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
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
    await supabase.from('active_alerts').update({ acknowledged: true, acknowledged_at: new Date().toISOString() }).eq('id', alertId)
    setAlerts(prev => prev.map(alert => alert.id === alertId ? { ...alert, acknowledged: true } : alert))
    toast({ title: "Alerte acquittée", description: "L'alerte a été marquée comme acquittée" })
  }

  const exportLogs = () => {
    if (filteredLogs.length === 0) return
    const data = filteredLogs.map(log => ({
      timestamp: log.timestamp, platform: log.platform, event: log.event, status: log.status, message: log.message, duration: log.duration
    }))
    const csv = [Object.keys(data[0]).join(','), ...data.map(row => Object.values(row).join(','))].join('\n')
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
          <p className="text-muted-foreground">Surveillance en temps réel de vos intégrations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportLogs}><Download className="w-4 h-4 mr-2" />Exporter</Button>
          <Button variant="outline" onClick={fetchMonitoringData}><RefreshCw className="w-4 h-4 mr-2" />Actualiser</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
          <SelectTrigger className="w-48"><Calendar className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            {timeRanges.map(range => (<SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
          <SelectTrigger className="w-48"><Globe className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
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
          <Input placeholder="Rechercher dans les logs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-64" />
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2"><Gauge className="w-4 h-4" />Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2"><BarChart3 className="w-4 h-4" />Métriques</TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2"><Activity className="w-4 h-4" />Logs</TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />Alertes {alerts.filter(a => !a.acknowledged).length > 0 && 
              <Badge variant="destructive" className="ml-1">{alerts.filter(a => !a.acknowledged).length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {metrics.map(metric => (
              <Card key={metric.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                  <div className="flex items-center gap-1">{getChangeIcon(metric.change)}{getStatusIcon(metric.status)}</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value.toLocaleString()} {metric.unit}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" />Activité Récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.length === 0 && <p className="text-muted-foreground text-center py-4">Aucune activité récente</p>}
                {logs.slice(0, 10).map(log => (
                  <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    {getStatusIcon(log.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{log.platform}</span>
                        <Badge variant="outline" className="text-xs">{log.event}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{log.message}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">{formatTimestamp(log.timestamp)}</div>
                      {log.duration > 0 && <div className="text-xs">{log.duration}ms</div>}
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
                    <Badge className={statusColors[metric.status as keyof typeof statusColors]}>{metric.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{metric.value.toLocaleString()} {metric.unit}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader><CardTitle>Logs d'Activité</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredLogs.length === 0 && <p className="text-muted-foreground text-center py-4">Aucun log trouvé</p>}
                {filteredLogs.map(log => (
                  <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    {getStatusIcon(log.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{log.platform}</span>
                        <Badge variant="outline" className="text-xs">{log.event}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{log.message}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">{formatTimestamp(log.timestamp)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />Alertes Actives</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.length === 0 && <p className="text-muted-foreground text-center py-4">Aucune alerte active</p>}
                {alerts.map(alert => (
                  <div key={alert.id} className={`p-4 rounded-lg border ${alert.acknowledged ? 'opacity-50' : ''} ${
                    alert.type === 'error' ? 'border-red-200 bg-red-50' : alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : 'border-blue-200 bg-blue-50'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(alert.type)}
                        <div>
                          <h4 className="font-medium">{alert.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{alert.platform}</Badge>
                            <span className="text-xs text-muted-foreground">{formatTimestamp(alert.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <Button variant="outline" size="sm" onClick={() => acknowledgeAlert(alert.id)}>Acquitter</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
