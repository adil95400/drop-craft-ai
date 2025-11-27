import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { StockLevel, StockAlert, Warehouse, StockMovement, StockStats } from '@/types/stock'
import { useToast } from '@/hooks/use-toast'

export const useStockManagement = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch warehouses
  const { data: warehouses = [], isLoading: warehousesLoading } = useQuery({
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

  // Fetch stock levels with product and warehouse info
  const { data: stockLevels = [], isLoading: stockLevelsLoading } = useQuery({
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

  // Fetch active alerts
  const { data: activeAlerts = [], isLoading: alertsLoading } = useQuery({
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

  // Fetch stock movements
  const { data: stockMovements = [], isLoading: movementsLoading } = useQuery({
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

  // Calculate stock stats
  const stockStats: StockStats = {
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
    predicted_stockouts_7d: 0, // Will be calculated from predictions
    average_stock_turnover: 0 // Will be calculated from movements
  }

  // Update stock level mutation
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
      toast({
        title: 'Stock mis à jour',
        description: 'Le niveau de stock a été mis à jour avec succès'
      })
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Record stock movement mutation
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
      
      // Update stock level manually
      const quantityChange = movement.movement_type === 'inbound' ? movement.quantity : -movement.quantity
      
      // Get current stock level
      const { data: currentLevel, error: fetchError } = await supabase
        .from('stock_levels')
        .select('quantity')
        .eq('product_id', movement.product_id)
        .eq('warehouse_id', movement.warehouse_id)
        .single()
      
      if (fetchError) throw fetchError
      
      // Update with new quantity
      const { error: updateError } = await supabase
        .from('stock_levels')
        .update({ 
          quantity: (currentLevel.quantity || 0) + quantityChange
        })
        .eq('product_id', movement.product_id)
        .eq('warehouse_id', movement.warehouse_id)
      
      if (updateError) throw updateError
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_levels'] })
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] })
      toast({
        title: 'Mouvement enregistré',
        description: 'Le mouvement de stock a été enregistré'
      })
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Resolve alert mutation
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
      toast({
        title: 'Alerte résolue',
        description: 'L\'alerte a été marquée comme résolue'
      })
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
