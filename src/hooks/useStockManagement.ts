import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Mock data types
interface MockWarehouse {
  id: string
  name: string
  location: string
  warehouse_type: 'standard' | 'cold_storage' | 'hazmat'
  capacity: number
  current_utilization: number
  manager_name?: string
  contact_email?: string
  contact_phone?: string
  is_active: boolean
}

interface MockStockLevel {
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
  product?: {
    name: string
    sku?: string
    image_url?: string
  }
  warehouse?: {
    name: string
    location?: string
  }
}

interface MockStockMovement {
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

interface MockStockAlert {
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

// Generate mock warehouses
const generateMockWarehouses = (): MockWarehouse[] => {
  return [
    {
      id: 'wh-1',
      name: 'Entrepôt Principal Paris',
      location: 'Paris, France',
      warehouse_type: 'standard',
      capacity: 10000,
      current_utilization: 7500,
      manager_name: 'Jean Dupont',
      contact_email: 'paris@warehouse.com',
      is_active: true
    },
    {
      id: 'wh-2',
      name: 'Entrepôt Lyon',
      location: 'Lyon, France',
      warehouse_type: 'standard',
      capacity: 5000,
      current_utilization: 3200,
      manager_name: 'Marie Martin',
      contact_email: 'lyon@warehouse.com',
      is_active: true
    },
    {
      id: 'wh-3',
      name: 'Stockage Froid Marseille',
      location: 'Marseille, France',
      warehouse_type: 'cold_storage',
      capacity: 2000,
      current_utilization: 1500,
      manager_name: 'Pierre Blanc',
      contact_email: 'marseille@warehouse.com',
      is_active: true
    }
  ]
}

// Generate mock stock levels from products
const generateMockStockLevels = async (): Promise<MockStockLevel[]> => {
  const { data: products } = await supabase
    .from('products')
    .select('id, title, name, sku, image_url, stock_quantity')
    .limit(20)

  if (!products?.length) return []

  const warehouses = generateMockWarehouses()
  
  return products.map((product, index) => {
    const warehouse = warehouses[index % warehouses.length]
    const quantity = product.stock_quantity || Math.floor(Math.random() * 100)
    const reserved = Math.floor(quantity * 0.1)
    
    return {
      id: `sl-${product.id}`,
      product_id: product.id,
      warehouse_id: warehouse.id,
      quantity,
      reserved_quantity: reserved,
      available_quantity: quantity - reserved,
      reorder_point: 10,
      max_stock_level: 200,
      min_stock_level: 5,
      location_in_warehouse: `A${index + 1}-${Math.floor(Math.random() * 10) + 1}`,
      cost_per_unit: Math.random() * 50 + 10,
      product: {
        name: product.name || product.title,
        sku: product.sku || `SKU-${product.id.slice(0, 8)}`,
        image_url: product.image_url
      },
      warehouse: {
        name: warehouse.name,
        location: warehouse.location
      }
    }
  })
}

// Generate mock stock movements
const generateMockMovements = (): MockStockMovement[] => {
  const types: MockStockMovement['movement_type'][] = ['inbound', 'outbound', 'transfer', 'adjustment', 'return']
  const reasons = [
    'Réception commande fournisseur',
    'Expédition client',
    'Transfert entre entrepôts',
    'Ajustement inventaire',
    'Retour client'
  ]
  
  return Array.from({ length: 20 }, (_, i) => {
    const type = types[i % types.length]
    return {
      id: `mv-${i}`,
      product_id: `prod-${i % 5}`,
      warehouse_id: `wh-${(i % 3) + 1}`,
      movement_type: type,
      quantity: Math.floor(Math.random() * 50) + 1,
      reason: reasons[types.indexOf(type)],
      notes: i % 3 === 0 ? 'Note additionnelle' : undefined,
      performed_by: ['Jean', 'Marie', 'Pierre'][i % 3],
      reference_id: `REF-${1000 + i}`,
      created_at: new Date(Date.now() - i * 3600000).toISOString()
    }
  })
}

// Generate mock alerts from low stock products
const generateMockAlerts = async (): Promise<MockStockAlert[]> => {
  const { data: products } = await supabase
    .from('products')
    .select('id, title, name, stock_quantity')
    .or('stock_quantity.lte.10,stock_quantity.is.null')
    .limit(10)

  if (!products?.length) return []

  return products.map((product, index) => {
    const stock = product.stock_quantity || 0
    const isOutOfStock = stock === 0
    
    return {
      id: `alert-${product.id}`,
      product_id: product.id,
      product_name: product.name || product.title,
      alert_type: isOutOfStock ? 'out_of_stock' : 'low_stock',
      severity: isOutOfStock ? 'critical' : stock <= 5 ? 'high' : 'medium',
      message: isOutOfStock 
        ? `${product.name || product.title} est en rupture de stock`
        : `Stock faible pour ${product.name || product.title}: ${stock} unités restantes`,
      alert_status: 'active',
      created_at: new Date(Date.now() - index * 86400000).toISOString()
    }
  })
}

// Warehouses
export const useWarehouses = () => {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      return generateMockWarehouses()
    }
  })
}

