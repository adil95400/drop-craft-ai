import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import type { Database } from '@/integrations/supabase/types'

type ShopifySyncConfig = Database['public']['Tables']['shopify_sync_configs']['Row']
type ShopifySyncConfigInsert = Database['public']['Tables']['shopify_sync_configs']['Insert']
type ShopifySyncLog = Database['public']['Tables']['shopify_sync_logs']['Row']

export const useShopifySync = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Get sync configs
  const { data: configs, isLoading: configsLoading } = useQuery({
    queryKey: ['shopify-sync-configs', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('shopify_sync_configs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ShopifySyncConfig[]
    },
    enabled: !!user?.id
  })

  // Get sync logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['shopify-sync-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('shopify_sync_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data as ShopifySyncLog[]
    },
    enabled: !!user?.id
  })

  // Create sync config
  const createConfig = useMutation({
    mutationFn: async (config: Omit<ShopifySyncConfigInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('shopify_sync_configs')
        .insert([{
          ...config,
          user_id: user.id
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopify-sync-configs'] })
      toast({
        title: "Configuration créée",
        description: "La synchronisation a été configurée avec succès"
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Update sync config
  const updateConfig = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ShopifySyncConfig> }) => {
      const { data, error } = await supabase
        .from('shopify_sync_configs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopify-sync-configs'] })
      toast({
        title: "Configuration mise à jour",
        description: "Les paramètres ont été enregistrés"
      })
    }
  })

  // Delete sync config
  const deleteConfig = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shopify_sync_configs')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopify-sync-configs'] })
      toast({
        title: "Configuration supprimée",
        description: "La synchronisation a été désactivée"
      })
    }
  })

  // Trigger manual sync
  const triggerSync = useMutation({
    mutationFn: async ({ configId, direction }: { configId: string; direction: 'import' | 'export' }) => {
      const functionName = direction === 'import' ? 'shopify-sync-import' : 'shopify-sync-export'
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { config_id: configId, sync_type: 'manual' }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shopify-sync-configs'] })
      queryClient.invalidateQueries({ queryKey: ['shopify-sync-logs'] })
      queryClient.invalidateQueries({ queryKey: ['unified-products'] })
      
      toast({
        title: "Synchronisation terminée",
        description: `${data.products_synced} produits traités (${data.products_created} créés, ${data.products_updated} mis à jour)`
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de synchronisation",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  return {
    configs,
    logs,
    configsLoading,
    logsLoading,
    createConfig: createConfig.mutate,
    updateConfig: updateConfig.mutate,
    deleteConfig: deleteConfig.mutate,
    triggerSync: triggerSync.mutate,
    isCreating: createConfig.isPending,
    isUpdating: updateConfig.isPending,
    isDeleting: deleteConfig.isPending,
    isSyncing: triggerSync.isPending
  }
}

export type { ShopifySyncConfig, ShopifySyncLog }
