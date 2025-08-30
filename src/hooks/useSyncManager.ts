import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { syncService } from '@/services/sync/SyncService'
import { queueService } from '@/services/sync/QueueService'
import { useToast } from '@/hooks/use-toast'

export const useSyncManager = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Récupération des jobs de synchronisation
  const { data: syncJobs = [], isLoading } = useQuery({
    queryKey: ['sync-jobs'],
    queryFn: async () => {
      // Utiliser activity_logs pour récupérer les jobs temporairement
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .like('action', 'sync_%')
        .order('created_at', { ascending: false })

      return data?.map(log => ({
        id: log.id,
        type: log.action.replace('sync_', ''),
        status: log.severity, // Approximation
        created_at: log.created_at,
        description: log.description,
        metadata: log.metadata
      })) || []
    }
  })

  // Statistiques de la queue
  const { data: queueStats } = useQuery({
    queryKey: ['queue-stats'],
    queryFn: () => queueService.getQueueStats(),
    refetchInterval: 30000 // Rafraîchir toutes les 30 secondes
  })

  // Création d'un job de sync
  const createSyncJob = useMutation({
    mutationFn: async (params: {
      type: 'products' | 'stock' | 'orders'
      supplier_id: string
      frequency: 'hourly' | 'daily' | 'weekly' | 'manual'
      auto_enabled: boolean
    }) => {
      // Simuler la création d'un job de sync
      return await queueService.addJob('sync', {
        supplierId: params.supplier_id,
        type: params.type,
        frequency: params.frequency,
        auto_enabled: params.auto_enabled
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-jobs'] })
      toast({
        title: "Job de synchronisation créé",
        description: "Le job de synchronisation a été configuré avec succès.",
      })
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le job de synchronisation.",
        variant: "destructive",
      })
      console.error('Failed to create sync job:', error)
    }
  })

  // Synchronisation manuelle
  const triggerManualSync = useMutation({
    mutationFn: async ({ supplierId, type }: { supplierId: string; type: 'products' | 'stock' | 'orders' }) => {
      return await queueService.addJob('sync', {
        supplierId,
        type,
        manual: true
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-jobs', 'queue-stats'] })
      toast({
        title: "Synchronisation lancée",
        description: "La synchronisation manuelle a été ajoutée à la queue.",
      })
    },
    onError: (error) => {
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de lancer la synchronisation manuelle.",
        variant: "destructive",
      })
      console.error('Failed to trigger manual sync:', error)
    }
  })

  // Synchronisation de produits vers Shopify
  const syncToShopify = useMutation({
    mutationFn: async (params: { productIds: string[]; shopifyCredentials: any }) => {
      return await queueService.addJob('export', {
        destination: 'shopify',
        format: 'shopify_api',
        filters: { productIds: params.productIds },
        credentials: params.shopifyCredentials
      })
    },
    onSuccess: () => {
      toast({
        title: "Export Shopify lancé",
        description: "L'export vers Shopify a été ajouté à la queue.",
      })
    },
    onError: (error) => {
      toast({
        title: "Erreur d'export",
        description: "Impossible de lancer l'export vers Shopify.",
        variant: "destructive",
      })
      console.error('Failed to sync to Shopify:', error)
    }
  })

  // Import depuis BigBuy
  const importFromBigBuy = useMutation({
    mutationFn: async (params: { category?: string; limit?: number }) => {
      return await queueService.addJob('import', {
        source: 'bigbuy',
        category: params.category,
        limit: params.limit || 100
      })
    },
    onSuccess: () => {
      toast({
        title: "Import BigBuy lancé",
        description: "L'import depuis BigBuy a été ajouté à la queue.",
      })
    },
    onError: (error) => {
      toast({
        title: "Erreur d'import",
        description: "Impossible de lancer l'import depuis BigBuy.",
        variant: "destructive",
      })
      console.error('Failed to import from BigBuy:', error)
    }
  })

  // Nettoyage des anciens jobs
  const cleanupOldJobs = useMutation({
    mutationFn: async (days: number = 7) => {
      await queueService.cleanupOldJobs(days)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-jobs', 'queue-stats'] })
      toast({
        title: "Nettoyage effectué",
        description: "Les anciens jobs ont été supprimés.",
      })
    }
  })

  return {
    syncJobs,
    queueStats,
    isLoading,
    createSyncJob: createSyncJob.mutate,
    triggerManualSync: triggerManualSync.mutate,
    syncToShopify: syncToShopify.mutate,
    importFromBigBuy: importFromBigBuy.mutate,
    cleanupOldJobs: cleanupOldJobs.mutate,
    isCreatingSyncJob: createSyncJob.isPending,
    isTriggeringSync: triggerManualSync.isPending,
    isSyncingToShopify: syncToShopify.isPending,
    isImportingFromBigBuy: importFromBigBuy.isPending,
    isCleaningUp: cleanupOldJobs.isPending
  }
}