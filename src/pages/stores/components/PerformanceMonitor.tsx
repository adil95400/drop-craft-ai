import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Monitor, 
  Cpu, 
  Database, 
  Wifi, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { Store } from '@/hooks/useStores'

interface PerformanceMonitorProps {
  store: Store
}

interface PerformanceMetrics {
  apiLatency: number
  syncSpeed: number
  uptime: number
  errorRate: number
  throughput: number
  lastResponseTime: number
}

export function PerformanceMonitor({ store }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    apiLatency: 125,
    syncSpeed: 450, // produits par minute
    uptime: 99.8,
    errorRate: 0.2,
    throughput: 1250, // requêtes par heure
    lastResponseTime: 89
  })
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  // Simulation de métriques en temps réel
  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(() => {
      setMetrics(prev => ({
        apiLatency: Math.max(50, prev.apiLatency + (Math.random() - 0.5) * 20),
        syncSpeed: Math.max(200, prev.syncSpeed + (Math.random() - 0.5) * 50),
        uptime: Math.min(100, Math.max(95, prev.uptime + (Math.random() - 0.1) * 0.1)),
        errorRate: Math.max(0, Math.min(5, prev.errorRate + (Math.random() - 0.5) * 0.1)),
        throughput: Math.max(800, prev.throughput + (Math.random() - 0.5) * 100),
        lastResponseTime: Math.max(30, prev.lastResponseTime + (Math.random() - 0.5) * 15)
      }))
      setLastUpdate(Date.now())
    }, 3000)

    return () => clearInterval(interval)
  }, [isMonitoring])

  const getStatusColor = (value: number, thresholds: { good: number, warning: number }, reversed = false) => {
    if (reversed) {
      if (value <= thresholds.good) return 'text-green-600'
      if (value <= thresholds.warning) return 'text-yellow-600'
      return 'text-red-600'
    } else {
      if (value >= thresholds.good) return 'text-green-600'
      if (value >= thresholds.warning) return 'text-yellow-600'
      return 'text-red-600'
    }
  }

  const getStatusBadge = (value: number, thresholds: { good: number, warning: number }, reversed = false) => {
    if (reversed) {
      if (value <= thresholds.good) return <Badge className="bg-green-100 text-green-700">Excellent</Badge>
      if (value <= thresholds.warning) return <Badge className="bg-yellow-100 text-yellow-700">Correct</Badge>
      return <Badge className="bg-red-100 text-red-700">Problème</Badge>
    } else {
      if (value >= thresholds.good) return <Badge className="bg-green-100 text-green-700">Excellent</Badge>
      if (value >= thresholds.warning) return <Badge className="bg-yellow-100 text-yellow-700">Correct</Badge>
      return <Badge className="bg-red-100 text-red-700">Problème</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Monitoring performance
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isMonitoring ? 'default' : 'secondary'} className="animate-pulse">
              {isMonitoring ? 'Live' : 'Pausé'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMonitoring(!isMonitoring)}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isMonitoring ? 'animate-spin' : ''}`} />
              {isMonitoring ? 'Pause' : 'Reprendre'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Latence API */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Latence API</span>
              </div>
              {getStatusBadge(metrics.apiLatency, { good: 100, warning: 200 }, true)}
            </div>
            <div className="text-2xl font-bold">
              <span className={getStatusColor(metrics.apiLatency, { good: 100, warning: 200 }, true)}>
                {Math.round(metrics.apiLatency)}ms
              </span>
            </div>
            <Progress 
              value={Math.min(100, (300 - metrics.apiLatency) / 3)} 
              className="h-2" 
            />
          </div>

          {/* Vitesse de sync */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span className="text-sm font-medium">Vitesse sync</span>
              </div>
              {getStatusBadge(metrics.syncSpeed, { good: 400, warning: 250 })}
            </div>
            <div className="text-2xl font-bold">
              <span className={getStatusColor(metrics.syncSpeed, { good: 400, warning: 250 })}>
                {Math.round(metrics.syncSpeed)}
              </span>
              <span className="text-sm text-muted-foreground ml-1">/min</span>
            </div>
            <Progress 
              value={Math.min(100, metrics.syncSpeed / 6)} 
              className="h-2" 
            />
          </div>

          {/* Uptime */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Disponibilité</span>
              </div>
              {getStatusBadge(metrics.uptime, { good: 99, warning: 97 })}
            </div>
            <div className="text-2xl font-bold">
              <span className={getStatusColor(metrics.uptime, { good: 99, warning: 97 })}>
                {metrics.uptime.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={metrics.uptime} 
              className="h-2" 
            />
          </div>
        </div>

        {/* Métriques secondaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Taux d'erreur</span>
              <span className={`text-sm font-medium ${getStatusColor(metrics.errorRate, { good: 1, warning: 3 }, true)}`}>
                {metrics.errorRate.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={Math.min(100, metrics.errorRate * 20)} 
              className="h-1" 
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Débit</span>
              <span className="text-sm font-medium">
                {Math.round(metrics.throughput)} req/h
              </span>
            </div>
            <Progress 
              value={Math.min(100, metrics.throughput / 20)} 
              className="h-1" 
            />
          </div>
        </div>

        {/* Alertes de performance */}
        <div className="space-y-2">
          {metrics.apiLatency > 200 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 border border-yellow-200">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Latence API élevée détectée
              </span>
            </div>
          )}

          {metrics.errorRate > 2 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800">
                Taux d'erreur élevé - Vérifiez la configuration
              </span>
            </div>
          )}

          {metrics.uptime < 98 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800">
                Disponibilité dégradée - Contactez le support
              </span>
            </div>
          )}
        </div>

        {/* Dernière mise à jour */}
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Dernière mise à jour: {new Date(lastUpdate).toLocaleTimeString('fr-FR')}
        </div>
      </CardContent>
    </Card>
  )
}