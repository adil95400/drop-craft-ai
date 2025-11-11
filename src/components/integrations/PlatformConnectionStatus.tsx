import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Zap, Clock, TrendingUp } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface IntegrationLike {
  id: string
  connection_status: string | 'connected' | 'disconnected' | 'error'
  last_sync_at?: string | null
}

interface PlatformConnectionStatusProps {
  integration: IntegrationLike
  onSync?: () => void
}

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'down'
  latency: number
  lastChecked: Date
  message?: string
}

export function PlatformConnectionStatus({ integration, onSync }: PlatformConnectionStatusProps) {
  const [healthCheck, setHealthCheck] = useState<HealthCheck | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    performHealthCheck()
    // Auto-check every 5 minutes
    const interval = setInterval(performHealthCheck, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [integration.id])

  const performHealthCheck = async () => {
    setIsChecking(true)
    const startTime = Date.now()
    
    try {
      const { data, error } = await supabase.functions.invoke('test-integration', {
        body: { integration_id: integration.id }
      })

      const latency = Date.now() - startTime

      if (error) throw error

      setHealthCheck({
        status: data.success ? 'healthy' : 'degraded',
        latency,
        lastChecked: new Date(),
        message: data.message
      })
    } catch (error: any) {
      setHealthCheck({
        status: 'down',
        latency: Date.now() - startTime,
        lastChecked: new Date(),
        message: error.message || 'Connexion échouée'
      })
    } finally {
      setIsChecking(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'bg-success text-success-foreground'
      case 'degraded':
        return 'bg-warning text-warning-foreground'
      case 'down':
      case 'error':
        return 'bg-destructive text-destructive-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return <CheckCircle className="w-4 h-4" />
      case 'degraded':
        return <AlertTriangle className="w-4 h-4" />
      case 'down':
      case 'error':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getPerformanceRating = (latency: number) => {
    if (latency < 500) return { label: 'Excellent', value: 100, color: 'text-success' }
    if (latency < 1000) return { label: 'Bon', value: 75, color: 'text-success' }
    if (latency < 2000) return { label: 'Moyen', value: 50, color: 'text-warning' }
    return { label: 'Lent', value: 25, color: 'text-destructive' }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">État de la connexion</CardTitle>
            <CardDescription>Surveillance en temps réel</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={performHealthCheck}
            disabled={isChecking}
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            {getStatusIcon(healthCheck?.status || integration.connection_status)}
            <span className="font-medium">Statut de connexion</span>
          </div>
          <Badge className={getStatusColor(healthCheck?.status || integration.connection_status)}>
            {healthCheck?.status === 'healthy' ? 'Connecté' : 
             healthCheck?.status === 'degraded' ? 'Dégradé' :
             healthCheck?.status === 'down' ? 'Hors ligne' : 
             integration.connection_status === 'connected' ? 'Connecté' : 'Déconnecté'}
          </Badge>
        </div>

        {/* Performance Metrics */}
        {healthCheck && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Latence</span>
                <span className={`font-medium ${getPerformanceRating(healthCheck.latency).color}`}>
                  {healthCheck.latency}ms - {getPerformanceRating(healthCheck.latency).label}
                </span>
              </div>
              <Progress 
                value={getPerformanceRating(healthCheck.latency).value} 
                className="h-2"
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <Clock className="w-3 h-3 inline mr-1" />
              Dernière vérification: {healthCheck.lastChecked.toLocaleTimeString('fr-FR')}
            </div>

            {healthCheck.message && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                {healthCheck.message}
              </div>
            )}
          </>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={performHealthCheck}
            disabled={isChecking}
            className="w-full"
          >
            <Zap className="w-4 h-4 mr-1" />
            Tester
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            className="w-full"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Synchroniser
          </Button>
        </div>

        {/* Last Sync Info */}
        {integration.last_sync_at && (
          <div className="text-xs text-muted-foreground border-t pt-3">
            Dernière synchronisation: {new Date(integration.last_sync_at).toLocaleString('fr-FR')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
