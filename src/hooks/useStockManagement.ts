import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Helper to get current user
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Warehouses
export const useWarehouses = () => {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      return data || []
    }
  })
}

export const useCreateWarehouse = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (warehouse: any) => {
      const user = await getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('warehouses')
        .insert([{ 
          name: warehouse.name || '',
          location: warehouse.location || '',
          warehouse_type: warehouse.warehouse_type || 'standard',
          capacity: warehouse.capacity || 1000,
          manager_name: warehouse.manager_name,
          contact_email: warehouse.contact_email,
          contact_phone: warehouse.contact_phone,
          user_id: user.id 
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      toast({ title: 'Entrepôt créé' })
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })
}

export const useUpdateWarehouse = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('warehouses')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      toast({ title: 'Entrepôt mis à jour' })
    }
  })
}

// Stock Levels
export const useStockLevels = () => {
  return useQuery({
    queryKey: ['stock_levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_levels')
        .select(`*, product:products(name, sku, image_url), warehouse:warehouses(name, location)`)
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      return data || []
    }
  })
}

export const useUpdateStockLevel = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { data, error } = await supabase
        .from('stock_levels')
        .update({ quantity })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_levels'] })
      toast({ title: 'Stock mis à jour' })
    }
  })
}

// Stock Movements
export const useStockMovements = () => {
  return useQuery({
    queryKey: ['stock_movements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (error) throw error
      return data || []
    }
  })
}

// Stock Alerts
export const useStockAlerts = (activeOnly = true) => {
  return useQuery({
    queryKey: ['stock_alerts', activeOnly ? 'active' : 'all'],
    queryFn: async () => {
      let query = supabase
        .from('stock_alerts')
        .select('*')
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (activeOnly) {
        query = query.eq('alert_status', 'active')
      }
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    }
  })
}

export const useResolveAlert = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase
        .from('stock_alerts')
        .update({ alert_status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', alertId)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_alerts'] })
      toast({ title: 'Alerte résolue' })
    }
  })
}

// Product Variants
export const useProductVariants = (productId?: string) => {
  return useQuery({
    queryKey: ['product_variants', productId],
    queryFn: async () => {
      let query = supabase.from('product_variants').select('*').order('created_at', { ascending: false })
      if (productId) query = query.eq('product_id', productId)
      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    enabled: !!productId || productId === undefined
  })
}

export const useCreateVariant = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (variant: any) => {
      const user = await getCurrentUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase.from('product_variants').insert([{ ...variant, user_id: user.id }]).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_variants'] })
      toast({ title: 'Variante créée' })
    }
  })
}

export const useUpdateVariant = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from('product_variants').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_variants'] })
      toast({ title: 'Variante mise à jour' })
    }
  })
}

export const useDeleteVariant = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_variants').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_variants'] })
      toast({ title: 'Variante supprimée' })
    }
  })
}

// Stock Stats
export const useStockStats = () => {
  const { data: stockLevels = [] } = useStockLevels()
  const { data: warehouses = [] } = useWarehouses()
  const { data: activeAlerts = [] } = useStockAlerts()

  return {
    total_products: stockLevels.length,
    total_warehouses: warehouses.length,
    total_stock_value: stockLevels.reduce((sum, level: any) => sum + ((level.quantity || 0) * (level.cost_per_unit || 0)), 0),
    low_stock_items: stockLevels.filter((level: any) => level.available_quantity <= level.reorder_point).length,
    out_of_stock_items: stockLevels.filter((level: any) => level.available_quantity === 0).length,
    active_alerts: activeAlerts.length,
    predicted_stockouts_7d: 0,
    average_stock_turnover: 0
  }
}
