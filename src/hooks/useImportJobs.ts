import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export interface ImportJob {
  id: string
  user_id: string
  source_type: string
  source_url?: string
  file_name?: string
  status: string
  total_rows?: number
  processed_rows?: number
  failed_rows?: number
  errors?: any
  mapping_config?: any
  created_at: string
  started_at?: string
  completed_at?: string
}

export function useImportJobs() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ['import-jobs', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data as ImportJob[]
    },
    enabled: !!user?.id,
    refetchInterval: 5000, // Refresh every 5 seconds for active jobs
  })

  const createJob = useMutation({
    mutationFn: async (jobData: Partial<ImportJob>) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('import_jobs')
        .insert([{
          user_id: user.id,
          source_type: jobData.source_type || 'csv',
          source_url: jobData.source_url,
          file_name: jobData.file_name,
          mapping_config: jobData.mapping_config,
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      toast({
        title: "Import créé",
        description: "Votre import a été ajouté à la file d'attente",
      })
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'import",
        variant: "destructive"
      })
      console.error('Create job error:', error)
    }
  })

  const retryJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase
        .rpc('retry_failed_import', { job_id: jobId })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      toast({
        title: "Import relancé",
        description: "L'import a été remis en file d'attente",
      })
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de relancer l'import",
        variant: "destructive"
      })
      console.error('Retry job error:', error)
    }
  })

  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    totalProcessed: jobs.reduce((sum, job) => sum + (job.processed_rows || 0), 0),
    totalFailed: jobs.reduce((sum, job) => sum + (job.failed_rows || 0), 0)
  }

  return {
    jobs,
    stats,
    isLoading,
    error,
    createJob: createJob.mutate,
    retryJob: retryJob.mutate,
    isCreating: createJob.isPending,
    isRetrying: retryJob.isPending
  }
}