export const useCreateWarehouse = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (warehouse: Partial<MockWarehouse>) => {
      // Simulate creating warehouse
      const newWarehouse: MockWarehouse = {
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
    mutationFn: async ({ id, ...updates }: Partial<MockWarehouse> & { id: string }) => {
      // Simulate update
      return { id, ...updates }
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
      return generateMockStockLevels()
    }
  })
}

export const useUpdateStockLevel = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      // Simulate update
      return { id, quantity }
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
      return generateMockMovements()
    }
  })
}

// Stock Alerts
export const useStockAlerts = (_activeOnly = true) => {
  return useQuery({
    queryKey: ['stock_alerts', _activeOnly ? 'active' : 'all'],
    queryFn: async () => {
      return generateMockAlerts()
    }
  })
}

export const useResolveAlert = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (alertId: string) => {
      // Simulate resolve
      return { id: alertId, alert_status: 'resolved', resolved_at: new Date().toISOString() }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_alerts'] })
      toast({ title: 'Alerte résolue' })
    }
  })
}

// Product Variants - use localStorage mock
export const useProductVariants = (productId?: string) => {
  return useQuery({
    queryKey: ['product_variants', productId],
    queryFn: async () => {
      const stored = localStorage.getItem('mock_product_variants')
      const variants = stored ? JSON.parse(stored) : []
      if (productId) {
        return variants.filter((v: { product_id: string }) => v.product_id === productId)
      }
      return variants
    },
    enabled: !!productId || productId === undefined
  })
}

export const useCreateVariant = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (variant: Record<string, unknown>) => {
      const stored = localStorage.getItem('mock_product_variants')
      const variants = stored ? JSON.parse(stored) : []
      const newVariant = { ...variant, id: `var-${Date.now()}`, created_at: new Date().toISOString() }
      variants.push(newVariant)
      localStorage.setItem('mock_product_variants', JSON.stringify(variants))
      return newVariant
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
      const stored = localStorage.getItem('mock_product_variants')
      const variants = stored ? JSON.parse(stored) : []
      const index = variants.findIndex((v: { id: string }) => v.id === id)
      if (index >= 0) {
        variants[index] = { ...variants[index], ...updates }
        localStorage.setItem('mock_product_variants', JSON.stringify(variants))
        return variants[index]
      }
      throw new Error('Variant not found')
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
      const stored = localStorage.getItem('mock_product_variants')
      const variants = stored ? JSON.parse(stored) : []
      const filtered = variants.filter((v: { id: string }) => v.id !== id)
      localStorage.setItem('mock_product_variants', JSON.stringify(filtered))
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
