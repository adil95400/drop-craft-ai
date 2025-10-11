import { useEffect } from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Clock, 
  Package,
  AlertTriangle,
  Pause,
  Play
} from 'lucide-react'
import { ImportJobStatus } from '@/services/UnifiedImportService'

interface ImportProgressProps {
  job: ImportJobStatus
  onCancel?: () => void
  onRetry?: () => void
}

export const ImportProgress = ({ job, onCancel, onRetry }: ImportProgressProps) => {
  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-destructive" />
      case 'processing':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusBadge = () => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      processing: 'default',
      completed: 'outline',
      failed: 'destructive'
    }
    
    const labels: Record<string, string> = {
      pending: 'En attente',
      processing: 'En cours',
      completed: 'Terminé',
      failed: 'Échoué'
    }

    return (
      <Badge variant={variants[job.status] || 'default'}>
        {labels[job.status] || job.status}
      </Badge>
    )
  }

  const calculateProgress = () => {
    if (!job.total_rows || job.total_rows === 0) return 0
    return Math.round((job.processed_rows / job.total_rows) * 100)
  }

  const formatDuration = () => {
    if (!job.started_at) return null
    
    const endTime = job.completed_at ? new Date(job.completed_at) : new Date()
    const startTime = new Date(job.started_at)
    const durationMs = endTime.getTime() - startTime.getTime()
    const durationSec = Math.floor(durationMs / 1000)
    
    if (durationSec < 60) return `${durationSec}s`
    const minutes = Math.floor(durationSec / 60)
    const seconds = durationSec % 60
    return `${minutes}m ${seconds}s`
  }

  const progress = calculateProgress()
  const duration = formatDuration()

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg">
                Import {job.source_type?.toUpperCase()}
              </CardTitle>
              <CardDescription>
                {job.source_url && (
                  <span className="text-xs truncate max-w-[300px] block">
                    {job.source_url}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar */}
        {job.status === 'processing' && job.total_rows > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{job.total_rows || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Réussis
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{job.success_rows || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Erreurs
            </p>
            <p className="text-2xl font-bold text-destructive">{job.error_rows || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Durée
            </p>
            <p className="text-2xl font-bold">{duration || '-'}</p>
          </div>
        </div>

        {/* Errors */}
        {job.errors && job.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-semibold">Erreurs détectées :</p>
                <ul className="list-disc list-inside space-y-1">
                  {job.errors.slice(0, 3).map((error, idx) => (
                    <li key={idx} className="text-sm">{error}</li>
                  ))}
                  {job.errors.length > 3 && (
                    <li className="text-sm">... et {job.errors.length - 3} autres erreurs</li>
                  )}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {job.status === 'failed' && onRetry && (
            <Button onClick={onRetry} size="sm" variant="outline">
              <Play className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          )}
          {job.status === 'processing' && onCancel && (
            <Button onClick={onCancel} size="sm" variant="outline">
              <Pause className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
