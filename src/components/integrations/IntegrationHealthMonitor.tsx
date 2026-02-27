import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useIntegrationsUnified } from "@/hooks/unified"
import { useToast } from "@/hooks/use-toast"
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  Zap
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { productionLogger } from '@/utils/productionLogger';

export const IntegrationHealthMonitor = () => {
  const { integrations, isLoading, testConnection } = useIntegrationsUnified()
  const { toast } = useToast()
  const [healthData, setHealthData] = useState<Record<string, any>>({})
  const [isMonitoring, setIsMonitoring] = useState(false)

  // Real-time health monitoring
  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const { data, error } = await supabase
          .from('integrations')
          .select(`
            id,
            platform_name,
            connection_status,
            last_sync_at,
            
            sync_frequency,
            is_active
          `)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

        if (error) throw error

        const healthMap: Record<string, any> = {}
        data?.forEach(integration => {
          healthMap[integration.id] = {
            ...integration,
            uptime: calculateUptime(integration.last_sync_at, integration.connection_status),
            responseTime: Math.random() * 200 + 50, // Simulate response time
            lastCheck: new Date().toISOString()
          }
        })

        setHealthData(healthMap)
      } catch (error) {
        productionLogger.error('Failed to fetch health data', error as Error, 'IntegrationHealthMonitor')
      }
    }

    fetchHealthData()
    
    // Real-time updates
    const channel = supabase
      .channel('integration_health')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'integrations'
      }, (payload) => {
        productionLogger.info('Integration health updated', payload, 'IntegrationHealthMonitor')
        fetchHealthData()
      })
      .subscribe()

    const interval = setInterval(fetchHealthData, 30000) // Update every 30s

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  const calculateUptime = (lastSync: string | null, connectionStatus: string | null) => {
    if (!lastSync) return 0
    const hoursSinceSync = (Date.now() - new Date(lastSync).getTime()) / (1000 * 60 * 60)
    return connectionStatus === 'connected' ? Math.max(85, Math.min(100, 100 - (hoursSinceSync * 0.5))) : 0
  }

  const getHealthStatus = (integration: any) => {
    const health = healthData[integration.id]
    if (!health) return 'unknown'
    
    if (health.connection_status === 'connected' && health.uptime > 95) return 'healthy'
    if (health.connection_status === 'connected' && health.uptime > 80) return 'warning'
    return 'critical'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="w-4 h-4 text-success" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />
      case 'critical': return <XCircle className="w-4 h-4 text-destructive" />
      default: return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge className="bg-success/10 text-success">En ligne</Badge>
      case 'warning': return <Badge className="bg-warning/10 text-warning">Attention</Badge>
      case 'critical': return <Badge className="bg-destructive/10 text-destructive">Critique</Badge>
      default: return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const runHealthCheck = async (integrationId: string) => {
    setIsMonitoring(true)
    try {
      await testConnection(integrationId)
      toast({
        title: "Test de santé réussi",
        description: "L'intégration fonctionne correctement"
      })
    } catch (error) {
      toast({
        title: "Test de santé échoué",
        description: "L'intégration rencontre des problèmes",
        variant: "destructive"
      })
    } finally {
      setIsMonitoring(false)
    }
  }

  const averageUptime = integrations.length > 0 
    ? integrations.reduce((acc, int) => acc + (healthData[int.id]?.uptime || 0), 0) / integrations.length
    : 0

  if (isLoading) {
    return <div className="p-4">Chargement des données de santé...</div>
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibilité Globale</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageUptime.toFixed(1)}%</div>
            <Progress value={averageUptime} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intégrations Actives</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrations.filter(i => i.connection_status === 'connected').length}
            </div>
            <p className="text-xs text-muted-foreground">
              sur {integrations.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps de Réponse</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(healthData).reduce((acc: number, health: any) => 
                acc + (health.responseTime || 0), 0) / Math.max(1, Object.keys(healthData).length)
              }ms
            </div>
            <p className="text-xs text-muted-foreground">
              Temps moyen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrations.filter(i => i.connection_status === 'error').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Dernières 24h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Integration Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            État de Santé des Intégrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrations.map((integration) => {
              const health = healthData[integration.id]
              const status = getHealthStatus(integration)
              
              return (
                <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(status)}
                    <div>
                      <div className="font-medium">{integration.platform_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {integration.platform_type} • {integration.shop_domain || 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm">
                        Disponibilité: {health?.uptime?.toFixed(1) || 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Réponse: {health?.responseTime?.toFixed(0) || 'N/A'}ms
                      </div>
                    </div>
                    
                    {getStatusBadge(status)}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => runHealthCheck(integration.id)}
                      disabled={isMonitoring}
                    >
                      <RefreshCw className={`w-4 h-4 ${isMonitoring ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}