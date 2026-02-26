import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { importJobsApi } from '@/services/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale'

export const ImportHistoryTab = () => {
  const locale = useDateFnsLocale()
  const { user } = useAuth()

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['import-history', user?.id],
    queryFn: async () => {
      const resp = await importJobsApi.list({ per_page: 20 })
      return resp.items || []
    },
    enabled: !!user?.id,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des Imports</CardTitle>
        <CardDescription>
          Consultez l'historique complet de vos imports
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          )}
          {!isLoading && jobs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun historique d'import
            </div>
          )}
          {jobs.map((job: any) => (
            <div key={job.job_id || job.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {format(new Date(job.created_at), 'dd MMM yyyy HH:mm', { locale })}
                </div>
                <div className="font-medium">{job.name || job.job_type || job.source}</div>
                <div className="text-sm">
                  {(job.progress?.total ?? job.items_total) ? `${job.progress?.total ?? job.items_total} produits` : '—'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={
                  job.status === 'completed' ? 'default' : 
                  job.status === 'failed' ? 'destructive' : 'secondary'
                }>
                  {job.status === 'completed' ? 'Terminé' : 
                   job.status === 'failed' ? 'Échec' : job.status}
                </Badge>
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
