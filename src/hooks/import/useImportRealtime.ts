/**
 * useImportRealtime - Suivi temps réel des imports via Supabase channels
 * Fournit des notifications et un indicateur de connexion
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from 'react-i18next'

export interface RealtimeImportJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial' | 'cancelled'
  totalProducts: number
  successfulImports: number
  failedImports: number
  progress: number
  jobType: string
  sourcePlatform: string
  createdAt: Date
  completedAt?: Date
}

interface UseImportRealtimeOptions {
  userId?: string
  onJobUpdate?: (job: RealtimeImportJob) => void
  onJobComplete?: (job: RealtimeImportJob) => void
  showNotifications?: boolean
}

export function useImportRealtime(options: UseImportRealtimeOptions = {}) {
  const { toast } = useToast()
  const { t } = useTranslation()
  
  const [isConnected, setIsConnected] = useState(false)
  const [activeJobs, setActiveJobs] = useState<RealtimeImportJob[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Transform DB row to RealtimeImportJob
  const transformJob = useCallback((row: any): RealtimeImportJob => {
    const processed = (row.successful_imports || 0) + (row.failed_imports || 0)
    const total = row.total_products || 1
    
    return {
      id: row.id,
      status: row.status,
      totalProducts: row.total_products || 0,
      successfulImports: row.successful_imports || 0,
      failedImports: row.failed_imports || 0,
      progress: Math.round((processed / total) * 100),
      jobType: row.job_type,
      sourcePlatform: row.source_platform,
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined
    }
  }, [])

  // Show notification for job status changes
  const showJobNotification = useCallback((job: RealtimeImportJob, eventType: 'insert' | 'update') => {
    if (!options.showNotifications) return

    if (eventType === 'insert') {
      toast({
        title: t('import.jobStarted', 'Import démarré'),
        description: t('import.jobStartedDesc', '{{count}} produits en cours d\'import', { count: job.totalProducts })
      })
    } else if (job.status === 'completed') {
      toast({
        title: t('import.success', 'Import réussi'),
        description: t('import.productsImported', '{{count}} produits importés', { count: job.successfulImports })
      })
    } else if (job.status === 'failed') {
      toast({
        title: t('import.failed', 'Import échoué'),
        variant: 'destructive'
      })
    } else if (job.status === 'partial') {
      toast({
        title: t('import.partial', 'Import partiel'),
        description: t('import.partialDesc', '{{success}} réussis, {{failed}} échecs', {
          success: job.successfulImports,
          failed: job.failedImports
        })
      })
    }
  }, [toast, t, options.showNotifications])

  // Subscribe to import_jobs changes
  const subscribe = useCallback(async () => {
    if (channelRef.current) {
      channelRef.current.unsubscribe()
    }

    // Get current user if not provided
    let userId = options.userId
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id
    }
    if (!userId) return

    channelRef.current = supabase
      .channel('import-jobs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'import_jobs',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const job = transformJob(payload.new)
          setActiveJobs(prev => [...prev, job])
          setLastUpdate(new Date())
          showJobNotification(job, 'insert')
          options.onJobUpdate?.(job)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'import_jobs',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const job = transformJob(payload.new)
          
          setActiveJobs(prev => 
            prev.map(j => j.id === job.id ? job : j)
          )
          setLastUpdate(new Date())
          showJobNotification(job, 'update')
          options.onJobUpdate?.(job)

          // Call onComplete for finished jobs
          if (['completed', 'failed', 'partial', 'cancelled'].includes(job.status)) {
            options.onJobComplete?.(job)
            
            // Remove from active after delay
            setTimeout(() => {
              setActiveJobs(prev => prev.filter(j => j.id !== job.id))
            }, 5000)
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
        
        if (status === 'CHANNEL_ERROR') {
          // Attempt reconnect after 5 seconds
          reconnectTimeoutRef.current = setTimeout(subscribe, 5000)
        }
      })
  }, [options, transformJob, showJobNotification])

  // Fetch active jobs on mount
  const fetchActiveJobs = useCallback(async () => {
    let userId = options.userId
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id
    }
    if (!userId) return

    const { data, error } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error && data) {
      setActiveJobs(data.map(transformJob))
    }
  }, [options.userId, transformJob])

  // Setup subscription on mount
  useEffect(() => {
    fetchActiveJobs()
    subscribe()

    return () => {
      channelRef.current?.unsubscribe()
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [subscribe, fetchActiveJobs])

  // Manually refresh
  const refresh = useCallback(() => {
    fetchActiveJobs()
  }, [fetchActiveJobs])

  return {
    isConnected,
    activeJobs,
    lastUpdate,
    refresh,
    
    // Computed
    hasActiveJobs: activeJobs.length > 0,
    totalPending: activeJobs.filter(j => j.status === 'pending').length,
    totalProcessing: activeJobs.filter(j => j.status === 'processing').length
  }
}
