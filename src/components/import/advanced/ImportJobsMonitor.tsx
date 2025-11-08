import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Activity, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { ImportJob } from '@/domains/commerce/services/importService'

interface ImportJobsMonitorProps {
  jobs: ImportJob[]
}

export const ImportJobsMonitor = ({ jobs }: ImportJobsMonitorProps) => {
  if (jobs.length === 0) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'processing':
        return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      processing: 'secondary',
      failed: 'destructive',
      pending: 'outline'
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  const calculateProgress = (job: ImportJob) => {
    if (job.total_rows && job.success_rows !== undefined) {
      return Math.round((job.success_rows / job.total_rows) * 100)
    }
    return 0
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary animate-pulse" />
          Imports en cours ({jobs.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobs.map((job) => {
          const progress = calculateProgress(job)
          
          return (
            <div key={job.id} className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(job.status)}
                  <span className="font-medium">
                    {job.source_type || 'Import'}
                  </span>
                </div>
                {getStatusBadge(job.status)}
              </div>

              {job.source_url && (
                <p className="text-xs text-muted-foreground truncate">
                  {job.source_url}
                </p>
              )}

              {job.status === 'processing' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{job.success_rows || 0} / {job.total_rows || 0} produits</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {job.status === 'completed' && (
                <div className="text-sm text-green-600">
                  ✓ {job.success_rows || 0} produits importés avec succès
                </div>
              )}

              {job.status === 'failed' && job.errors && job.errors.length > 0 && (
                <div className="text-sm text-red-600">
                  ✗ Échec : {job.errors[0]}
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Démarré {new Date(job.started_at || job.created_at).toLocaleString()}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
