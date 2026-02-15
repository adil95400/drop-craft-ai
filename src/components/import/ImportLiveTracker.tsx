/**
 * ImportLiveTracker - Composant de suivi en temps réel des imports
 * Affiche progression Realtime, statuts détaillés et liens vers produits créés
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Loader2, CheckCircle2, XCircle, Clock, Package,
  ExternalLink, X, ChevronDown, ChevronUp, RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'

interface ImportJob {
  id: string
  job_type: string
  status: string
  items_total: number | null
  items_processed: number | null
  items_succeeded: number | null
  items_failed: number | null
  progress_percent: number | null
  progress_message: string | null
  error_message: string | null
  created_at: string
  updated_at: string
  metadata: any
  output_data: any
}

import { Sparkles } from 'lucide-react'

const STATUS_MAP: Record<string, { label: string; icon: typeof CheckCircle2; color: string; pulse?: boolean }> = {
  pending: { label: 'En attente', icon: Clock, color: 'text-amber-500' },
  running: { label: 'Import en cours', icon: Loader2, color: 'text-primary', pulse: true },
  processing: { label: 'Traitement', icon: Loader2, color: 'text-primary', pulse: true },
  completed: { label: 'Terminé', icon: CheckCircle2, color: 'text-green-500' },
  failed: { label: 'Échoué', icon: XCircle, color: 'text-destructive' },
  cancelled: { label: 'Annulé', icon: X, color: 'text-muted-foreground' },
}

export function ImportLiveTracker() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(true)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  // Fetch recent import jobs
  const { data: jobs = [] } = useQuery({
    queryKey: ['import-live-jobs', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .in('job_type', ['import', 'bulk_import', 'csv_import', 'url_import', 'ai_enrich'])
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) return []
      return (data || []).map((j: any) => ({
        ...j,
        items_total: j.total_items,
        items_processed: j.processed_items,
        items_succeeded: (j.processed_items || 0) - (j.failed_items || 0),
        items_failed: j.failed_items,
      })) as ImportJob[]
    },
    enabled: !!user,
    refetchInterval: 5000,
  })

  // Realtime subscription
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('import-live-tracker')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['import-live-jobs'] })
          queryClient.invalidateQueries({ queryKey: ['import-history'] })
          queryClient.invalidateQueries({ queryKey: ['imported-products'] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, queryClient])

  // Filter out dismissed and show only recent (last 24h)
  const cutoff = Date.now() - 24 * 60 * 60 * 1000
  const visibleJobs = jobs.filter(j =>
    !dismissedIds.has(j.id) &&
    new Date(j.created_at).getTime() > cutoff
  )

  const activeJobs = visibleJobs.filter(j => j.status === 'running' || j.status === 'pending' || j.status === 'processing')
  const recentDoneJobs = visibleJobs.filter(j => j.status === 'completed' || j.status === 'failed').slice(0, 5)

  if (visibleJobs.length === 0) return null

  return (
    <Card className="border-primary/20 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-primary/5 hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          {activeJobs.length > 0 ? (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          ) : (
            <Package className="h-4 w-4 text-primary" />
          )}
          <span className="font-medium text-sm">
            {activeJobs.length > 0
              ? `${activeJobs.length} import${activeJobs.length > 1 ? 's' : ''} en cours`
              : 'Imports récents'
            }
          </span>
          {recentDoneJobs.length > 0 && activeJobs.length === 0 && (
            <Badge variant="secondary" className="text-[10px] h-5">
              {recentDoneJobs.length} terminé{recentDoneJobs.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="p-0">
              <ScrollArea className="max-h-[300px]">
                <div className="divide-y divide-border/50">
                  {/* Active jobs first */}
                  {activeJobs.map(job => (
                    <ImportJobRow
                      key={job.id}
                      job={job}
                      onDismiss={() => setDismissedIds(prev => new Set([...prev, job.id]))}
                      onViewProducts={() => navigate('/products')}
                    />
                  ))}
                  {/* Recent completed/failed */}
                  {recentDoneJobs.map(job => (
                    <ImportJobRow
                      key={job.id}
                      job={job}
                      onDismiss={() => setDismissedIds(prev => new Set([...prev, job.id]))}
                      onViewProducts={() => navigate('/products')}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

function ImportJobRow({ job, onDismiss, onViewProducts }: {
  job: ImportJob
  onDismiss: () => void
  onViewProducts: () => void
}) {
  const statusConfig = STATUS_MAP[job.status] || STATUS_MAP.pending
  const StatusIcon = statusConfig.icon
  const isActive = job.status === 'running' || job.status === 'pending' || job.status === 'processing'
  const progress = job.progress_percent ?? 0
  const succeeded = job.items_succeeded ?? 0
  const failed = job.items_failed ?? 0
  const total = job.items_total ?? 0
  const processed = job.items_processed ?? 0

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 transition-colors',
      isActive && 'bg-primary/5'
    )}>
      {/* Status icon */}
      <div className={cn(
        'p-1.5 rounded-lg shrink-0',
        isActive ? 'bg-primary/10' : job.status === 'completed' ? 'bg-green-500/10' : 'bg-destructive/10'
      )}>
        <StatusIcon className={cn(
          'h-4 w-4',
          statusConfig.color,
          statusConfig.pulse && 'animate-spin'
        )} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {job.progress_message || statusConfig.label}
          </span>
          <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5 shrink-0", job.job_type === 'ai_enrich' && 'border-violet-300 text-violet-600')}>
            {job.job_type === 'ai_enrich' ? '✨ IA' : job.job_type?.replace(/_/g, ' ')}
          </Badge>
        </div>

        {/* Progress bar for active */}
        {isActive && (
          <div className="flex items-center gap-2">
            <Progress value={progress} className="h-1.5 flex-1" />
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
              {Math.round(progress)}%
            </span>
          </div>
        )}

        {/* Stats line */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {total > 0 && (
            <span>{processed}/{total} traités</span>
          )}
          {succeeded > 0 && (
            <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3" />
              {succeeded} réussis
            </span>
          )}
          {failed > 0 && (
            <span className="flex items-center gap-0.5 text-destructive">
              <XCircle className="h-3 w-3" />
              {failed} erreurs
            </span>
          )}
          <span className="ml-auto">
            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: fr })}
          </span>
        </div>

        {/* Error message */}
        {job.status === 'failed' && job.error_message && (
          <p className="text-[11px] text-destructive truncate">{job.error_message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {job.status === 'completed' && succeeded > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-primary"
            onClick={onViewProducts}
          >
            <ExternalLink className="h-3 w-3" />
            Voir produits
          </Button>
        )}
        {!isActive && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onDismiss}
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  )
}
