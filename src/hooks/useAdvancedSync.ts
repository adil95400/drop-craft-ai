import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface ProductVariant {
  id?: string
  variant_sku: string
  name: string
  options: {
    size?: string
    color?: string
    [key: string]: any
  }
  price: number
  cost_price?: number
  stock_quantity: number
  image_url?: string
  shopify_variant_id?: string
  woocommerce_variant_id?: string
}

export interface SyncSchedule {
  id: string
  integration_id: string
  user_id: string
  sync_type: 'inventory' | 'prices' | 'products' | 'orders'
  frequency_minutes: number
  is_active: boolean
  last_run_at?: string
  next_run_at?: string
}

export const useAdvancedSync = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Create product with variants (Shopify/WooCommerce)
  const createProductWithVariants = useMutation({
    mutationFn: async (params: {
      integration_id: string
      product_data: any
      variants_data: ProductVariant[]
      platform: 'shopify' | 'woocommerce'
    }) => {
      const syncType = params.platform === 'shopify' 
        ? 'create_product_with_variants'
        : 'create_variable_product'

      const { data, error } = await supabase.functions.invoke('advanced-sync', {
        body: {
          integration_id: params.integration_id,
          sync_type: syncType,
          product_data: params.product_data,
          variants_data: params.variants_data
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast({
        title: "Produit créé avec succès",
        description: `Produit créé avec ${data.succeeded} variantes`
      })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product-variants'] })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la création",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Update inventory levels (Shopify specific)
  const updateInventoryLevels = useMutation({
    mutationFn: async (params: {
      integration_id: string
      inventory_data: {
        items: Array<{
          inventory_item_id: string
          quantity: number
        }>
      }
    }) => {
      const { data, error } = await supabase.functions.invoke('advanced-sync', {
        body: {
          integration_id: params.integration_id,
          sync_type: 'update_inventory_levels',
          product_data: params.inventory_data
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast({
        title: "Stock mis à jour",
        description: `${data.succeeded} articles mis à jour avec succès`
      })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    }
  })

  // Sync product variants
  const syncProductVariants = useMutation({
    mutationFn: async (params: {
      integration_id: string
      product_data: any
      variants_data: ProductVariant[]
      platform: 'shopify' | 'woocommerce'
    }) => {
      const syncType = params.platform === 'shopify' 
        ? 'sync_product_variants'
        : 'update_product_variations'

      const { data, error } = await supabase.functions.invoke('advanced-sync', {
        body: {
          integration_id: params.integration_id,
          sync_type: syncType,
          product_data: params.product_data,
          variants_data: params.variants_data
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast({
        title: "Variantes synchronisées",
        description: `${data.succeeded} variantes mises à jour`
      })
      queryClient.invalidateQueries({ queryKey: ['product-variants'] })
    }
  })

  // Get product variants
  const { data: productVariants = [], isLoading: isLoadingVariants } = useQuery({
    queryKey: ['product-variants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []).map((p: any) => ({
        id: p.id,
        product_id: p.id,
        name: p.title || p.name || '',
        variant_sku: p.sku || '',
        options: {},
        price: p.price || 0,
        stock_quantity: p.stock_quantity || 0,
        created_at: p.created_at
      })) as unknown as ProductVariant[]
        id: p.id,
        product_id: p.id,
        variant_sku: p.sku || '',
        options: {},
        price: p.price || 0,
        stock_quantity: p.stock_quantity || 0,
        created_at: p.created_at
      })) as ProductVariant[]
    }
  })

  // Manage sync schedules
  const { data: syncSchedules = [], isLoading: isLoadingSchedules } = useQuery({
    queryKey: ['sync-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []).map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        integration_id: s.id,
        sync_type: s.task_type,
        frequency_minutes: 60,
        is_active: s.is_active,
        last_run_at: s.last_run_at,
        next_run_at: s.next_run_at,
        created_at: s.created_at,
        integrations: { platform_name: s.name }
      })) as unknown as SyncSchedule[]
    }
  })

  const manageSyncSchedule = useMutation({
    mutationFn: async (params: {
      action: 'create' | 'update' | 'delete'
      schedule_id?: string
      schedule_data?: Partial<SyncSchedule>
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      let query
      
      if (params.action === 'create') {
        const nextRun = new Date(Date.now() + ((params.schedule_data?.frequency_minutes || 60) * 60 * 1000))
        query = supabase
          .from('scheduled_tasks')
          .insert({
            name: params.schedule_data?.sync_type || 'sync',
            task_type: params.schedule_data?.sync_type || 'sync',
            schedule: `*/${params.schedule_data?.frequency_minutes || 60} * * * *`,
            is_active: params.schedule_data?.is_active ?? true,
            user_id: user.id,
            next_run_at: nextRun.toISOString()
          })
          .select()
          .single()
      } else if (params.action === 'update') {
        query = supabase
          .from('scheduled_tasks')
          .update({ is_active: params.schedule_data?.is_active })
          .eq('id', params.schedule_id!)
          .select()
          .single()
      } else {
        query = supabase
          .from('scheduled_tasks')
          .delete()
          .eq('id', params.schedule_id!)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    onSuccess: (_, params) => {
      const action = params.action === 'create' ? 'créée' : 
                    params.action === 'update' ? 'mise à jour' : 'supprimée'
      toast({
        title: "Planification modifiée",
        description: `Planification ${action} avec succès`
      })
      queryClient.invalidateQueries({ queryKey: ['sync-schedules'] })
    }
  })

  // Get sync logs
  const { data: syncLogs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ['sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return (data || []).map((log: any) => ({
        id: log.id,
        integration_id: log.id,
        sync_type: log.method || 'sync',
        status: log.status_code && log.status_code < 400 ? 'success' : 'error',
        started_at: log.created_at,
        completed_at: log.created_at,
        records_processed: 1,
        records_succeeded: log.status_code && log.status_code < 400 ? 1 : 0,
        records_failed: log.status_code && log.status_code >= 400 ? 1 : 0,
        error_details: log.error_message ? [log.error_message] : [],
        integrations: { platform_name: log.endpoint }
      })) as any[]
    }
  })

  // Manual CRON trigger
  const triggerCronSync = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('cron-sync')
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast({
        title: "Synchronisation lancée",
        description: `${data.processed} tâches de synchronisation exécutées`
      })
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] })
      queryClient.invalidateQueries({ queryKey: ['sync-schedules'] })
    }
  })

  return {
    // Mutations
    createProductWithVariants: createProductWithVariants.mutate,
    updateInventoryLevels: updateInventoryLevels.mutate,
    syncProductVariants: syncProductVariants.mutate,
    manageSyncSchedule: manageSyncSchedule.mutate,
    triggerCronSync: triggerCronSync.mutate,

    // Data
    productVariants,
    syncSchedules,
    syncLogs,

    // Loading states
    isLoadingVariants,
    isLoadingSchedules,
    isLoadingLogs,
    isCreatingProduct: createProductWithVariants.isPending,
    isUpdatingInventory: updateInventoryLevels.isPending,
    isSyncingVariants: syncProductVariants.isPending,
    isManagingSchedule: manageSyncSchedule.isPending,
    isTriggeringSync: triggerCronSync.isPending
  }
}