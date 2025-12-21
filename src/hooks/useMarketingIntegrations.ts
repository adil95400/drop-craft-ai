import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

interface MarketingIntegration {
  id: string
  platform: string
  platform_name?: string
  connection_status?: string
  is_active?: boolean
  last_sync_at?: string
  created_at?: string
  updated_at?: string
}

export const useMarketingIntegrations = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const {
    data: integrations = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['marketing-integrations', user?.id],
    queryFn: async (): Promise<MarketingIntegration[]> => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as unknown as MarketingIntegration[]
    },
    enabled: !!user?.id
  })

  const connectIntegration = useMutation({
    mutationFn: async (integrationData: { 
      platform_name: string
      platform_type?: string
      api_key?: string
      access_token?: string 
    }) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('integrations')
        .insert([{ 
          platform: integrationData.platform_name,
          platform_name: integrationData.platform_name,
          user_id: user.id,
          connection_status: 'connected',
          is_active: true
        } as any])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-integrations'] })
      toast({
        title: `${data.platform_name} connecté`,
        description: `Votre compte ${data.platform_name} a été connecté avec succès`
      })
    }
  })

  const disconnectIntegration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-integrations'] })
      toast({
        title: "Intégration déconnectée",
        description: "L'intégration a été supprimée avec succès"
      })
    }
  })

  const syncIntegration = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('integrations')
        .update({ 
          last_sync_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-integrations'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({
        title: "Synchronisation terminée",
        description: "Les données ont été synchronisées avec succès"
      })
    }
  })

  return {
    integrations,
    isLoading,
    error,
    connectIntegration: connectIntegration.mutate,
    disconnectIntegration: disconnectIntegration.mutate,
    syncIntegration: syncIntegration.mutate,
    isConnecting: connectIntegration.isPending,
    isDisconnecting: disconnectIntegration.isPending,
    isSyncing: syncIntegration.isPending
  }
}
