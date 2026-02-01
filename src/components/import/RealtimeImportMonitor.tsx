/**
 * RealtimeImportMonitor - Moniteur global des imports en cours
 * Affiche tous les jobs actifs avec suivi temps réel
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Clock,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useImportRealtime, RealtimeImportJob } from '@/hooks/import/useImportRealtime'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface RealtimeImportMonitorProps {
  className?: string
  maxHeight?: number
  showEmpty?: boolean
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
}: RealtimeImportMonitorProps) {
  const { t } = useTranslation()
  const { 
    isConnected, 
    activeJobs, 
    lastUpdate, 
    refresh,
    hasActiveJobs 
  } = useImportRealtime({ showNotifications: false })

  if (!hasActiveJobs && !showEmpty) return null

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity 
            className={cn(
              'w-4 h-4',
              hasActiveJobs ? 'text-primary animate-pulse' : 'text-muted-foreground'
            )} 
            aria-hidden="true"
          />
          <span className="text-sm font-medium">
            {t('import.activeJobs', 'Imports en cours')}
          </span>
          {hasActiveJobs && (
            <Badge variant="secondary" className="ml-1">
              {activeJobs.length}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Connection status */}
          <div 
            className={cn(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-red-500'
            )}
            aria-label={isConnected ? t('common.connected') : t('common.disconnected')}
          />
          
          {/* Refresh button */}
          <button
            onClick={refresh}
            className="p-1 hover:bg-muted rounded-md transition-colors"
            aria-label={t('common.refresh')}
          >
            <RefreshCw className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Jobs list */}
      <ScrollArea style={{ maxHeight }} className="rounded-md border">
        <AnimatePresence mode="popLayout">
          {activeJobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 text-center text-sm text-muted-foreground"
            >
              {t('import.noActiveJobs', 'Aucun import en cours')}
            </motion.div>
          ) : (
            <div className="p-2 space-y-2">
              {activeJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>

      {/* Last update */}
      {lastUpdate && (
        <div className="text-xs text-muted-foreground text-right">
          {t('common.lastSync')}: {formatDistanceToNow(lastUpdate, { 
            addSuffix: true, 
            locale: fr 
          })}
        </div>
      )}
    </div>
  )
}

// Individual job card
function JobCard({ job }: { job: RealtimeImportJob }) {
  const { t } = useTranslation()
  const Icon = statusIcons[job.status] || Loader2
  const colorClass = statusColors[job.status] || 'text-muted-foreground'
  const isActive = job.status === 'processing' || job.status === 'pending'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'p-3 rounded-lg border bg-card',
        isActive && 'border-primary/30 bg-primary/5'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon 
            className={cn(
              'w-4 h-4',
              colorClass,
              job.status === 'processing' && 'animate-spin'
            )} 
          />
          <span className="text-sm font-medium capitalize">
            {job.sourcePlatform}
          </span>
        </div>
        <Badge variant="outline" className="text-xs">
          {job.progress}%
        </Badge>
      </div>

      <Progress value={job.progress} className="h-1.5 mb-2" />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {job.successfulImports}/{job.totalProducts} {t('import.products', 'produits')}
        </span>
        <span>
          {formatDistanceToNow(job.createdAt, { addSuffix: true, locale: fr })}
        </span>
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
