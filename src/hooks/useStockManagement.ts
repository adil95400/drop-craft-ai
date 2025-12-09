import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { StockLevel, StockAlert, Warehouse, StockMovement, StockStats } from '@/types/stock'
import { useToast } from '@/hooks/use-toast'

// Individual hooks for modular usage
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
      return data as Warehouse[]
    }
  })
}

export const useCreateWarehouse = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (warehouse: Partial<Warehouse>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('warehouses')
        .insert([{ ...warehouse, user_id: user.id }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      toast({ title: 'Entrepôt créé', description: 'L\'entrepôt a été créé avec succès' })
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })
}

export const useUpdateWarehouse = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Warehouse> & { id: string }) => {
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

export const useStockLevels = () => {
  return useQuery({
    queryKey: ['stock_levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_levels')
        .select(`
          *,
          product:products(name, sku, image_url),
          warehouse:warehouses(name, location)
        `)
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      return data as StockLevel[]
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
      toast({ title: 'Stock mis à jour', description: 'Le niveau de stock a été mis à jour' })
    }
  })
}

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
      return data as StockMovement[]
    }
  })
}

export const useStockAlerts = () => {
  return useQuery({
    queryKey: ['stock_alerts', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_alerts')
        .select('*')
        .eq('alert_status', 'active')
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as any[]
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
        .update({
          alert_status: 'resolved',
          resolved_at: new Date().toISOString()
        })
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

export const useProductVariants = (productId?: string) => {
  return useQuery({
    queryKey: ['product_variants', productId],
    queryFn: async () => {
      let query = supabase
        .from('product_variants')
        .select('*')
        .order('created_at', { ascending: false })

      if (productId) {
        query = query.eq('product_id', productId)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!productId || productId === undefined
  })
}

export const useCreateVariant = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (variant: any) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('product_variants')
        .insert([{ ...variant, user_id: user.id }])
        .select()
        .single()
      
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
      const { data, error } = await supabase
        .from('product_variants')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
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
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_variants'] })
      toast({ title: 'Variante supprimée' })
    }
  })
}

export const useStockStats = () => {
  const { data: stockLevels = [] } = useStockLevels()
  const { data: warehouses = [] } = useWarehouses()
  const { data: activeAlerts = [] } = useStockAlerts()

  const stats: StockStats = {
    total_products: stockLevels.length,
    total_warehouses: warehouses.length,
    total_stock_value: stockLevels.reduce((sum, level) => 
      sum + (level.quantity * (level.cost_per_unit || 0)), 0
    ),
    low_stock_items: stockLevels.filter(level => 
      level.available_quantity <= level.reorder_point
    ).length,
    out_of_stock_items: stockLevels.filter(level => 
      level.available_quantity === 0
    ).length,
    active_alerts: activeAlerts.length,
    predicted_stockouts_7d: 0,
    average_stock_turnover: 0
  }

  return stats
}

// Legacy combined hook for backwards compatibility
export const useStockManagement = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: warehouses = [], isLoading: warehousesLoading } = useWarehouses()
  const { data: stockLevels = [], isLoading: stockLevelsLoading } = useStockLevels()
  const { data: activeAlerts = [], isLoading: alertsLoading } = useStockAlerts()
  const { data: stockMovements = [], isLoading: movementsLoading } = useStockMovements()
  const stockStats = useStockStats()

  const updateStockLevel = useMutation({
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
      toast({ title: 'Stock mis à jour', description: 'Le niveau de stock a été mis à jour avec succès' })
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  const recordStockMovement = useMutation({
    mutationFn: async (movement: {
      product_id: string
      warehouse_id: string
      movement_type: 'inbound' | 'outbound' | 'transfer' | 'adjustment' | 'return'
      quantity: number
      reason?: string
      notes?: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('stock_movements')
        .insert([{
          ...movement,
          user_id: user.id,
          performed_by: user.id
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_levels'] })
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] })
      toast({ title: 'Mouvement enregistré' })
    }
  })

  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase
        .from('stock_alerts')
        .update({
          alert_status: 'resolved',
          resolved_at: new Date().toISOString()
        })
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

  return {
    warehouses,
    warehousesLoading,
    stockLevels,
    stockLevelsLoading,
    activeAlerts,
    alertsLoading,
    stockMovements,
    movementsLoading,
    stockStats,
    updateStockLevel,
    recordStockMovement,
    resolveAlert,
    isLoading: warehousesLoading || stockLevelsLoading || alertsLoading
  }
}
