import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

interface MarketingIntegration {
  id: string; platform: string; platform_name?: string; connection_status?: string
  is_active?: boolean; last_sync_at?: string; created_at?: string; updated_at?: string
}

export const useMarketingIntegrations = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: integrations = [], isLoading, error } = useQuery({
    queryKey: ['marketing-integrations', user?.id],
    queryFn: async (): Promise<MarketingIntegration[]> => {
      if (!user?.id) return []
      const res = await shopOptiApi.request<MarketingIntegration[]>('/marketing/integrations')
      return res.data || []
    },
    enabled: !!user?.id
  })

  const connectIntegration = useMutation({
    mutationFn: async (integrationData: { platform_name: string; platform_type?: string; api_key?: string; access_token?: string }) => {
      const res = await shopOptiApi.request('/marketing/integrations', { method: 'POST', body: integrationData })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-integrations'] })
      toast({ title: `${data.platform_name || 'Intégration'} connecté`, description: `Votre compte a été connecté avec succès` })
    }
  })

  const disconnectIntegration = useMutation({
    mutationFn: async (id: string) => {
      const res = await shopOptiApi.request(`/marketing/integrations/${id}`, { method: 'DELETE' })
      if (!res.success) throw new Error(res.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-integrations'] })
      toast({ title: "Intégration déconnectée", description: "L'intégration a été supprimée avec succès" })
    }
  })

  const syncIntegration = useMutation({
    mutationFn: async (id: string) => {
      const res = await shopOptiApi.request(`/marketing/integrations/${id}/sync`, { method: 'POST' })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-integrations'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
      toast({ title: "Synchronisation terminée", description: "Les données ont été synchronisées avec succès" })
    }
  })

  return {
    integrations, isLoading, error,
    connectIntegration: connectIntegration.mutate,
    disconnectIntegration: disconnectIntegration.mutate,
    syncIntegration: syncIntegration.mutate,
    isConnecting: connectIntegration.isPending,
    isDisconnecting: disconnectIntegration.isPending,
    isSyncing: syncIntegration.isPending
  }
}
