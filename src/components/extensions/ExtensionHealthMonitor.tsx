import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity, AlertCircle, CheckCircle, RefreshCw, PlayCircle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface HealthMetrics {
  health_status: 'healthy' | 'degraded' | 'critical'
  error_count_24h: number
  critical_errors: number
  active_users_5m: number
  total_events_24h: number
  import_success_rate: number
  last_updated: string
}

interface TestResult {
  name: string
  passed: boolean
  error: string | null
}

export function ExtensionHealthMonitor() {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  const [runningTests, setRunningTests] = useState(false)

  useEffect(() => {
    loadMetrics()
    const interval = setInterval(loadMetrics, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('extension-hub', {
        body: { handler: 'health-monitor', action: 'metrics' }
      })

      if (error) throw error
      setMetrics(data)
    } catch (error) {
      console.error('Failed to load metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const runTests = async () => {
    setRunningTests(true)
    try {
      const { data, error } = await supabase.functions.invoke('extension-hub', {
        body: { handler: 'health-monitor', action: 'run_tests' }
      })

      if (error) throw error
      setTestResults(data.results)
    } catch (error) {
      console.error('Failed to run tests:', error)
    } finally {
      setRunningTests(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500'
      case 'degraded': return 'text-yellow-500'
      case 'critical': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />
      case 'degraded': return <AlertCircle className="h-5 w-5" />
      case 'critical': return <AlertCircle className="h-5 w-5" />
      default: return <Activity className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Monitoring Santé Extension
              </CardTitle>
              <CardDescription>
                Surveillance en temps réel de l'état de l'extension
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMetrics}
                disabled={loading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={runTests}
                disabled={runningTests}
              >
                <PlayCircle className={`mr-2 h-4 w-4 ${runningTests ? 'animate-pulse' : ''}`} />
                Tests Auto
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {metrics && (
            <>
              {/* Status Overview */}
              <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                <div className={getStatusColor(metrics.health_status)}>
                  {getStatusIcon(metrics.health_status)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">
                    État Général : {' '}
                    <Badge 
                      variant={
                        metrics.health_status === 'healthy' ? 'default' :
                        metrics.health_status === 'degraded' ? 'secondary' : 'destructive'
                      }
                    >
                      {metrics.health_status === 'healthy' ? 'Sain' :
                       metrics.health_status === 'degraded' ? 'Dégradé' : 'Critique'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Dernière mise à jour : {new Date(metrics.last_updated).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-background">
                  <div className="text-2xl font-bold">{metrics.active_users_5m}</div>
                  <div className="text-sm text-muted-foreground">Utilisateurs actifs</div>
                  <div className="text-xs text-muted-foreground mt-1">(dernières 5 min)</div>
                </div>

                <div className="p-4 rounded-lg border bg-background">
                  <div className="text-2xl font-bold text-green-600">{metrics.import_success_rate}%</div>
                  <div className="text-sm text-muted-foreground">Taux de succès</div>
                  <div className="text-xs text-muted-foreground mt-1">Imports réussis</div>
                </div>

                <div className="p-4 rounded-lg border bg-background">
                  <div className="text-2xl font-bold">{metrics.total_events_24h}</div>
                  <div className="text-sm text-muted-foreground">Événements</div>
                  <div className="text-xs text-muted-foreground mt-1">(dernières 24h)</div>
                </div>

                <div className="p-4 rounded-lg border bg-background">
                  <div className="text-2xl font-bold text-yellow-600">{metrics.error_count_24h}</div>
                  <div className="text-sm text-muted-foreground">Erreurs totales</div>
                  <div className="text-xs text-muted-foreground mt-1">(dernières 24h)</div>
                </div>

                <div className="p-4 rounded-lg border bg-background">
                  <div className="text-2xl font-bold text-red-600">{metrics.critical_errors}</div>
                  <div className="text-sm text-muted-foreground">Erreurs critiques</div>
                  <div className="text-xs text-muted-foreground mt-1">(dernières 24h)</div>
                </div>

                <div className="p-4 rounded-lg border bg-background">
                  <div className="text-2xl font-bold">
                    {Math.round((metrics.total_events_24h / 24) * 10) / 10}
                  </div>
                  <div className="text-sm text-muted-foreground">Événements/heure</div>
                  <div className="text-xs text-muted-foreground mt-1">Moyenne</div>
                </div>
              </div>
            </>
          )}

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Résultats des Tests Automatisés</h4>
              {testResults.map((test, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {test.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">{test.name}</span>
                  </div>
                  <Badge variant={test.passed ? 'default' : 'destructive'}>
                    {test.passed ? 'Réussi' : 'Échec'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
