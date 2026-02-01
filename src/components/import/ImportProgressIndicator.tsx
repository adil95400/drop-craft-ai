/**
 * ImportProgressIndicator - Composant de suivi d'import temps réel
 * Affiche la progression, l'état de connexion et les notifications
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Wifi, 
  WifiOff,
  Sparkles,
  X,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ImportStatus, ImportProgress } from '@/hooks/import/useUnifiedImport'

interface ImportProgressIndicatorProps {
  status: ImportStatus
  progress: ImportProgress
  isConnected?: boolean
  onCancel?: () => void
  className?: string
  showDetails?: boolean
}

const statusConfig: Record<ImportStatus, { 
  icon: React.ElementType
  color: string
  labelKey: string
}> = {
  idle: { icon: Clock, color: 'text-muted-foreground', labelKey: 'import.status.idle' },
  detecting: { icon: Loader2, color: 'text-blue-500', labelKey: 'import.status.detecting' },
  validating: { icon: Loader2, color: 'text-blue-500', labelKey: 'import.status.validating' },
  processing: { icon: Loader2, color: 'text-primary', labelKey: 'import.status.processing' },
  enriching: { icon: Sparkles, color: 'text-purple-500', labelKey: 'import.status.enriching' },
  completed: { icon: CheckCircle2, color: 'text-green-500', labelKey: 'import.status.completed' },
  failed: { icon: XCircle, color: 'text-destructive', labelKey: 'import.status.failed' },
  partial: { icon: AlertTriangle, color: 'text-yellow-500', labelKey: 'import.status.partial' }
}

export function ImportProgressIndicator({
  status,
  progress,
  isConnected = true,
  onCancel,
  className,
  showDetails = true
}: ImportProgressIndicatorProps) {
  const { t } = useTranslation()
  
  const config = statusConfig[status]
  const Icon = config.icon
  const isActive = ['detecting', 'validating', 'processing', 'enriching'].includes(status)
  const progressPercent = progress.total > 0 
    ? Math.round((progress.processed / progress.total) * 100) 
    : 0

  if (status === 'idle') return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={className}
      >
        <Card className="p-4 border-2 border-primary/20 bg-card/95 backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon 
                className={cn(
                  'w-5 h-5',
                  config.color,
                  isActive && 'animate-spin'
                )} 
                aria-hidden="true"
              />
              <span className="font-medium" role="status" aria-live="polite">
                {t(config.labelKey, status)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Connection indicator */}
              <Badge 
                variant={isConnected ? 'outline' : 'destructive'} 
                className="gap-1"
                aria-label={isConnected ? t('common.connected') : t('common.disconnected')}
              >
                {isConnected ? (
                  <Wifi className="w-3 h-3" aria-hidden="true" />
                ) : (
                  <WifiOff className="w-3 h-3" aria-hidden="true" />
                )}
                <span className="sr-only sm:not-sr-only">
                  {isConnected ? t('common.online') : t('common.offline')}
                </span>
              </Badge>
              
              {/* Cancel button */}
              {isActive && onCancel && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCancel}
                  aria-label={t('common.cancel')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <Progress 
            value={progressPercent} 
            className="h-2 mb-3"
            aria-label={t('import.progress', 'Progression de l\'import')}
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          />

          {/* Stats */}
          {showDetails && (
            <div 
              className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm"
              aria-label={t('import.statistics', 'Statistiques d\'import')}
            >
              <StatItem 
                label={t('common.total')} 
                value={progress.total} 
              />
              <StatItem 
                label={t('import.processed', 'Traités')} 
                value={progress.processed}
                highlight={isActive}
              />
              <StatItem 
                label={t('import.successful', 'Réussis')} 
                value={progress.successful}
                className="text-green-600 dark:text-green-400"
              />
              <StatItem 
                label={t('import.failed', 'Échoués')} 
                value={progress.failed}
                className={progress.failed > 0 ? 'text-destructive' : undefined}
              />
            </div>
          )}

          {/* AI Enrichment indicator */}
          {status === 'enriching' && progress.enriched > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>
                {t('import.enrichedProducts', '{{count}} produits enrichis par IA', { 
                  count: progress.enriched 
                })}
              </span>
            </motion.div>
          )}

          {/* ETA */}
          {isActive && progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              {t('import.eta', 'Temps restant estimé: {{time}}', {
                time: formatDuration(progress.estimatedTimeRemaining)
              })}
            </div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

// Sub-component for stats
function StatItem({ 
  label, 
  value, 
  className,
  highlight 
}: { 
  label: string
  value: number
  className?: string
  highlight?: boolean
}) {
  return (
    <div className={cn('text-center p-2 rounded-md bg-muted/50', className)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn(
        'font-semibold tabular-nums',
        highlight && 'animate-pulse'
      )}>
        {value.toLocaleString()}
      </div>
    </div>
  )
}

// Format duration in human-readable format
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

export default ImportProgressIndicator
