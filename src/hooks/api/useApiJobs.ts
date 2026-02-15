/**
 * useApiJobs - Hook pour le suivi des jobs via la table `jobs` (source de vérité unique)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

export interface Job {
  id: string
  user_id: string
  job_type: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  total_items: number
  processed_items: number
  failed_items: number
  progress_percent: number
  error_message?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export function useApiJobs(options?: {
  status?: string
  jobType?: string
  limit?: number
  realtime?: boolean
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { realtime = true } = options || {}

  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ['api-jobs', user?.id, options?.status, options?.jobType],
    queryFn: async () => {
      if (!user?.id) return []
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(options?.limit || 20)

      if (options?.status) {
        query = query.eq('status', options.status)
      }
      if (options?.jobType) {
        query = query.eq('job_type', options.jobType)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []).map((j: any) => ({
        id: j.id,
        user_id: j.user_id,
        job_type: j.job_type,
        status: j.status,
        total_items: j.total_items || 0,
        processed_items: j.processed_items || 0,
        failed_items: j.failed_items || 0,
        progress_percent: j.progress_percent || 0,
        error_message: j.error_message,
        metadata: j.metadata,
        created_at: j.created_at,
        updated_at: j.updated_at,
      })) as Job[]
    },
    enabled: !!user,
    staleTime: 10_000,
    refetchInterval: realtime ? false : 15_000,
  })

  useEffect(() => {
    if (!user || !realtime) return

    const channel = supabase
      .channel('api-jobs-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['api-jobs'] })
          const newRecord = payload.new as any
          if (newRecord?.status === 'completed') {
            toast({ title: 'Job terminé', description: `${newRecord.job_type} terminé avec succès` })
          } else if (newRecord?.status === 'failed') {
            toast({ title: 'Job échoué', description: newRecord.error_message || 'Une erreur est survenue', variant: 'destructive' })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, realtime, queryClient, toast])

  const cancelJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'cancelled' } as any)
        .eq('id', jobId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-jobs'] })
      toast({ title: 'Job annulé' })
    },
  })

  const retryJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'pending', error_message: null } as any)
        .eq('id', jobId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-jobs'] })
      toast({ title: 'Job relancé' })
    },
  })

  const activeJobs = jobs.filter(j => j.status === 'running' || j.status === 'pending')
  const completedJobs = jobs.filter(j => j.status === 'completed')
  const failedJobs = jobs.filter(j => j.status === 'failed')

  return {
    jobs,
    activeJobs,
    completedJobs,
    failedJobs,
    jobStats: null,
    isLoading,
    cancelJob: cancelJob.mutate,
    retryJob: retryJob.mutate,
    isCancelling: cancelJob.isPending,
    isRetrying: retryJob.isPending,
    refetch,
  }
}

export function useApiJobDetail(jobId: string | null) {
  const { user } = useAuth()

  const { data: job, isLoading } = useQuery({
    queryKey: ['api-job-detail', jobId],
    queryFn: async () => {
      if (!jobId) return null
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()
      if (error) return null
      return data
    },
    enabled: !!user && !!jobId,
    refetchInterval: 5_000,
  })

  return {
    job,
    jobItems: [],
    isLoading,
    isRunning: job?.status === 'running' || job?.status === 'pending',
    isCompleted: job?.status === 'completed',
    isFailed: job?.status === 'failed',
  }
}
