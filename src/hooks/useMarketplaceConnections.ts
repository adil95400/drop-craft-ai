import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { marketplaceService, ConnectMarketplaceData } from '@/services/marketplace.service'
import { useToast } from '@/hooks/use-toast'

export function useMarketplaceConnections() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: connections = [], isLoading, error, refetch } = useQuery({
    queryKey: ['marketplace-connections'],
    queryFn: () => marketplaceService.getConnections(),
  })

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['marketplace-stats'],
    queryFn: () => marketplaceService.getAllStats(),
  })

  const connectMutation = useMutation({
    mutationFn: (data: ConnectMarketplaceData) => marketplaceService.connectMarketplace(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-connections'] })
      queryClient.invalidateQueries({ queryKey: ['marketplace-stats'] })
      toast({
        title: 'Connexion réussie',
        description: 'La marketplace a été connectée avec succès',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur de connexion',
        description: error.message || 'Impossible de connecter la marketplace',
        variant: 'destructive',
      })
    },
  })

  const syncMutation = useMutation({
    mutationFn: ({ connectionId, syncType }: { connectionId: string; syncType?: 'products' | 'orders' | 'full' }) =>
      marketplaceService.syncMarketplace(connectionId, syncType),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-connections'] })
      queryClient.invalidateQueries({ queryKey: ['marketplace-stats'] })
      toast({
        title: 'Synchronisation réussie',
        description: `${data.products_synced || 0} produits et ${data.orders_synced || 0} commandes synchronisés`,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur de synchronisation',
        description: error.message || 'Échec de la synchronisation',
        variant: 'destructive',
      })
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: (connectionId: string) => marketplaceService.disconnectMarketplace(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-connections'] })
      queryClient.invalidateQueries({ queryKey: ['marketplace-stats'] })
      toast({
        title: 'Déconnexion réussie',
        description: 'La marketplace a été déconnectée',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur de déconnexion',
        description: error.message || 'Impossible de déconnecter la marketplace',
        variant: 'destructive',
      })
    },
  })

  return {
    connections,
    stats,
    isLoading,
    isLoadingStats,
    error,
    refetch,
    connectMarketplace: connectMutation.mutate,
    isConnecting: connectMutation.isPending,
    syncMarketplace: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    disconnectMarketplace: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,
  }
}
