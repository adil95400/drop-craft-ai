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
      // Use the secure marketplace function instead of direct table access
      const { data, error } = await supabase.rpc('get_marketplace_products', {
        category_filter: filters.category || null,
        search_term: filters.search || null,
        limit_count: 100
      });
      
      if (error) {
        console.error('Error fetching catalog products:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les produits du catalogue",
          variant: "destructive",
        });
        throw error;
      }
      
      // Apply additional client-side filters for features not supported by the function
      let filteredData = data || [];
      
      if (filters.supplier) {
        // Note: supplier filtering removed for security - admin access required
        console.warn('Supplier filtering requires admin access');
      }
      if (filters.isTrending) {
        filteredData = filteredData.filter((p: any) => p.is_trending);
      }
      if (filters.isBestseller) {
        filteredData = filteredData.filter((p: any) => p.is_bestseller);
      }
      
      // Map the secure marketplace data to CatalogProduct format
      return filteredData.map((item: any) => ({
        id: item.id,
        external_id: item.external_id,
        name: item.name,
        description: item.description,
        price: item.price,
        cost_price: 0, // Hidden for security
        original_price: 0, // Hidden for security
        currency: item.currency,
        category: item.category,
        subcategory: item.subcategory,
        brand: item.brand,
        sku: item.sku,
        image_url: item.image_url,
        supplier_id: 'hidden', // Hidden for security
        supplier_name: 'Marketplace Vendor', // Generic name for security
        rating: item.rating || 0,
        reviews_count: item.reviews_count || 0,
        sales_count: 0, // Hidden for security
        stock_quantity: 0, // Hidden for security
        tags: item.tags || [],
        profit_margin: 0, // Hidden for security
        is_winner: false, // Hidden for security
        is_trending: item.is_trending || false,
        is_bestseller: item.is_bestseller || false,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) as CatalogProduct[];
    }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['catalogCategories'],
    queryFn: async () => {
      // Get categories from the secure marketplace function
      const { data, error } = await supabase.rpc('get_marketplace_products', {
        limit_count: 1000
      });
      if (error) throw error;
      const categories = [...new Set(data?.map((item: any) => item.category))]
        .filter(Boolean)
        .sort();
      return categories;
    }
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['catalogSuppliers'], 
    queryFn: async () => {
      // Use secure function to get supplier data
      const { data, error } = await supabase.rpc('get_secure_catalog_products', {
        category_filter: null,
        search_term: null,
        limit_count: 1000
      });
      if (error) throw error;
      
      // Extract unique suppliers from the secure data
      const uniqueSuppliers = new Map()
      data?.forEach(product => {
        if (product.supplier_name && product.external_id) {
          uniqueSuppliers.set(product.external_id, {
            id: product.external_id,
            name: product.supplier_name
          })
        }
      })
      
      return Array.from(uniqueSuppliers.values());
    }
  });

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