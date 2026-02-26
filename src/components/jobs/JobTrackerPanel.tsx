/**
 * JobTrackerPanel - Panneau de suivi temps réel des jobs FastAPI
 * Affiche la progression globale et les items individuels (job_items)
 * Utilise Supabase Realtime pour les mises à jour en direct
 */
import { useState } from 'react'
import { useApiJobs, useApiJobDetail } from '@/hooks/api/useApiJobs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Loader2, CheckCircle2, XCircle, Clock, 
  ChevronDown, ChevronRight, RotateCcw, X,
  Zap, RefreshCw, Package, Brain, Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

// Job type icons mapping
const JOB_ICONS: Record<string, React.ElementType> = {
  sync: RefreshCw,
  enrichment: Brain,
  import: Upload,
  export: Package,
  pricing: Zap,
  seo: Brain,
  delete: X,
  default: Zap,
}

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'bg-muted text-muted-foreground', icon: Clock },
  running: { label: 'En cours', color: 'bg-primary/15 text-primary', icon: Loader2 },
  completed: { label: 'Terminé', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  failed: { label: 'Échoué', color: 'bg-destructive/15 text-destructive', icon: XCircle },
  cancelled: { label: 'Annulé', color: 'bg-muted text-muted-foreground', icon: X },
}

export function JobTrackerPanel() {
  const { jobs, activeJobs, cancelJob, retryJob, isCancelling, isRetrying } = useApiJobs({ limit: 15 })
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)

  if (jobs.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4 text-center text-sm text-muted-foreground">
        Aucun job en cours ou récent.
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Jobs Backend</span>
          {activeJobs.length > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-primary/15 text-primary">
              {activeJobs.length} actif{activeJobs.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Jobs list */}
      <ScrollArea className="max-h-[400px]">
        <div className="divide-y">
          {jobs.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              isExpanded={expandedJobId === job.id}
              onToggle={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
              onCancel={() => cancelJob(job.id)}
              onRetry={() => retryJob(job.id)}
              isCancelling={isCancelling}
              isRetrying={isRetrying}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function JobRow({ job, isExpanded, onToggle, onCancel, onRetry, isCancelling, isRetrying }: {
  job: any
  isExpanded: boolean
  onToggle: () => void
  onCancel: () => void
  onRetry: () => void
  isCancelling: boolean
  isRetrying: boolean
}) {
  const statusConfig = STATUS_CONFIG[job.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
  const StatusIcon = statusConfig.icon
  const JobIcon = JOB_ICONS[job.job_type] || JOB_ICONS.default
  const isActive = job.status === 'running' || job.status === 'pending'

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div className={cn(
          'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors',
          isActive && 'bg-primary/5'
        )}>
          {/* Icon */}
          <div className="shrink-0">
            <JobIcon className={cn('h-4 w-4 text-muted-foreground', isActive && 'text-primary')} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate capitalize">
                {job.job_type?.replace(/_/g, ' ') || 'Job'}
              </span>
              <Badge className={cn('h-5 text-[10px] px-1.5 border-0', statusConfig.color)}>
                <StatusIcon className={cn('h-3 w-3 mr-1', job.status === 'running' && 'animate-spin')} />
                {statusConfig.label}
              </Badge>
            </div>

            {/* Progress bar for active jobs */}
            {isActive && (
              <div className="mt-1.5 flex items-center gap-2">
                <Progress value={job.progress_percent || 0} className="h-1.5 flex-1" />
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {job.processed_items}/{job.total_items} • {Math.round(job.progress_percent || 0)}%
                </span>
              </div>
            )}

            {/* Completed stats */}
            {job.status === 'completed' && (
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {job.processed_items} traités • {job.failed_items > 0 ? `${job.failed_items} erreurs` : 'aucune erreur'}
                {' • '}
                {formatDistanceToNow(new Date(job.updated_at), { addSuffix: true, locale: getDateFnsLocale() })}
              </div>
            )}

            {/* Error message */}
            {job.status === 'failed' && job.error_message && (
              <div className="mt-0.5 text-[11px] text-destructive truncate">
                {job.error_message}
              </div>
            )}
          </div>

          {/* Expand arrow */}
          <div className="shrink-0">
            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <JobDetailPanel
          jobId={job.id}
          jobStatus={job.status}
          onCancel={onCancel}
          onRetry={onRetry}
          isCancelling={isCancelling}
          isRetrying={isRetrying}
        />
      </CollapsibleContent>
    </Collapsible>
  )
}

function JobDetailPanel({ jobId, jobStatus, onCancel, onRetry, isCancelling, isRetrying }: {
  jobId: string
  jobStatus: string
  onCancel: () => void
  onRetry: () => void
  isCancelling: boolean
  isRetrying: boolean
}) {
  const { job, jobItems, isRunning, isFailed } = useApiJobDetail(jobId)

  return (
    <div className="px-4 pb-3 space-y-3 border-t bg-muted/10">
      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        {isRunning && (
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isCancelling} className="h-7 text-xs gap-1.5">
            <X className="h-3 w-3" />
            Annuler
          </Button>
        )}
        {isFailed && (
          <Button variant="outline" size="sm" onClick={onRetry} disabled={isRetrying} className="h-7 text-xs gap-1.5">
            <RotateCcw className="h-3 w-3" />
            Relancer
          </Button>
        )}
        {job && (
          <span className="text-[10px] text-muted-foreground ml-auto font-mono">
            ID: {jobId.slice(0, 8)}
          </span>
        )}
      </div>

      {/* Job Items */}
      {jobItems.length > 0 && (
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Détails par produit ({jobItems.length})
          </span>
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-1">
              {jobItems.map((item: any) => (
                <JobItemRow key={item.id} item={item} />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {jobItems.length === 0 && jobStatus !== 'pending' && (
        <p className="text-[11px] text-muted-foreground italic">Aucun détail disponible pour ce job.</p>
      )}
    </div>
  )
}

function JobItemRow({ item }: { item: any }) {
  const isSuccess = item.status === 'completed' || item.status === 'success'
  const isFail = item.status === 'failed' || item.status === 'error'

  return (
    <div className={cn(
      'flex items-center gap-2 px-2 py-1.5 rounded text-[11px]',
      isSuccess && 'bg-green-50 dark:bg-green-900/10',
      isFail && 'bg-destructive/5',
    )}>
      {isSuccess ? (
        <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
      ) : isFail ? (
        <XCircle className="h-3 w-3 text-destructive shrink-0" />
      ) : (
        <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />
      )}
      <span className="truncate flex-1 font-medium">
        {item.product_title || item.entity_name || item.item_id?.slice(0, 8) || 'Item'}
      </span>
      {isFail && item.error_message && (
        <span className="text-destructive truncate max-w-[150px]">{item.error_message}</span>
      )}
    </div>
  )
}
