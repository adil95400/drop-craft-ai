import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface CatalogProduct {
  id: string
  external_id: string
  name: string
  description?: string
  price: number
  cost_price?: number
  original_price?: number
  currency: string
  category?: string
  subcategory?: string
  brand?: string
  sku?: string
  image_url?: string
  supplier_id: string
  supplier_name: string
  rating: number
  reviews_count: number
  sales_count: number
  stock_quantity: number
  tags?: string[]
  profit_margin: number
  is_winner: boolean
  is_trending: boolean
  is_bestseller: boolean
  created_at: string
  updated_at: string
}

export const useCatalogProducts = (filters: any = {}) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['catalogProducts', filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Query products table (canonical)
      let query = (supabase
        .from('products') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.search) {
        query = query.ilike('title', `%${filters.search}%`)
      }

      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching catalog products:', error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les produits du catalogue",
          variant: "destructive",
        })
        throw error
      }
      
      // Map the catalog_products data to CatalogProduct format
      return (data || []).map((item: any) => ({
        id: item.id,
        external_id: item.id,
        name: item.title,
        description: item.description,
        price: item.price || 0,
        cost_price: 0,
        original_price: item.compare_at_price,
        currency: 'EUR',
        category: item.category,
        subcategory: '',
        brand: item.supplier_name,
        sku: '',
        image_url: item.image_urls?.[0] || '',
        supplier_id: item.source_platform || '',
        supplier_name: item.supplier_name || 'Unknown',
        rating: 0,
        reviews_count: 0,
        sales_count: 0,
        stock_quantity: 0,
        tags: [],
        profit_margin: 0,
        is_winner: false,
        is_trending: false,
        is_bestseller: false,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) as CatalogProduct[]
    }
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['catalogCategories'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('products') as any)
        .select('category')
        .limit(1000)
        
      if (error) throw error
      const uniqueCategories = [...new Set((data || []).map((item: any) => item.category))]
        .filter(Boolean)
        .sort()
      return uniqueCategories as string[]
    }
  })

  const { data: suppliers = [] } = useQuery({
    queryKey: ['catalogSuppliers'], 
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('products') as any)
        .select('supplier_name, source_type')
        .limit(1000)
        
      if (error) throw error
      
      const uniqueSuppliers = new Map()
      ;(data || []).forEach((product: any) => {
        if (product.supplier_name) {
          uniqueSuppliers.set(product.supplier_name, {
            id: product.source_platform || product.supplier_name,
            name: product.supplier_name
          })
        }
      })
      
      return Array.from(uniqueSuppliers.values())
    }
  })

  const { data: userFavorites = [] } = useQuery({
    queryKey: ['userFavorites'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      
      // Use notifications as a placeholder for favorites
      const { data, error } = await supabase
        .from('notifications')
        .select('metadata')
        .eq('user_id', user.id)
        .eq('type', 'favorite')
        
      if (error) throw error
      return (data || []).map(f => (f.metadata as any)?.product_id).filter(Boolean)
    }
  })

  const addToFavorites = useMutation({
    mutationFn: async (productId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([{ 
          user_id: user.id, 
          title: 'Favori ajouté',
          type: 'favorite',
          metadata: { product_id: productId }
        }])
        
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userFavorites'] })
      toast({ title: "Favori ajouté", description: "Le produit a été ajouté à vos favoris." })
    }
  })

  const removeFromFavorites = useMutation({
    mutationFn: async (productId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      // Delete the favorite notification
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('type', 'favorite')
        
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userFavorites'] })
      toast({ title: "Favori retiré", description: "Le produit a été retiré de vos favoris." })
    }
  })

  const addSourcingHistory = useMutation({
    mutationFn: async ({ productId, action, metadata }: { productId: string; action: string; metadata?: any }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('activity_logs')
        .insert([{ 
          user_id: user.id, 
          entity_id: productId,
          entity_type: 'catalog_product',
          action, 
          details: metadata || {} 
        }])
        
      if (error) throw error
      return data
    }
  })

  const stats = {
    total: products.length,
    winners: products.filter(p => p.is_winner).length,
    trending: products.filter(p => p.is_trending).length,
    bestsellers: products.filter(p => p.is_bestseller).length,
    averageRating: products.length > 0 ? products.reduce((sum, p) => sum + p.rating, 0) / products.length : 0,
    totalValue: products.reduce((sum, p) => sum + p.price, 0)
  }

  return {
    products,
    categories,
    suppliers,
    userFavorites,
    stats,
    isLoading,
    addToFavorites: addToFavorites.mutate,
    removeFromFavorites: removeFromFavorites.mutate,
    addSourcingHistory: addSourcingHistory.mutate
  }
}
