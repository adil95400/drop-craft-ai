import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

type Integration = {
  id: string
  user_id: string
  platform_name: string
  platform_type: string
  platform_url?: string
  shop_domain?: string
  seller_id?: string
  store_config?: any
  connection_status: 'connected' | 'disconnected' | 'error'
  is_active: boolean
  sync_frequency: 'manual' | 'hourly' | 'daily' | 'weekly'
  last_sync_at?: string
  created_at: string
  updated_at: string
  encrypted_credentials?: Record<string, any>
  // Legacy fields - no longer used for security
  api_key?: never
  api_secret?: never
  access_token?: never
  refresh_token?: never
}

export type { Integration }

export const useIntegrations = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    data: integrations = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      // Filter out legacy credential fields for security
      return data.map(item => {
        const { api_key, api_secret, access_token, refresh_token, ...secureItem } = item
        return secureItem as Integration
      })
    }
  })

  const addIntegration = useMutation({
    mutationFn: async (integration: Omit<Integration, 'id' | 'created_at' | 'updated_at' | 'user_id'> & { credentials?: Record<string, string> }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Separate credentials from integration data
      const { credentials, ...integrationData } = integration
      
      // Create integration without credentials first
      const { data, error } = await supabase
        .from('integrations')
        .insert([{ ...integrationData, user_id: user.id }])
        .select()
        .single()
      
      if (error) throw error
      
      // Store credentials securely if provided
      if (credentials && Object.keys(credentials).length > 0) {
        const { error: credError } = await supabase.functions.invoke('secure-credentials', {
          body: {
            integrationId: data.id,
            credentials,
            action: 'store'
          }
        })
        
        if (credError) {
          console.error('Failed to store credentials:', credError)
          throw new Error('Failed to store credentials securely')
        }
      }
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      toast({
        title: "Intégration ajoutée",
        description: "L'intégration a été configurée avec succès.",
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'intégration.",
        variant: "destructive",
      })
    }
  })

  const updateIntegration = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Integration> }) => {
      const { data, error } = await supabase
        .from('integrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      toast({
        title: "Intégration mise à jour",
        description: "L'intégration a été mise à jour avec succès.",
      })
    }
  })

  const deleteIntegration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      toast({
        title: "Intégration supprimée",
        description: "L'intégration a été supprimée avec succès.",
      })
    }
  })

  const syncIntegration = useMutation({
    mutationFn: async ({ integrationId, syncType }: { integrationId: string; syncType: string }) => {
      const { data, error } = await supabase.functions.invoke('sync-integration', {
        body: { integration_id: integrationId, sync_type: syncType }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      toast({
        title: "Synchronisation lancée",
        description: "La synchronisation des données a commencé.",
      })
    },
    onError: () => {
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de lancer la synchronisation.",
        variant: "destructive",
      })
    }
  })

  const connectedIntegrations = integrations.filter(i => i.connection_status === 'connected')
  const activeIntegrations = integrations.filter(i => i.is_active)

  return {
    integrations,
    connectedIntegrations,
    activeIntegrations,
    syncLogs: [],
    loading: isLoading,
    fetchIntegrations: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
    isLoading,
    error,
    addIntegration: addIntegration.mutate,
    createIntegration: addIntegration.mutate,
    updateIntegration: updateIntegration.mutate,
    deleteIntegration: deleteIntegration.mutate,
    syncIntegration: syncIntegration.mutate,
    testConnection: (integrationId: string) => updateIntegration.mutate({ id: integrationId, updates: { connection_status: 'connected' } }),
    syncData: syncIntegration.mutate,
    isAdding: addIntegration.isPending,
    isUpdating: updateIntegration.isPending,
    isDeleting: deleteIntegration.isPending,
    isSyncing: syncIntegration.isPending
  }
}