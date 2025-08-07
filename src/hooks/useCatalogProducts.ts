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
      let query = supabase.from('catalog_products').select('*').order('created_at', { ascending: false })
      
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.supplier) {
        query = query.eq('supplier_id', filters.supplier)
      }
      if (filters.isTrending) {
        query = query.eq('is_trending', true)
      }
      if (filters.isWinner) {
        query = query.eq('is_winner', true)
      }
      if (filters.isBestseller) {
        query = query.eq('is_bestseller', true)
      }

      const { data, error } = await query.limit(100)
      if (error) throw error
      return data as CatalogProduct[]
    }
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['catalogCategories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('catalog_products').select('category').not('category', 'is', null)
      if (error) throw error
      return [...new Set(data.map(item => item.category))].filter(Boolean)
    }
  })

  const { data: suppliers = [] } = useQuery({
    queryKey: ['catalogSuppliers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('catalog_products').select('supplier_id, supplier_name')
      if (error) throw error
      return [...new Map(data.map(s => [s.supplier_id, { id: s.supplier_id, name: s.supplier_name }])).values()]
    }
  })

  const { data: userFavorites = [] } = useQuery({
    queryKey: ['userFavorites'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data, error } = await supabase.from('user_favorites').select('catalog_product_id').eq('user_id', user.id)
      if (error) throw error
      return data.map(f => f.catalog_product_id)
    }
  })

  const addToFavorites = useMutation({
    mutationFn: async (productId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      const { data, error } = await supabase.from('user_favorites').insert([{ user_id: user.id, catalog_product_id: productId }])
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
      const { error } = await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('catalog_product_id', productId)
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
      const { data, error } = await supabase.from('sourcing_history').insert([{ user_id: user.id, catalog_product_id: productId, action, metadata: metadata || {} }])
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