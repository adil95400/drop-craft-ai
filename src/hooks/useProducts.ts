import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, Product } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

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
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Product[]
    }
  })

  const addProduct = useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single()
      
      if (error) throw error
      return data
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
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: "Produit mis à jour",
        description: "Le produit a été mis à jour avec succès.",
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
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès.",
      })
    }
  })

  return {
    products,
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