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

  // Données de démonstration réalistes
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
    },
    {
      id: '4',
      name: 'Samsung Galaxy S24 Ultra',
      description: 'Smartphone Samsung avec S Pen, écran Dynamic AMOLED 6.8"',
      price: 1299.00,
      cost_price: 979.00,
      status: 'active',
      stock_quantity: 18,
      sku: 'SAM-GS24U-512-TIT',
      category: 'Électronique',
      image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
      profit_margin: 24.6,
      user_id: '',
      created_at: '2024-01-12T10:00:00Z',
      updated_at: '2024-01-12T10:00:00Z'
    },
    {
      id: '5',
      name: 'Canapé Scandinave 3 Places',
      description: 'Canapé en tissu beige, style scandinave, pieds en bois massif',
      price: 899.00,
      cost_price: 549.00,
      status: 'active',
      stock_quantity: 8,
      sku: 'FURN-SCAN-3P-BEIGE',
      category: 'Maison',
      image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
      profit_margin: 38.9,
      user_id: '',
      created_at: '2024-01-11T10:00:00Z',
      updated_at: '2024-01-11T10:00:00Z'
    },
    {
      id: '6',
      name: 'Casque Sony WH-1000XM5',
      description: 'Casque audio sans fil avec réduction de bruit active, autonomie 30h',
      price: 399.99,
      cost_price: 249.99,
      status: 'active',
      stock_quantity: 0,
      sku: 'SONY-WH1000XM5-BLK',
      category: 'Audio',
      image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400',
      profit_margin: 37.5,
      user_id: '',
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-10T10:00:00Z'
    }
  ]

  const { data: realProducts = [], isLoading, error } = useQuery({
    queryKey: ['real-products', filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      let query = supabase.from('products').select('*').eq('user_id', user.id)
      
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
      }
      if (filters?.low_stock) {
        query = query.lt('stock_quantity', 10)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Product[]
    },
  })

  // Utiliser des données de démo si aucun produit réel ou si tous sont vides
  const hasRealData = realProducts.some(p => p.name !== 'Produit sans nom' && p.price > 0)
  const products = hasRealData ? realProducts : mockProducts

  const addProduct = useMutation({
    mutationFn: async (newProduct: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      const { data, error } = await supabase
        .from('products')
        .insert([{ ...newProduct, user_id: user.id }])
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
      const { data, error } = await supabase
        .from('products')
        .update(updates)
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
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-products'] })
      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès",
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