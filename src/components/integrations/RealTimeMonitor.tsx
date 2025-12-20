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

  // Generate system status from real data
  const systemStatus: SystemStatus = {
    integrations_online: integrations.filter((i: any) => i.connection_status === 'connected').length,
    integrations_total: integrations.length,
    active_syncs: Math.floor(Math.random() * 5), // Simulated active syncs
    webhooks_active: Math.floor(Math.random() * 10) + 5, // Simulated webhooks
    last_activity: new Date().toISOString(),
    system_health: getSystemHealth(integrations as any[])
  }

  // Simulate real-time activity logs
  useEffect(() => {
    const generateActivityLog = (): ActivityLog => {
      const integration = integrations[Math.floor(Math.random() * integrations.length)]
      const types = ['sync', 'webhook', 'test', 'connection'] as const
      const type = types[Math.floor(Math.random() * types.length)]
      
      const activities = {
        sync: {
          messages: [
            'Synchronisation des produits terminée',
            'Import de nouvelles commandes',
            'Mise à jour du stock en cours',
            'Synchronisation client complète'
          ],
          statuses: ['success', 'success', 'success', 'error'] as const
        },
        webhook: {
          messages: [
            'Webhook reçu avec succès',
            'Notification de commande traitée',
            'Événement produit déclenché',
            'Webhook en échec - retry programmé'
          ],
          statuses: ['success', 'success', 'success', 'warning'] as const
        },
        test: {
          messages: [
            'Test de connexion réussi',
            'Validation des identifiants OK',
            'Test API terminé avec succès',
            'Erreur de test - identifiants invalides'
          ],
          statuses: ['success', 'success', 'success', 'error'] as const
        },
        connection: {
          messages: [
            'Connexion établie',
            'Reconnexion automatique réussie',
            'Connexion interrompue',
            'Tentative de reconnexion en cours'
          ],
          statuses: ['success', 'success', 'warning', 'pending'] as const
        }
      }

      const activity = activities[type]
      const messageIndex = Math.floor(Math.random() * activity.messages.length)
      
      return {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type,
        integration_name: (integration as any)?.platform_name || (integration as any)?.platform || 'Système',
        integration_id: (integration as any)?.id || 'system',
        status: activity.statuses[messageIndex],
        message: activity.messages[messageIndex],
        duration_ms: type === 'sync' ? Math.floor(Math.random() * 5000) + 1000 : undefined,
        details: generateDetails(type)
      }
    }

    // Add initial logs
    if (integrations.length > 0 && activityLogs.length === 0) {
      const initialLogs = Array.from({ length: 20 }, generateActivityLog)
      setActivityLogs(initialLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
    }

    // Simulate real-time updates
    const interval = setInterval(() => {
      if (integrations.length > 0) {
        const newLog = generateActivityLog()
        setActivityLogs(prev => [newLog, ...prev.slice(0, 49)]) // Keep last 50 logs
      }
    }, Math.random() * 5000 + 2000) // Random interval between 2-7 seconds

    return () => clearInterval(interval)
  }, [integrations])

  // Simulate connection status
  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(Math.random() > 0.05) // 95% uptime simulation
    }, 10000)

    return () => clearInterval(interval)
  }, [])

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

  function generateDetails(type: ActivityLog['type']) {
    switch (type) {
      case 'sync':
        return {
          items_processed: Math.floor(Math.random() * 1000) + 10,
          items_success: Math.floor(Math.random() * 950) + 10,
          items_error: Math.floor(Math.random() * 5)
        }
      case 'webhook':
        return {
          event_type: ['order.created', 'product.updated', 'customer.created'][Math.floor(Math.random() * 3)],
          payload_size: Math.floor(Math.random() * 5000) + 500
        }
      case 'test':
        return {
          endpoint: '/api/test',
          response_time: Math.floor(Math.random() * 2000) + 100
        }
      default:
        return {}
    }
  }

  const getStatusIcon = (status: ActivityLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-blue-500" />
    }
  }

  const getHealthBadge = (health: SystemStatus['system_health']) => {
    switch (health) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Bon</Badge>
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Attention</Badge>
      case 'critical':
        return <Badge variant="destructive">Critique</Badge>
    }
  }

  const getTypeIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'sync':
        return <RefreshCw className="w-4 h-4 text-blue-500" />
      case 'webhook':
        return <Zap className="w-4 h-4 text-purple-500" />
      case 'test':
        return <Activity className="w-4 h-4 text-orange-500" />
      case 'connection':
        return <Database className="w-4 h-4 text-green-500" />
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
                      <Wifi className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">En ligne</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600 font-medium">Hors ligne</span>
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
                <p className="text-xl font-bold text-blue-600">{systemStatus.active_syncs}</p>
              </div>
              <RefreshCw className="w-6 h-6 text-blue-500" />
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
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
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
              <div className="text-2xl font-bold text-green-600">
                {activityLogs.filter(log => log.status === 'success').length}
              </div>
              <div className="text-sm text-muted-foreground">Opérations réussies</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {activityLogs.filter(log => log.status === 'error').length}
              </div>
              <div className="text-sm text-muted-foreground">Erreurs détectées</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
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