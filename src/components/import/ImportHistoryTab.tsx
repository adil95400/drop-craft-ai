import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const ImportHistoryTab = () => {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['import-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data, error } = await supabase
        .from('background_jobs')
        .select('id, job_type, status, items_total, items_succeeded, items_failed, created_at, name')
        .eq('user_id', user.id)
        .in('job_type', ['import', 'bulk_import', 'csv_import', 'url_import'])
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data || []
    }
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
          {jobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {format(new Date(job.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                </div>
                <div className="font-medium">{job.name || job.job_type}</div>
                <div className="text-sm">
                  {job.items_total ? `${job.items_total} produits` : '—'}
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
