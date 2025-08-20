import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

type Integration = {
  id: string
  user_id: string
  platform_type: string
  platform_name: string
  platform_url?: string
  shop_domain?: string
  seller_id?: string
  is_active: boolean
  connection_status: 'connected' | 'disconnected' | 'error'
  sync_frequency: string
  last_sync_at?: string
  store_config?: any
  sync_settings?: any
  last_error?: string
  created_at: string
  updated_at: string
}

// Real API calls to FastAPI backend
const apiCall = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  })
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`)
  }
  
  return response.json()
}

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
      try {
        return await apiCall('/integrations')
      } catch (apiError) {
        console.warn('API call failed, falling back to Supabase:', apiError)
        const { data, error } = await supabase
          .from('integrations')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        return data as Integration[]
      }
    }
  })

  // Connect to Shopify
  const connectShopify = useMutation({
    mutationFn: async ({ shop_domain, access_token }: { shop_domain: string, access_token?: string }) => {
      return await apiCall('/shopify/connect', {
        method: 'POST',
        body: JSON.stringify({ shop_domain, access_token })
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      toast({
        title: "Shopify connecté",
        description: "Votre boutique Shopify a été connectée avec succès.",
      })
    },
    onError: (error) => {
      toast({
        title: "Erreur Shopify",
        description: error.message || "Impossible de connecter Shopify.",
        variant: "destructive",
      })
    }
  })

  // Sync products to Shopify
  const syncToShopify = useMutation({
    mutationFn: async (productIds: string[]) => {
      return await apiCall('/shopify/sync-products', {
        method: 'POST',
        body: JSON.stringify({ product_ids: productIds })
      })
    },
    onSuccess: (data) => {
      toast({
        title: "Synchronisation réussie",
        description: `${data.products_synced || 0} produits synchronisés vers Shopify.`,
      })
    },
    onError: (error) => {
      toast({
        title: "Erreur de synchronisation",
        description: error.message || "Impossible de synchroniser vers Shopify.",
        variant: "destructive",
      })
    }
  })

  // Test integration connection
  const testConnection = useMutation({
    mutationFn: async (integrationId: string) => {
      return await apiCall(`/integrations/${integrationId}/test`, {
        method: 'POST'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      toast({
        title: "Test réussi",
        description: "La connexion fonctionne correctement.",
      })
    },
    onError: (error) => {
      toast({
        title: "Test échoué",
        description: error.message || "La connexion ne fonctionne pas.",
        variant: "destructive",
      })
    }
  })

  // Update integration settings
  const updateIntegration = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Integration> }) => {
      try {
        return await apiCall(`/integrations/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        })
      } catch (apiError) {
        // Fallback to Supabase
        const { data, error } = await supabase
          .from('integrations')
          .update(updates)
          .eq('id', id)
          .select()
          .single()
        
        if (error) throw error
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      toast({
        title: "Intégration mise à jour",
        description: "Les paramètres ont été mis à jour avec succès.",
      })
    }
  })

  // Delete integration
  const deleteIntegration = useMutation({
    mutationFn: async (id: string) => {
      try {
        await apiCall(`/integrations/${id}`, { method: 'DELETE' })
      } catch (apiError) {
        // Fallback to Supabase
        const { error } = await supabase
          .from('integrations')
          .delete()
          .eq('id', id)
        
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      toast({
        title: "Intégration supprimée",
        description: "L'intégration a été supprimée avec succès.",
      })
    }
  })

  const stats = {
    total: integrations.length,
    active: integrations.filter(i => i.is_active).length,
    connected: integrations.filter(i => i.connection_status === 'connected').length,
    errors: integrations.filter(i => i.connection_status === 'error').length
  }

  return {
    integrations,
    stats,
    isLoading,
    error,
    connectShopify: connectShopify.mutate,
    syncToShopify: syncToShopify.mutate,
    testConnection: testConnection.mutate,
    updateIntegration: updateIntegration.mutate,
    deleteIntegration: deleteIntegration.mutate,
    isConnecting: connectShopify.isPending,
    isSyncing: syncToShopify.isPending,
    isTesting: testConnection.isPending,
    isUpdating: updateIntegration.isPending,
    isDeleting: deleteIntegration.isPending
  }
}