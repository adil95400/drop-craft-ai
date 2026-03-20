import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  TrendingUp,
  Database
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface ActivityLog {
  id: string
  timestamp: string
  type: 'sync' | 'webhook' | 'test' | 'error' | 'connection'
  integration_name: string
  integration_id: string
  status: 'success' | 'error' | 'pending' | 'warning'
  message: string
  details?: any
  duration_ms?: number
}

interface SystemStatus {
  integrations_online: number
  integrations_total: number
  active_syncs: number
  webhooks_active: number
  last_activity: string
  system_health: 'excellent' | 'good' | 'warning' | 'critical'
}

export const RealTimeMonitor = () => {
  const [isConnected, setIsConnected] = useState(true)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])

  // Fetch real integrations for monitoring
  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations-monitor'],
    queryFn: async () => {
      const { data } = await supabase
        .from('integrations')
        .select('id, platform_name, platform, connection_status, is_active, last_sync_at')
      return (data || []) as any[]
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  // Fetch real sync activity from activity_logs
  const { data: realLogs = [] } = useQuery({
    queryKey: ['integration-activity-logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('id, action, description, entity_type, entity_id, created_at, severity, source')
        .in('entity_type', ['integration', 'sync', 'webhook', 'connection'])
        .order('created_at', { ascending: false })
        .limit(50)
      return (data || []).map((log: any): ActivityLog => ({
        id: log.id,
        timestamp: log.created_at,
        type: (['sync', 'webhook', 'connection'].includes(log.entity_type) ? log.entity_type : 'sync') as ActivityLog['type'],
        integration_name: log.source || 'Système',
        integration_id: log.entity_id || 'system',
        status: log.severity === 'error' ? 'error' : log.severity === 'warn' ? 'warning' : 'success',
        message: log.description || log.action,
      }))
    },
    refetchInterval: 15000,
  })

  // Generate system status from real data
  const systemStatus: SystemStatus = {
    integrations_online: integrations.filter((i: any) => i.connection_status === 'connected').length,
    integrations_total: integrations.length,
    active_syncs: integrations.filter((i: any) => i.is_active && i.connection_status === 'connected').length,
    webhooks_active: integrations.filter((i: any) => i.is_active).length,
    last_activity: realLogs[0]?.timestamp || new Date().toISOString(),
    system_health: getSystemHealth(integrations as any[])
  }

  // Use real logs instead of simulated ones
  useEffect(() => {
    if (realLogs.length > 0 && activityLogs.length === 0) {
      setActivityLogs(realLogs)
    } else if (realLogs.length > 0) {
      // Merge new logs
      const existingIds = new Set(activityLogs.map(l => l.id))
      const newLogs = realLogs.filter(l => !existingIds.has(l.id))
      if (newLogs.length > 0) {
        setActivityLogs(prev => [...newLogs, ...prev].slice(0, 50))
      }
    }
  }, [realLogs])

  // Connection status based on real data
  useEffect(() => {
    setIsConnected(integrations.some((i: any) => i.connection_status === 'connected'))
  }, [integrations])

  function getSystemHealth(integrations: any[]): SystemStatus['system_health'] {
    if (integrations.length === 0) return 'warning'
    
    const connectedRatio = integrations.filter(i => i.connection_status === 'connected').length / integrations.length
    const activeRatio = integrations.filter(i => i.is_active).length / integrations.length
    
    const overallHealth = (connectedRatio + activeRatio) / 2
    
    if (overallHealth >= 0.9) return 'excellent'
    if (overallHealth >= 0.7) return 'good'
    if (overallHealth >= 0.5) return 'warning'
    return 'critical'
  }

  const getStatusIcon = (status: ActivityLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-success" />
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />
      case 'pending':
        return <Clock className="w-4 h-4 text-info" />
    }
  }

  const getHealthBadge = (health: SystemStatus['system_health']) => {
    switch (health) {
      case 'excellent':
        return <Badge className="bg-success/10 text-success border-success/20">Excellent</Badge>
      case 'good':
        return <Badge className="bg-info/10 text-blue-800 border-info/20">Bon</Badge>
      case 'warning':
        return <Badge className="bg-warning/10 text-yellow-800 border-warning/20">Attention</Badge>
      case 'critical':
        return <Badge variant="destructive">Critique</Badge>
    }
  }

  const getTypeIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'sync':
        return <RefreshCw className="w-4 h-4 text-info" />
      case 'webhook':
        return <Zap className="w-4 h-4 text-purple-500" />
      case 'test':
        return <Activity className="w-4 h-4 text-warning" />
      case 'connection':
        return <Database className="w-4 h-4 text-success" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connexion</p>
                <div className="flex items-center gap-2 mt-1">
                  {isConnected ? (
                    <>
                      <Wifi className="w-4 h-4 text-success" />
                      <span className="text-sm text-success font-medium">En ligne</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-destructive" />
                      <span className="text-sm text-destructive font-medium">Hors ligne</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Intégrations</p>
                <p className="text-xl font-bold">
                  {systemStatus.integrations_online}/{systemStatus.integrations_total}
                </p>
              </div>
              <Database className="w-6 h-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Syncs Actives</p>
                <p className="text-xl font-bold text-info">{systemStatus.active_syncs}</p>
              </div>
              <RefreshCw className="w-6 h-6 text-info" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Webhooks</p>
                <p className="text-xl font-bold text-purple-600">{systemStatus.webhooks_active}</p>
              </div>
              <Zap className="w-6 h-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">État Système</p>
                <div className="mt-1">
                  {getHealthBadge(systemStatus.system_health)}
                </div>
              </div>
              <TrendingUp className="w-6 h-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activité en Temps Réel
              </CardTitle>
              <CardDescription>
                Flux des événements et opérations en cours
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-destructive'} animate-pulse`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Connecté' : 'Déconnecté'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {activityLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>En attente d'activité...</p>
                </div>
              ) : (
                activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg border transition-all hover:bg-muted/50"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getTypeIcon(log.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{log.integration_name}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {log.type}
                        </Badge>
                        {getStatusIcon(log.status)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-1">{log.message}</p>
                      
                      {log.details && (
                        <div className="text-xs text-muted-foreground">
                          {log.type === 'sync' && log.details.items_processed && (
                            <span>
                              {log.details.items_processed} éléments • {log.details.items_success} succès • {log.details.items_error} erreurs
                            </span>
                          )}
                          {log.type === 'webhook' && log.details.event_type && (
                            <span>
                              {log.details.event_type} • {log.details.payload_size} bytes
                            </span>
                          )}
                          {log.type === 'test' && log.details.response_time && (
                            <span>
                              {log.details.response_time}ms • {log.details.endpoint}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0 text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {activityLogs.filter(log => log.status === 'success').length}
              </div>
              <div className="text-sm text-muted-foreground">Opérations réussies</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {activityLogs.filter(log => log.status === 'error').length}
              </div>
              <div className="text-sm text-muted-foreground">Erreurs détectées</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-info">
                {activityLogs.filter(log => log.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">En cours de traitement</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}