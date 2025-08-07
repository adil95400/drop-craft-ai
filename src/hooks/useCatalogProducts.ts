import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Mock data for now until the database migration is approved
const mockCatalogProducts = [
  {
    id: '1',
    name: 'Montre intelligente Sport Pro',
    description: 'Montre connectée avec GPS et suivi de santé',
    price: 89.99,
    cost_price: 54.00,
    category: 'Électronique',
    supplier: 'Amazon',
    supplier_logo: '/placeholder.svg',
    image_url: '/placeholder.svg',
    rating: 4.8,
    reviews_count: 234,
    stock_quantity: 150,
    sales_count: 1230,
    margin_percentage: 39.8,
    is_winner: true,
    is_trending: true,
    is_best_seller: false,
    delivery_time: '2-3 jours',
    tags: ['GPS', 'Fitness', 'Bluetooth'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Écouteurs Bluetooth Premium',
    description: 'Écouteurs sans fil avec réduction de bruit',
    price: 45.99,
    cost_price: 23.00,
    category: 'Audio',
    supplier: 'AliExpress',
    supplier_logo: '/placeholder.svg',
    image_url: '/placeholder.svg',
    rating: 4.6,
    reviews_count: 189,
    stock_quantity: 89,
    sales_count: 567,
    margin_percentage: 50.0,
    is_winner: false,
    is_trending: true,
    is_best_seller: true,
    delivery_time: '1-2 semaines',
    tags: ['Bluetooth', 'Réduction bruit', 'Sans fil'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Chaussures de running légères',
    description: 'Chaussures de sport ultra-légères et respirantes',
    price: 79.99,
    cost_price: 32.00,
    category: 'Sport',
    supplier: 'Decathlon',
    supplier_logo: '/placeholder.svg',
    image_url: '/placeholder.svg',
    rating: 4.5,
    reviews_count: 92,
    stock_quantity: 45,
    sales_count: 234,
    margin_percentage: 60.0,
    is_winner: true,
    is_trending: false,
    is_best_seller: false,
    delivery_time: '3-5 jours',
    tags: ['Running', 'Léger', 'Respirant'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

interface CatalogProduct {
  id: string
  name: string
  description?: string
  price: number
  cost_price?: number
  category: string
  supplier: string
  supplier_logo?: string
  image_url?: string
  rating: number
  reviews_count: number
  stock_quantity: number
  sales_count: number
  margin_percentage: number
  is_winner: boolean
  is_trending: boolean
  is_best_seller: boolean
  delivery_time: string
  tags: string[]
  created_at: string
  updated_at: string
}

interface CatalogFilters {
  search?: string
  category?: string
  supplier?: string
  minPrice?: number
  maxPrice?: number
  minMargin?: number
  isWinner?: boolean
  isTrending?: boolean
  inStock?: boolean
  sortBy?: 'rating' | 'price' | 'margin' | 'sales' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

export const useCatalogProducts = (filters: CatalogFilters = {}) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // For now, use mock data with filtering
  const {
    data: products = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['catalog-products', filters],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      let filteredProducts = [...mockCatalogProducts]

      // Apply filters
      if (filters.search) {
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(filters.search!.toLowerCase())
        )
      }
      if (filters.category && filters.category !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.category === filters.category)
      }
      if (filters.supplier && filters.supplier !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.supplier === filters.supplier)
      }
      if (filters.minPrice) {
        filteredProducts = filteredProducts.filter(p => p.price >= filters.minPrice!)
      }
      if (filters.maxPrice) {
        filteredProducts = filteredProducts.filter(p => p.price <= filters.maxPrice!)
      }
      if (filters.isWinner) {
        filteredProducts = filteredProducts.filter(p => p.is_winner)
      }
      if (filters.isTrending) {
        filteredProducts = filteredProducts.filter(p => p.is_trending)
      }
      if (filters.inStock) {
        filteredProducts = filteredProducts.filter(p => p.stock_quantity > 0)
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'rating'
      const sortOrder = filters.sortOrder || 'desc'
      
      filteredProducts.sort((a, b) => {
        let aValue: number
        let bValue: number
        
        switch (sortBy) {
          case 'price':
            aValue = a.price
            bValue = b.price
            break
          case 'margin':
            aValue = a.margin_percentage
            bValue = b.margin_percentage
            break
          case 'sales':
            aValue = a.sales_count
            bValue = b.sales_count
            break
          case 'created_at':
            aValue = new Date(a.created_at).getTime()
            bValue = new Date(b.created_at).getTime()
            break
          default:
            aValue = a.rating
            bValue = b.rating
        }
        
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      })

      return filteredProducts as CatalogProduct[]
    }
  })

  // Mock favorites (will be replaced with real Supabase data)
  const favorites = ['1', '3'] // Mock favorite IDs

  // Toggle favorite
  const toggleFavorite = useMutation({
    mutationFn: async (productId: string) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      return { productId, action: favorites.includes(productId) ? 'removed' : 'added' }
    },
    onSuccess: (result) => {
      toast({
        title: result.action === 'added' ? "Ajouté aux favoris" : "Retiré des favoris",
        description: result.action === 'added' 
          ? "Le produit a été ajouté à vos favoris." 
          : "Le produit a été retiré de vos favoris.",
      })
    }
  })

  // Import product to user's catalog
  const importProduct = useMutation({
    mutationFn: async (catalogProduct: CatalogProduct) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Add to user's products table
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([{
          user_id: user.id,
          name: catalogProduct.name,
          description: catalogProduct.description,
          price: catalogProduct.price,
          cost_price: catalogProduct.cost_price,
          category: catalogProduct.category,
          supplier: catalogProduct.supplier,
          image_url: catalogProduct.image_url,
          tags: catalogProduct.tags,
          status: 'active' as const,
          stock_quantity: 0, // User starts with 0 stock
          profit_margin: catalogProduct.margin_percentage
        }])
        .select()
        .single()

      if (productError) throw productError
      return product
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: "Produit importé",
        description: "Le produit a été ajouté à votre catalogue.",
      })
    },
    onError: (error) => {
      console.error('Import error:', error)
      toast({
        title: "Erreur d'importation",
        description: "Impossible d'importer le produit.",
        variant: "destructive",
      })
    }
  })

  // Get product statistics
  const stats = {
    total: products.length,
    winners: products.filter(p => p.is_winner).length,
    trending: products.filter(p => p.is_trending).length,
    inStock: products.filter(p => p.stock_quantity > 0).length,
    averageRating: products.reduce((sum, p) => sum + p.rating, 0) / (products.length || 1),
    averageMargin: products.reduce((sum, p) => sum + p.margin_percentage, 0) / (products.length || 1)
  }

  return {
    products,
    favorites,
    stats,
    isLoading,
    error,
    toggleFavorite: toggleFavorite.mutate,
    importProduct: importProduct.mutate,
    isTogglingFavorite: toggleFavorite.isPending,
    isImporting: importProduct.isPending
  }
}

// Mock hooks for now
export const useSourcingHistory = () => {
  return {
    history: [],
    isLoading: false,
    error: null
  }
}

export const usePriceAlerts = () => {
  const { toast } = useToast()
  
  const createAlert = useMutation({
    mutationFn: async ({ productId, targetPrice }: { productId: string; targetPrice: number }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      return { productId, targetPrice }
    },
    onSuccess: () => {
      toast({
        title: "Alerte créée",
        description: "Vous serez notifié quand le prix atteindra votre objectif.",
      })
    }
  })

  return {
    alerts: [],
    isLoading: false,
    error: null,
    createAlert: createAlert.mutate,
    isCreating: createAlert.isPending
  }
}