import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { ApiService } from '@/services/api'
import type { Product } from '@/lib/supabase'

export const useRealProducts = (filters?: any) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['real-products', filters],
    queryFn: () => ApiService.getProducts(filters),
  })

  const addProduct = useMutation({
    mutationFn: (newProduct: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => 
      ApiService.createProduct(newProduct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-products'] })
    }
  })

  const updateProduct = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) => 
      ApiService.updateProduct(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-products'] })
    }
  })

  const deleteProduct = useMutation({
    mutationFn: (id: string) => ApiService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-products'] })
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