/**
 * useApiStores - Hook pour les opérations boutiques/canaux via FastAPI
 * Remplace les mutations Supabase directes par des appels FastAPI avec suivi de jobs
 * Les lectures restent via Supabase pour le temps réel
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'

export function useApiStores() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['channel-connections-unified'] })
    queryClient.invalidateQueries({ queryKey: ['channel-activity'] })
    queryClient.invalidateQueries({ queryKey: ['api-jobs'] })
  }

  // Sync store(s) via FastAPI → creates a background job
  const syncStores = useMutation({
    mutationFn: async (connectionIds: string[]) => {
      // For each connection, trigger a sync job via FastAPI
      const results = []
      for (const id of connectionIds) {
        const res = await shopOptiApi.triggerSync('products', { platformId: id })
        results.push(res)
      }
      return results
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length
      const jobIds = results.map(r => r.job_id || r.data?.job_id).filter(Boolean)
      
      if (successCount > 0) {
        toast({
          title: `Synchronisation lancée (${successCount} boutique${successCount > 1 ? 's' : ''})`,
          description: jobIds.length > 0 ? `Jobs: ${jobIds.join(', ')}` : undefined,
        })
      }
      
      const errors = results.filter(r => !r.success)
      if (errors.length > 0) {
        toast({
          title: 'Erreurs de sync',
          description: `${errors.length} boutique(s) en erreur`,
          variant: 'destructive',
        })
      }
      
      invalidate()
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Synchronisation impossible', variant: 'destructive' })
    },
  })

  // Connect a new store via FastAPI
  const connectStore = useMutation({
    mutationFn: (params: {
      platformType: string
      apiKey: string
      config?: Record<string, any>
    }) => shopOptiApi.connectSupplier(params.platformType, params.apiKey, params.config),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: 'Boutique connectée', description: 'La connexion a été établie via le backend.' })
        invalidate()
      } else {
        toast({ title: 'Erreur', description: res.error, variant: 'destructive' })
      }
    },
    onError: () => toast({ title: 'Erreur', description: 'Connexion impossible', variant: 'destructive' }),
  })

  // Disconnect / delete store(s) via FastAPI
  const deleteStores = useMutation({
    mutationFn: async (connectionIds: string[]) => {
      const results = []
      for (const id of connectionIds) {
        const res = await shopOptiApi.request(`/stores/${id}/disconnect`, { method: 'POST' })
        results.push(res)
      }
      return results
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length
      toast({ title: `${successCount} boutique(s) déconnectée(s)` })
      invalidate()
    },
    onError: () => toast({ title: 'Erreur', description: 'Déconnexion impossible', variant: 'destructive' }),
  })

  // Toggle auto-sync via FastAPI
  const toggleAutoSync = useMutation({
    mutationFn: async ({ connectionIds, enabled }: { connectionIds: string[]; enabled: boolean }) => {
      const results = []
      for (const id of connectionIds) {
        const res = await shopOptiApi.request(`/stores/${id}/auto-sync`, {
          method: 'PATCH',
          body: { enabled },
        })
        results.push(res)
      }
      return results
    },
    onSuccess: (_, { enabled }) => {
      toast({ title: enabled ? 'Auto-sync activé' : 'Auto-sync désactivé' })
      invalidate()
    },
    onError: () => toast({ title: 'Erreur', description: 'Impossible de modifier l\'auto-sync', variant: 'destructive' }),
  })

  // Get store status via FastAPI
  const checkStoreStatus = useMutation({
    mutationFn: (storeId: string) => shopOptiApi.getSupplierStatus(storeId),
    onSuccess: (res) => {
      if (!res.success) {
        toast({ title: 'Erreur', description: res.error, variant: 'destructive' })
      }
    },
  })

  return {
    syncStores,
    connectStore,
    deleteStores,
    toggleAutoSync,
    checkStoreStatus,
    isSyncing: syncStores.isPending,
    isConnecting: connectStore.isPending,
    isDeleting: deleteStores.isPending,
    isTogglingAutoSync: toggleAutoSync.isPending,
  }
}
