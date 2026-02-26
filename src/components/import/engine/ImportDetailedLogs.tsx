/**
 * ImportDetailedLogs — Logs enrichis par produit avec retry granulaire
 * Filtrage par niveau, timeline, détails techniques + retry item-level
 */
import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  FileText, Search, CheckCircle2, XCircle, AlertTriangle,
  Info, Clock, ChevronDown, ChevronUp, RotateCcw, Download,
  Package, Tag, ExternalLink, Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'
import { toast } from 'sonner'

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
  jobId?: string
  retryable?: boolean
  qualityScore?: number
}

interface ImportDetailedLogsProps {
  imports: any[]
  onRetryItem?: (jobId: string, itemId: string) => void
  className?: string
}

export function ImportDetailedLogs({ imports, onRetryItem, className }: ImportDetailedLogsProps) {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Generate per-product logs from import data
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
        jobId: imp.id,
      })

      // Per-product success entries (simulated from job items)
      const succeeded = imp.items_succeeded || imp.success_rows || 0
      if (succeeded > 0) {
        // Generate product-level logs from metadata if available
        const itemDetails = imp.metadata?.items || imp.output_data?.products || []
        if (itemDetails.length > 0) {
          itemDetails.slice(0, 20).forEach((item: any, idx: number) => {
            entries.push({
              id: `${imp.id}-item-${idx}`,
              timestamp: imp.updated_at || imp.created_at,
              level: item.status === 'failed' ? 'error' : 'success',
              message: item.status === 'failed'
                ? `Échec : ${item.error || 'Erreur inconnue'}`
                : `Importé : ${item.name || item.title || `Produit #${idx + 1}`}`,
              productName: item.name || item.title,
              sku: item.sku,
              url: item.source_url || item.url,
              source: imp.source_type,
              jobId: imp.id,
              retryable: item.status === 'failed',
              qualityScore: item.quality_score || item.import_quality_score,
            })
          })
        } else {
          // Aggregate entry
          entries.push({
            id: `${imp.id}-success`,
            timestamp: imp.updated_at || imp.created_at,
            level: 'success',
            message: `${succeeded} produit(s) importé(s) avec succès`,
            source: imp.source_type,
            jobId: imp.id,
          })
        }
      }

      // Per-product error entries
      const failed = imp.items_failed || imp.error_rows || 0
      if (failed > 0) {
        const errorItems = imp.error_details?.items || imp.metadata?.errors || []
        if (errorItems.length > 0) {
          errorItems.slice(0, 20).forEach((err: any, idx: number) => {
            entries.push({
              id: `${imp.id}-err-${idx}`,
              timestamp: imp.updated_at || imp.created_at,
              level: 'error',
              message: `Erreur produit : ${err.name || err.title || `Ligne ${err.index || idx + 1}`}`,
              details: err.error || err.message || 'Validation échouée',
              productName: err.name || err.title,
              sku: err.sku,
              url: err.source_url,
              source: imp.source_type,
              jobId: imp.id,
              retryable: true,
            })
          })
        } else {
          entries.push({
            id: `${imp.id}-error`,
            timestamp: imp.updated_at || imp.created_at,
            level: 'error',
            message: `${failed} produit(s) en erreur`,
            source: imp.source_type,
            details: imp.error_message || imp.error_details?.message,
            jobId: imp.id,
            retryable: true,
          })
        }
      }

      // Warnings (missing data, low quality)
      if (imp.metadata?.warnings) {
        (imp.metadata.warnings as string[]).forEach((w: string, idx: number) => {
          entries.push({
            id: `${imp.id}-warn-${idx}`,
            timestamp: imp.updated_at || imp.created_at,
            level: 'warning',
            message: w,
            source: imp.source_type,
            jobId: imp.id,
          })
        })
      }

      // Completion
      if (imp.status === 'completed') {
        const quality = computeJobQuality(imp)
        entries.push({
          id: `${imp.id}-done`,
          timestamp: imp.completed_at || imp.updated_at || imp.created_at,
          level: 'success',
          message: `Import terminé — ${imp.items_total || imp.total_rows || 0} produits traités`,
          source: imp.source_type,
          jobId: imp.id,
          qualityScore: quality,
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
          details: typeof imp.error_details === 'object' ? JSON.stringify(imp.error_details, null, 2) : imp.error_details,
          jobId: imp.id,
          retryable: true,
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
          log.source?.toLowerCase().includes(q) ||
          log.productName?.toLowerCase().includes(q) ||
          log.sku?.toLowerCase().includes(q)
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

  const handleRetryItem = useCallback((log: LogEntry) => {
    if (onRetryItem && log.jobId) {
      onRetryItem(log.jobId, log.id)
    }
    toast.success(`Retry lancé pour ${log.productName || 'l\'élément'}`)
  }, [onRetryItem])

  const handleExportLogs = useCallback(() => {
    const csv = [
      'Timestamp,Level,Message,Product,SKU,Source,Quality',
      ...filteredLogs.map(l =>
        `"${l.timestamp}","${l.level}","${l.message}","${l.productName || ''}","${l.sku || ''}","${l.source || ''}","${l.qualityScore || ''}"`
      )
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `import-logs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Logs exportés')
  }, [filteredLogs])

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
            Logs détaillés par produit
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
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleExportLogs} title="Exporter les logs">
              <Download className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, SKU, source..."
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
        <ScrollArea className="max-h-[500px]">
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
                    onClick={() => (log.details || log.productName) && toggleExpand(log.id)}
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center mt-0.5 shrink-0">
                      <div className={cn('p-1 rounded', config.bg)}>
                        <Icon className={cn('w-3 h-3', config.color)} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm">{log.message}</span>
                        {log.source && (
                          <Badge variant="outline" className="text-[9px] h-4 shrink-0">
                            {log.source}
                          </Badge>
                        )}
                        {log.qualityScore != null && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[9px] h-4 shrink-0 gap-0.5',
                              log.qualityScore >= 80 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
                              log.qualityScore >= 50 ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
                              'bg-destructive/10 text-destructive border-destructive/30'
                            )}
                          >
                            <Star className="w-2.5 h-2.5" />
                            {log.qualityScore}%
                          </Badge>
                        )}
                      </div>

                      {/* Product details */}
                      {isExpanded && (log.productName || log.sku || log.url || log.details) && (
                        <div className="mt-1.5 p-2.5 bg-muted/40 rounded-lg space-y-1.5 text-[11px]">
                          {log.productName && (
                            <div className="flex items-center gap-1.5 text-foreground">
                              <Package className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="font-medium">{log.productName}</span>
                            </div>
                          )}
                          {log.sku && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Tag className="w-3 h-3 shrink-0" />
                              SKU: <span className="font-mono">{log.sku}</span>
                            </div>
                          )}
                          {log.url && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <a
                                href={log.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline truncate max-w-[300px] text-primary"
                                onClick={e => e.stopPropagation()}
                              >
                                {log.url}
                              </a>
                            </div>
                          )}
                          {log.details && (
                            <pre className="text-muted-foreground bg-muted/50 p-2 rounded overflow-x-auto whitespace-pre-wrap font-mono text-[10px]">
                              {log.details}
                            </pre>
                          )}
                          {log.retryable && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[10px] gap-1 mt-1"
                              onClick={(e) => { e.stopPropagation(); handleRetryItem(log) }}
                            >
                              <RotateCcw className="w-3 h-3" />
                              Retry cet élément
                            </Button>
                          )}
                        </div>
                      )}

                      <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: getDateFnsLocale() })}
                        {(log.details || log.productName) && (
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                            détails
                          </span>
                        )}
                        {log.retryable && (
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 px-1 text-[9px] gap-0.5"
                              onClick={(e) => { e.stopPropagation(); handleRetryItem(log) }}
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              retry
                            </Button>
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

/** Compute quality score for a job (0-100) */
function computeJobQuality(imp: any): number {
  const total = imp.items_total || imp.total_rows || 1
  const succeeded = imp.items_succeeded || imp.success_rows || 0
  const failed = imp.items_failed || imp.error_rows || 0
  const successRate = total > 0 ? (succeeded / total) * 100 : 0
  
  let score = successRate
  // Bonus for no errors
  if (failed === 0 && total > 0) score = Math.min(100, score + 5)
  // Penalty for high error rate
  if (total > 0 && failed / total > 0.2) score = Math.max(0, score - 10)
  
  return Math.round(score)
}
