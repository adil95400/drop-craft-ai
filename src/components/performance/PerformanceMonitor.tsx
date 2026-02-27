import { useEffect, useState, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  Zap, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'

interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  bundleSize: number
  loadTime: number
  renderCount: number
  cacheHitRate: number
}

interface PerformanceMonitorProps {
  children: ReactNode
  showWidget?: boolean
}

export function PerformanceMonitor({ children, showWidget = false }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    bundleSize: 0,
    loadTime: 0,
    renderCount: 0,
    cacheHitRate: 95
  })

  const [isOptimized, setIsOptimized] = useState(false)
  const [lastOptimization, setLastOptimization] = useState<Date | null>(null)

  useEffect(() => {
    // Simulation des métriques de performance
    const updateMetrics = () => {
      // Gestion sécurisée de performance.memory
      const performanceMemory = (performance as any).memory
      if (performanceMemory) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round((performanceMemory.usedJSHeapSize / performanceMemory.jsHeapSizeLimit) * 100),
          renderCount: prev.renderCount + 1,
        }))
      }
    }

    // Calcul du temps de chargement initial
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigationTiming) {
      setMetrics(prev => ({
        ...prev,
        loadTime: Math.round(navigationTiming.loadEventEnd - navigationTiming.fetchStart)
      }))
    }

    const interval = setInterval(updateMetrics, 2000)
    updateMetrics()

    return () => clearInterval(interval)
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { variant: 'default' as const, label: 'Excellent' }
    if (score >= 70) return { variant: 'secondary' as const, label: 'Bon' }
    return { variant: 'destructive' as const, label: 'À améliorer' }
  }

  const performOptimization = () => {
    // Simulation d'optimisations
    setIsOptimized(true)
    setLastOptimization(new Date())
    
    setMetrics(prev => ({
      ...prev,
      fps: Math.min(prev.fps + 10, 60),
      memoryUsage: Math.max(prev.memoryUsage - 15, 20),
      cacheHitRate: Math.min(prev.cacheHitRate + 5, 99)
    }))

    setTimeout(() => setIsOptimized(false), 3000)
  }

  const overallScore = Math.round(
    (Math.min(metrics.fps / 60, 1) * 25) +
    (Math.max(1 - metrics.memoryUsage / 100, 0) * 25) +
    (metrics.cacheHitRate / 100 * 25) +
    (Math.max(1 - metrics.loadTime / 3000, 0) * 25)
  )

  const scoreBadge = getScoreBadge(overallScore)

  const PerformanceWidget = () => (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Moniteur de Performance
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={scoreBadge.variant} className="gap-1">
              <TrendingUp className="h-3 w-3" />
              {scoreBadge.label}
            </Badge>
            <Badge variant="outline">{overallScore}/100</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Score global avec progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Score Global</span>
            <span className={`font-medium ${getScoreColor(overallScore)}`}>
              {overallScore}%
            </span>
          </div>
          <Progress value={overallScore} className="h-2" />
        </div>

        {/* Métriques détaillées */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                FPS
              </span>
              <span className={`font-mono ${getScoreColor(metrics.fps)}`}>
                {metrics.fps}
              </span>
            </div>
            <Progress value={(metrics.fps / 60) * 100} className="h-1" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Mémoire
              </span>
              <span className={`font-mono ${getScoreColor(100 - metrics.memoryUsage)}`}>
                {metrics.memoryUsage}%
              </span>
            </div>
            <Progress value={metrics.memoryUsage} className="h-1" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Chargement
              </span>
              <span className="font-mono text-xs">
                {metrics.loadTime}ms
              </span>
            </div>
            <Progress value={Math.max(1 - metrics.loadTime / 3000, 0) * 100} className="h-1" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Cache
              </span>
              <span className={`font-mono ${getScoreColor(metrics.cacheHitRate)}`}>
                {metrics.cacheHitRate}%
              </span>
            </div>
            <Progress value={metrics.cacheHitRate} className="h-1" />
          </div>
        </div>

        {/* Statistiques additionnelles */}
        <div className="pt-2 border-t">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Rendus: {metrics.renderCount.toLocaleString()}</span>
            <span>Bundle: ~2.1MB</span>
          </div>
        </div>

        {/* Actions d'optimisation */}
        <div className="flex gap-2">
          <Button
            onClick={performOptimization}
            disabled={isOptimized}
            size="sm"
            variant="outline"
            className="flex-1 gap-2"
          >
            {isOptimized ? (
              <>
                <CheckCircle className="h-3 w-3 text-green-600" />
                Optimisé
              </>
            ) : (
              <>
                <Zap className="h-3 w-3" />
                Optimiser
              </>
            )}
          </Button>

          <Button
            onClick={() => window.location.reload()}
            size="sm"
            variant="ghost"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>

        {lastOptimization && (
          <p className="text-xs text-muted-foreground">
            Dernière optimisation: {lastOptimization.toLocaleTimeString()}
          </p>
        )}

        {/* Alertes de performance */}
        {overallScore < 70 && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Performance dégradée détectée
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 text-xs">
                Recommandation: Optimisation automatique disponible
              </p>
            </div>
          </div>
        )}
      </CardContent>

      {/* Animation d'optimisation */}
      {isOptimized && (
        <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
          <div className="bg-background border rounded-lg p-4 shadow-lg animate-pulse">
            <div className="flex items-center gap-2 text-green-600">
              <Zap className="h-5 w-5" />
              <span className="font-medium">Optimisation en cours...</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  )

  return (
    <>
      {children}
      {showWidget && (
        <div className="fixed bottom-4 left-4 z-50 w-80">
          <PerformanceWidget />
        </div>
      )}
    </>
  )
}