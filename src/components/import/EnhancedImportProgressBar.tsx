import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, XCircle, Clock, Loader2, 
  Pause, Play, X, AlertTriangle,
  Package, FileText, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ImportProgressState {
  status: 'idle' | 'preparing' | 'processing' | 'paused' | 'completed' | 'failed' | 'cancelled'
  currentStep: string
  totalItems: number
  processedItems: number
  successItems: number
  failedItems: number
  currentItemName?: string
  estimatedTimeRemaining?: number // in seconds
  startedAt?: Date
}

interface EnhancedImportProgressBarProps {
  state: ImportProgressState
  onPause?: () => void
  onResume?: () => void
  onCancel?: () => void
  onRetry?: () => void
  className?: string
}

export function EnhancedImportProgressBar({
  state,
  onPause,
  onResume,
  onCancel,
  onRetry,
  className
}: EnhancedImportProgressBarProps) {
  const [elapsedTime, setElapsedTime] = useState(0)

  // Calculate progress percentage
  const progress = state.totalItems > 0 
    ? Math.round((state.processedItems / state.totalItems) * 100) 
    : 0

  // Update elapsed time
  useEffect(() => {
    if (state.status === 'processing' && state.startedAt) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - state.startedAt!.getTime()) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [state.status, state.startedAt])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusConfig = () => {
    switch (state.status) {
      case 'preparing':
        return {
          icon: <Clock className="w-5 h-5 text-blue-600 animate-pulse" />,
          label: 'Préparation...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-500/10'
        }
      case 'processing':
        return {
          icon: <Loader2 className="w-5 h-5 text-primary animate-spin" />,
          label: 'Import en cours',
          color: 'text-primary',
          bgColor: 'bg-primary/10'
        }
      case 'paused':
        return {
          icon: <Pause className="w-5 h-5 text-yellow-600" />,
          label: 'En pause',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-500/10'
        }
      case 'completed':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          label: 'Terminé',
          color: 'text-green-600',
          bgColor: 'bg-green-500/10'
        }
      case 'failed':
        return {
          icon: <XCircle className="w-5 h-5 text-destructive" />,
          label: 'Échec',
          color: 'text-destructive',
          bgColor: 'bg-destructive/10'
        }
      case 'cancelled':
        return {
          icon: <X className="w-5 h-5 text-muted-foreground" />,
          label: 'Annulé',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted'
        }
      default:
        return {
          icon: <FileText className="w-5 h-5 text-muted-foreground" />,
          label: 'Prêt',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted'
        }
    }
  }

  const statusConfig = getStatusConfig()

  if (state.status === 'idle') {
    return null
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", statusConfig.bgColor)}>
              {statusConfig.icon}
            </div>
            <div>
              <CardTitle className="text-base">{statusConfig.label}</CardTitle>
              <p className="text-sm text-muted-foreground">{state.currentStep}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {state.status === 'processing' && onPause && (
              <Button variant="ghost" size="sm" onClick={onPause}>
                <Pause className="w-4 h-4" />
              </Button>
            )}
            {state.status === 'paused' && onResume && (
              <Button variant="ghost" size="sm" onClick={onResume}>
                <Play className="w-4 h-4" />
              </Button>
            )}
            {(state.status === 'processing' || state.status === 'paused') && onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="w-4 h-4" />
              </Button>
            )}
            {state.status === 'failed' && onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                Réessayer
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress 
            value={progress} 
            className={cn(
              "h-3 transition-all",
              state.status === 'failed' && "[&>div]:bg-destructive",
              state.status === 'completed' && "[&>div]:bg-green-500"
            )}
          />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Package className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-medium text-sm">{state.totalItems}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Zap className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Traités</p>
              <p className="font-medium text-sm">{state.processedItems}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Succès</p>
              <p className="font-medium text-sm text-green-600">{state.successItems}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <div>
              <p className="text-xs text-muted-foreground">Erreurs</p>
              <p className="font-medium text-sm text-destructive">{state.failedItems}</p>
            </div>
          </div>
        </div>

        {/* Current item and timing */}
        {(state.currentItemName || elapsedTime > 0) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
            {state.currentItemName && (
              <p className="text-muted-foreground truncate flex-1">
                <span className="font-medium">En cours:</span> {state.currentItemName}
              </p>
            )}
            <div className="flex items-center gap-3 text-muted-foreground">
              {elapsedTime > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(elapsedTime)}
                </span>
              )}
              {state.estimatedTimeRemaining && state.status === 'processing' && (
                <span className="text-xs">
                  ~{formatTime(state.estimatedTimeRemaining)} restant
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
