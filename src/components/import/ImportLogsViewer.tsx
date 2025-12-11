import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  AlertCircle, CheckCircle, Clock, XCircle, 
  ChevronDown, ChevronUp, Download, Trash2,
  Info, AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export interface ImportLogEntry {
  id: string
  timestamp: Date
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
  details?: string
  productName?: string
  row?: number
}

interface ImportLogsViewerProps {
  logs: ImportLogEntry[]
  maxHeight?: string
  onClearLogs?: () => void
  onExportLogs?: () => void
  autoScroll?: boolean
  className?: string
}

export function ImportLogsViewer({ 
  logs, 
  maxHeight = '300px',
  onClearLogs,
  onExportLogs,
  autoScroll = true,
  className
}: ImportLogsViewerProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'success'>('all')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true
    return log.level === filter
  })

  const logCounts = {
    total: logs.length,
    errors: logs.filter(l => l.level === 'error').length,
    warnings: logs.filter(l => l.level === 'warning').length,
    success: logs.filter(l => l.level === 'success').length
  }

  const getLevelIcon = (level: ImportLogEntry['level']) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
      default:
        return <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
    }
  }

  const getLevelBg = (level: ImportLogEntry['level']) => {
    switch (level) {
      case 'success':
        return 'bg-green-500/10 border-l-green-500'
      case 'error':
        return 'bg-destructive/10 border-l-destructive'
      case 'warning':
        return 'bg-yellow-500/10 border-l-yellow-500'
      default:
        return 'bg-blue-500/10 border-l-blue-500'
    }
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Logs d'Import</CardTitle>
            <Badge variant="outline" className="text-xs">
              {logCounts.total} entrées
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtres */}
            <div className="flex gap-1">
              <Button
                variant={filter === 'all' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setFilter('all')}
              >
                Tous
              </Button>
              {logCounts.errors > 0 && (
                <Button
                  variant={filter === 'error' ? 'destructive' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => setFilter('error')}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  {logCounts.errors}
                </Button>
              )}
              {logCounts.warnings > 0 && (
                <Button
                  variant={filter === 'warning' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => setFilter('warning')}
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {logCounts.warnings}
                </Button>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-1">
              {onExportLogs && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={onExportLogs}
                >
                  <Download className="w-3 h-3" />
                </Button>
              )}
              {onClearLogs && logs.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={onClearLogs}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          <ScrollArea 
            ref={scrollRef}
            className="w-full" 
            style={{ maxHeight }}
          >
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">Aucun log à afficher</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      "flex items-start gap-3 p-3 border-l-2 transition-colors",
                      getLevelBg(log.level)
                    )}
                  >
                    {getLevelIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground font-mono">
                          {format(log.timestamp, 'HH:mm:ss', { locale: fr })}
                        </span>
                        {log.row && (
                          <Badge variant="outline" className="text-xs h-5">
                            Ligne {log.row}
                          </Badge>
                        )}
                        {log.productName && (
                          <Badge variant="secondary" className="text-xs h-5 truncate max-w-[150px]">
                            {log.productName}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm mt-1">{log.message}</p>
                      {log.details && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  )
}
