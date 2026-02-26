/**
 * ImportMonitor — Monitors active import jobs via API V1 polling
 * No realtime subscriptions. Uses importJobsApi.list with refetchInterval.
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, Loader2, CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { importJobsApi } from '@/services/api/client'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

interface ImportMonitorProps {
  className?: string
  maxHeight?: number
  showEmpty?: boolean
}

interface ImportJob {
  id: string
  status: string
  progress: number
  totalProducts: number
  successfulImports: number
  failedImports: number
  sourcePlatform: string
  createdAt: Date
}

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  processing: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
  partial: AlertTriangle,
  cancelled: XCircle
}

const statusColors: Record<string, string> = {
  pending: 'text-muted-foreground',
  processing: 'text-blue-500',
  completed: 'text-green-500',
  failed: 'text-destructive',
  partial: 'text-yellow-500',
  cancelled: 'text-muted-foreground'
}

export function RealtimeImportMonitor({ 
  className, 
  maxHeight = 300,
  showEmpty = false 
}: ImportMonitorProps) {
  const { t } = useTranslation()

  const { data: activeJobs = [], refetch, dataUpdatedAt } = useQuery({
    queryKey: ['import-jobs-active'],
    queryFn: async () => {
      try {
        const resp = await importJobsApi.list({ status: 'processing', per_page: 20 })
        return (resp.items ?? []).map((item: any): ImportJob => ({
          id: item.job_id ?? item.id,
          status: item.status,
          progress: item.progress?.percent ?? 0,
          totalProducts: item.progress?.total ?? item.items_total ?? 0,
          successfulImports: item.progress?.success ?? item.items_succeeded ?? 0,
          failedImports: item.progress?.failed ?? item.items_failed ?? 0,
          sourcePlatform: item.source ?? item.job_subtype ?? 'import',
          createdAt: new Date(item.created_at),
        }))
      } catch {
        return []
      }
    },
    refetchInterval: 5000,
  })

  const hasActiveJobs = activeJobs.length > 0
  if (!hasActiveJobs && !showEmpty) return null

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className={cn('w-4 h-4', hasActiveJobs ? 'text-primary animate-pulse' : 'text-muted-foreground')} />
          <span className="text-sm font-medium">{t('import.activeJobs', 'Imports en cours')}</span>
          {hasActiveJobs && <Badge variant="secondary" className="ml-1">{activeJobs.length}</Badge>}
        </div>
        <button onClick={() => refetch()} className="p-1 hover:bg-muted rounded-md transition-colors">
          <RefreshCw className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      <ScrollArea style={{ maxHeight }} className="rounded-md border">
        <AnimatePresence mode="popLayout">
          {activeJobs.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 text-center text-sm text-muted-foreground">
              {t('import.noActiveJobs', 'Aucun import en cours')}
            </motion.div>
          ) : (
            <div className="p-2 space-y-2">
              {activeJobs.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>

      {dataUpdatedAt > 0 && (
        <div className="text-xs text-muted-foreground text-right">
          {t('common.lastSync', 'Dernière MAJ')}: {formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true, locale: getDateFnsLocale() })}
        </div>
      )}
    </div>
  )
}

function JobCard({ job }: { job: ImportJob }) {
  const { t } = useTranslation()
  const Icon = statusIcons[job.status] || Loader2
  const colorClass = statusColors[job.status] || 'text-muted-foreground'
  const isActive = job.status === 'processing' || job.status === 'pending'

  return (
    <motion.div layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className={cn('p-3 rounded-lg border bg-card', isActive && 'border-primary/30 bg-primary/5')}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4', colorClass, job.status === 'processing' && 'animate-spin')} />
          <span className="text-sm font-medium capitalize">{job.sourcePlatform}</span>
        </div>
        <Badge variant="outline" className="text-xs">{job.progress}%</Badge>
      </div>
      <Progress value={job.progress} className="h-1.5 mb-2" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{job.successfulImports}/{job.totalProducts} {t('import.products', 'produits')}</span>
        <span>{formatDistanceToNow(job.createdAt, { addSuffix: true, locale: getDateFnsLocale() })}</span>
      </div>
      {job.failedImports > 0 && (
        <div className="mt-1 text-xs text-destructive">
          {t('import.failedCount', '{{count}} échecs', { count: job.failedImports })}
        </div>
      )}
    </motion.div>
  )
}

export default RealtimeImportMonitor
