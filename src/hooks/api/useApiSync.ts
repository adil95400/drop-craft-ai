/**
 * useApiSync - Hook pour la synchronisation multi-boutiques via FastAPI
 * Chaque action de sync crée un job en arrière-plan
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'

export function useApiSync() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Trigger a sync job
  const triggerSync = useMutation({
    mutationFn: (params: {
      syncType: 'products' | 'stock' | 'orders' | 'full'
      supplierId?: string
      platformId?: string
      options?: Record<string, any>
    }) => shopOptiApi.triggerSync(params.syncType, {
      supplierId: params.supplierId,
      platformId: params.platformId,
      additionalOptions: params.options,
    }),
    onSuccess: (res) => {
      if (res.success) {
        toast({
          title: 'Synchronisation lancée',
          description: `Job ID: ${res.job_id || res.data?.job_id || 'en cours'}`,
        })
        queryClient.invalidateQueries({ queryKey: ['api-jobs'] })
        queryClient.invalidateQueries({ queryKey: ['products-unified'] })
      } else {
        toast({ title: 'Erreur sync', description: res.error, variant: 'destructive' })
      }
    },
    onError: () => toast({ title: 'Erreur', description: 'Sync impossible', variant: 'destructive' }),
  })

  // Get sync history
  const { data: syncHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['api-sync-history', user?.id],
    queryFn: async () => {
      const res = await shopOptiApi.getSyncHistory(undefined, 20)
      return res.success ? (res.data || []) : []
    },
    enabled: !!user,
    staleTime: 30_000,
  })

  // Get sync schedules
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['api-sync-schedules', user?.id],
    queryFn: async () => {
      const res = await shopOptiApi.getSyncSchedules()
      return res.success ? (res.data || []) : []
    },
    enabled: !!user,
    staleTime: 60_000,
  })

  // Create schedule
  const createSchedule = useMutation({
    mutationFn: (config: {
      syncType: string
      supplierId: string
      frequency: 'hourly' | 'daily' | 'weekly'
      enabled?: boolean
    }) => shopOptiApi.createSyncSchedule(config),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['api-sync-schedules'] })
        toast({ title: 'Planning créé' })
      }
    },
  })

  // Delete schedule
  const deleteSchedule = useMutation({
    mutationFn: (scheduleId: string) => shopOptiApi.deleteSyncSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-sync-schedules'] })
      toast({ title: 'Planning supprimé' })
    },
  })

  return {
    triggerSync,
    syncHistory,
    schedules,
    createSchedule,
    deleteSchedule,
    isSyncing: triggerSync.isPending,
    historyLoading,
    schedulesLoading,
    lastJobId: triggerSync.data?.job_id || triggerSync.data?.data?.job_id || null,
  }
}
