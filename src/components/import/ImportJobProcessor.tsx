import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Play, Pause, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { importJobsApi } from '@/services/api/client'

interface ImportJob {
  id: string
  job_type: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  total_products: number
  processed_products: number
  successful_imports: number
  failed_imports: number
  error_log?: any
  created_at: string
  started_at?: string
  completed_at?: string
}

export function ImportJobProcessor() {
  const [jobs, setJobs] = useState<ImportJob[]>([])
  const [processing, setProcessing] = useState<Record<string, boolean>>({})
  const [isAutoProcessing, setIsAutoProcessing] = useState(false)
  const { toast } = useToast()

  const fetchPendingJobs = async () => {
    try {
      const resp = await importJobsApi.list({ per_page: 20, status: 'pending' })
      const processingResp = await importJobsApi.list({ per_page: 20, status: 'processing' })
      const allJobs = [...(resp.items || []), ...(processingResp.items || [])]
      setJobs(allJobs.map((job: any) => ({
        id: job.job_id || job.id,
        job_type: job.job_type || job.source || 'import',
        status: job.status,
        total_products: job.progress?.total ?? 0,
        processed_products: job.progress?.processed ?? 0,
        successful_imports: job.progress?.success ?? 0,
        failed_imports: job.progress?.failed ?? 0,
        created_at: job.created_at,
        started_at: job.started_at,
        completed_at: job.completed_at,
      })))
    } catch (error) {
      console.error('Error fetching import jobs:', error)
    }
  }

  const retryJob = async (job: ImportJob) => {
    if (processing[job.id]) return
    setProcessing(prev => ({ ...prev, [job.id]: true }))

    try {
      await importJobsApi.retry(job.id)
      toast({ title: "Job relancé", description: `Job ${job.id.slice(0, 8)} relancé` })
      fetchPendingJobs()
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" })
    } finally {
      setProcessing(prev => ({ ...prev, [job.id]: false }))
    }
  }

  const processAllPending = async () => {
    setIsAutoProcessing(true)
    const pendingJobs = jobs.filter(job => job.status === 'pending')
    for (const job of pendingJobs) {
      if (!processing[job.id]) {
        await retryJob(job)
      }
    }
    setIsAutoProcessing(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'processing': return <RefreshCw className="h-4 w-4 text-primary animate-spin" />
      default: return <Pause className="h-4 w-4 text-muted-foreground" />
    }
  }

  useEffect(() => {
    fetchPendingJobs()
    const interval = setInterval(fetchPendingJobs, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Processeur d'Import
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchPendingJobs} disabled={isAutoProcessing}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button
              variant="default" size="sm"
              onClick={processAllPending}
              disabled={isAutoProcessing || jobs.filter(j => j.status === 'pending').length === 0}
            >
              <Play className="h-4 w-4 mr-2" />
              Traiter Tous
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune tâche d'import en attente
            </div>
          ) : (
            jobs.map(job => (
              <div key={job.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <p className="font-medium">{job.job_type.toUpperCase()} Import</p>
                      <p className="text-sm text-muted-foreground">ID: {job.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      job.status === 'completed' ? 'default' :
                      job.status === 'failed' ? 'destructive' : 'secondary'
                    }>
                      {job.status}
                    </Badge>
                    {job.status === 'pending' && (
                      <Button size="sm" onClick={() => retryJob(job)} disabled={processing[job.id]}>
                        {processing[job.id] ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {job.status === 'processing' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progression</span>
                      <span>{job.processed_products}/{job.total_products || '?'}</span>
                    </div>
                    <Progress
                      value={job.total_products > 0 ? (job.processed_products / job.total_products) * 100 : 0}
                    />
                  </div>
                )}

                {job.status === 'completed' && (
                  <div className="text-sm text-green-600">
                    ✓ {job.successful_imports} succès, {job.failed_imports} erreurs
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Créé: {new Date(job.created_at).toLocaleString()}
                  {job.started_at && <> • Démarré: {new Date(job.started_at).toLocaleString()}</>}
                  {job.completed_at && <> • Terminé: {new Date(job.completed_at).toLocaleString()}</>}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
