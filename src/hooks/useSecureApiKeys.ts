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
  // Note: encrypted_value is never exposed for security
}

export const useSecureApiKeys = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: apiKeys = [], isLoading, error } = useQuery({
    queryKey: ['secure-api-keys'],
    queryFn: async () => {
      // Use regular select but the encrypted_value field will be hidden by RLS
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('id, user_id, key_name, platform, is_active, created_at, updated_at, last_used_at, usage_count, created_ip')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return (data || []) as SecureApiKey[]
    },
  })

  const createApiKey = useMutation({
    mutationFn: async (apiKeyData: {
      key_name: string
      platform: string
      encrypted_value: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      const { data, error } = await supabase
        .from('user_api_keys')
        .insert([{
          ...apiKeyData,
          user_id: user.id,
          is_active: true,
          usage_count: 0
        }])
        .select('id, user_id, key_name, platform, is_active, created_at, updated_at')
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-api-keys'] })
      toast({
        title: "Clé API créée",
        description: "La clé API a été créée avec succès et stockée de manière sécurisée",
      })
    }
  })

  const rotateApiKey = useMutation({
    mutationFn: async (keyId: string) => {
      const { data, error } = await supabase.rpc('rotate_api_key', {
        key_id: keyId
      })
      
      if (error) throw error
      
      const result = data as { success: boolean; message?: string }
      if (!result.success) {
        throw new Error('Échec de la rotation de la clé')
      }
      
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure-api-keys'] })
      toast({
        title: "Clé API rotée",
        description: "La clé API a été régénérée avec succès pour des raisons de sécurité",
      })
    }
  })

  const deleteApiKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_api_keys')
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
        .from('user_api_keys')
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