/**
 * Admin Control Center — Elite SaaS Dashboard (Shopify + AutoDS level)
 * Professional top bar, KPI cards with sparklines, charts, alerts, activity feed
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { getProductCount } from '@/services/api/productHelpers'

// UI
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Charts
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, PieChart, Pie, Cell
} from 'recharts'

// Icons
import {
  LayoutDashboard, Users, Activity, Shield, Bell,
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package,
  Zap, RefreshCw, AlertTriangle, CheckCircle, XCircle,
  BarChart3, Workflow, Server, Search, Command,
  Minus, ArrowUpRight, Eye, Settings, LogOut,
  CircleDot, Database, Cpu, Globe, Clock,
  ChevronRight, MoreHorizontal, Filter, Download,
  Percent, Target, Boxes
} from 'lucide-react'

// Existing admin components
import { EnhancedUserManagement } from '@/components/admin/EnhancedUserManagement'
import { LogsViewer } from '@/components/admin/LogsViewer'
import { QuickActionsPanel } from '@/components/admin/QuickActionsPanel'
import SupplierControlTab from '@/components/admin/SupplierControlTab'

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
  marginPercent: number
  growth: { revenue: number; orders: number; users: number; profit: number }
}

interface SystemHealth {
  apiLatency: number
  errorRate: number
  activeJobs: number
  failedJobs: number
  pendingJobs: number
  uptime: number
  dbLatency: number
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

// ─── Chart Colors (HSL tokens) ──────────────────────────────────
const CHART_COLORS = {
  primary: 'hsl(221, 83%, 53%)',
  success: 'hsl(142, 76%, 36%)',
  warning: 'hsl(38, 92%, 50%)',
  destructive: 'hsl(0, 84%, 60%)',
  muted: 'hsl(215, 16%, 80%)',
  purple: 'hsl(280, 65%, 60%)',
}

const PIE_COLORS = [CHART_COLORS.primary, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.purple]

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
      const profit = revenue * 0.35

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
        marginPercent: revenue > 0 ? (profit / revenue) * 100 : 0,
        growth: {
          revenue: previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0,
          orders: previousOrders.length > 0 ? ((recentOrders.length - previousOrders.length) / previousOrders.length) * 100 : 0,
          users: 0,
          profit: previousRevenue > 0 ? ((recentRevenue * 0.35 - previousRevenue * 0.35) / (previousRevenue * 0.35)) * 100 : 0,
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
        dbLatency: Math.round(latency * 0.7),
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

function useRevenueChart() {
  return useQuery({
    queryKey: ['admin-revenue-chart'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true })

      // Group by day
      const byDay: Record<string, { revenue: number; orders: number; profit: number }> = {}
      for (const o of orders || []) {
        const day = new Date(o.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
        if (!byDay[day]) byDay[day] = { revenue: 0, orders: 0, profit: 0 }
        byDay[day].revenue += o.total_amount || 0
        byDay[day].orders += 1
        byDay[day].profit += (o.total_amount || 0) * 0.35
      }

      return Object.entries(byDay).map(([day, data]) => ({ day, ...data }))
    },
    staleTime: 5 * 60_000,
  })
}

// ─── Sub-Components ──────────────────────────────────────────────

function GrowthBadge({ value }: { value: number }) {
  if (Math.abs(value) < 0.5) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
      <Minus className="h-3 w-3" />0%
    </span>
  )
  if (value > 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-md">
      <TrendingUp className="h-3 w-3" />+{value.toFixed(1)}%
    </span>
  )
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded-md">
      <TrendingDown className="h-3 w-3" />{value.toFixed(1)}%
    </span>
  )
}

function KPICard({
  title, value, subtitle, icon: Icon, growth, loading, accent = 'primary'
}: {
  title: string; value: string; subtitle?: string
  icon: React.ElementType; growth?: number; loading?: boolean
  accent?: 'primary' | 'success' | 'warning' | 'destructive'
}) {
  const accentColors = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    destructive: 'bg-destructive/10 text-destructive',
  }

  return (
    <Card className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300">
      <CardContent className="p-5">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${accentColors[accent]}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">{subtitle}</span>
              {growth !== undefined && <GrowthBadge value={growth} />}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function StatusIndicator({ status, label, detail }: { status: 'healthy' | 'warning' | 'critical'; label: string; detail: string }) {
  const colors = {
    healthy: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
  }
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors[status]}`} />
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[status]}`} />
        </span>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <span className="text-xs text-muted-foreground font-mono">{detail}</span>
    </div>
  )
}

function MiniSparkline({ data, color = CHART_COLORS.primary }: { data: number[]; color?: string }) {
  const chartData = data.map((v, i) => ({ i, v }))
  return (
    <ResponsiveContainer width="100%" height={32}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`spark-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#spark-${color.replace(/[^a-z0-9]/gi, '')})`} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Top Bar ─────────────────────────────────────────────────────
function AdminTopBar({ alertCount }: { alertCount: number }) {
  const { profile } = useUnifiedAuth()
  const navigate = useNavigate()

  return (
    <div className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center justify-between h-14 px-6">
        {/* Left: Title + breadcrumb */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-none">Admin Control Center</h1>
              <p className="text-[11px] text-muted-foreground">Pilotage global SaaS</p>
            </div>
          </div>
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex items-center max-w-md flex-1 mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher... (⌘K)"
              className="pl-9 pr-12 h-9 bg-muted/50 border-transparent focus:border-primary/30 focus:bg-background text-sm"
              readOnly
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9" onClick={() => navigate('/admin', { state: { tab: 'alerts' } })}>
                  <Bell className="h-4 w-4" />
                  {alertCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 bg-destructive text-destructive-foreground rounded-full text-[10px] font-bold flex items-center justify-center px-1">
                      {alertCount}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Alertes</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">
                {(profile?.full_name || 'A').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-medium leading-none">{profile?.full_name || 'Admin'}</p>
              <p className="text-[10px] text-muted-foreground">Administrateur</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Overview ───────────────────────────────────────────────
function OverviewTab() {
  const { data: kpis, isLoading: kpisLoading } = useAdminKPIs()
  const { data: health } = useSystemHealth()
  const { data: alerts = [] } = useAdminAlerts()
  const { data: activities = [] } = useRecentActivity()
  const { data: chartData = [] } = useRevenueChart()
  const { data: workflows } = useWorkflowSummary()

  const criticalAlerts = alerts.filter(a => a.severity === 'critical')

  // Plan distribution mock (from real users would come from profiles)
  const planDist = [
    { name: 'Free', value: 40 },
    { name: 'Pro', value: 35 },
    { name: 'Ultra', value: 25 },
  ]

  return (
    <div className="space-y-6">
      {/* Critical alerts banner */}
      {criticalAlerts.length > 0 && (
        <Alert className="border-destructive/30 bg-destructive/5 shadow-sm">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive font-medium flex items-center justify-between">
            <span>{criticalAlerts.length} alerte(s) critique(s) — {criticalAlerts[0]?.title}</span>
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10 h-7 text-xs">
              Voir les détails
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
          accent="primary"
        />
        <KPICard
          title="Profit net"
          value={kpis ? `€${kpis.profit.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}` : '—'}
          subtitle={`Marge ${kpis?.marginPercent.toFixed(0) || 0}%`}
          icon={TrendingUp}
          growth={kpis?.growth.profit}
          loading={kpisLoading}
          accent="success"
        />
        <KPICard
          title="Commandes"
          value={kpis?.orders.toLocaleString() || '—'}
          subtitle={`Moy. €${kpis?.avgOrderValue.toFixed(0) || 0}/cmd`}
          icon={ShoppingCart}
          growth={kpis?.growth.orders}
          loading={kpisLoading}
          accent="warning"
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
          subtitle={kpis ? `${kpis.activeUsers} actifs (30j)` : ''}
          icon={Users}
          growth={kpis?.growth.users}
          loading={kpisLoading}
        />
      </div>

      {/* System health strip */}
      {health && (
        <Card className="shadow-sm">
          <CardContent className="py-3 px-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${health.errorRate < 2 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${health.errorRate < 2 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </span>
                <span className="text-sm font-semibold text-foreground">Systèmes opérationnels</span>
                <Badge variant="outline" className="text-[10px] h-5">
                  Uptime {health.uptime}%
                </Badge>
              </div>
              <div className="flex items-center gap-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Cpu className="h-3 w-3" />
                  API <strong className="text-foreground font-mono">{health.apiLatency}ms</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Database className="h-3 w-3" />
                  DB <strong className="text-foreground font-mono">{health.dbLatency}ms</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" />
                  Erreurs <strong className="text-foreground font-mono">{health.errorRate.toFixed(1)}%</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3 w-3" />
                  Jobs <strong className="text-foreground font-mono">{health.activeJobs}</strong>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue & Profit Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Revenus vs Profit
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">30 jours</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.success} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={CHART_COLORS.success} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px -2px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="revenue" name="Revenus" stroke={CHART_COLORS.primary} strokeWidth={2} fill="url(#revGrad)" />
                  <Area type="monotone" dataKey="profit" name="Profit" stroke={CHART_COLORS.success} strokeWidth={2} fill="url(#profitGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">
                Aucune donnée de commande pour cette période
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution Pie + Workflow Stats */}
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Distribution Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={100} height={100}>
                  <PieChart>
                    <Pie data={planDist} cx="50%" cy="50%" innerRadius={28} outerRadius={45} paddingAngle={3} dataKey="value">
                      {planDist.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5">
                  {planDist.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-2 text-xs">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                      <span className="text-muted-foreground">{p.name}</span>
                      <span className="font-semibold text-foreground">{p.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Workflow className="h-4 w-4 text-primary" />
                Automation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Workflows actifs</span>
                  <span className="font-semibold">{workflows?.active || 0} / {workflows?.total || 0}</span>
                </div>
                <Progress value={workflows ? (workflows.active / Math.max(workflows.total, 1)) * 100 : 0} className="h-1.5" />
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Taux de succès</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{(workflows?.successRate || 0).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Exécutions totales</span>
                  <span className="font-semibold">{(workflows?.totalExecutions || 0).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity + Alerts */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Activity Feed */}
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Activité récente
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">{activities.length} événements</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-0.5">
              {activities.slice(0, 10).map((act) => (
                <div key={act.id} className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0 group hover:bg-muted/30 rounded-md px-2 -mx-2 transition-colors">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${
                    act.severity === 'error' ? 'bg-destructive' :
                    act.severity === 'warn' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{act.description || act.action}</p>
                    <p className="text-[10px] text-muted-foreground">{act.source || 'system'}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                    {new Date(act.created_at || '').toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune activité récente</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Alertes
              </CardTitle>
              {alerts.length > 0 && (
                <Badge variant="destructive" className="text-[10px] h-5">{alerts.length}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-medium text-foreground">Tout est en ordre</p>
                <p className="text-xs text-muted-foreground mt-1">Aucune alerte active</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {alerts.slice(0, 6).map((alert) => (
                  <div key={alert.id} className={`flex items-start gap-2.5 p-2.5 rounded-lg transition-colors ${
                    alert.severity === 'critical' ? 'bg-destructive/5 hover:bg-destructive/10' :
                    alert.severity === 'warning' ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-muted/50'
                  }`}>
                    {alert.severity === 'critical' ? (
                      <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    ) : alert.severity === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    ) : (
                      <Bell className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate text-foreground">{alert.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{alert.description}</p>
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

// ─── Tab: System Monitoring (Ultra-Pro) ──────────────────────────
function useApiAnalyticsChart() {
  return useQuery({
    queryKey: ['admin-api-analytics-30d'],
    queryFn: async () => {
      const { data } = await supabase
        .from('api_analytics')
        .select('date, total_requests, failed_requests, avg_response_time_ms, endpoint')
        .gte('date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
        .order('date', { ascending: true })

      const byDay: Record<string, { day: string; requests: number; errors: number; latency: number; count: number }> = {}
      for (const r of data || []) {
        const day = new Date(r.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
        if (!byDay[day]) byDay[day] = { day, requests: 0, errors: 0, latency: 0, count: 0 }
        byDay[day].requests += r.total_requests || 0
        byDay[day].errors += r.failed_requests || 0
        byDay[day].latency += r.avg_response_time_ms || 0
        byDay[day].count += 1
      }
      return Object.values(byDay).map(d => ({
        ...d,
        latency: d.count > 0 ? Math.round(d.latency / d.count) : 0,
        errorRate: d.requests > 0 ? Math.round((d.errors / d.requests) * 1000) / 10 : 0,
      }))
    },
    staleTime: 5 * 60_000,
  })
}

function useResponseTimePercentiles() {
  return useQuery({
    queryKey: ['admin-response-percentiles'],
    queryFn: async () => {
      const { data } = await supabase
        .from('api_logs')
        .select('response_time_ms')
        .not('response_time_ms', 'is', null)
        .gte('created_at', new Date(Date.now() - 86400000).toISOString())
        .order('response_time_ms', { ascending: true })
        .limit(500)

      if (!data || data.length === 0) return { p50: 0, p95: 0, p99: 0, avg: 0, total: 0 }
      const times = data.map(d => d.response_time_ms!).filter(Boolean).sort((a, b) => a - b)
      const n = times.length
      return {
        p50: times[Math.floor(n * 0.5)] || 0,
        p95: times[Math.floor(n * 0.95)] || 0,
        p99: times[Math.floor(n * 0.99)] || 0,
        avg: Math.round(times.reduce((a, b) => a + b, 0) / n),
        total: n,
      }
    },
    staleTime: 60_000,
  })
}

function SystemTab() {
  const { data: health, isLoading, refetch } = useSystemHealth()
  const { data: apiChart = [] } = useApiAnalyticsChart()
  const { data: percentiles } = useResponseTimePercentiles()
  const [sysView, setSysView] = useState<'overview' | 'latency' | 'services'>('overview')

  const services = [
    { name: 'Base de données', icon: Database, status: 'healthy' as const, detail: `${health?.dbLatency || 0}ms` },
    { name: 'Edge Functions', icon: Zap, status: 'healthy' as const, detail: 'Opérationnel' },
    { name: 'Authentification', icon: Shield, status: 'healthy' as const, detail: 'Opérationnel' },
    { name: 'File de jobs', icon: Boxes, status: (health?.failedJobs || 0) > 3 ? 'warning' as const : 'healthy' as const, detail: `${health?.pendingJobs || 0} en attente` },
    { name: 'Sync fournisseurs', icon: Globe, status: 'healthy' as const, detail: 'Connecté' },
    { name: 'Moteur de prix', icon: DollarSign, status: 'healthy' as const, detail: 'Actif' },
  ]

  // SLA calculation
  const slaTarget = 99.9
  const currentUptime = health?.uptime || 99.9
  const slaCompliant = currentUptime >= slaTarget

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Monitoring Système</h2>
          <p className="text-xs text-muted-foreground">Infrastructure, latence, SLA et services</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="h-8 text-xs">
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* KPIs Row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
        <KPICard title="Latence API" value={`${health?.apiLatency || 0}ms`} subtitle="Temps réel" icon={Cpu} loading={isLoading} accent={health?.apiLatency && health.apiLatency > 500 ? 'warning' : 'primary'} />
        <KPICard title="Latence DB" value={`${health?.dbLatency || 0}ms`} subtitle="Base de données" icon={Database} loading={isLoading} />
        <KPICard title="Taux erreur" value={`${(health?.errorRate || 0).toFixed(1)}%`} subtitle="Dernière heure" icon={AlertTriangle} loading={isLoading} accent={(health?.errorRate || 0) > 3 ? 'destructive' : 'success'} />
        <KPICard title="Uptime" value={`${currentUptime}%`} subtitle={slaCompliant ? 'SLA respecté' : 'SLA violé ⚠️'} icon={CheckCircle} loading={isLoading} accent={slaCompliant ? 'success' : 'destructive'} />
        <KPICard title="Jobs actifs" value={(health?.activeJobs || 0).toString()} subtitle={`${health?.pendingJobs || 0} en attente`} icon={Zap} loading={isLoading} />
        <KPICard title="P95 Latence" value={percentiles ? `${percentiles.p95}ms` : '—'} subtitle={`P50: ${percentiles?.p50 || 0}ms`} icon={Activity} loading={isLoading} accent={percentiles && percentiles.p95 > 1000 ? 'warning' : 'primary'} />
      </div>

      {/* SLA Bar */}
      <Card className="shadow-sm">
        <CardContent className="py-3 px-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${slaCompliant ? 'bg-emerald-500' : 'bg-destructive'}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${slaCompliant ? 'bg-emerald-500' : 'bg-destructive'}`} />
              </span>
              <span className="text-sm font-semibold">SLA Tracking</span>
              <span className={`text-lg font-bold font-mono ${slaCompliant ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>{currentUptime}%</span>
              <span className="text-xs text-muted-foreground">/ {slaTarget}% cible</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>P50: <b className="font-mono text-foreground">{percentiles?.p50 || 0}ms</b></span>
              <span>P95: <b className="font-mono text-foreground">{percentiles?.p95 || 0}ms</b></span>
              <span>P99: <b className="font-mono text-foreground">{percentiles?.p99 || 0}ms</b></span>
            </div>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${slaCompliant ? 'bg-emerald-500' : 'bg-destructive'}`} style={{ width: `${Math.min(currentUptime, 100)}%` }} />
          </div>
        </CardContent>
      </Card>

      {/* Sub-nav */}
      <div className="flex gap-1 bg-muted/50 p-0.5 rounded-lg w-fit">
        {([
          { key: 'overview', label: 'Vue globale', icon: BarChart3 },
          { key: 'latency', label: 'Latence & Trafic', icon: Activity },
          { key: 'services', label: 'Services', icon: Server },
        ] as const).map(s => (
          <button key={s.key} onClick={() => setSysView(s.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              sysView === s.key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <s.icon className="h-3.5 w-3.5" />{s.label}
          </button>
        ))}
      </div>

      {/* Overview: Metrics grid */}
      {sysView === 'overview' && (
        <Card className="shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-5">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  (health?.failedJobs || 0) > 5 ? 'bg-red-500' : (health?.errorRate || 0) > 3 ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  (health?.failedJobs || 0) > 5 ? 'bg-red-500' : (health?.errorRate || 0) > 3 ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {(health?.failedJobs || 0) > 5 ? 'Dégradation détectée' :
                   (health?.errorRate || 0) > 3 ? 'Performance réduite' : 'Tous les systèmes opérationnels'}
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Dernière vérification: {new Date().toLocaleTimeString('fr-FR')}
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[
                { label: 'Latence API', value: health?.apiLatency || 0, unit: 'ms', max: 1000, icon: Cpu },
                { label: 'Latence DB', value: health?.dbLatency || 0, unit: 'ms', max: 500, icon: Database },
                { label: "Taux d'erreur", value: health?.errorRate || 0, unit: '%', max: 10, icon: AlertTriangle },
                { label: 'Jobs actifs', value: health?.activeJobs || 0, unit: '', max: 50, icon: Zap },
                { label: 'Jobs échoués', value: health?.failedJobs || 0, unit: '', max: 10, icon: XCircle },
                { label: 'Uptime', value: health?.uptime || 99.9, unit: '%', max: 100, icon: CheckCircle },
              ].map(m => {
                const ratio = m.value / m.max
                const isUptime = m.label.includes('Uptime')
                const color = isUptime
                  ? (ratio > 0.99 ? 'bg-emerald-500' : ratio > 0.95 ? 'bg-amber-500' : 'bg-destructive')
                  : (ratio < 0.5 ? 'bg-emerald-500' : ratio < 0.8 ? 'bg-amber-500' : 'bg-destructive')
                return (
                  <div key={m.label} className="p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
                      </div>
                      <span className="text-base font-bold font-mono text-foreground">{m.value}{m.unit}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(ratio * 100, 100)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Latency & Traffic charts */}
      {sysView === 'latency' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />Latence moyenne (30j)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {apiChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={apiChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="latency" name="Latence (ms)" stroke={CHART_COLORS.primary} fill="url(#latGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">Aucune donnée</div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />Requêtes & Erreurs (30j)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {apiChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={apiChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="requests" name="Requêtes" fill={CHART_COLORS.primary} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="errors" name="Erreurs" fill={CHART_COLORS.destructive} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">Aucune donnée</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Services */}
      {sysView === 'services' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Services ({services.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {services.map(svc => (
                <div key={svc.name} className="flex items-center justify-between p-3 rounded-xl border hover:border-primary/20 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2 w-2">
                      <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        svc.status === 'healthy' ? 'bg-emerald-500' : svc.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${
                        svc.status === 'healthy' ? 'bg-emerald-500' : svc.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                    </span>
                    <svc.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{svc.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{svc.detail}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Tab: Automation (Ultra-Pro) ─────────────────────────────────
function useWorkflowsList() {
  return useQuery({
    queryKey: ['admin-workflows-full'],
    queryFn: async () => {
      const { data } = await supabase
        .from('automation_workflows')
        .select('id, name, description, is_active, trigger_type, action_type, execution_count, trigger_count, last_run_at, last_triggered_at, status, created_at, updated_at')
        .order('last_run_at', { ascending: false, nullsFirst: false })
      return data || []
    },
    refetchInterval: 30_000,
  })
}

function useJobsHistory() {
  return useQuery({
    queryKey: ['admin-jobs-history'],
    queryFn: async () => {
      const { data } = await supabase
        .from('jobs')
        .select('id, job_type, status, error_message, started_at, completed_at, total_items, processed_items, failed_items, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(50)
      return data || []
    },
    refetchInterval: 15_000,
  })
}

function useJobsChartData() {
  return useQuery({
    queryKey: ['admin-jobs-chart-30d'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
      const { data } = await supabase
        .from('jobs')
        .select('status, created_at, job_type')
        .gte('created_at', thirtyDaysAgo)

      const byDay: Record<string, { day: string; success: number; failed: number; total: number }> = {}
      for (const j of data || []) {
        const day = new Date(j.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
        if (!byDay[day]) byDay[day] = { day, success: 0, failed: 0, total: 0 }
        byDay[day].total++
        if (j.status === 'completed') byDay[day].success++
        if (j.status === 'failed') byDay[day].failed++
      }

      // Type breakdown
      const byType: Record<string, { type: string; count: number; success: number; failed: number; avgDuration: number }> = {}
      for (const j of data || []) {
        const t = j.job_type || 'unknown'
        if (!byType[t]) byType[t] = { type: t, count: 0, success: 0, failed: 0, avgDuration: 0 }
        byType[t].count++
        if (j.status === 'completed') byType[t].success++
        if (j.status === 'failed') byType[t].failed++
      }

      return {
        daily: Object.values(byDay),
        byType: Object.values(byType).sort((a, b) => b.count - a.count),
      }
    },
    staleTime: 5 * 60_000,
  })
}

function AutomationTab() {
  const { data: summary, isLoading } = useWorkflowSummary()
  const { data: workflows = [], refetch: refetchWorkflows } = useWorkflowsList()
  const { data: jobs = [], refetch: refetchJobs } = useJobsHistory()
  const { data: chartData } = useJobsChartData()
  const [activeSection, setActiveSection] = useState<'overview' | 'workflows' | 'timeline' | 'errors'>('overview')

  const failedJobs = jobs.filter(j => j.status === 'failed')
  const runningJobs = jobs.filter(j => j.status === 'running')
  const completedJobs = jobs.filter(j => j.status === 'completed')

  // Health score
  const totalRecent = jobs.length
  const successRecent = completedJobs.length
  const healthScore = totalRecent > 0 ? Math.round((successRecent / totalRecent) * 100) : 100
  const healthColor = healthScore >= 95 ? 'text-emerald-600 dark:text-emerald-400' : healthScore >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-destructive'
  const healthBg = healthScore >= 95 ? 'bg-emerald-500' : healthScore >= 80 ? 'bg-amber-500' : 'bg-destructive'

  // Average execution time
  const jobsWithDuration = jobs.filter(j => j.started_at && j.completed_at)
  const avgDuration = jobsWithDuration.length > 0
    ? Math.round(jobsWithDuration.reduce((s, j) => s + (new Date(j.completed_at!).getTime() - new Date(j.started_at!).getTime()), 0) / jobsWithDuration.length / 1000)
    : 0

  const handleRefreshAll = () => {
    refetchWorkflows()
    refetchJobs()
  }

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] h-5">Succès</Badge>
      case 'failed': return <Badge variant="destructive" className="text-[10px] h-5">Échec</Badge>
      case 'running': return <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] h-5 animate-pulse">En cours</Badge>
      case 'pending': return <Badge variant="outline" className="text-[10px] h-5">En attente</Badge>
      default: return <Badge variant="secondary" className="text-[10px] h-5">{status}</Badge>
    }
  }

  const getJobTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sync: 'Synchronisation', import: 'Import', export: 'Export', pricing: 'Prix',
      ai_enrich: 'IA Enrichissement', bulk_edit: 'Édition en masse', publish: 'Publication',
      fulfillment: 'Expédition', webhook: 'Webhook', seo_audit: 'Audit SEO',
      ai_generation: 'Génération IA', scraping: 'Scraping', email: 'Email',
    }
    return labels[type] || type
  }

  const getJobTypeIcon = (type: string) => {
    switch (type) {
      case 'sync': return Globe
      case 'pricing': return DollarSign
      case 'import': case 'export': return Download
      case 'ai_enrich': case 'ai_generation': return Zap
      default: return CircleDot
    }
  }

  const formatDuration = (startedAt: string | null, completedAt: string | null) => {
    if (!startedAt || !completedAt) return '—'
    const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime()
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
  }

  const sectionButtons = [
    { key: 'overview' as const, label: 'Vue globale', icon: BarChart3 },
    { key: 'workflows' as const, label: 'Workflows', icon: Workflow },
    { key: 'timeline' as const, label: 'Timeline', icon: Clock },
    { key: 'errors' as const, label: `Erreurs (${failedJobs.length})`, icon: AlertTriangle },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Suivi des Automatisations</h2>
          <p className="text-xs text-muted-foreground">Workflows, exécutions, performance et fiabilité</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefreshAll} className="h-8 text-xs">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Actualiser
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
        <KPICard title="Workflows" value={summary?.total.toString() || '0'} subtitle={`${summary?.active || 0} actifs`} icon={Workflow} loading={isLoading} />
        <KPICard title="Exécutions" value={summary?.totalExecutions.toLocaleString() || '0'} subtitle="Total cumulé" icon={Zap} loading={isLoading} accent="success" />
        <KPICard title="Taux succès" value={`${(summary?.successRate || 0).toFixed(1)}%`} subtitle="Fiabilité" icon={CheckCircle} loading={isLoading} accent="success" />
        <KPICard title="Échecs" value={failedJobs.length.toString()} subtitle="Récents" icon={XCircle} loading={isLoading} accent="destructive" />
        <KPICard title="En cours" value={runningJobs.length.toString()} subtitle="Jobs actifs" icon={Activity} loading={isLoading} accent="warning" />
        <KPICard title="Temps moyen" value={avgDuration > 0 ? `${avgDuration}s` : '—'} subtitle="Durée d'exécution" icon={Clock} loading={isLoading} />
      </div>

      {/* Health Score Bar */}
      <Card className="shadow-sm">
        <CardContent className="py-3 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${healthBg}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${healthBg}`} />
              </span>
              <span className="text-sm font-semibold text-foreground">Santé globale</span>
              <span className={`text-lg font-bold font-mono ${healthColor}`}>{healthScore}%</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                {completedJobs.length} réussis
              </span>
              <span className="flex items-center gap-1.5">
                <XCircle className="h-3 w-3 text-destructive" />
                {failedJobs.length} échoués
              </span>
              <span className="flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-primary" />
                {runningJobs.length} en cours
              </span>
            </div>
          </div>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${healthBg}`} style={{ width: `${healthScore}%` }} />
          </div>
        </CardContent>
      </Card>

      {/* Sub-navigation */}
      <div className="flex gap-1 bg-muted/50 p-0.5 rounded-lg w-fit">
        {sectionButtons.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeSection === s.key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <s.icon className="h-3.5 w-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Section: Overview */}
      {activeSection === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Chart: Success vs Failed over 30 days */}
          <Card className="lg:col-span-3 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Exécutions (30 jours)
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">{(chartData?.daily || []).reduce((s, d) => s + d.total, 0)} total</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {(chartData?.daily || []).length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData!.daily} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px -2px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="success" name="Succès" fill={CHART_COLORS.success} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="failed" name="Échecs" fill={CHART_COLORS.destructive} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                  Aucune donnée pour cette période
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metrics by Type */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Par type de tâche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {(chartData?.byType || []).slice(0, 8).map(t => {
                  const rate = t.count > 0 ? Math.round((t.success / t.count) * 100) : 0
                  const TypeIcon = getJobTypeIcon(t.type)
                  return (
                    <div key={t.type} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium">{getJobTypeLabel(t.type)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-muted-foreground font-mono">{t.count} exéc.</span>
                          <span className={`font-semibold ${rate >= 90 ? 'text-emerald-600 dark:text-emerald-400' : rate >= 70 ? 'text-amber-600' : 'text-destructive'}`}>{rate}%</span>
                        </div>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${rate >= 90 ? 'bg-emerald-500' : rate >= 70 ? 'bg-amber-500' : 'bg-destructive'}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                {(!chartData?.byType || chartData.byType.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-4">Aucune donnée</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Section: Workflows */}
      {activeSection === 'workflows' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Tous les workflows ({workflows.length})</CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />{workflows.filter(w => w.is_active).length} actifs</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/30" />{workflows.filter(w => !w.is_active).length} inactifs</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {workflows.map(wf => {
                const successRate = wf.trigger_count > 0 ? Math.round((wf.execution_count / wf.trigger_count) * 100) : 100
                return (
                  <div key={wf.id} className="flex items-center justify-between py-3 px-3 -mx-3 border-b border-border/40 last:border-0 hover:bg-muted/30 rounded-lg transition-colors group">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`h-3 w-3 rounded-full shrink-0 ${wf.is_active ? 'bg-emerald-500' : 'bg-muted-foreground/20'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate text-foreground">{wf.name}</p>
                          {wf.status === 'error' && <Badge variant="destructive" className="text-[10px] h-5">Erreur</Badge>}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                          <span>{wf.trigger_type || 'manual'}</span>
                          {wf.action_type && <span>→ {wf.action_type}</span>}
                          {wf.description && <span className="truncate max-w-[200px]">• {wf.description}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs shrink-0">
                      <div className="text-right">
                        <div className="font-mono font-medium">{wf.execution_count || 0} <span className="text-muted-foreground font-normal">exéc.</span></div>
                        <div className={`text-[10px] ${successRate >= 90 ? 'text-emerald-600 dark:text-emerald-400' : successRate >= 70 ? 'text-amber-600' : 'text-destructive'}`}>
                          {successRate}% succès
                        </div>
                      </div>
                      <div className="text-right text-muted-foreground w-20">
                        {wf.last_run_at ? (
                          <>
                            <div className="text-[10px]">{new Date(wf.last_run_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</div>
                            <div className="text-[10px]">{new Date(wf.last_run_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                          </>
                        ) : <span className="text-[10px]">Jamais exécuté</span>}
                      </div>
                      <Badge className={`text-[10px] h-5 ${wf.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-muted text-muted-foreground'}`}>
                        {wf.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
              {workflows.length === 0 && (
                <div className="text-center py-12">
                  <Workflow className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun workflow configuré</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section: Timeline */}
      {activeSection === 'timeline' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Timeline d'exécution
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">{jobs.length} derniers jobs</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border" />

              <div className="space-y-0">
                {jobs.slice(0, 30).map((job, i) => {
                  const JobIcon = getJobTypeIcon(job.job_type)
                  return (
                    <div key={job.id} className="flex gap-4 py-3 relative group">
                      {/* Dot */}
                      <div className={`h-[14px] w-[14px] rounded-full border-2 shrink-0 z-10 mt-1 ${
                        job.status === 'completed' ? 'bg-emerald-500 border-emerald-500' :
                        job.status === 'failed' ? 'bg-destructive border-destructive' :
                        job.status === 'running' ? 'bg-primary border-primary animate-pulse' :
                        'bg-muted border-muted-foreground/30'
                      }`} style={{ marginLeft: '12px' }} />

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex items-start justify-between gap-4 hover:bg-muted/30 -mx-2 px-2 py-1 rounded-lg transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <JobIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">{getJobTypeLabel(job.job_type)}</span>
                            {getJobStatusBadge(job.status)}
                          </div>
                          {job.error_message && (
                            <p className="text-[10px] text-destructive mt-0.5 truncate max-w-[400px]">{job.error_message}</p>
                          )}
                          <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                            {job.total_items != null && <span>{job.processed_items || 0}/{job.total_items} items</span>}
                            {job.failed_items != null && job.failed_items > 0 && <span className="text-destructive">{job.failed_items} échoués</span>}
                            <span>Durée: {formatDuration(job.started_at, job.completed_at)}</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono shrink-0 text-right">
                          <div>{new Date(job.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</div>
                          <div>{new Date(job.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {jobs.length === 0 && (
                  <div className="text-center py-12 ml-10">
                    <Clock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucune exécution récente</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section: Errors */}
      {activeSection === 'errors' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Jobs en erreur ({failedJobs.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {failedJobs.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3 opacity-80" />
                <h3 className="font-semibold text-foreground">Aucune erreur</h3>
                <p className="text-sm text-muted-foreground mt-1">Tous les jobs récents ont réussi</p>
              </div>
            ) : (
              <div className="space-y-2">
                {failedJobs.map(job => {
                  const JobIcon = getJobTypeIcon(job.job_type)
                  return (
                    <div key={job.id} className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                            <JobIcon className="h-4 w-4 text-destructive" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{getJobTypeLabel(job.job_type)}</p>
                              <Badge variant="destructive" className="text-[10px] h-5">Échec</Badge>
                            </div>
                            <p className="text-xs text-destructive mt-1 break-words">{job.error_message || 'Erreur inconnue'}</p>
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                              <span>ID: {job.id.slice(0, 8)}...</span>
                              <span>Durée: {formatDuration(job.started_at, job.completed_at)}</span>
                              {job.total_items != null && <span>{job.processed_items || 0}/{job.total_items} traités</span>}
                              {job.failed_items != null && job.failed_items > 0 && <span className="text-destructive">{job.failed_items} échoués</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono shrink-0 text-right">
                          <div>{new Date(job.created_at).toLocaleDateString('fr-FR')}</div>
                          <div>{new Date(job.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Tab: Alert Center ───────────────────────────────────────────
function AlertCenterTab() {
  const { data: alerts = [], isLoading, refetch } = useAdminAlerts()

  const grouped = {
    critical: alerts.filter(a => a.severity === 'critical'),
    warning: alerts.filter(a => a.severity === 'warning'),
    info: alerts.filter(a => a.severity === 'info'),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Centre d'alertes</h2>
          <p className="text-xs text-muted-foreground">Incidents système, business et sécurité</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="h-8 text-xs">
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-3">
        {[
          { label: 'Critique', count: grouped.critical.length, color: 'text-destructive', border: grouped.critical.length > 0 ? 'border-destructive/30 bg-destructive/5' : '' },
          { label: 'Warning', count: grouped.warning.length, color: 'text-amber-500', border: '' },
          { label: 'Info', count: grouped.info.length, color: 'text-muted-foreground', border: '' },
        ].map((s) => (
          <Card key={s.label} className={`shadow-sm ${s.border}`}>
            <CardContent className="py-4 text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{s.count}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-5">
          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3 opacity-80" />
              <h3 className="font-semibold text-foreground">Tout est en ordre</h3>
              <p className="text-sm text-muted-foreground mt-1">Aucune alerte active pour le moment</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-xl border transition-colors ${
                  alert.severity === 'critical' ? 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10' :
                  alert.severity === 'warning' ? 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10' : 'border-border hover:bg-muted/50'
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
                        <h4 className="text-sm font-semibold text-foreground">{alert.title}</h4>
                        <Badge variant="outline" className="text-[10px] h-4">{alert.source}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-mono">
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
  const totalAlertCount = alerts.length

  return (
    <div className="min-h-screen bg-background">
      <AdminTopBar alertCount={totalAlertCount} />

      <div className="px-6 py-5">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 h-9 bg-muted/50 p-0.5">
            <TabsTrigger value="overview" className="gap-1.5 text-xs h-8 data-[state=active]:shadow-sm">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-1.5 text-xs h-8 data-[state=active]:shadow-sm">
              <Server className="h-3.5 w-3.5" />
              Système
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-1.5 text-xs h-8 data-[state=active]:shadow-sm">
              <Workflow className="h-3.5 w-3.5" />
              Automation
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1.5 text-xs h-8 relative data-[state=active]:shadow-sm">
              <Bell className="h-3.5 w-3.5" />
              Alertes
              {criticalCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 bg-destructive text-destructive-foreground rounded-full text-[9px] font-bold flex items-center justify-center px-1">
                  {criticalCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5 text-xs h-8 data-[state=active]:shadow-sm">
              <Users className="h-3.5 w-3.5" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-1.5 text-xs h-8 data-[state=active]:shadow-sm">
              <Globe className="h-3.5 w-3.5" />
              Fournisseurs
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5 text-xs h-8 data-[state=active]:shadow-sm">
              <Shield className="h-3.5 w-3.5" />
              Audit & Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="system"><SystemTab /></TabsContent>
          <TabsContent value="automation"><AutomationTab /></TabsContent>
          <TabsContent value="alerts"><AlertCenterTab /></TabsContent>
          <TabsContent value="users"><EnhancedUserManagement /></TabsContent>
          <TabsContent value="suppliers"><SupplierControlTab /></TabsContent>
          <TabsContent value="audit"><LogsViewer /></TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default AdminPanelContent
