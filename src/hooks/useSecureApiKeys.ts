import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface SecureApiKey {
  id: string
  user_id: string
  key_name: string
  platform: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_used_at?: string
  usage_count?: number
  created_ip?: string
}

export const useSecureApiKeys = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Use the existing api_keys table instead of non-existent user_api_keys
  const { data: apiKeys = [], isLoading, error } = useQuery({
    queryKey: ['secure-api-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, user_id, name, key_prefix, is_active, created_at, last_used_at, scopes, environment')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Transform to match SecureApiKey interface
      return (data || []).map(key => ({
        id: key.id,
        user_id: key.user_id,
        key_name: key.name,
        platform: key.environment || 'production',
        is_active: key.is_active ?? true,
        created_at: key.created_at || new Date().toISOString(),
        updated_at: key.created_at || new Date().toISOString(),
        last_used_at: key.last_used_at,
        usage_count: 0,
        created_ip: undefined
      })) as SecureApiKey[]
    },
  })

  const createApiKey = useMutation({
    mutationFn: async (apiKeyData: {
      key_name: string
      platform: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      // Use the secure server-side key generation with automatic hashing
      const { data, error } = await supabase.rpc('generate_api_key', {
        key_name: apiKeyData.key_name,
        key_scopes: [apiKeyData.platform]
      })
      
      if (error) throw error
      // Return the full key - user must copy it now, it won't be visible again
      return { 
        key: data,
        message: 'Copiez cette clé maintenant, elle ne sera plus visible après.'
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-api-keys'] })
      toast({
        title: "Clé API créée",
        description: "Copiez la clé maintenant - elle ne sera plus visible après fermeture",
      })
    }
  })

  const rotateApiKey = useMutation({
    mutationFn: async (keyId: string) => {
      // Delete old key and create new one with secure hashing
      const oldKey = apiKeys.find(k => k.id === keyId)
      if (!oldKey) throw new Error('Clé non trouvée')
      
      // Delete old key
      await supabase.from('api_keys').delete().eq('id', keyId)
      
      // Create new key with same name (will be automatically hashed)
      const { data, error } = await supabase.rpc('generate_api_key', {
        key_name: oldKey.key_name,
        key_scopes: [oldKey.platform]
      })
      
      if (error) throw error
      // Return the new full key - user must copy it now
      return { 
        success: true, 
        key: data,
        message: 'Nouvelle clé générée. Copiez-la maintenant, elle ne sera plus visible après.'
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-api-keys'] })
      toast({
        title: "Clé API rotée",
        description: "Copiez la nouvelle clé maintenant - elle ne sera plus visible après",
      })
    }
  })

  const deleteApiKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-api-keys'] })
      toast({
        title: "Clé API supprimée",
        description: "La clé API a été supprimée avec succès",
      })
    }
  })

  const toggleApiKey = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('api_keys')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-api-keys'] })
      toast({
        title: "Clé API mise à jour",
        description: "Le statut de la clé API a été modifié avec succès",
      })
    }
  })

  const stats = {
    total: apiKeys.length,
    active: apiKeys.filter(key => key.is_active).length,
    inactive: apiKeys.filter(key => !key.is_active).length,
    totalUsage: apiKeys.reduce((sum, key) => sum + (key.usage_count || 0), 0)
  }

  return {
    apiKeys,
    stats,
    isLoading,
    error,
    createApiKey: createApiKey.mutate,
    rotateApiKey: rotateApiKey.mutate,
    deleteApiKey: deleteApiKey.mutate,
    toggleApiKey: toggleApiKey.mutate,
    isCreating: createApiKey.isPending,
    isRotating: rotateApiKey.isPending,
    isDeleting: deleteApiKey.isPending,
    isToggling: toggleApiKey.isPending
  }
}
