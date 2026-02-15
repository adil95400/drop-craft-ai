import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export interface ActivityItem {
  id: string
  type: 'automation' | 'workflow' | 'optimization' | 'import' | 'sync' | 'error'
  title: string
  description: string
  status: 'success' | 'error' | 'processing' | 'info'
  timestamp: Date
  metadata?: Record<string, any>
}

export const useRealtimeActivity = () => {
  const { user } = useAuth()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return

    const fetchInitialActivities = async () => {
      setIsLoading(true)
      const allActivities: ActivityItem[] = []

      try {
        // Fetch automation activity from activity_logs
        const { data: executions } = await (supabase
          .from('activity_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20) as any)

        if (executions) {
          executions.forEach((exec: any) => {
            allActivities.push({
              id: exec.id,
              type: 'automation',
              title: 'Exécution de workflow',
              description: exec.error_message || `Workflow ${exec.status === 'success' ? 'complété' : exec.status === 'error' ? 'échoué' : 'en cours'}`,
              status: exec.status === 'running' ? 'processing' : exec.status === 'success' ? 'success' : 'error',
              timestamp: new Date(exec.executed_at || exec.created_at),
              metadata: {
                trigger_id: exec.trigger_id,
                action_id: exec.action_id,
                duration_ms: exec.duration_ms
              }
            })
          })
        }

        // Fetch import jobs
        const { data: imports } = await supabase
          .from('import_jobs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)

        if (imports) {
          imports.forEach((job: any) => {
            allActivities.push({
              id: job.id,
              type: 'import',
              title: `Import ${job.source_platform || job.job_type}`,
              description: job.status === 'completed' 
                ? `${job.successful_imports || 0} produits importés avec succès`
                : job.status === 'failed' 
                ? `Import échoué`
                : 'Import en cours...',
              status: job.status === 'completed' ? 'success' : job.status === 'failed' ? 'error' : 'processing',
              timestamp: new Date(job.created_at),
              metadata: {
                source: job.source_platform,
                total: job.total_products,
                success: job.successful_imports
              }
            })
          })
        }

        // Fetch AI optimization jobs
        const { data: aiJobs } = await supabase
          .from('ai_optimization_jobs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)

        if (aiJobs) {
          aiJobs.forEach((job: any) => {
            allActivities.push({
              id: job.id,
              type: 'optimization',
              title: `Optimisation IA: ${job.job_type}`,
              description: job.status === 'completed'
                ? 'Optimisation terminée avec succès'
                : job.status === 'failed'
                ? `Échec: ${job.error_message || 'Erreur inconnue'}`
                : `En cours...`,
              status: job.status === 'completed' ? 'success' : job.status === 'failed' ? 'error' : 'processing',
              timestamp: new Date(job.created_at),
              metadata: {
                job_type: job.job_type
              }
            })
          })
        }

        // Sort by timestamp descending
        allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        setActivities(allActivities.slice(0, 50))
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialActivities()

    // Subscribe to realtime updates for import_jobs
    const importsChannel = supabase
      .channel('import-jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'import_jobs',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const job = payload.new as any
          const newActivity: ActivityItem = {
            id: job.id,
            type: 'import',
            title: `Import ${job.source_platform || job.job_type}`,
            description: job.status === 'completed' 
              ? `${job.successful_imports || 0} produits importés`
              : job.status === 'failed'
              ? `Import échoué`
              : 'Import en cours...',
            status: job.status === 'completed' ? 'success' : job.status === 'failed' ? 'error' : 'processing',
            timestamp: new Date(job.created_at || new Date()),
            metadata: {
              source: job.source_platform,
              total: job.total_products
            }
          }
          setActivities(prev => [newActivity, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    const aiJobsChannel = supabase
      .channel('ai-jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_optimization_jobs',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const job = payload.new as any
          const newActivity: ActivityItem = {
            id: job.id,
            type: 'optimization',
            title: `Optimisation IA: ${job.job_type}`,
            description: job.status === 'completed'
              ? 'Optimisation terminée'
              : job.status === 'failed'
              ? 'Optimisation échouée'
              : `En cours...`,
            status: job.status === 'completed' ? 'success' : job.status === 'failed' ? 'error' : 'processing',
            timestamp: new Date(job.created_at || new Date()),
            metadata: {
              job_type: job.job_type
            }
          }
          setActivities(prev => [newActivity, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(importsChannel)
      supabase.removeChannel(aiJobsChannel)
    }
  }, [user?.id])

  return {
    activities,
    isLoading
  }
}
