/**
 * useApiSync - Hook pour la synchronisation via Supabase/Edge Functions
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'

export function useApiSync() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const triggerSync = useMutation({
    mutationFn: async (params: {
      syncType: 'products' | 'stock' | 'orders' | 'full'
      supplierId?: string
      platformId?: string
      options?: Record<string, any>
    }) => {
      const { data, error } = await supabase.functions.invoke('shopify-sync', {
        body: {
          sync_type: params.syncType,
          supplier_id: params.supplierId,
          platform_id: params.platformId,
          options: params.options || {},
        },
      })
      if (error) throw error
      return { success: true, data, job_id: data?.job_id }
    },
    onSuccess: (res) => {
      toast({ title: 'Synchronisation lancée' })
      queryClient.invalidateQueries({ queryKey: ['api-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['products-unified'] })
    },
    onError: () => toast({ title: 'Erreur', description: 'Sync impossible', variant: 'destructive' }),
  })

  const { data: syncHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['api-sync-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .in('job_type', ['sync', 'product_sync', 'stock_sync'])
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) return []
      return data || []
    },
    enabled: !!user,
    staleTime: 30_000,
  })

  return {
    triggerSync,
    syncHistory,
    schedules: [],
    createSchedule: { mutate: () => {}, isPending: false },
    deleteSchedule: { mutate: () => {}, isPending: false },
    isSyncing: triggerSync.isPending,
    historyLoading,
    schedulesLoading: false,
    lastJobId: null,
  }
}
