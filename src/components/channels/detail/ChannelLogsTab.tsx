/**
 * ChannelLogsTab - Real sync logs from channel_sync_logs
 * Filterable, paginated log viewer
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  FileText, CheckCircle2, XCircle, Clock, Loader2, 
  Search, RefreshCw, Filter, ChevronDown, AlertTriangle
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface ChannelLogsTabProps {
  channelId: string
}

export function ChannelLogsTab({ channelId }: ChannelLogsTabProps) {
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['channel-logs', channelId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('channel_sync_logs')
        .select('*')
        .eq('channel_id', channelId)
        .order('started_at', { ascending: false })
        .limit(50)

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    enabled: !!channelId,
  })

  // Also try unified_sync_queue as fallback
  const { data: queueLogs } = useQuery({
    queryKey: ['channel-queue-logs', channelId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return []
      
      const { data } = await supabase
        .from('unified_sync_queue')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      
      return data || []
    },
    enabled: !!channelId && (!logs || logs.length === 0),
  })

  const allLogs = (logs && logs.length > 0) ? logs : (queueLogs || []).map((q: any) => ({
    id: q.id,
    sync_type: q.sync_type || 'full',
    status: q.status === 'completed' ? 'completed' : q.status === 'failed' ? 'failed' : 'pending',
    started_at: q.created_at,
    completed_at: q.processed_at,
    items_succeeded: q.status === 'completed' ? 1 : 0,
    items_failed: q.status === 'failed' ? 1 : 0,
    duration_ms: q.processed_at ? new Date(q.processed_at).getTime() - new Date(q.created_at).getTime() : null,
    error_message: q.error_message || null,
  }))

  const filteredLogs = searchQuery.trim() 
    ? allLogs.filter((l: any) => 
        l.sync_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.error_message?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allLogs

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'Succès' }
      case 'failed':
        return { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', label: 'Échec' }
      case 'in_progress':
        return { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-500/10 border-blue-500/30', label: 'En cours' }
      default:
        return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/30', label: 'En attente' }
    }
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return '—'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${Math.floor(ms / 60000)}min ${Math.round((ms % 60000) / 1000)}s`
  }

  const stats = {
    total: allLogs.length,
    success: allLogs.filter((l: any) => l.status === 'completed').length,
    failed: allLogs.filter((l: any) => l.status === 'failed').length,
    pending: allLogs.filter((l: any) => l.status !== 'completed' && l.status !== 'failed').length,
  }

  return (
    <div className="space-y-5">
      {/* Stats summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground' },
          { label: 'Succès', value: stats.success, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Échecs', value: stats.failed, color: 'text-destructive' },
          { label: 'En attente', value: stats.pending, color: 'text-amber-600 dark:text-amber-400' },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-lg border border-border bg-card text-center">
            <p className={cn("text-xl font-bold tabular-nums", s.color)}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Journal de synchronisation</CardTitle>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()} 
              disabled={isLoading}
              className="gap-1.5 h-8 text-xs"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              Actualiser
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={statusFilter ? "default" : "outline"} size="sm" className="gap-1.5 h-8 text-xs">
                  <Filter className="h-3.5 w-3.5" />
                  {statusFilter ? getStatusConfig(statusFilter).label : 'Statut'}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel className="text-xs">Filtrer par statut</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter(null)} className="text-xs">Tous</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('completed')} className="text-xs">Succès</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('failed')} className="text-xs">Échec</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('in_progress')} className="text-xs">En cours</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="space-y-1.5">
              {filteredLogs.map((log: any) => {
                const sc = getStatusConfig(log.status)
                const StatusIcon = sc.icon
                return (
                  <div
                    key={log.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/30",
                      log.status === 'failed' ? "border-destructive/20 bg-destructive/5" : "border-border"
                    )}
                  >
                    <div className={cn("p-1.5 rounded-md shrink-0 mt-0.5", sc.bg)}>
                      <StatusIcon className={cn("h-3.5 w-3.5", sc.color, log.status === 'in_progress' && "animate-spin")} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium capitalize">{log.sync_type || 'sync'}</span>
                        <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", sc.bg, sc.color)}>
                          {sc.label}
                        </Badge>
                        {(log.items_succeeded > 0 || log.items_failed > 0) && (
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            {log.items_succeeded || 0} OK
                            {log.items_failed > 0 && (
                              <span className="text-destructive"> • {log.items_failed} erreur{log.items_failed > 1 ? 's' : ''}</span>
                            )}
                          </span>
                        )}
                      </div>

                      {log.error_message && (
                        <div className="flex items-start gap-1.5 mt-1.5 p-2 rounded bg-destructive/5 border border-destructive/10">
                          <AlertTriangle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                          <p className="text-[11px] text-destructive break-all">{log.error_message}</p>
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        {log.started_at && format(new Date(log.started_at), 'dd/MM HH:mm', { locale: getDateFnsLocale() })}
                      </p>
                      {log.duration_ms != null && (
                        <p className="text-[10px] text-muted-foreground/70 tabular-nums mt-0.5">
                          {formatDuration(log.duration_ms)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <FileText className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs font-medium">Aucun log</p>
              <p className="text-[11px] text-muted-foreground">Les logs de synchronisation apparaîtront ici</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
