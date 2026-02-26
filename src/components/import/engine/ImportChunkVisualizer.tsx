/**
 * ImportChunkVisualizer — Visualisation des chunks d'import parallèles
 * Affiche les morceaux de traitement en temps réel style CI/CD pipeline
 */
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Layers, CheckCircle2, XCircle, Loader2, Clock,
  ArrowRight, Cpu, Database, Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

interface ChunkData {
  id: string
  index: number
  status: 'queued' | 'processing' | 'completed' | 'failed'
  itemsCount: number
  processedCount: number
  startedAt?: string
  completedAt?: string
  errorMessage?: string
}

interface ActiveImport {
  id: string
  job_type?: string
  source_type?: string
  status: string
  items_total?: number | null
  items_processed?: number | null
  items_succeeded?: number | null
  items_failed?: number | null
  progress_percent?: number | null
  progress_message?: string | null
  created_at: string
  metadata?: any
}

interface ImportChunkVisualizerProps {
  activeImports: ActiveImport[]
  className?: string
}

export function ImportChunkVisualizer({ activeImports, className }: ImportChunkVisualizerProps) {
  // Generate chunks from active imports
  const imports = useMemo(() => {
    return activeImports.map(imp => {
      const total = imp.items_total || 0
      const processed = imp.items_processed || 0
      const chunkSize = Math.max(10, Math.ceil(total / 5))
      const chunks: ChunkData[] = []

      if (total > 0) {
        const numChunks = Math.ceil(total / chunkSize)
        for (let i = 0; i < numChunks; i++) {
          const chunkStart = i * chunkSize
          const chunkEnd = Math.min((i + 1) * chunkSize, total)
          const chunkItems = chunkEnd - chunkStart

          let status: ChunkData['status'] = 'queued'
          let chunkProcessed = 0
          if (processed >= chunkEnd) {
            status = 'completed'
            chunkProcessed = chunkItems
          } else if (processed > chunkStart) {
            status = 'processing'
            chunkProcessed = processed - chunkStart
          }

          chunks.push({
            id: `${imp.id}-chunk-${i}`,
            index: i,
            status,
            itemsCount: chunkItems,
            processedCount: chunkProcessed,
          })
        }
      }

      return { import: imp, chunks }
    })
  }, [activeImports])

  if (imports.length === 0) return null

  const statusIcons = {
    queued: Clock,
    processing: Loader2,
    completed: CheckCircle2,
    failed: XCircle,
  }

  const statusColors = {
    queued: 'bg-muted text-muted-foreground border-border',
    processing: 'bg-primary/10 text-primary border-primary/30',
    completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    failed: 'bg-destructive/10 text-destructive border-destructive/30',
  }

  return (
    <Card className={cn('border-2 border-primary/10', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="w-5 h-5 text-primary" />
          Pipeline d'import parallèle
          <Badge variant="outline" className="ml-auto text-[10px]">
            {imports.length} job{imports.length > 1 ? 's' : ''} actif{imports.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-4">
            {imports.map(({ import: imp, chunks }) => {
              const progress = imp.progress_percent ?? 0
              const succeeded = imp.items_succeeded ?? 0
              const failed = imp.items_failed ?? 0

              return (
                <div key={imp.id} className="space-y-3">
                  {/* Job header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-primary/10 rounded-lg">
                        <Cpu className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {imp.source_type || imp.job_type || 'Import'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(imp.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      {succeeded > 0 && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <Database className="w-3 h-3" />
                          {succeeded} OK
                        </span>
                      )}
                      {failed > 0 && (
                        <span className="flex items-center gap-1 text-destructive">
                          <XCircle className="w-3 h-3" />
                          {failed}
                        </span>
                      )}
                      <Badge variant="secondary" className="text-[10px]">
                        {Math.round(progress)}%
                      </Badge>
                    </div>
                  </div>

                  {/* Global progress */}
                  <Progress value={progress} className="h-1.5" />

                  {/* Pipeline visualization */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {chunks.map((chunk, i) => {
                      const Icon = statusIcons[chunk.status]
                      const colors = statusColors[chunk.status]
                      const chunkProgress = chunk.itemsCount > 0
                        ? Math.round((chunk.processedCount / chunk.itemsCount) * 100)
                        : 0

                      return (
                        <div key={chunk.id} className="flex items-center gap-1.5 shrink-0">
                          <div
                            className={cn(
                              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all',
                              colors,
                              chunk.status === 'processing' && 'ring-1 ring-primary/30 shadow-sm'
                            )}
                          >
                            <Icon className={cn(
                              'w-3.5 h-3.5',
                              chunk.status === 'processing' && 'animate-spin'
                            )} />
                            <span>#{i + 1}</span>
                            {chunk.status === 'processing' && (
                              <span className="text-[10px] opacity-70">{chunkProgress}%</span>
                            )}
                            {chunk.status === 'completed' && (
                              <span className="text-[10px] opacity-70">{chunk.itemsCount}</span>
                            )}
                          </div>
                          {i < chunks.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Message */}
                  {imp.progress_message && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {imp.progress_message}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
