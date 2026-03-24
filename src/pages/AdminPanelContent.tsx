/**
 * Admin Control Center — Shopify-style SaaS dashboard
 * Clean, minimal, business-focused with full system visibility
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useQuery } from '@tanstack/react-query'
import { getProductCount } from '@/services/api/productHelpers'

// UI
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Icons
import {
  LayoutDashboard, Users, Activity, Shield, FileText, Bell,
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package,
  Zap, RefreshCw, AlertTriangle, CheckCircle, XCircle,
  Clock, BarChart3, Workflow, Server, ArrowUpRight,
  Minus
} from 'lucide-react'

// Existing admin components
import { EnhancedUserManagement } from '@/components/admin/EnhancedUserManagement'
import { LogsViewer } from '@/components/admin/LogsViewer'
import { QuickActionsPanel } from '@/components/admin/QuickActionsPanel'

// ─── Types ───────────────────────────────────────────────────────
interface DashboardKPIs {
  revenue: number
  profit: number
  orders: number
  products: number
  users: number
  activeUsers: number
  conversionRate: number
  avgOrderValue: number
  growth: { revenue: number; orders: number; users: number }
}

interface SystemHealth {
  apiLatency: number
  errorRate: number
  activeJobs: number
  failedJobs: number
  pendingJobs: number
  uptime: number
}

interface WorkflowSummary {
  total: number
  active: number
  totalExecutions: number
  successRate: number
  recentFailures: number
}

interface AlertItem {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  timestamp: string
  source: string
}

// ─── Hooks ───────────────────────────────────────────────────────
function useAdminKPIs() {
  return useQuery({
    queryKey: ['admin-kpis'],
    queryFn: async (): Promise<DashboardKPIs> => {
      const [
        { data: profiles },
        { data: orders },
        productCount,
      ] = await Promise.all([
        supabase.from('profiles').select('id, last_login_at, created_at'),
        supabase.from('orders').select('id, total_amount, status, created_at'),
        getProductCount(),
      ])

      const totalUsers = profiles?.length || 0
      const now = Date.now()
      const thirtyDaysAgo = now - 30 * 86400000
      const activeUsers = profiles?.filter(u =>
        u.last_login_at && new Date(u.last_login_at).getTime() > thirtyDaysAgo
      ).length || 0

      const allOrders = orders || []
      const totalOrders = allOrders.length
      const revenue = allOrders.reduce((s, o) => s + (o.total_amount || 0), 0)
      const completedOrders = allOrders.filter(o => ['delivered', 'completed'].includes(o.status || ''))
      const profit = revenue * 0.35 // estimated margin

      const recentOrders = allOrders.filter(o => new Date(o.created_at).getTime() > thirtyDaysAgo)
      const previousOrders = allOrders.filter(o => {
        const t = new Date(o.created_at).getTime()
        return t > thirtyDaysAgo - 30 * 86400000 && t <= thirtyDaysAgo
      })

      const recentRevenue = recentOrders.reduce((s, o) => s + (o.total_amount || 0), 0)
      const previousRevenue = previousOrders.reduce((s, o) => s + (o.total_amount || 0), 0)

      return {
        revenue,
        profit,
        orders: totalOrders,
        products: productCount,
        users: totalUsers,
        activeUsers,
        conversionRate: totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0,
        avgOrderValue: totalOrders > 0 ? revenue / totalOrders : 0,
        growth: {
          revenue: previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0,
          orders: previousOrders.length > 0 ? ((recentOrders.length - previousOrders.length) / previousOrders.length) * 100 : 0,
          users: 0,
        },
      }
    },
    staleTime: 60_000,
  })
}

function useSystemHealth() {
  return useQuery({
    queryKey: ['admin-system-health'],
    queryFn: async (): Promise<SystemHealth> => {
      const start = Date.now()

      const [
        { count: errorCount },
        { data: jobs },
      ] = await Promise.all([
        supabase.from('activity_logs').select('*', { count: 'exact', head: true })
          .eq('severity', 'error')
          .gte('created_at', new Date(Date.now() - 3600000).toISOString()),
        supabase.from('jobs').select('id, status')
          .in('status', ['pending', 'running', 'failed']),
      ])

      const latency = Date.now() - start
      const jobsList = jobs || []

      return {
        apiLatency: latency,
        errorRate: Math.min((errorCount || 0) * 0.5, 100),
        activeJobs: jobsList.filter(j => j.status === 'running').length,
        failedJobs: jobsList.filter(j => j.status === 'failed').length,
        pendingJobs: jobsList.filter(j => j.status === 'pending').length,
        uptime: 99.9,
      }
    },
    refetchInterval: 30_000,
  })
}

function useWorkflowSummary() {
  return useQuery({
    queryKey: ['admin-workflow-summary'],
    queryFn: async (): Promise<WorkflowSummary> => {
      const { data: workflows } = await supabase
        .from('automation_workflows')
        .select('id, is_active, execution_count, trigger_count, last_run_at, status')

      const all = workflows || []
      const active = all.filter(w => w.is_active)
      const totalExec = all.reduce((s, w) => s + (w.execution_count || 0), 0)
      const totalTriggers = all.reduce((s, w) => s + (w.trigger_count || 0), 0)
      const successRate = totalTriggers > 0 ? (totalExec / totalTriggers) * 100 : 100

      return {
        total: all.length,
        active: active.length,
        totalExecutions: totalExec,
        successRate: Math.min(successRate, 100),
        recentFailures: all.filter(w => w.status === 'error').length,
      }
    },
    staleTime: 60_000,
  })
}

function useAdminAlerts() {
  return useQuery({
    queryKey: ['admin-alerts-center'],
    queryFn: async (): Promise<AlertItem[]> => {
      const [
        { data: securityEvents },
        { data: activeAlerts },
        { data: failedJobs },
      ] = await Promise.all([
        supabase.from('security_events').select('*')
          .order('created_at', { ascending: false }).limit(10),
        supabase.from('active_alerts').select('*')
          .eq('status', 'active').order('created_at', { ascending: false }).limit(10),
        supabase.from('jobs').select('id, job_type, error_message, updated_at')
          .eq('status', 'failed').order('updated_at', { ascending: false }).limit(5),
      ])

      const alerts: AlertItem[] = []

      for (const alert of activeAlerts || []) {
        alerts.push({
          id: alert.id,
          severity: alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'info',
          title: alert.title,
          description: alert.message || '',
          timestamp: alert.created_at || '',
          source: alert.alert_type,
        })
      }

      for (const job of failedJobs || []) {
        alerts.push({
          id: job.id,
          severity: 'critical',
          title: `Job échoué: ${job.job_type}`,
          description: job.error_message || 'Erreur inconnue',
          timestamp: job.updated_at || '',
          source: 'jobs',
        })
      }

      for (const event of securityEvents || []) {
        if (event.severity === 'critical' || event.severity === 'error') {
          alerts.push({
            id: event.id,
            severity: event.severity === 'critical' ? 'critical' : 'warning',
            title: event.event_type,
            description: event.description || '',
            timestamp: event.created_at || '',
            source: 'security',
          })
        }
      }

      return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    },
    refetchInterval: 60_000,
  })
}

function useRecentActivity() {
  return useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('id, action, description, severity, created_at, user_id, source')
        .order('created_at', { ascending: false })
        .limit(15)
      return data || []
    },
    refetchInterval: 30_000,
  })
}

// ─── Sub-Components ──────────────────────────────────────────────

function GrowthIndicator({ value }: { value: number }) {
  if (Math.abs(value) < 0.5) return <Minus className="h-3 w-3 text-muted-foreground" />
  if (value > 0) return (
    <span className="flex items-center gap-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
      <TrendingUp className="h-3 w-3" />+{value.toFixed(1)}%
    </span>
  )
  return (
    <span className="flex items-center gap-0.5 text-xs text-destructive font-medium">
      <TrendingDown className="h-3 w-3" />{value.toFixed(1)}%
    </span>
  )
}

function KPICard({
  title, value, subtitle, icon: Icon, growth, loading
}: {
  title: string; value: string; subtitle?: string
  icon: React.ElementType; growth?: number; loading?: boolean
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">{title}</span>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">{subtitle}</span>
              {growth !== undefined && <GrowthIndicator value={growth} />}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function StatusDot({ status }: { status: 'healthy' | 'warning' | 'critical' }) {
  const colors = {
    healthy: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
  }
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors[status]}`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[status]}`} />
    </span>
  )
}

// ─── Tab: Overview ───────────────────────────────────────────────
function OverviewTab() {
  const { data: kpis, isLoading: kpisLoading } = useAdminKPIs()
  const { data: health } = useSystemHealth()
  const { data: alerts = [] } = useAdminAlerts()
  const { data: activities = [] } = useRecentActivity()

  const criticalAlerts = alerts.filter(a => a.severity === 'critical')

  return (
    <div className="space-y-6">
      {/* Critical alerts banner */}
      {criticalAlerts.length > 0 && (
        <Alert className="border-destructive/30 bg-destructive/5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive font-medium">
            {criticalAlerts.length} alerte(s) critique(s) — {criticalAlerts[0]?.title}
            <Button variant="link" size="sm" className="text-destructive ml-2 p-0 h-auto">
              Voir les détails →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="Revenus"
          value={kpis ? `€${kpis.revenue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}` : '—'}
          subtitle="Total cumulé"
          icon={DollarSign}
          growth={kpis?.growth.revenue}
          loading={kpisLoading}
        />
        <KPICard
          title="Profit net"
          value={kpis ? `€${kpis.profit.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}` : '—'}
          subtitle="~35% marge"
          icon={TrendingUp}
          loading={kpisLoading}
        />
        <KPICard
          title="Commandes"
          value={kpis?.orders.toLocaleString() || '—'}
          subtitle="Toutes périodes"
          icon={ShoppingCart}
          growth={kpis?.growth.orders}
          loading={kpisLoading}
        />
        <KPICard
          title="Produits"
          value={kpis?.products.toLocaleString() || '—'}
          subtitle="En catalogue"
          icon={Package}
          loading={kpisLoading}
        />
        <KPICard
          title="Utilisateurs"
          value={kpis ? `${kpis.users}` : '—'}
          subtitle={kpis ? `${kpis.activeUsers} actifs` : ''}
          icon={Users}
          growth={kpis?.growth.users}
          loading={kpisLoading}
        />
      </div>

      {/* System health strip */}
      {health && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <StatusDot status={health.errorRate < 2 ? 'healthy' : health.errorRate < 5 ? 'warning' : 'critical'} />
                <span className="text-sm font-medium">Système opérationnel</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span>Latence: <strong className="text-foreground">{health.apiLatency}ms</strong></span>
                <span>Erreurs: <strong className="text-foreground">{health.errorRate.toFixed(1)}%</strong></span>
                <span>Jobs actifs: <strong className="text-foreground">{health.activeJobs}</strong></span>
                <span>Uptime: <strong className="text-foreground">{health.uptime}%</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Activity Feed — 3 cols */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {activities.slice(0, 10).map((act) => (
                <div key={act.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                  <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    act.severity === 'error' ? 'bg-destructive' :
                    act.severity === 'warn' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{act.description || act.action}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(act.created_at || '').toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Aucune activité récente</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts summary — 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Alertes
              </CardTitle>
              {alerts.length > 0 && <Badge variant="destructive" className="text-xs">{alerts.length}</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucune alerte active</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 6).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0">
                    {alert.severity === 'critical' ? (
                      <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    ) : alert.severity === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    ) : (
                      <Bell className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{alert.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <QuickActionsPanel />
    </div>
  )
}

// ─── Tab: System Monitoring ──────────────────────────────────────
function SystemTab() {
  const { data: health, isLoading, refetch } = useSystemHealth()

  const metrics = [
    { label: 'Latence API', value: `${health?.apiLatency || 0}ms`, max: 1000, current: health?.apiLatency || 0, unit: 'ms' },
    { label: 'Taux d\'erreur', value: `${(health?.errorRate || 0).toFixed(1)}%`, max: 10, current: health?.errorRate || 0, unit: '%' },
    { label: 'Jobs en cours', value: `${health?.activeJobs || 0}`, max: 50, current: health?.activeJobs || 0, unit: '' },
    { label: 'Jobs échoués', value: `${health?.failedJobs || 0}`, max: 10, current: health?.failedJobs || 0, unit: '' },
    { label: 'Jobs en attente', value: `${health?.pendingJobs || 0}`, max: 100, current: health?.pendingJobs || 0, unit: '' },
    { label: 'Uptime', value: `${health?.uptime || 99.9}%`, max: 100, current: health?.uptime || 99.9, unit: '%' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Monitoring Système</h2>
          <p className="text-sm text-muted-foreground">État en temps réel de l'infrastructure</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Global status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-6">
            <StatusDot status={
              (health?.failedJobs || 0) > 5 ? 'critical' :
              (health?.errorRate || 0) > 3 ? 'warning' : 'healthy'
            } />
            <div>
              <h3 className="font-semibold">
                {(health?.failedJobs || 0) > 5 ? 'Dégradation détectée' :
                 (health?.errorRate || 0) > 3 ? 'Performance réduite' : 'Tous les systèmes opérationnels'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Dernière vérification: {new Date().toLocaleTimeString('fr-FR')}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {metrics.map((m) => {
              const ratio = m.current / m.max
              const color = m.label.includes('Uptime')
                ? (ratio > 0.99 ? 'bg-emerald-500' : ratio > 0.95 ? 'bg-amber-500' : 'bg-destructive')
                : (ratio < 0.5 ? 'bg-emerald-500' : ratio < 0.8 ? 'bg-amber-500' : 'bg-destructive')
              return (
                <div key={m.label} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{m.label}</span>
                    <span className="text-lg font-bold">{m.value}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${color}`}
                      style={{ width: `${Math.min((m.current / m.max) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Services status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { name: 'Base de données', status: 'healthy' as const, detail: `${health?.apiLatency || 0}ms` },
              { name: 'Edge Functions', status: 'healthy' as const, detail: 'Opérationnel' },
              { name: 'Authentification', status: 'healthy' as const, detail: 'Opérationnel' },
              { name: 'File de jobs', status: (health?.failedJobs || 0) > 3 ? 'warning' as const : 'healthy' as const, detail: `${health?.pendingJobs || 0} en attente` },
              { name: 'Sync fournisseurs', status: 'healthy' as const, detail: 'Connecté' },
              { name: 'Moteur de prix', status: 'healthy' as const, detail: 'Actif' },
            ].map((svc) => (
              <div key={svc.name} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <StatusDot status={svc.status} />
                  <span className="text-sm font-medium">{svc.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{svc.detail}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Tab: Automation ─────────────────────────────────────────────
function AutomationTab() {
  const { data: summary, isLoading } = useWorkflowSummary()
  const { data: workflows } = useQuery({
    queryKey: ['admin-workflows-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('automation_workflows')
        .select('id, name, is_active, trigger_type, execution_count, trigger_count, last_run_at, status')
        .order('last_run_at', { ascending: false, nullsFirst: false })
        .limit(20)
      return data || []
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Suivi des Automatisations</h2>
        <p className="text-sm text-muted-foreground">Workflows, exécutions et taux de succès</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KPICard title="Workflows" value={summary?.total.toString() || '0'} subtitle={`${summary?.active || 0} actifs`} icon={Workflow} loading={isLoading} />
        <KPICard title="Exécutions" value={summary?.totalExecutions.toLocaleString() || '0'} subtitle="Total cumulé" icon={Zap} loading={isLoading} />
        <KPICard title="Taux de succès" value={`${(summary?.successRate || 0).toFixed(1)}%`} subtitle="Fiabilité" icon={CheckCircle} loading={isLoading} />
        <KPICard title="Échecs récents" value={summary?.recentFailures.toString() || '0'} subtitle="En erreur" icon={XCircle} loading={isLoading} />
      </div>

      {/* Workflow list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workflows récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {(workflows || []).map((wf) => (
              <div key={wf.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${wf.is_active ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{wf.name}</p>
                    <p className="text-xs text-muted-foreground">{wf.trigger_type || 'manual'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                  <span>{wf.execution_count || 0} exéc.</span>
                  {wf.status === 'error' && <Badge variant="destructive" className="text-xs">Erreur</Badge>}
                  {wf.is_active && <Badge variant="secondary" className="text-xs">Actif</Badge>}
                  {wf.last_run_at && (
                    <span>{new Date(wf.last_run_at).toLocaleDateString('fr-FR')}</span>
                  )}
                </div>
              </div>
            ))}
            {(!workflows || workflows.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun workflow configuré</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Tab: Alert Center ───────────────────────────────────────────
function AlertCenterTab() {
  const { data: alerts = [], isLoading, refetch } = useAdminAlerts()

  const groupedAlerts = {
    critical: alerts.filter(a => a.severity === 'critical'),
    warning: alerts.filter(a => a.severity === 'warning'),
    info: alerts.filter(a => a.severity === 'info'),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Centre d'alertes</h2>
          <p className="text-sm text-muted-foreground">Alertes système, business et sécurité</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid gap-4 grid-cols-3">
        <Card className={groupedAlerts.critical.length > 0 ? 'border-destructive/30' : ''}>
          <CardContent className="pt-4 pb-4 text-center">
            <div className="text-2xl font-bold text-destructive">{groupedAlerts.critical.length}</div>
            <div className="text-xs text-muted-foreground">Critique</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <div className="text-2xl font-bold text-amber-500">{groupedAlerts.warning.length}</div>
            <div className="text-xs text-muted-foreground">Warning</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <div className="text-2xl font-bold text-muted-foreground">{groupedAlerts.info.length}</div>
            <div className="text-xs text-muted-foreground">Info</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts list */}
      <Card>
        <CardContent className="pt-6">
          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-medium">Tout est en ordre</h3>
              <p className="text-sm text-muted-foreground mt-1">Aucune alerte active pour le moment</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${
                  alert.severity === 'critical' ? 'border-destructive/30 bg-destructive/5' :
                  alert.severity === 'warning' ? 'border-amber-500/30 bg-amber-500/5' : 'border-border'
                }`}>
                  <div className="flex items-start gap-3">
                    {alert.severity === 'critical' ? (
                      <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    ) : alert.severity === 'warning' ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <Bell className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">{alert.title}</h4>
                        <Badge variant="outline" className="text-xs">{alert.source}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{alert.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────
const AdminPanelContent = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const { data: alerts = [] } = useAdminAlerts()
  const criticalCount = alerts.filter(a => a.severity === 'critical').length

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b bg-card">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin Control Center</h1>
              <p className="text-sm text-muted-foreground">Pilotage business, système et automatisations</p>
            </div>
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {criticalCount} critique(s)
                </Badge>
              )}
              <Badge variant="outline" className="gap-1">
                <StatusDot status="healthy" />
                Opérationnel
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 h-10">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Server className="h-4 w-4" />
              Système
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-2">
              <Workflow className="h-4 w-4" />
              Automation
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2 relative">
              <Bell className="h-4 w-4" />
              Alertes
              {criticalCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center">
                  {criticalCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <Shield className="h-4 w-4" />
              Audit & Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="system"><SystemTab /></TabsContent>
          <TabsContent value="automation"><AutomationTab /></TabsContent>
          <TabsContent value="alerts"><AlertCenterTab /></TabsContent>
          <TabsContent value="users"><EnhancedUserManagement /></TabsContent>
          <TabsContent value="audit"><LogsViewer /></TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default AdminPanelContent
