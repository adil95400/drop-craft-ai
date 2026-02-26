/**
 * Alert History Panel
 * 
 * Historical view of all alerts with filtering and export capabilities
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Search,
  Download,
  Filter,
  Calendar,
  Activity
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

interface HistoricalAlert {
  id: string
  type: 'system' | 'business' | 'security' | 'import'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  timestamp: string
  acknowledged: boolean
  acknowledgedAt: string | null
  acknowledgedBy: string | null
  resolvedAt: string | null
  metadata: Record<string, unknown> | null
}

interface AlertFilters {
  search: string
  severity: string
  type: string
  status: string
  dateRange: '24h' | '7d' | '30d' | 'all'
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AlertHistoryPanel() {
  const [filters, setFilters] = useState<AlertFilters>({
    search: '',
    severity: 'all',
    type: 'all',
    status: 'all',
    dateRange: '7d'
  })

  // Fetch historical alerts
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alert-history', filters],
    queryFn: () => fetchAlertHistory(filters),
  })

  // Export to CSV
  const handleExport = () => {
    if (!alerts || alerts.length === 0) return

    const headers = ['Date', 'Sévérité', 'Type', 'Titre', 'Message', 'Status']
    const rows = alerts.map(a => [
      format(new Date(a.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      a.severity,
      a.type,
      a.title,
      a.message,
      a.acknowledged ? 'Acquitté' : 'Actif'
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `alertes_${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  // Stats
  const stats = alerts ? {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    unacknowledged: alerts.filter(a => !a.acknowledged).length,
    resolved: alerts.filter(a => a.resolvedAt).length,
  } : { total: 0, critical: 0, unacknowledged: 0, resolved: 0 }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total alertes"
          value={stats.total}
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="Critiques"
          value={stats.critical}
          icon={XCircle}
          color="red"
        />
        <StatCard
          title="Non acquittées"
          value={stats.unacknowledged}
          icon={AlertCircle}
          color="orange"
        />
        <StatCard
          title="Résolues"
          value={stats.resolved}
          icon={CheckCircle2}
          color="green"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Historique des alertes</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                className="pl-9"
              />
            </div>

            {/* Severity Filter */}
            <Select
              value={filters.severity}
              onValueChange={value => setFilters(f => ({ ...f, severity: value }))}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sévérité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select
              value={filters.type}
              onValueChange={value => setFilters(f => ({ ...f, type: value }))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="system">Système</SelectItem>
                <SelectItem value="business">Métier</SelectItem>
                <SelectItem value="security">Sécurité</SelectItem>
                <SelectItem value="import">Import</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Select
              value={filters.dateRange}
              onValueChange={value => setFilters(f => ({ ...f, dateRange: value as AlertFilters['dateRange'] }))}
            >
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 heures</SelectItem>
                <SelectItem value="7d">7 jours</SelectItem>
                <SelectItem value="30d">30 jours</SelectItem>
                <SelectItem value="all">Tout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alert List */}
          <AlertList alerts={alerts || []} loading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function StatCard({
  title,
  value,
  icon: Icon,
  color
}: {
  title: string
  value: number
  icon: React.ElementType
  color: 'blue' | 'red' | 'orange' | 'green'
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={cn('h-10 w-10 rounded-full flex items-center justify-center', colors[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AlertList({
  alerts,
  loading
}: {
  alerts: HistoricalAlert[]
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="animate-pulse h-16 bg-muted rounded" />
        ))}
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucune alerte trouvée pour cette période</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-2">
        {alerts.map(alert => (
          <AlertRow key={alert.id} alert={alert} />
        ))}
      </div>
    </ScrollArea>
  )
}

function AlertRow({ alert }: { alert: HistoricalAlert }) {
  const severityColors = {
    low: 'border-l-blue-500',
    medium: 'border-l-yellow-500',
    high: 'border-l-orange-500',
    critical: 'border-l-red-500',
  }

  const severityBadges = {
    low: 'secondary',
    medium: 'outline',
    high: 'default',
    critical: 'destructive',
  } as const

  return (
    <div className={cn(
      'p-4 border rounded-lg border-l-4 hover:bg-muted/50 transition-colors',
      severityColors[alert.severity]
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={severityBadges[alert.severity]} className="text-xs">
              {alert.severity}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {alert.type}
            </Badge>
            {alert.acknowledged && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Acquitté
              </Badge>
            )}
          </div>
          <p className="font-medium">{alert.title}</p>
          <p className="text-sm text-muted-foreground line-clamp-2">{alert.message}</p>
        </div>
        <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
          <p>{format(new Date(alert.timestamp), 'dd MMM yyyy', { locale: getDateFnsLocale() })}</p>
          <p>{format(new Date(alert.timestamp), 'HH:mm')}</p>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// DATA FETCHING
// =============================================================================

async function fetchAlertHistory(filters: AlertFilters): Promise<HistoricalAlert[]> {
  let query = supabase
    .from('active_alerts')
    .select('*')
    .order('created_at', { ascending: false })

  // Date range filter
  if (filters.dateRange !== 'all') {
    const days = filters.dateRange === '24h' ? 1 : filters.dateRange === '7d' ? 7 : 30
    const startDate = startOfDay(subDays(new Date(), days))
    query = query.gte('created_at', startDate.toISOString())
  }

  // Severity filter
  if (filters.severity !== 'all') {
    query = query.eq('severity', filters.severity)
  }

  // Type filter
  if (filters.type !== 'all') {
    query = query.eq('alert_type', filters.type)
  }

  // Status filter
  if (filters.status === 'acknowledged') {
    query = query.eq('acknowledged', true)
  } else if (filters.status === 'active') {
    query = query.eq('acknowledged', false)
  }

  const { data, error } = await query.limit(100)

  if (error) {
    console.error('Failed to fetch alert history:', error)
    return []
  }

  // Apply search filter client-side
  let results = (data || []).map(row => ({
    id: row.id,
    type: row.alert_type as HistoricalAlert['type'],
    severity: (row.severity || 'low') as HistoricalAlert['severity'],
    title: row.title,
    message: row.message || '',
    timestamp: row.created_at,
    acknowledged: row.acknowledged || false,
    acknowledgedAt: row.acknowledged_at,
    acknowledgedBy: row.acknowledged_by,
    resolvedAt: null,
    metadata: row.metadata as Record<string, unknown> | null,
  }))

  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    results = results.filter(a => 
      a.title.toLowerCase().includes(searchLower) ||
      a.message.toLowerCase().includes(searchLower)
    )
  }

  return results
}

export default AlertHistoryPanel
