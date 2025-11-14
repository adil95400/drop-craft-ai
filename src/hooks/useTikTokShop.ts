import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { tiktokShopService, TikTokPublishOptions } from '@/services/tiktok-shop.service'

export function useTikTokShop() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const publishProduct = useMutation({
    mutationFn: ({ 
      integrationId, 
      productId, 
      options 
    }: { 
      integrationId: string
      productId: string
      options?: TikTokPublishOptions 
    }) => tiktokShopService.publishProduct(integrationId, productId, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['published-products'] })
      queryClient.invalidateQueries({ queryKey: ['marketplace-integrations'] })
      toast({
        title: 'Publication réussie',
        description: 'Produit publié sur TikTok Shop',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur de publication',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const publishBulkProducts = useMutation({
    mutationFn: ({ 
      integrationId, 
      productIds, 
      options 
    }: { 
      integrationId: string
      productIds: string[]
      options?: TikTokPublishOptions 
    }) => tiktokShopService.publishBulkProducts(integrationId, productIds, options),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['published-products'] })
      toast({
        title: 'Publication terminée',
        description: `${data.success_count} produits publiés sur ${data.total}`,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur de publication',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const syncProducts = useMutation({
    mutationFn: (integrationId: string) => tiktokShopService.syncProducts(integrationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      toast({
        title: 'Synchronisation réussie',
        description: `${data.synced_count} produits synchronisés`,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur de synchronisation',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const syncOrders = useMutation({
    mutationFn: (integrationId: string) => tiktokShopService.syncOrders(integrationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast({
        title: 'Synchronisation réussie',
        description: `${data.synced_count} commandes synchronisées`,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur de synchronisation',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const updateInventory = useMutation({
    mutationFn: ({ 
      integrationId, 
      productId, 
      quantity 
    }: { 
      integrationId: string
      productId: string
      quantity: number 
    }) => tiktokShopService.updateInventory(integrationId, productId, quantity),
    onSuccess: () => {
      toast({
        title: 'Stock mis à jour',
        description: 'Le stock a été synchronisé sur TikTok Shop',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur de mise à jour',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const getStats = (integrationId: string) => useQuery({
    queryKey: ['tiktok-shop-stats', integrationId],
    queryFn: () => tiktokShopService.getIntegrationStats(integrationId),
    enabled: !!integrationId,
  })

  const getCategories = (integrationId: string) => useQuery({
    queryKey: ['tiktok-shop-categories', integrationId],
    queryFn: () => tiktokShopService.getCategories(integrationId),
    enabled: !!integrationId,
  })

  return {
    publishProduct: publishProduct.mutate,
    isPublishing: publishProduct.isPending,
    publishBulkProducts: publishBulkProducts.mutate,
    isBulkPublishing: publishBulkProducts.isPending,
    syncProducts: syncProducts.mutate,
    isSyncingProducts: syncProducts.isPending,
    syncOrders: syncOrders.mutate,
    isSyncingOrders: syncOrders.isPending,
    updateInventory: updateInventory.mutate,
    isUpdatingInventory: updateInventory.isPending,
    getStats,
    getCategories,
  }
}
