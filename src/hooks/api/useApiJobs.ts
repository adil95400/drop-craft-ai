/**
 * useApiJobs - Hook pour le suivi des jobs en arrière-plan via FastAPI
 * Combine les appels API et le realtime Supabase pour le suivi en temps réel
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'

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

  // Fetch jobs list from FastAPI
  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ['api-jobs', user?.id, options?.status, options?.jobType],
    queryFn: async () => {
      const res = await shopOptiApi.getJobs({
        status: options?.status,
        jobType: options?.jobType,
        limit: options?.limit || 20,
      })
      if (res.success && res.data) {
        return (Array.isArray(res.data) ? res.data : res.data.jobs || []) as Job[]
      }
      return []
    },
    enabled: !!user,
    staleTime: 10_000,
    refetchInterval: realtime ? false : 15_000, // Fallback polling if no realtime
  })

  // Realtime subscription on jobs table
  useEffect(() => {
    if (!user || !realtime) return

    const channel = supabase
      .channel('jobs-realtime')
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
          
          // Notify on completion
          const newRecord = payload.new as any
          if (newRecord?.status === 'completed') {
            toast({
              title: 'Job terminé',
              description: `${newRecord.job_type} terminé avec succès`,
            })
          } else if (newRecord?.status === 'failed') {
            toast({
              title: 'Job échoué',
              description: newRecord.error_message || 'Une erreur est survenue',
              variant: 'destructive',
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, realtime, queryClient, toast])

  // Cancel a job
  const cancelJob = useMutation({
    mutationFn: (jobId: string) => shopOptiApi.cancelJob(jobId),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['api-jobs'] })
        toast({ title: 'Job annulé' })
      }
    },
  })

  // Retry a failed job
  const retryJob = useMutation({
    mutationFn: (jobId: string) => shopOptiApi.retryJob(jobId),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['api-jobs'] })
        toast({ title: 'Job relancé' })
      }
    },
  })

  // Job stats summary
  const { data: jobStats } = useQuery({
    queryKey: ['api-jobs-stats', user?.id],
    queryFn: async () => {
      const res = await shopOptiApi.getJobStats()
      return res.success ? res.data : null
    },
    enabled: !!user,
    staleTime: 30_000,
  })

  const activeJobs = jobs.filter(j => j.status === 'running' || j.status === 'pending')
  const completedJobs = jobs.filter(j => j.status === 'completed')
  const failedJobs = jobs.filter(j => j.status === 'failed')

  return {
    jobs,
    activeJobs,
    completedJobs,
    failedJobs,
    jobStats,
    isLoading,
    cancelJob: cancelJob.mutate,
    retryJob: retryJob.mutate,
    isCancelling: cancelJob.isPending,
    isRetrying: retryJob.isPending,
    refetch,
  }
}

/**
 * useApiJobDetail - Suivi détaillé d'un job spécifique + ses items
 */
export function useApiJobDetail(jobId: string | null) {
  const { user } = useAuth()

  const { data: job, isLoading } = useQuery({
    queryKey: ['api-job-detail', jobId],
    queryFn: async () => {
      if (!jobId) return null
      const res = await shopOptiApi.getJob(jobId)
      return res.success ? res.data : null
    },
    enabled: !!user && !!jobId,
    refetchInterval: 5_000, // Poll for progress
  })

  // Fetch job_items via FastAPI
  const { data: jobItems = [] } = useQuery({
    queryKey: ['api-job-items', jobId],
    queryFn: async () => {
      if (!jobId) return []
      const res = await shopOptiApi.getJobItems(jobId, { limit: 200 })
      if (res.success && res.data) {
        return Array.isArray(res.data) ? res.data : res.data.items || []
      }
      return []
    },
    enabled: !!jobId,
    refetchInterval: 5_000,
  })

  return {
    job,
    jobItems,
    isLoading,
    isRunning: job?.status === 'running' || job?.status === 'pending',
    isCompleted: job?.status === 'completed',
    isFailed: job?.status === 'failed',
  }
}
