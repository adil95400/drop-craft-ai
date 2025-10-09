import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface Product {
  id: string
  name: string
  price: number
  cost_price?: number
  category?: string
  status: 'active' | 'inactive' | 'draft'
  image_url?: string
  description?: string
  supplier?: string
  sku?: string
  tags?: string[]
  stock_quantity?: number
  created_at: string
  updated_at: string
  profit_margin?: number
}

export const useProductsDemo = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-real'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    }
  })

  const addProduct = useMutation({
    mutationFn: async (productData: Partial<Product>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          name: productData.name || '',
          price: productData.price || 0,
          cost_price: productData.cost_price,
          category: productData.category,
          status: 'active',
          image_url: productData.image_url,
          description: productData.description,
          supplier: productData.supplier,
          sku: productData.sku,
          tags: productData.tags,
          stock_quantity: productData.stock_quantity || 0,
          profit_margin: productData.cost_price ? ((productData.price || 0) - productData.cost_price) / productData.cost_price * 100 : 0
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-real'] })
      toast({ title: "Produit ajouté", description: "Le produit a été ajouté à votre catalogue avec succès." })
    }
  })

  const updateProduct = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      const { error } = await supabase
        .from('products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
      
      if (error) throw error
      return { id, updates }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-real'] })
      toast({ title: "Produit modifié", description: "Le produit a été mis à jour avec succès." })
    }
  })

  const deleteProduct = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
      
      if (error) throw error
      return productId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-real'] })
      toast({ title: "Produit supprimé", description: "Le produit a été supprimé de votre catalogue." })
    }
  })

  // Calculer les statistiques
  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    inactive: products.filter(p => p.status === 'inactive').length,
    lowStock: products.filter(p => (p.stock_quantity || 0) < 20).length,
    totalValue: products.reduce((sum, product) => sum + (product.price * (product.stock_quantity || 0)), 0),
    averageMargin: products.length > 0 ? products.reduce((sum, product) => sum + (product.profit_margin || 0), 0) / products.length : 0
  }

  return {
    products,
    stats,
    isLoading,
    addProduct: addProduct.mutate,
    updateProduct: updateProduct.mutate,
    deleteProduct: deleteProduct.mutate,
    isAdding: addProduct.isPending,
    isUpdating: updateProduct.isPending,
    isDeleting: deleteProduct.isPending
  }
}