import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

// Define types locally since tables don't exist
interface ShopifySyncConfig {
  id: string
  user_id: string
  store_url: string
  sync_products: boolean
  sync_orders: boolean
  sync_customers: boolean
  sync_frequency: string
  sync_direction: 'import' | 'export' | 'both'
  sync_status: 'idle' | 'syncing' | 'error'
  auto_sync_enabled: boolean
  next_sync_at?: string
  last_sync_at?: string
  last_sync_result?: {
    products_created: number
    products_updated: number
    products_skipped: number
    errors: string[]
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ShopifySyncLog {
  id: string
  user_id: string
  config_id: string
  sync_type: string
  sync_direction: 'import' | 'export'
  status: string
  products_synced: number
  products_created: number
  products_updated: number
  products_skipped: number
  orders_synced: number
  customers_synced: number
  errors: any[]
  duration_ms: number
  started_at: string
  completed_at?: string
}

export const useShopifySync = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Get sync configs from integrations table (Shopify platform)
  const { data: configs, isLoading: configsLoading } = useQuery({
    queryKey: ['shopify-sync-configs', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'shopify')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Transform to match ShopifySyncConfig interface
      return (data || []).map(integration => ({
        id: integration.id,
        user_id: integration.user_id,
        store_url: integration.store_url || '',
        sync_products: (integration.config as any)?.sync_products ?? true,
        sync_orders: (integration.config as any)?.sync_orders ?? true,
        sync_customers: (integration.config as any)?.sync_customers ?? true,
        sync_frequency: integration.sync_frequency || 'manual',
        last_sync_at: integration.last_sync_at,
        is_active: integration.is_active ?? true,
        created_at: integration.created_at || new Date().toISOString(),
        updated_at: integration.updated_at || new Date().toISOString()
      })) as ShopifySyncConfig[]
    },
    enabled: !!user?.id
  })

  // Get sync logs from activity_logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['shopify-sync-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('entity_type', 'shopify_sync')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      
      // Transform to match ShopifySyncLog interface
      return (data || []).map(log => ({
        id: log.id,
        user_id: log.user_id || '',
        config_id: log.entity_id || '',
        sync_type: (log.details as any)?.sync_type || 'manual',
        status: (log.details as any)?.status || 'completed',
        products_synced: (log.details as any)?.products_synced || 0,
        orders_synced: (log.details as any)?.orders_synced || 0,
        customers_synced: (log.details as any)?.customers_synced || 0,
        errors: (log.details as any)?.errors || [],
        started_at: log.created_at || new Date().toISOString(),
        completed_at: (log.details as any)?.completed_at
      })) as ShopifySyncLog[]
    },
    enabled: !!user?.id
  })

  // Create sync config
  const createConfig = useMutation({
    mutationFn: async (config: Partial<ShopifySyncConfig>) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('integrations')
        .insert([{
          platform: 'shopify',
          platform_name: 'Shopify',
          store_url: config.store_url,
          sync_frequency: config.sync_frequency || 'manual',
          is_active: config.is_active ?? true,
          config: {
            sync_products: config.sync_products ?? true,
            sync_orders: config.sync_orders ?? true,
            sync_customers: config.sync_customers ?? true
          },
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
        .from('integrations')
        .update({
          store_url: updates.store_url,
          sync_frequency: updates.sync_frequency,
          is_active: updates.is_active,
          config: {
            sync_products: updates.sync_products,
            sync_orders: updates.sync_orders,
            sync_customers: updates.sync_customers
          }
        })
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
        .from('integrations')
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shopify-sync-configs'] })
      queryClient.invalidateQueries({ queryKey: ['shopify-sync-logs'] })
      queryClient.invalidateQueries({ queryKey: ['unified-products'] })
      
      toast({
        title: "Synchronisation terminée",
        description: `${data?.products_synced || 0} produits traités (${data?.products_created || 0} créés, ${data?.products_updated || 0} mis à jour)`
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
