import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  cost_price?: number
  status: 'active' | 'inactive'
  stock_quantity?: number
  sku?: string
  category?: string
  image_url?: string
  profit_margin?: number
  user_id: string
  created_at: string
  updated_at: string
}

export const useRealProducts = (filters?: any) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Demo products for display when no real data exists
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'iPhone 15 Pro Max',
      description: 'Smartphone Apple avec puce A17 Pro, écran Super Retina XDR 6.7"',
      price: 1229.00,
      cost_price: 899.00,
      status: 'active',
      stock_quantity: 25,
      sku: 'APPLE-IPH15PM-256',
      category: 'Électronique',
      image_url: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400',
      profit_margin: 26.8,
      user_id: '',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'MacBook Air M3',
      description: 'Ordinateur portable Apple avec puce M3, 8GB RAM, 256GB SSD',
      price: 1199.00,
      cost_price: 949.00,
      status: 'active',
      stock_quantity: 15,
      sku: 'APPLE-MBA-M3-256',
      category: 'Informatique',
      image_url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400',
      profit_margin: 20.9,
      user_id: '',
      created_at: '2024-01-14T10:00:00Z',
      updated_at: '2024-01-14T10:00:00Z'
    },
    {
      id: '3',
      name: 'Nike Air Max 270',
      description: 'Baskets Nike avec amorti Air Max, design moderne et confortable',
      price: 149.99,
      cost_price: 89.99,
      status: 'active',
      stock_quantity: 3,
      sku: 'NIKE-AM270-BLK-42',
      category: 'Mode',
      image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
      profit_margin: 40.0,
      user_id: '',
      created_at: '2024-01-13T10:00:00Z',
      updated_at: '2024-01-13T10:00:00Z'
    }
  ]

  const { data: realProducts = [], isLoading, error } = useQuery({
    queryKey: ['real-products', filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      // Query products table
      let query = supabase.from('products').select('*').eq('user_id', user.id)
      
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
      }
      if (filters?.low_stock) {
        query = query.lt('stock_quantity', 10)
      }
      
      const { data: productsData, error: productsError } = await query.order('created_at', { ascending: false })
      if (productsError) throw productsError

      // Also get imported products
      const { data: importedData } = await (supabase
        .from('imported_products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) as any)

      // Also get catalog products  
      const { data: catalogData } = await (supabase
        .from('catalog_products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) as any)

      // Normalize products from main table - use 'title' from DB
      const normalizedProducts = (productsData || []).map((p: any) => ({
        id: p.id,
        name: p.title || p.name || 'Produit sans nom',
        description: p.description,
        price: p.price || 0,
        cost_price: p.cost_price,
        status: (p.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
        stock_quantity: p.stock_quantity,
        sku: p.sku,
        category: p.category,
        image_url: p.image_url,
        profit_margin: p.cost_price && p.price ? ((p.price - p.cost_price) / p.price * 100) : undefined,
        user_id: p.user_id,
        created_at: p.created_at,
        updated_at: p.updated_at
      }))

      // Normalize imported products
      const normalizedImported = (importedData || []).map((p: any) => ({
        id: p.id,
        name: 'Produit importé',
        description: '',
        price: p.price || 0,
        cost_price: undefined,
        status: 'active' as 'active' | 'inactive',
        stock_quantity: 0,
        sku: undefined,
        category: p.category,
        image_url: undefined,
        profit_margin: undefined,
        user_id: p.user_id,
        created_at: p.created_at,
        updated_at: p.created_at
      }))

      // Normalize catalog products
      const normalizedCatalog = (catalogData || []).map((p: any) => ({
        id: p.id,
        name: p.title || 'Produit catalogue',
        description: p.description,
        price: p.price || 0,
        cost_price: undefined,
        status: (p.status === 'available' ? 'active' : 'inactive') as 'active' | 'inactive',
        stock_quantity: 0,
        sku: undefined,
        category: p.category,
        image_url: p.image_urls?.[0],
        profit_margin: p.compare_at_price && p.price ? ((p.compare_at_price - p.price) / p.compare_at_price * 100) : undefined,
        user_id: p.user_id,
        created_at: p.created_at,
        updated_at: p.updated_at
      }))

      // Combine all products
      const allProducts = [
        ...normalizedProducts,
        ...normalizedImported,
        ...normalizedCatalog
      ]

      return allProducts as Product[]
    },
  })

  // Use demo data only if no real products exist
  const products = realProducts.length > 0 ? realProducts : mockProducts.slice(0, 3)

  const addProduct = useMutation({
    mutationFn: async (newProduct: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      // Use 'title' instead of 'name' for DB insert
      const { data, error } = await supabase
        .from('products')
        .insert([{ 
          title: newProduct.name,
          description: newProduct.description,
          price: newProduct.price,
          cost_price: newProduct.cost_price,
          status: newProduct.status,
          stock_quantity: newProduct.stock_quantity,
          sku: newProduct.sku,
          category: newProduct.category,
          image_url: newProduct.image_url,
          user_id: user.id 
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-products'] })
      toast({
        title: "Produit ajouté",
        description: "Le produit a été créé avec succès",
      })
    }
  })

  const updateProduct = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      // Transform 'name' to 'title' for DB
      const dbUpdates: any = { ...updates }
      if (updates.name) {
        dbUpdates.title = updates.name
        delete dbUpdates.name
      }
      delete dbUpdates.profit_margin // Computed field
      
      const { data, error } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-products'] })
      toast({
        title: "Produit mis à jour",
        description: "Le produit a été modifié avec succès",
      })
    }
  })

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Try to delete from all product tables
      const deletePromises = [
        supabase.from('products').delete().eq('id', id).eq('user_id', user.id),
        (supabase.from('imported_products').delete().eq('id', id).eq('user_id', user.id) as any),
        (supabase.from('catalog_products').delete().eq('id', id).eq('user_id', user.id) as any)
      ]

      const results = await Promise.allSettled(deletePromises)
      
      // Check if at least one deletion succeeded
      const successCount = results.filter(r => r.status === 'fulfilled' && !(r.value as any).error).length
      
      if (successCount === 0) {
        throw new Error('Impossible de supprimer le produit')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-products'] })
      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès",
      })
    },
    onError: (error) => {
      console.error('Erreur lors de la suppression:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit",
        variant: "destructive",
      })
    }
  })

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    inactive: products.filter(p => p.status === 'inactive').length,
    lowStock: products.filter(p => (p.stock_quantity || 0) < 10).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * (p.stock_quantity || 0)), 0)
  }

  return {
    products,
    stats,
    isLoading,
    error,
    addProduct: addProduct.mutate,
    updateProduct: updateProduct.mutate,
    deleteProduct: deleteProduct.mutate,
    isAdding: addProduct.isPending,
    isUpdating: updateProduct.isPending,
    isDeleting: deleteProduct.isPending
  }
}
