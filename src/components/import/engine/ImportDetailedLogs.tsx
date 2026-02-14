/**
 * ImportDetailedLogs — Logs enrichis avec filtrage, niveaux et timeline
 */
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  FileText, Search, Filter, CheckCircle2, XCircle, AlertTriangle,
  Info, Clock, ChevronDown, ChevronUp, Copy, ExternalLink,
  RotateCcw, Download
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
  details?: string
  source?: string
  productName?: string
  sku?: string
  url?: string
}

interface ImportDetailedLogsProps {
  imports: any[]
  className?: string
}

export function ImportDetailedLogs({ imports, className }: ImportDetailedLogsProps) {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Generate logs from import data
  const logs: LogEntry[] = useMemo(() => {
    const entries: LogEntry[] = []

    imports.forEach((imp) => {
      // Job start
      entries.push({
        id: `${imp.id}-start`,
        timestamp: imp.created_at,
        level: 'info',
        message: `Import ${imp.source_type || imp.job_type || 'URL'} démarré`,
        source: imp.source_type,
        details: imp.metadata?.source_url || imp.configuration?.url,
      })

      // Success items
      if (imp.items_succeeded > 0 || imp.success_rows > 0) {
        entries.push({
          id: `${imp.id}-success`,
          timestamp: imp.updated_at || imp.created_at,
          level: 'success',
          message: `${imp.items_succeeded || imp.success_rows || 0} produit(s) importé(s) avec succès`,
          source: imp.source_type,
        })
      }

      // Failed items
      if (imp.items_failed > 0 || imp.error_rows > 0) {
        entries.push({
          id: `${imp.id}-error`,
          timestamp: imp.updated_at || imp.created_at,
          level: 'error',
          message: `${imp.items_failed || imp.error_rows || 0} produit(s) en erreur`,
          source: imp.source_type,
          details: imp.error_message || imp.error_details?.message,
        })
      }

      // Completion
      if (imp.status === 'completed') {
        entries.push({
          id: `${imp.id}-done`,
          timestamp: imp.completed_at || imp.updated_at || imp.created_at,
          level: 'success',
          message: `Import terminé — ${imp.items_total || imp.total_rows || 0} produits traités`,
          source: imp.source_type,
        })
      }

      // Failed job
      if (imp.status === 'failed') {
        entries.push({
          id: `${imp.id}-failed`,
          timestamp: imp.updated_at || imp.created_at,
          level: 'error',
          message: `Import échoué : ${imp.error_message || 'Erreur inconnue'}`,
          source: imp.source_type,
          details: JSON.stringify(imp.error_details, null, 2),
        })
      }
    })

    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [imports])

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (levelFilter !== 'all' && log.level !== levelFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          log.message.toLowerCase().includes(q) ||
          log.details?.toLowerCase().includes(q) ||
          log.source?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [logs, search, levelFilter])

  const levelConfig = {
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Info' },
    success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Succès' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Alerte' },
    error: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Erreur' },
  }

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const levelCounts = useMemo(() => ({
    all: logs.length,
    info: logs.filter(l => l.level === 'info').length,
    success: logs.filter(l => l.level === 'success').length,
    warning: logs.filter(l => l.level === 'warning').length,
    error: logs.filter(l => l.level === 'error').length,
  }), [logs])

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-muted-foreground" />
            Logs détaillés
          </CardTitle>
          <div className="flex items-center gap-2">
            {Object.entries(levelCounts).filter(([k]) => k !== 'all').map(([level, count]) => {
              if (count === 0) return null
              const config = levelConfig[level as keyof typeof levelConfig]
              return (
                <Badge
                  key={level}
                  variant="outline"
                  className={cn('text-[10px] cursor-pointer', config.bg, config.color,
                    levelFilter === level && 'ring-1 ring-offset-1'
                  )}
                  onClick={() => setLevelFilter(levelFilter === level ? 'all' : level)}
                >
                  {count} {config.label}
                </Badge>
              )
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans les logs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous ({levelCounts.all})</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Succès</SelectItem>
              <SelectItem value="warning">Alertes</SelectItem>
              <SelectItem value="error">Erreurs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Log entries */}
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-1">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Aucun log à afficher
              </div>
            ) : (
              filteredLogs.map(log => {
                const config = levelConfig[log.level]
                const Icon = config.icon
                const isExpanded = expandedIds.has(log.id)

                return (
                  <div
                    key={log.id}
                    className={cn(
                      'group flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer',
                      log.level === 'error' && 'hover:bg-destructive/5'
                    )}
                    onClick={() => log.details && toggleExpand(log.id)}
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center mt-0.5 shrink-0">
                      <div className={cn('p-1 rounded', config.bg)}>
                        <Icon className={cn('w-3 h-3', config.color)} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{log.message}</span>
                        {log.source && (
                          <Badge variant="outline" className="text-[9px] h-4 shrink-0">
                            {log.source}
                          </Badge>
                        )}
                      </div>

                      {isExpanded && log.details && (
                        <pre className="text-[11px] text-muted-foreground bg-muted/50 p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap font-mono">
                          {log.details}
                        </pre>
                      )}

                      <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: fr })}
                        {log.details && (
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                            détails
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
