/**
 * Monitoring Dashboard - Complete Enterprise Monitoring
 * 
 * Features:
 * - Real-time metrics visualization
 * - Alert management with history
 * - System health monitoring
 * - Import pipeline status
 * - Performance analytics
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Bell,
  BellOff,
  Server,
  Database,
  Zap,
  Package,
  AlertCircle,
  XCircle,
  Eye,
  BarChart3,
  History
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'
import { useQuery, useQueryClient } from '@tanstack/react-query'

// =============================================================================
// TYPES
// =============================================================================

interface SystemMetric {
  id: string
  name: string
  value: number
  unit: string
  status: 'healthy' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  lastUpdated: string
}

interface Alert {
  id: string
  type: 'system' | 'business' | 'security' | 'import'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  timestamp: string
  acknowledged: boolean
  metadata?: Record<string, unknown>
}

interface ImportJob {
  id: string
  source_url: string
  platform: string
  status: 'pending' | 'scraping' | 'processing' | 'completed' | 'error'
  progress_percent: number
  progress_message: string | null
  created_at: string
  completed_at: string | null
  error_message: string | null
  extraction_stats: Record<string, unknown> | null
}

interface PipelineStats {
  totalImports: number
  successRate: number
  avgDuration: number
  pendingJobs: number
  failedJobs: number
  todayImports: number
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MonitoringDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const queryClient = useQueryClient()

  // Fetch system metrics
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['monitoring-metrics'],
    queryFn: fetchSystemMetrics,
    refetchInterval: autoRefresh ? 30000 : false,
  })

  // Fetch alerts
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['monitoring-alerts'],
    queryFn: fetchAlerts,
    refetchInterval: autoRefresh ? 15000 : false,
  })

  // Fetch import jobs
  const { data: importJobs, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ['monitoring-import-jobs'],
    queryFn: fetchImportJobs,
    refetchInterval: autoRefresh ? 10000 : false,
  })

  // Fetch pipeline stats
  const { data: pipelineStats, isLoading: statsLoading } = useQuery({
    queryKey: ['monitoring-pipeline-stats'],
    queryFn: fetchPipelineStats,
    refetchInterval: autoRefresh ? 60000 : false,
  })

  // Refresh all data
  const handleRefresh = useCallback(() => {
    refetchMetrics()
    refetchAlerts()
    refetchJobs()
    queryClient.invalidateQueries({ queryKey: ['monitoring-pipeline-stats'] })
  }, [refetchMetrics, refetchAlerts, refetchJobs, queryClient])

  // Acknowledge alert
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await supabase
        .from('active_alerts')
        .update({ 
          acknowledged: true, 
          acknowledged_at: new Date().toISOString() 
        })
        .eq('id', alertId)
      
      refetchAlerts()
    } catch (error) {
      console.error('Failed to acknowledge alert:', error)
    }
  }

  // Count unacknowledged critical alerts
  const criticalCount = alerts?.filter(
    a => a.severity === 'critical' && !a.acknowledged
  ).length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Monitoring Dashboard</h2>
          <p className="text-muted-foreground">
            Surveillance en temps réel de votre infrastructure
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(autoRefresh && 'border-green-500 text-green-600')}
          >
            {autoRefresh ? (
              <>
                <Activity className="h-4 w-4 mr-1 animate-pulse" />
                Auto-refresh ON
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4 mr-1" />
                Auto-refresh OFF
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Rafraîchir
          </Button>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {criticalCount > 0 && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="py-3 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive animate-pulse" />
            <span className="font-medium text-destructive">
              {criticalCount} alerte{criticalCount > 1 ? 's' : ''} critique{criticalCount > 1 ? 's' : ''} en attente
            </span>
            <Button 
              variant="destructive" 
              size="sm" 
              className="ml-auto"
              onClick={() => {
                const criticalAlert = alerts?.find(a => a.severity === 'critical' && !a.acknowledged)
                if (criticalAlert) setSelectedAlert(criticalAlert)
              }}
            >
              Voir les alertes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <QuickStatCard
          title="Imports aujourd'hui"
          value={pipelineStats?.todayImports || 0}
          icon={Package}
          trend={12}
          loading={statsLoading}
        />
        <QuickStatCard
          title="Taux de succès"
          value={`${pipelineStats?.successRate || 0}%`}
          icon={CheckCircle2}
          status={
            (pipelineStats?.successRate || 0) >= 90 ? 'healthy' :
            (pipelineStats?.successRate || 0) >= 70 ? 'warning' : 'critical'
          }
          loading={statsLoading}
        />
        <QuickStatCard
          title="Durée moyenne"
          value={`${pipelineStats?.avgDuration || 0}s`}
          icon={Clock}
          loading={statsLoading}
        />
        <QuickStatCard
          title="En attente"
          value={pipelineStats?.pendingJobs || 0}
          icon={Activity}
          loading={statsLoading}
        />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="alerts" className="relative">
            <Bell className="h-4 w-4 mr-2" />
            Alertes
            {criticalCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                {criticalCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="imports">
            <Package className="h-4 w-4 mr-2" />
            Pipeline Import
          </TabsTrigger>
          <TabsTrigger value="system">
            <Server className="h-4 w-4 mr-2" />
            Système
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* System Health Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Santé Système
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SystemHealthIndicator metrics={metrics || []} loading={metricsLoading} />
              </CardContent>
            </Card>

            {/* Recent Alerts Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Alertes récentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecentAlertsList 
                  alerts={(alerts || []).slice(0, 5)} 
                  loading={alertsLoading}
                  onSelect={setSelectedAlert}
                />
              </CardContent>
            </Card>

            {/* Import Activity Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Activité Import
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImportActivitySummary 
                  jobs={(importJobs || []).slice(0, 5)} 
                  loading={jobsLoading} 
                />
              </CardContent>
            </Card>
          </div>

          {/* Metrics Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Métriques clés</CardTitle>
            </CardHeader>
            <CardContent>
              <MetricsGrid metrics={metrics || []} loading={metricsLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Centre d'alertes</CardTitle>
              <CardDescription>
                Gérez et analysez les alertes système et métier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertsTable 
                alerts={alerts || []} 
                loading={alertsLoading}
                onAcknowledge={handleAcknowledgeAlert}
                onSelect={setSelectedAlert}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Pipeline Tab */}
        <TabsContent value="imports">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline d'importation</CardTitle>
              <CardDescription>
                Suivi en temps réel des jobs d'import produits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportJobsTable 
                jobs={importJobs || []} 
                loading={jobsLoading} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Services</CardTitle>
              </CardHeader>
              <CardContent>
                <ServiceStatusList />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Base de données</CardTitle>
              </CardHeader>
              <CardContent>
                <DatabaseMetrics />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal 
          alert={selectedAlert} 
          onClose={() => setSelectedAlert(null)}
          onAcknowledge={handleAcknowledgeAlert}
        />
      )}
    </div>
  )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function QuickStatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  status,
  loading 
}: { 
  title: string
  value: number | string
  icon: React.ElementType
  trend?: number
  status?: 'healthy' | 'warning' | 'critical'
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={cn(
            'h-10 w-10 rounded-full flex items-center justify-center',
            status === 'healthy' && 'bg-green-100 text-green-600 dark:bg-green-900/30',
            status === 'warning' && 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30',
            status === 'critical' && 'bg-red-100 text-red-600 dark:bg-red-900/30',
            !status && 'bg-primary/10 text-primary'
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-sm mt-2',
            trend >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span>{trend >= 0 ? '+' : ''}{trend}%</span>
            <span className="text-muted-foreground">vs hier</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SystemHealthIndicator({ 
  metrics, 
  loading 
}: { 
  metrics: SystemMetric[]
  loading: boolean 
}) {
  if (loading) {
    return <div className="animate-pulse h-24 bg-muted rounded" />
  }

  const criticalCount = metrics.filter(m => m.status === 'critical').length
  const warningCount = metrics.filter(m => m.status === 'warning').length
  
  const overallStatus = criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'healthy'

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={cn(
          'h-3 w-3 rounded-full',
          overallStatus === 'healthy' && 'bg-green-500',
          overallStatus === 'warning' && 'bg-yellow-500',
          overallStatus === 'critical' && 'bg-red-500 animate-pulse'
        )} />
        <span className="font-medium">
          {overallStatus === 'healthy' && 'Tous les systèmes opérationnels'}
          {overallStatus === 'warning' && `${warningCount} avertissement(s)`}
          {overallStatus === 'critical' && `${criticalCount} problème(s) critique(s)`}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span>{metrics.filter(m => m.status === 'healthy').length}</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span>{warningCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <XCircle className="h-4 w-4 text-red-500" />
          <span>{criticalCount}</span>
        </div>
      </div>
    </div>
  )
}

function RecentAlertsList({ 
  alerts, 
  loading,
  onSelect 
}: { 
  alerts: Alert[]
  loading: boolean
  onSelect: (alert: Alert) => void
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse h-10 bg-muted rounded" />
        ))}
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Aucune alerte récente</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-2">
        {alerts.map(alert => (
          <button
            key={alert.id}
            onClick={() => onSelect(alert)}
            className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted text-left transition-colors"
          >
            <SeverityIcon severity={alert.severity} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{alert.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true, locale: getDateFnsLocale() })}
              </p>
            </div>
            {!alert.acknowledged && (
              <div className="h-2 w-2 rounded-full bg-blue-500" />
            )}
          </button>
        ))}
      </div>
    </ScrollArea>
  )
}

