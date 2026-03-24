/**
 * LogsViewer — Ultra-Pro Audit & System Logs with KPIs, volume chart, compact design
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FileText, RefreshCw, Download, AlertTriangle, Info,
  XCircle, CheckCircle, Activity, Database, Shield,
  Globe, Clock, BarChart3, Search, Eye,
} from 'lucide-react'
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts'
import { useToast } from '@/hooks/use-toast'

const CHART_COLORS = {
  primary: 'hsl(221, 83%, 53%)',
  success: 'hsl(142, 76%, 36%)',
  warning: 'hsl(38, 92%, 50%)',
  destructive: 'hsl(0, 84%, 60%)',
}

interface LogEntry {
  id: string
  timestamp: string
  rawTimestamp: string
  level: 'info' | 'warning' | 'error' | 'debug'
  source: string
  message: string
  user?: string
  ip?: string
  action?: string
}

function useRealLogs() {
  return useQuery({
    queryKey: ['admin-logs-ultra'],
    queryFn: async () => {
      const [securityEvents, activityLogs, apiLogs, auditLogs] = await Promise.all([
        supabase.from('security_events').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('api_logs').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('audit_logs').select('id, action, action_category, severity, description, created_at, user_id, actor_email, resource_type').order('created_at', { ascending: false }).limit(50),
      ])

      const logs: LogEntry[] = []

      for (const e of securityEvents.data || []) {
        logs.push({
          id: `sec_${e.id}`,
          timestamp: new Date(e.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          rawTimestamp: e.created_at,
          level: e.severity === 'critical' ? 'error' : e.severity === 'warning' ? 'warning' : 'info',
          source: 'security',
          message: e.description || e.event_type || 'Security event',
          user: e.user_id?.slice(0, 8),
          ip: (e.metadata as any)?.ip_address,
          action: e.event_type,
        })
      }

      for (const l of activityLogs.data || []) {
        logs.push({
          id: `act_${l.id}`,
          timestamp: new Date(l.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          rawTimestamp: l.created_at || '',
          level: l.severity === 'critical' ? 'error' : l.severity === 'warning' ? 'warning' : 'info',
          source: l.source || 'system',
          message: l.description || l.action,
          user: l.user_id?.slice(0, 8),
          ip: l.ip_address,
          action: l.action,
        })
      }

      for (const l of apiLogs.data || []) {
        logs.push({
          id: `api_${l.id}`,
          timestamp: new Date(l.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          rawTimestamp: l.created_at || '',
          level: (l.status_code || 0) >= 500 ? 'error' : (l.status_code || 0) >= 400 ? 'warning' : 'info',
          source: 'api',
          message: `${l.method} ${l.endpoint} — ${l.status_code} (${l.response_time_ms || 0}ms)`,
          ip: l.ip_address,
          action: 'api_request',
        })
      }

      for (const a of auditLogs.data || []) {
        logs.push({
          id: `aud_${a.id}`,
          timestamp: new Date(a.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          rawTimestamp: a.created_at,
          level: a.severity === 'error' || a.severity === 'critical' ? 'error' : a.severity === 'warning' ? 'warning' : 'info',
          source: 'audit',
          message: a.description || `${a.action} (${a.action_category})`,
          user: a.actor_email?.split('@')[0] || a.user_id?.slice(0, 8),
          action: a.action,
        })
      }

      logs.sort((a, b) => new Date(b.rawTimestamp).getTime() - new Date(a.rawTimestamp).getTime())
      return logs
    },
    refetchInterval: 30_000,
  })
}

export const LogsViewer = () => {
  const { data: logs = [], isLoading, refetch } = useRealLogs()
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [page, setPage] = useState(0)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const pageSize = 25
  const { toast } = useToast()

  const filtered = useMemo(() => {
    let result = logs
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      result = result.filter(l => l.message.toLowerCase().includes(q) || l.source.includes(q) || l.user?.includes(q))
    }
    if (levelFilter !== 'all') result = result.filter(l => l.level === levelFilter)
    if (sourceFilter !== 'all') result = result.filter(l => l.source === sourceFilter)
    return result
  }, [logs, searchTerm, levelFilter, sourceFilter])

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.ceil(filtered.length / pageSize)

  // Stats
  const errorCount = logs.filter(l => l.level === 'error').length
  const warningCount = logs.filter(l => l.level === 'warning').length
  const sources = [...new Set(logs.map(l => l.source))]

  // Volume chart
  const volumeChart = useMemo(() => {
    const byHour: Record<string, { hour: string; info: number; warning: number; error: number }> = {}
    for (const l of logs) {
      const d = new Date(l.rawTimestamp)
      const hour = `${d.getHours().toString().padStart(2, '0')}h`
      if (!byHour[hour]) byHour[hour] = { hour, info: 0, warning: 0, error: 0 }
      byHour[hour][l.level === 'debug' ? 'info' : l.level]++
    }
    return Object.values(byHour).sort((a, b) => a.hour.localeCompare(b.hour))
  }, [logs])

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Level', 'Source', 'Message', 'User', 'IP', 'Action'].join(','),
      ...filtered.map(l => [l.timestamp, l.level, l.source, `"${l.message}"`, l.user || '', l.ip || '', l.action || ''].join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Export réussi', description: `${filtered.length} logs exportés` })
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="h-3.5 w-3.5 text-destructive" />
      case 'warning': return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
      default: return <Info className="h-3.5 w-3.5 text-muted-foreground" />
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'security': case 'audit': return <Shield className="h-3.5 w-3.5" />
      case 'api': return <Globe className="h-3.5 w-3.5" />
      case 'system': return <Activity className="h-3.5 w-3.5" />
      default: return <FileText className="h-3.5 w-3.5" />
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Audit & Logs Système</h2>
          <p className="text-xs text-muted-foreground">Sécurité, activité, API et audit — données temps réel</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExport}>
            <Download className="h-3.5 w-3.5 mr-1.5" />Export CSV
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />Actualiser
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        {[
          { title: 'Total logs', value: logs.length.toString(), icon: FileText, accent: 'primary' as const },
          { title: 'Erreurs', value: errorCount.toString(), icon: XCircle, accent: errorCount > 0 ? 'destructive' as const : 'success' as const },
          { title: 'Warnings', value: warningCount.toString(), icon: AlertTriangle, accent: warningCount > 5 ? 'warning' as const : 'primary' as const },
          { title: 'Sources', value: sources.length.toString(), icon: Database, accent: 'primary' as const },
          { title: 'Filtrés', value: filtered.length.toString(), icon: Search, accent: 'primary' as const },
        ].map(kpi => (
          <Card key={kpi.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{kpi.title}</span>
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                  kpi.accent === 'destructive' ? 'bg-destructive/10 text-destructive' :
                  kpi.accent === 'warning' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                  kpi.accent === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                  'bg-primary/10 text-primary'
                }`}>
                  <kpi.icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-xl font-bold text-foreground">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Volume Chart */}
      {volumeChart.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />Volume par heure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={volumeChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="info" name="Info" stackId="a" fill={CHART_COLORS.primary} radius={[0, 0, 0, 0]} />
                <Bar dataKey="warning" name="Warning" stackId="a" fill={CHART_COLORS.warning} />
                <Bar dataKey="error" name="Erreur" stackId="a" fill={CHART_COLORS.destructive} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(0) }}
            className="pl-9 h-8 text-xs bg-muted/50 border-transparent focus:border-primary/30" />
        </div>
        <div className="flex gap-1">
          {['all', 'error', 'warning', 'info'].map(lv => (
            <button key={lv} onClick={() => { setLevelFilter(lv); setPage(0) }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors ${
                levelFilter === lv ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {lv === 'all' ? 'Tous' : lv === 'error' ? `Erreurs (${errorCount})` : lv === 'warning' ? `Warnings (${warningCount})` : 'Info'}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {['all', ...sources].map(src => (
            <button key={src} onClick={() => { setSourceFilter(src); setPage(0) }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors ${
                sourceFilter === src ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {src === 'all' ? 'Toutes sources' : src}
            </button>
          ))}
        </div>
      </div>

      {/* Log entries */}
      <Card className="shadow-sm">
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aucun log trouvé</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {paginated.map(log => (
                <div key={log.id}
                  onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                  className={`flex items-center gap-3 py-2 px-3 -mx-3 rounded-lg cursor-pointer transition-colors ${
                    log.level === 'error' ? 'hover:bg-destructive/5' : 'hover:bg-muted/50'
                  } ${selectedLog?.id === log.id ? 'bg-muted/50' : ''}`}
                >
                  {getLevelIcon(log.level)}
                  <span className="text-[10px] font-mono text-muted-foreground w-28 shrink-0">{log.timestamp}</span>
                  <div className="flex items-center gap-1.5 w-16 shrink-0">
                    {getSourceIcon(log.source)}
                    <span className="text-[10px] text-muted-foreground capitalize">{log.source}</span>
                  </div>
                  <span className={`text-xs flex-1 min-w-0 truncate ${log.level === 'error' ? 'text-destructive' : 'text-foreground'}`}>
                    {log.message}
                  </span>
                  {log.user && <span className="text-[10px] text-muted-foreground font-mono shrink-0">{log.user}</span>}
                  {log.ip && <span className="text-[10px] text-muted-foreground font-mono shrink-0">{log.ip}</span>}
                </div>
              ))}

              {/* Expanded detail */}
              {selectedLog && (
                <div className="mt-2 p-3 rounded-lg bg-muted/50 border text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedLog.level === 'error' ? 'destructive' : selectedLog.level === 'warning' ? 'secondary' : 'default'} className="text-[10px]">
                      {selectedLog.level.toUpperCase()}
                    </Badge>
                    <span className="font-mono text-muted-foreground">{selectedLog.timestamp}</span>
                  </div>
                  <p className="text-foreground">{selectedLog.message}</p>
                  <div className="flex gap-4 text-[10px] text-muted-foreground">
                    <span>Source: <b>{selectedLog.source}</b></span>
                    {selectedLog.action && <span>Action: <b>{selectedLog.action}</b></span>}
                    {selectedLog.user && <span>User: <b>{selectedLog.user}</b></span>}
                    {selectedLog.ip && <span>IP: <b>{selectedLog.ip}</b></span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <span className="text-[10px] text-muted-foreground">
                Page {page + 1} / {totalPages} — {filtered.length} logs
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 text-[10px] px-2.5" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  Précédent
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] px-2.5" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
