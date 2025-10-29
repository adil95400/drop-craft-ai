import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  History, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trash2,
  FileText,
  Download
} from 'lucide-react'
import { useImportJobsReal } from '@/hooks/useImportJobsReal'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export function ImportJobHistory() {
  const { jobs, isLoading, deleteJob, isDeleting } = useImportJobsReal()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historique des Imports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <FileText className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      completed: { label: 'Terminé', className: 'bg-green-500' },
      failed: { label: 'Échoué', className: 'bg-red-500' },
      processing: { label: 'En cours', className: 'bg-blue-500' },
      pending: { label: 'En attente', className: 'bg-yellow-500' }
    }
    
    const variant = variants[status] || { label: status, className: 'bg-gray-500' }
    return <Badge className={variant.className}>{variant.label}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Historique des Imports
        </CardTitle>
        <CardDescription>
          {jobs.length} job(s) au total
        </CardDescription>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Aucun import pour le moment</p>
            <p className="text-sm">Vos imports apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(job.status)}
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {job.source_type || 'Import'}
                          </span>
                          {getStatusBadge(job.status)}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {job.source_url && (
                            <div className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              <span className="truncate max-w-md">{job.source_url}</span>
                            </div>
                          )}
                          <div className="mt-1">
                            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: fr })}
                          </div>
                        </div>

                        {/* Progress */}
                        {(job.status === 'processing' || job.status === 'completed') && job.total_rows > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>
                                {job.processed_rows} / {job.total_rows} lignes
                              </span>
                              <span className="text-muted-foreground">
                                {((job.processed_rows / job.total_rows) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <Progress 
                              value={(job.processed_rows / job.total_rows) * 100} 
                              className="h-2"
                            />
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs">
                          {job.success_rows > 0 && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              <span>{job.success_rows} réussis</span>
                            </div>
                          )}
                          {job.error_rows > 0 && (
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="w-3 h-3" />
                              <span>{job.error_rows} échoués</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {job.result_data && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Download results
                            const dataStr = JSON.stringify(job.result_data, null, 2)
                            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
                            const exportFileDefaultName = `import-${job.id}.json`
                            const linkElement = document.createElement('a')
                            linkElement.setAttribute('href', dataUri)
                            linkElement.setAttribute('download', exportFileDefaultName)
                            linkElement.click()
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteJob(job.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
