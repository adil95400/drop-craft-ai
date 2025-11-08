import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History, CheckCircle2, XCircle, Package } from 'lucide-react'
import { ImportJob } from '@/domains/commerce/services/importService'
import { ImportedProductData } from '@/domains/commerce/services/importService'

interface ImportHistoryTimelineProps {
  jobs: ImportJob[]
  products: ImportedProductData[]
}

export const ImportHistoryTimeline = ({ jobs, products }: ImportHistoryTimelineProps) => {
  const recentJobs = jobs.slice(0, 20)

  return (
    <div className="space-y-6">
      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{jobs.length}</p>
                <p className="text-xs text-muted-foreground">Imports totaux</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {jobs.filter(j => j.status === 'completed').length}
                </p>
                <p className="text-xs text-muted-foreground">Réussis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">{products.length}</p>
                <p className="text-xs text-muted-foreground">Produits importés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique récent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentJobs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun import pour le moment
              </p>
            ) : (
              recentJobs.map((job, index) => (
                <div key={job.id} className="flex gap-4 pb-4 border-b last:border-0">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div className={`rounded-full p-2 ${
                      job.status === 'completed' 
                        ? 'bg-green-100' 
                        : job.status === 'failed' 
                        ? 'bg-red-100' 
                        : 'bg-gray-100'
                    }`}>
                      {job.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : job.status === 'failed' ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <History className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    {index < recentJobs.length - 1 && (
                      <div className="w-0.5 h-full bg-border mt-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{job.source_type || 'Import'}</span>
                        <Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'outline'}>
                          {job.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(job.completed_at || job.created_at).toLocaleDateString()} à{' '}
                        {new Date(job.completed_at || job.created_at).toLocaleTimeString()}
                      </span>
                    </div>

                    {job.source_url && (
                      <p className="text-sm text-muted-foreground truncate">
                        {job.source_url}
                      </p>
                    )}

                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {job.total_rows && (
                        <span>Total: {job.total_rows}</span>
                      )}
                      {job.success_rows !== undefined && (
                        <span className="text-green-600">✓ {job.success_rows}</span>
                      )}
                      {job.error_rows !== undefined && job.error_rows > 0 && (
                        <span className="text-red-600">✗ {job.error_rows}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
