import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface SetupTemplate {
  id: string
  title: string
  config: {
    auto_import: boolean
    filter?: string
    category?: string
    limit: number
  }
}

interface AutomationRules {
  autoImport: boolean
  autoFulfill: boolean
  priceOptimization: boolean
  targetMargin: number
  syncFrequency: string
}

export function useQuickDropshipping() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Récupérer la config actuelle - use integrations table
  const { data: config, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['dropshipping-config'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'dropshipping')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    }
  })

  // Récupérer les stats
  const { data: stats } = useQuery({
    queryKey: ['dropshipping-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const [productsResult, ordersResult, syncsResult] = await Promise.all([
        supabase
          .from('imported_products')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'imported'),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('fulfillment_status', 'ordered'),
        supabase
          .from('activity_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('action', 'sync')
      ])

      return {
        products: productsResult.count || 0,
        autoOrders: ordersResult.count || 0,
        syncs: syncsResult.count || 0
      }
    },
    refetchInterval: 30000
  })

  // Setup rapide
  const setupStore = useMutation({
    mutationFn: async ({ 
      template, 
      supplier, 
      automationRules 
    }: { 
      template: SetupTemplate
      supplier: string
      automationRules?: AutomationRules 
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.functions.invoke('quick-dropshipping-setup', {
        body: {
          userId: user.id,
          template,
          supplier,
          automationRules
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dropshipping-config'] })
      queryClient.invalidateQueries({ queryKey: ['dropshipping-stats'] })
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      
      toast({
        title: 'Store configuré ! 🎉',
        description: `${data?.data?.products_imported || 0} produits importés avec succès`
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur de configuration',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Mettre à jour les règles d'automatisation
  const updateAutomationRules = useMutation({
    mutationFn: async (rules: AutomationRules & { filters?: any }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.functions.invoke('dropshipping-automation', {
        body: {
          userId: user.id,
          action: 'update_rules',
          rules,
          filters: rules.filters
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dropshipping-config'] })
      toast({
        title: 'Règles mises à jour',
        description: 'Les règles d\'automatisation ont été sauvegardées'
      })
    }
  })

  // Synchroniser l'inventaire
  const syncInventory = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.functions.invoke('dropshipping-automation', {
        body: {
          userId: user.id,
          action: 'sync_inventory'
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dropshipping-stats'] })
      toast({
        title: 'Synchronisation terminée',
        description: `${data?.stats?.synced || 0} produits synchronisés`
      })
    }
  })

  // Optimiser les prix
  const optimizePrices = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.functions.invoke('dropshipping-automation', {
        body: {
          userId: user.id,
          action: 'optimize_prices'
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      toast({
        title: 'Prix optimisés',
        description: `${data?.stats?.optimized || 0} produits mis à jour`
      })
    }
  })

  return {
    config,
    stats,
    isLoadingConfig,
    
    setupStore: setupStore.mutate,
    isSettingUp: setupStore.isPending,
    
    updateAutomationRules: updateAutomationRules.mutate,
    isUpdatingRules: updateAutomationRules.isPending,
    
    syncInventory: syncInventory.mutate,
    isSyncing: syncInventory.isPending,
    
    optimizePrices: optimizePrices.mutate,
    isOptimizing: optimizePrices.isPending
  }
}
