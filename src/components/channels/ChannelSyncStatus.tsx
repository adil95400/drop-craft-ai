/**
 * Indicateur de statut de synchronisation pour les canaux
 */

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  RefreshCw, CheckCircle2, AlertCircle, Clock, Loader2,
  WifiOff, Wifi, ArrowUpDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale'

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'pending'

interface ChannelSyncStatusProps {
  status: SyncStatus
  lastSyncAt?: string | null
  nextSyncAt?: string | null
  progress?: number
  productsCount?: number
  ordersCount?: number
  errorMessage?: string
  onSync?: () => void
  isLoading?: boolean
  compact?: boolean
}

export function ChannelSyncStatus({
  status,
  lastSyncAt,
  nextSyncAt,
  progress = 0,
  productsCount = 0,
  ordersCount = 0,
  errorMessage,
  onSync,
  isLoading,
  compact = false
}: ChannelSyncStatusProps) {
  const { t } = useTranslation(['common', 'channels'])
  const locale = useDateFnsLocale()
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    if (status === 'syncing') {
      const timer = setInterval(() => {
        setAnimatedProgress(prev => {
          if (prev >= 95) return prev
          return prev + Math.random() * 10
        })
      }, 500)
      return () => clearInterval(timer)
    } else if (status === 'success') {
      setAnimatedProgress(100)
    } else {
      setAnimatedProgress(0)
    }
  }, [status])

  const getStatusConfig = () => {
    switch (status) {
      case 'syncing':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          label: t('common:syncing'),
          color: 'bg-info/20 text-info border-info/30',
          bgColor: 'bg-info'
        }
      case 'success':
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          label: t('common:synced'),
          color: 'bg-success/20 text-success border-success/30',
          bgColor: 'bg-success'
        }
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          label: t('common:error'),
          color: 'bg-destructive/20 text-destructive border-destructive/30',
          bgColor: 'bg-destructive'
        }
      case 'pending':
        return {
          icon: <Clock className="h-4 w-4" />,
          label: t('common:pending'),
          color: 'bg-warning/20 text-warning border-warning/30',
          bgColor: 'bg-warning'
        }
      default:
        return {
          icon: <Wifi className="h-4 w-4" />,
          label: t('common:active'),
          color: 'bg-muted text-muted-foreground border-border',
          bgColor: 'bg-muted-foreground'
        }
    }
  }

  const config = getStatusConfig()

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={cn("gap-1 cursor-help", config.color)}>
              {config.icon}
              {config.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1 text-xs">
              {lastSyncAt && (
                <p>{t('common:lastSync')}: {formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true, locale })}</p>
              )}
              <p>{productsCount} {t('navigation:products').toLowerCase()} · {ordersCount} {t('navigation:orders').toLowerCase()}</p>
              {errorMessage && <p className="text-destructive">{errorMessage}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="space-y-3 p-4 rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={cn("gap-1", config.color)}>
            {config.icon}
            {config.label}
          </Badge>
          {status === 'syncing' && (
            <span className="text-sm text-muted-foreground">
              {Math.round(animatedProgress)}%
            </span>
          )}
        </div>
        
        {onSync && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={isLoading || status === 'syncing'}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", (isLoading || status === 'syncing') && "animate-spin")} />
            {t('common:sync')}
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {status === 'syncing' && (
        <Progress value={animatedProgress} className="h-2" />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{t('navigation:products')}:</span>
          <span className="font-medium">{productsCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{t('navigation:orders')}:</span>
          <span className="font-medium">{ordersCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Timestamps */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {lastSyncAt && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t('common:lastSync')}: {formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true, locale })}
          </div>
        )}
        {nextSyncAt && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(nextSyncAt), { addSuffix: true, locale })}
          </div>
        )}
      </div>

      {/* Error message */}
      {status === 'error' && errorMessage && (
        <div className="p-2 rounded bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {errorMessage}
        </div>
      )}
    </div>
  )
}

export default ChannelSyncStatus
