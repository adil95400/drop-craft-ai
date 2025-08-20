import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

type Product = {
  id: string
  user_id: string
  name: string
  description?: string
  price: number
  cost_price?: number
  sku?: string
  category?: string
  stock_quantity?: number
  status: 'active' | 'inactive' | 'archived'
  image_url?: string
  weight?: number
  dimensions?: any
  tags?: string[]
  supplier_id?: string
  supplier?: string
  profit_margin?: number
  shopify_id?: string
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  created_at: string
  updated_at: string
}

// Real API calls to FastAPI backend
const apiCall = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  })
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`)
  }
  
  return response.json()
}

export const useProducts = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    data: products = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      // Try API first, fallback to Supabase
      try {
        return await apiCall('/products')
      } catch (apiError) {
        console.warn('API call failed, falling back to Supabase:', apiError)
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        return data as Product[]
      }
    }
  })

  const addProduct = useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      try {
        return await apiCall('/products', {
          method: 'POST',
          body: JSON.stringify(product)
        })
      } catch (apiError) {
        // Fallback to Supabase
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const { data, error } = await supabase
          .from('products')
          .insert([{ ...product, user_id: user.id }])
          .select()
          .single()
        
        if (error) throw error
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: "Produit ajouté",
        description: "Le produit a été ajouté avec succès.",
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le produit.",
        variant: "destructive",
      })
    }
  })

  const updateProduct = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      try {
        return await apiCall(`/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        })
      } catch (apiError) {
        // Fallback to Supabase
        const { data, error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', id)
          .select()
          .single()
        
        if (error) throw error
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: "Produit mis à jour",
        description: "Le produit a été mis à jour avec succès.",
      })
    }
  })

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      try {
        await apiCall(`/products/${id}`, { method: 'DELETE' })
      } catch (apiError) {
        // Fallback to Supabase
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id)
        
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès.",
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