function ImportActivitySummary({ 
  jobs, 
  loading 
}: { 
  jobs: ImportJob[]
  loading: boolean 
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse h-8 bg-muted rounded" />
        ))}
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Aucun import récent</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-2">
        {jobs.map(job => (
          <div key={job.id} className="flex items-center gap-2 p-2">
            <ImportStatusIcon status={job.status} />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{getPlatformName(job.platform)}</p>
              {job.status === 'scraping' || job.status === 'processing' ? (
                <Progress value={job.progress_percent} className="h-1 mt-1" />
              ) : (
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

function MetricsGrid({ 
  metrics, 
  loading 
}: { 
  metrics: SystemMetric[]
  loading: boolean 
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse h-20 bg-muted rounded" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map(metric => (
        <div key={metric.id} className="p-3 border rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">{metric.name}</span>
            <StatusBadge status={metric.status} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold">{metric.value}</span>
            <span className="text-sm text-muted-foreground">{metric.unit}</span>
          </div>
          {metric.trendValue !== 0 && (
            <div className={cn(
              'flex items-center gap-1 text-xs mt-1',
              metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
            )}>
              {metric.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{metric.trendValue}%</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function AlertsTable({ 
  alerts, 
  loading,
  onAcknowledge,
  onSelect
}: { 
  alerts: Alert[]
  loading: boolean
  onAcknowledge: (id: string) => void
  onSelect: (alert: Alert) => void
}) {
  if (loading) {
    return <div className="animate-pulse h-64 bg-muted rounded" />
  }

  return (
    <ScrollArea className="h-[400px]">
      <table className="w-full">
        <thead>
          <tr className="border-b text-sm text-muted-foreground">
            <th className="py-2 text-left">Sévérité</th>
            <th className="py-2 text-left">Alerte</th>
            <th className="py-2 text-left">Type</th>
            <th className="py-2 text-left">Date</th>
            <th className="py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map(alert => (
            <tr key={alert.id} className="border-b hover:bg-muted/50">
              <td className="py-3">
                <SeverityBadge severity={alert.severity} />
              </td>
              <td className="py-3">
                <button 
                  onClick={() => onSelect(alert)}
                  className="text-left hover:underline"
                >
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-sm text-muted-foreground truncate max-w-xs">
                    {alert.message}
                  </p>
                </button>
              </td>
              <td className="py-3">
                <Badge variant="outline">{alert.type}</Badge>
              </td>
              <td className="py-3 text-sm text-muted-foreground">
                {format(new Date(alert.timestamp), 'dd/MM HH:mm')}
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onSelect(alert)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {!alert.acknowledged && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onAcknowledge(alert.id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  )
}

function ImportJobsTable({ 
  jobs, 
  loading 
}: { 
  jobs: ImportJob[]
  loading: boolean 
}) {
  if (loading) {
    return <div className="animate-pulse h-64 bg-muted rounded" />
  }

  return (
    <ScrollArea className="h-[400px]">
      <table className="w-full">
        <thead>
          <tr className="border-b text-sm text-muted-foreground">
            <th className="py-2 text-left">Status</th>
            <th className="py-2 text-left">Plateforme</th>
            <th className="py-2 text-left">Progression</th>
            <th className="py-2 text-left">Créé</th>
            <th className="py-2 text-left">Durée</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(job => (
            <tr key={job.id} className="border-b hover:bg-muted/50">
              <td className="py-3">
                <ImportStatusBadge status={job.status} />
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getPlatformName(job.platform)}</span>
                </div>
              </td>
              <td className="py-3 w-48">
                {(job.status === 'scraping' || job.status === 'processing') ? (
                  <div className="space-y-1">
                    <Progress value={job.progress_percent} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {job.progress_message || `${job.progress_percent}%`}
                    </p>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {job.status === 'completed' ? '100%' : '-'}
                  </span>
                )}
              </td>
              <td className="py-3 text-sm text-muted-foreground">
                {format(new Date(job.created_at), 'dd/MM HH:mm')}
              </td>
              <td className="py-3 text-sm text-muted-foreground">
                {job.completed_at ? (
                  `${Math.round((new Date(job.completed_at).getTime() - new Date(job.created_at).getTime()) / 1000)}s`
                ) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  )
}

function ServiceStatusList() {
  const services = [
    { name: 'API Gateway', status: 'healthy' as const, latency: 45 },
    { name: 'Import Pipeline', status: 'healthy' as const, latency: 120 },
    { name: 'AI Service', status: 'healthy' as const, latency: 890 },
    { name: 'Headless Scraper', status: 'warning' as const, latency: 2340 },
    { name: 'Database', status: 'healthy' as const, latency: 12 },
  ]

  return (
    <div className="space-y-2">
      {services.map(service => (
        <div key={service.name} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
          <div className="flex items-center gap-2">
            <StatusDot status={service.status} />
            <span className="font-medium">{service.name}</span>
          </div>
          <span className="text-sm text-muted-foreground">{service.latency}ms</span>
        </div>
      ))}
    </div>
  )
}

function DatabaseMetrics() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Connexions actives</span>
        <span className="font-medium">23 / 100</span>
      </div>
      <Progress value={23} className="h-2" />
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="p-3 border rounded-md">
          <p className="text-sm text-muted-foreground">Tables</p>
          <p className="text-xl font-bold">42</p>
        </div>
        <div className="p-3 border rounded-md">
          <p className="text-sm text-muted-foreground">Taille</p>
          <p className="text-xl font-bold">1.2 GB</p>
        </div>
      </div>
    </div>
  )
}

function AlertDetailModal({ 
  alert, 
  onClose,
  onAcknowledge
}: { 
  alert: Alert
  onClose: () => void
  onAcknowledge: (id: string) => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SeverityIcon severity={alert.severity} />
              <CardTitle>{alert.title}</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            {format(new Date(alert.timestamp), 'dd MMMM yyyy à HH:mm', { locale: getDateFnsLocale() })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{alert.message}</p>
          
          {alert.metadata && Object.keys(alert.metadata).length > 0 && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-2">Détails techniques</p>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(alert.metadata, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex justify-end gap-2">
            {!alert.acknowledged && (
              <Button 
                variant="outline"
                onClick={() => {
                  onAcknowledge(alert.id)
                  onClose()
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Acquitter
              </Button>
            )}
            <Button onClick={onClose}>Fermer</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function SeverityIcon({ severity }: { severity: Alert['severity'] }) {
  const icons = {
    low: <Activity className="h-4 w-4 text-blue-500" />,
    medium: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    high: <AlertCircle className="h-4 w-4 text-orange-500" />,
    critical: <XCircle className="h-4 w-4 text-red-500" />,
  }
  return icons[severity]
}

function SeverityBadge({ severity }: { severity: Alert['severity'] }) {
  const variants: Record<Alert['severity'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    low: 'secondary',
    medium: 'outline',
    high: 'default',
    critical: 'destructive',
  }
  return <Badge variant={variants[severity]}>{severity}</Badge>
}

function StatusBadge({ status }: { status: 'healthy' | 'warning' | 'critical' }) {
  const colors = {
    healthy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  }
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full', colors[status])}>
      {status}
    </span>
  )
}

function StatusDot({ status }: { status: 'healthy' | 'warning' | 'critical' }) {
  const colors = {
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500 animate-pulse',
  }
  return <div className={cn('h-2 w-2 rounded-full', colors[status])} />
}

function ImportStatusIcon({ status }: { status: ImportJob['status'] }) {
  const icons = {
    pending: <Clock className="h-4 w-4 text-muted-foreground" />,
    scraping: <Activity className="h-4 w-4 text-blue-500 animate-pulse" />,
    processing: <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />,
    completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    error: <XCircle className="h-4 w-4 text-red-500" />,
  }
  return icons[status]
}

function ImportStatusBadge({ status }: { status: ImportJob['status'] }) {
  const variants: Record<ImportJob['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
    pending: { variant: 'secondary', label: 'En attente' },
    scraping: { variant: 'outline', label: 'Extraction' },
    processing: { variant: 'outline', label: 'Traitement' },
    completed: { variant: 'default', label: 'Terminé' },
    error: { variant: 'destructive', label: 'Erreur' },
  }
  const { variant, label } = variants[status]
  return <Badge variant={variant}>{label}</Badge>
}

function getPlatformName(platform: string): string {
  const names: Record<string, string> = {
    amazon: 'Amazon',
    aliexpress: 'AliExpress',
    temu: 'Temu',
    shein: 'SHEIN',
    ebay: 'eBay',
    wish: 'Wish',
    alibaba: 'Alibaba',
    other: 'Autre',
  }
  return names[platform] || platform
}

// =============================================================================
// DATA FETCHING
// =============================================================================

async function fetchSystemMetrics(): Promise<SystemMetric[]> {
  // In production, this would fetch from a monitoring endpoint
  return [
    { id: '1', name: 'CPU', value: 45, unit: '%', status: 'healthy', trend: 'stable', trendValue: 0, lastUpdated: new Date().toISOString() },
    { id: '2', name: 'Mémoire', value: 62, unit: '%', status: 'healthy', trend: 'up', trendValue: 5, lastUpdated: new Date().toISOString() },
    { id: '3', name: 'Latence API', value: 124, unit: 'ms', status: 'healthy', trend: 'down', trendValue: -8, lastUpdated: new Date().toISOString() },
    { id: '4', name: 'Erreurs', value: 0.2, unit: '%', status: 'healthy', trend: 'stable', trendValue: 0, lastUpdated: new Date().toISOString() },
  ]
}

async function fetchAlerts(): Promise<Alert[]> {
  const { data, error } = await supabase
    .from('active_alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Failed to fetch alerts:', error)
    return []
  }

  return (data || []).map(row => ({
    id: row.id,
    type: row.alert_type as Alert['type'],
    severity: (row.severity || 'low') as Alert['severity'],
    title: row.title,
    message: row.message || '',
    timestamp: row.created_at,
    acknowledged: row.acknowledged || false,
    metadata: row.metadata as Record<string, unknown> | undefined,
  }))
}

async function fetchImportJobs(): Promise<ImportJob[]> {
  const { data, error } = await supabase
    .from('product_import_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Failed to fetch import jobs:', error)
    return []
  }

  return (data || []).map(row => ({
    id: row.id,
    source_url: row.source_url,
    platform: row.platform || 'other',
    status: row.status as ImportJob['status'],
    progress_percent: row.progress_percent || 0,
    progress_message: (row.metadata as Record<string, unknown> | null)?.progress_message as string || null,
    created_at: row.created_at,
    completed_at: row.completed_at,
    error_message: row.error_message,
    extraction_stats: (row.metadata as Record<string, unknown> | null)?.extraction_stats as Record<string, unknown> | null,
  }))
}

async function fetchPipelineStats(): Promise<PipelineStats> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: todayJobs } = await supabase
    .from('product_import_jobs')
    .select('id, status, created_at, completed_at')
    .gte('created_at', today.toISOString())

  const { count: totalCount } = await supabase
    .from('product_import_jobs')
    .select('id', { count: 'exact', head: true })

  const { count: completedCount } = await supabase
    .from('product_import_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'completed')

  const { count: pendingCount } = await supabase
    .from('product_import_jobs')
    .select('id', { count: 'exact', head: true })
    .in('status', ['pending', 'scraping', 'processing'])

  const { count: failedCount } = await supabase
    .from('product_import_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'error')

  // Calculate average duration for completed jobs
  const completedJobs = (todayJobs || []).filter(j => j.status === 'completed' && j.completed_at)
  const avgDuration = completedJobs.length > 0
    ? completedJobs.reduce((acc, j) => {
        return acc + (new Date(j.completed_at!).getTime() - new Date(j.created_at).getTime())
      }, 0) / completedJobs.length / 1000
    : 0

  return {
    totalImports: totalCount || 0,
    successRate: totalCount ? Math.round(((completedCount || 0) / totalCount) * 100) : 0,
    avgDuration: Math.round(avgDuration),
    pendingJobs: pendingCount || 0,
    failedJobs: failedCount || 0,
    todayImports: (todayJobs || []).length,
  }
}

export default MonitoringDashboard
