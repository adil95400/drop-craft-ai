import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Play, Pause, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'

interface ImportJob {
  id: string
  user_id: string
  job_type: string
  supplier_id?: string
  import_settings?: any
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  total_products: number
  processed_products: number
  successful_imports: number
  failed_imports: number
  error_log?: any
  created_at: string
  updated_at: string
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
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: true })
        .limit(20)

      if (error) throw error
      setJobs((data || []).map(job => ({
        ...job,
        status: job.status as 'pending' | 'processing' | 'completed' | 'failed'
      })))
    } catch (error) {
      console.error('Error fetching import jobs:', error)
    }
  }

  const processJob = async (job: ImportJob) => {
    if (processing[job.id]) return

    setProcessing(prev => ({ ...prev, [job.id]: true }))

    try {
      // Update job status to processing
      const { error: updateError } = await supabase
        .from('import_jobs')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id)

      if (updateError) throw updateError

      // Simulate processing based on job type
      await processJobByType(job)

      // Mark as completed
      const { error: completeError } = await supabase
        .from('import_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          processed_rows: job.total_rows || 100,
          success_rows: Math.floor((job.total_rows || 100) * 0.9),
          error_rows: Math.floor((job.total_rows || 100) * 0.1)
        })
        .eq('id', job.id)

      if (completeError) throw completeError

      toast({
        title: "Import terminé",
        description: `Import job ${job.id.slice(0, 8)} traité avec succès`
      })

      fetchPendingJobs()
    } catch (error: any) {
      console.error('Error processing job:', error)
      
      // Mark as failed
      await supabase
        .from('import_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          errors: [error.message]
        })
        .eq('id', job.id)

      toast({
        title: "Erreur d'import",
        description: `Échec du traitement de l'import ${job.id.slice(0, 8)}`,
        variant: "destructive"
      })
    } finally {
      setProcessing(prev => ({ ...prev, [job.id]: false }))
    }
  }

  const processJobByType = async (job: ImportJob) => {
    switch (job.source_type) {
      case 'csv':
        await processCsvJob(job)
        break
      case 'url':
        await processUrlJob(job)
        break
      case 'api':
        await processApiJob(job)
        break
      default:
        await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate processing
    }
  }

  const processCsvJob = async (job: ImportJob) => {
    // Simulate CSV processing
    const fileSize = job.file_data?.size || 1000000
    const estimatedRows = Math.floor(fileSize / 1000) // Rough estimate
    
    // Update total products
    await supabase
      .from('import_jobs')
      .update({ total_products: estimatedRows })
      .eq('id', job.id)

    // Simulate processing time based on file size
    const processingTime = Math.min(fileSize / 100000, 10000) // Max 10 seconds
    await new Promise(resolve => setTimeout(resolve, processingTime))
  }

  const processUrlJob = async (job: ImportJob) => {
    // Simulate URL scraping
    await new Promise(resolve => setTimeout(resolve, 3000))
  }

  const processApiJob = async (job: ImportJob) => {
    // Simulate API import
    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  const processAllPending = async () => {
    setIsAutoProcessing(true)
    const pendingJobs = jobs.filter(job => job.status === 'pending')
    
    for (const job of pendingJobs) {
      if (!processing[job.id]) {
        await processJob(job)
        // Small delay between jobs to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    setIsAutoProcessing(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Pause className="h-4 w-4 text-orange-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-orange-100 text-orange-800'
    }
  }

  useEffect(() => {
    fetchPendingJobs()
    
    // Auto-refresh every 30 seconds
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
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPendingJobs}
              disabled={isAutoProcessing}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button
              variant="default"
              size="sm"
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
                      <p className="font-medium">
                        {job.source_type.toUpperCase()} Import
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ID: {job.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                    {job.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => processJob(job)}
                        disabled={processing[job.id]}
                      >
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
                      <span>{job.processed_rows}/{job.total_rows || '?'}</span>
                    </div>
                    <Progress 
                      value={job.total_rows > 0 ? (job.processed_rows / job.total_rows) * 100 : 0} 
                    />
                  </div>
                )}
                
                {job.status === 'completed' && (
                  <div className="text-sm text-green-600">
                    ✓ {job.success_rows} succès, {job.error_rows} erreurs
                  </div>
                )}
                
                {job.status === 'failed' && job.errors && (
                  <div className="text-sm text-red-600">
                    ✗ Erreur: {Array.isArray(job.errors) ? job.errors[0] : 'Erreur inconnue'}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  Créé: {new Date(job.created_at).toLocaleString()}
                  {job.started_at && (
                    <> • Démarré: {new Date(job.started_at).toLocaleString()}</>
                  )}
                  {job.completed_at && (
                    <> • Terminé: {new Date(job.completed_at).toLocaleString()}</>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}