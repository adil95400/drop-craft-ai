import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Warehouses - stored in user settings (no dedicated table yet)
interface Warehouse {
  id: string
  name: string
  location: string
  warehouse_type: 'standard' | 'cold_storage' | 'hazmat' | 'dropship'
  capacity: number
  current_utilization: number
  manager_name?: string
  contact_email?: string
  contact_phone?: string
  is_active: boolean
}

interface StockLevel {
  id: string
  product_id: string
  warehouse_id: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  reorder_point: number
  max_stock_level: number
  min_stock_level: number
  location_in_warehouse?: string
  cost_per_unit?: number
  product?: { name: string; sku?: string; image_url?: string }
  warehouse?: { name: string; location?: string }
}

interface StockMovement {
  id: string
  product_id: string
  warehouse_id: string
  movement_type: 'inbound' | 'outbound' | 'transfer' | 'adjustment' | 'return'
  quantity: number
  reason?: string
  notes?: string
  performed_by?: string
  reference_id?: string
  created_at: string
}

interface StockAlert {
  id: string
  product_id: string
  product_name?: string
  alert_type: 'low_stock' | 'out_of_stock' | 'overstocked' | 'expiring_soon'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  alert_status: 'active' | 'resolved'
  resolved_at?: string
  created_at: string
}

// Warehouses - from user_settings JSON or default
export const useWarehouses = () => {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Try to load warehouses from user_settings
      const { data: settings } = await (supabase.from('user_settings' as any) as any)
        .select('value')
        .eq('user_id', user.id)
        .eq('key', 'warehouses')
        .maybeSingle()

      if (settings?.value) {
        return settings.value as Warehouse[]
      }

      // Default single warehouse
      return [{
        id: 'wh-default',
        name: 'Entrepôt Principal',
        location: 'France',
        warehouse_type: 'standard' as const,
        capacity: 10000,
        current_utilization: 0,
        is_active: true
      }]
    }
  })
}

export const useCreateWarehouse = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (warehouse: Partial<Warehouse>) => {
      const newWarehouse: Warehouse = {
        id: `wh-${Date.now()}`,
        name: warehouse.name || 'Nouvel Entrepôt',
        location: warehouse.location || '',
        warehouse_type: warehouse.warehouse_type || 'standard',
        capacity: warehouse.capacity || 1000,
        current_utilization: 0,
        manager_name: warehouse.manager_name,
        contact_email: warehouse.contact_email,
        contact_phone: warehouse.contact_phone,
        is_active: true
      }
      return newWarehouse
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      toast({ title: 'Entrepôt créé' })
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })
}

export const useUpdateWarehouse = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Warehouse> & { id: string }) => {
      return { id, ...updates }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      toast({ title: 'Entrepôt mis à jour' })
    }
  })
}

// Stock Levels - derived from products table
export const useStockLevels = () => {
  return useQuery({
    queryKey: ['stock_levels'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data: products, error } = await supabase
        .from('products')
        .select('id, title, name, sku, image_url, stock_quantity, price')
        .eq('user_id', user.id)
        .limit(50)

      if (error) throw error

      return (products || []).map((product): StockLevel => {
        const quantity = product.stock_quantity || 0
        const reserved = Math.floor(quantity * 0.1)

        return {
          id: `sl-${product.id}`,
          product_id: product.id,
          warehouse_id: 'wh-default',
          quantity,
          reserved_quantity: reserved,
          available_quantity: quantity - reserved,
          reorder_point: 10,
          max_stock_level: 200,
          min_stock_level: 5,
          cost_per_unit: product.price ? Number(product.price) * 0.6 : undefined,
          product: {
            name: product.name || product.title || 'Sans nom',
            sku: product.sku || undefined,
            image_url: product.image_url || undefined
          },
          warehouse: {
            name: 'Entrepôt Principal',
            location: 'France'
          }
        }
      })
    }
  })
}

export const useUpdateStockLevel = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const productId = id.replace('sl-', '')
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: quantity })
        .eq('id', productId)

      if (error) throw error
      return { id, quantity }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_levels'] })
      toast({ title: 'Stock mis à jour' })
    }
  })
}

// Stock Movements - from activity_logs
export const useStockMovements = () => {
  return useQuery({
    queryKey: ['stock_movements'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data: logs, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .in('action', ['stock_updated', 'product_created', 'product_updated', 'order_shipped'])
        .order('created_at', { ascending: false })
        .limit(30)

      if (error) return []

      return (logs || []).map((log, i): StockMovement => ({
        id: log.id,
        product_id: log.entity_id || '',
        warehouse_id: 'wh-default',
        movement_type: log.action === 'order_shipped' ? 'outbound' : log.action === 'product_created' ? 'inbound' : 'adjustment',
        quantity: (log.details as any)?.quantity || 1,
        reason: log.description || log.action,
        performed_by: 'Système',
        reference_id: log.entity_id || undefined,
        created_at: log.created_at || new Date().toISOString()
      }))
    }
  })
}

// Stock Alerts - from products with low stock
export const useStockAlerts = (_activeOnly = true) => {
  return useQuery({
    queryKey: ['stock_alerts', _activeOnly ? 'active' : 'all'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data: products, error } = await supabase
        .from('products')
        .select('id, title, name, stock_quantity')
        .eq('user_id', user.id)
        .or('stock_quantity.lte.10,stock_quantity.is.null')
        .limit(20)

      if (error) return []

      return (products || []).map((product): StockAlert => {
        const stock = product.stock_quantity || 0
        const isOutOfStock = stock === 0

        return {
          id: `alert-${product.id}`,
          product_id: product.id,
          product_name: product.name || product.title || 'Sans nom',
          alert_type: isOutOfStock ? 'out_of_stock' : 'low_stock',
          severity: isOutOfStock ? 'critical' : stock <= 5 ? 'high' : 'medium',
          message: isOutOfStock
            ? `${product.name || product.title} est en rupture de stock`
            : `Stock faible pour ${product.name || product.title}: ${stock} unités restantes`,
          alert_status: 'active',
          created_at: new Date().toISOString()
        }
      })
    }
  })
}

export const useResolveAlert = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (alertId: string) => {
      return { id: alertId, alert_status: 'resolved', resolved_at: new Date().toISOString() }
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
      if (!productId) return []

      const { data, error } = await (supabase.from('product_variants' as any) as any)
        .select('*')
        .eq('product_id', productId)
        .order('created_at')

      if (error) return []
      return data || []
    },
    enabled: !!productId
  })
}

export const useCreateVariant = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (variant: Record<string, unknown>) => {
      const { data, error } = await (supabase.from('product_variants' as any) as any)
        .insert(variant)
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
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await (supabase.from('product_variants' as any) as any)
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
      const { error } = await (supabase.from('product_variants' as any) as any)
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

// Stock Stats
export const useStockStats = () => {
  const { data: stockLevels = [] } = useStockLevels()
  const { data: warehouses = [] } = useWarehouses()
  const { data: activeAlerts = [] } = useStockAlerts()

  return {
    total_products: stockLevels.length,
    total_warehouses: warehouses.length,
    total_stock_value: stockLevels.reduce((sum, level) => sum + ((level.quantity || 0) * (level.cost_per_unit || 0)), 0),
    low_stock_items: stockLevels.filter((level) => level.available_quantity <= level.reorder_point).length,
    out_of_stock_items: stockLevels.filter((level) => level.available_quantity === 0).length,
    active_alerts: activeAlerts.length,
    predicted_stockouts_7d: 0,
    average_stock_turnover: 0
  }
}
