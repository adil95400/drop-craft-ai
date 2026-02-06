/**
 * useApiStores - Hook pour les opérations boutiques via Supabase direct
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export function useApiStores() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['channel-connections-unified'] })
    queryClient.invalidateQueries({ queryKey: ['channel-activity'] })
  }

  const syncStores = useMutation({
    mutationFn: async (connectionIds: string[]) => {
      for (const id of connectionIds) {
        await supabase.functions.invoke('shopify-sync', {
          body: { integration_id: id, sync_type: 'products' },
        })
      }
      return { success: true }
    },
    onSuccess: () => {
      toast({ title: 'Synchronisation lancée' })
      invalidate()
    },
    onError: () => toast({ title: 'Erreur', description: 'Synchronisation impossible', variant: 'destructive' }),
  })

  const connectStore = useMutation({
    mutationFn: async (params: {
      platformType: string
      apiKey: string
      config?: Record<string, any>
    }) => {
      const { data, error } = await supabase.functions.invoke('marketplace-connect', {
        body: {
          platform: params.platformType,
          api_key: params.apiKey,
          config: params.config,
        },
      })
      if (error) throw error
      return { success: true, data }
    },
    onSuccess: () => {
      toast({ title: 'Boutique connectée' })
      invalidate()
    },
    onError: () => toast({ title: 'Erreur', description: 'Connexion impossible', variant: 'destructive' }),
  })

  const deleteStores = useMutation({
    mutationFn: async (connectionIds: string[]) => {
      for (const id of connectionIds) {
        await supabase
          .from('integrations')
          .delete()
          .eq('id', id)
      }
      return { success: true }
    },
    onSuccess: () => {
      toast({ title: 'Boutique(s) déconnectée(s)' })
      invalidate()
    },
    onError: () => toast({ title: 'Erreur', description: 'Déconnexion impossible', variant: 'destructive' }),
  })

  const toggleAutoSync = useMutation({
    mutationFn: async ({ connectionIds, enabled }: { connectionIds: string[]; enabled: boolean }) => {
      for (const id of connectionIds) {
        await supabase
          .from('integrations')
          .update({ auto_sync_enabled: enabled })
          .eq('id', id)
      }
      return { success: true }
    },
    onSuccess: (_, { enabled }) => {
      toast({ title: enabled ? 'Auto-sync activé' : 'Auto-sync désactivé' })
      invalidate()
    },
  })

  const checkStoreStatus = useMutation({
    mutationFn: async (storeId: string) => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', storeId)
        .single()
      if (error) throw error
      return { success: true, data }
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
