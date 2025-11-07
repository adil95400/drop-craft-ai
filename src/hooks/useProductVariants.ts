import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import type { Database } from '@/integrations/supabase/types'

type ProductVariant = Database['public']['Tables']['product_variants']['Row']
type ProductVariantInsert = Database['public']['Tables']['product_variants']['Insert']
type ProductOption = Database['public']['Tables']['product_options']['Row']
type ProductOptionInsert = Database['public']['Tables']['product_options']['Insert']

export const useProductVariants = (productId?: string) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Get variants for a product
  const { data: variants, isLoading: variantsLoading } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async () => {
      if (!productId) return []
      
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!productId
  })

  // Get options for a product
  const { data: options, isLoading: optionsLoading } = useQuery({
    queryKey: ['product-options', productId],
    queryFn: async () => {
      if (!productId) return []
      
      const { data, error } = await supabase
        .from('product_options')
        .select('*')
        .eq('product_id', productId)
        .order('position', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!productId
  })

  // Create variant
  const createVariant = useMutation({
    mutationFn: async (variant: Omit<ProductVariantInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('product_variants')
        .insert([{ ...variant, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants'] })
      toast({
        title: "Variante créée",
        description: "La variante a été ajoutée avec succès"
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Update variant
  const updateVariant = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ProductVariant> }) => {
      const { data, error } = await supabase
        .from('product_variants')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants'] })
      toast({
        title: "Variante mise à jour",
        description: "Les modifications ont été enregistrées"
      })
    }
  })

  // Delete variant
  const deleteVariant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants'] })
      toast({
        title: "Variante supprimée",
        description: "La variante a été supprimée"
      })
    }
  })

  // Create/Update options
  const saveOptions = useMutation({
    mutationFn: async (options: Array<Omit<ProductOptionInsert, 'user_id'>>) => {
      if (!user?.id) throw new Error('User not authenticated')

      // Delete existing options
      if (productId) {
        await supabase
          .from('product_options')
          .delete()
          .eq('product_id', productId)
      }

      // Insert new options
      const { data, error } = await supabase
        .from('product_options')
        .insert(options.map(opt => ({ ...opt, user_id: user.id })))
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-options'] })
      toast({
        title: "Options enregistrées",
        description: "Les options ont été mises à jour"
      })
    }
  })

  // Generate variants from options
  const generateVariants = async (opts: ProductOption[]) => {
    if (!productId || !user?.id) return

    // Get product data
    const { data: product } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('id', productId)
      .single()

    if (!product) return

    // Generate all combinations
    const combinations = generateCombinations(opts)

    // Create variants
    for (const combo of combinations) {
      const variantName = combo.map(c => c.value).join(' / ')
      const variantSKU = `${product.sku}-${combo.map(c => c.value.substring(0, 3).toUpperCase()).join('-')}`
      
      const variantData: Omit<ProductVariantInsert, 'user_id'> = {
        product_id: productId,
        name: variantName,
        variant_sku: variantSKU,
        price: product.price,
        cost_price: product.cost_price,
        stock_quantity: 0,
        options: combo.reduce((acc, c) => ({ ...acc, [c.name]: c.value }), {}),
        is_active: true
      }

      await createVariant.mutateAsync(variantData)
    }
  }

  return {
    variants,
    options,
    variantsLoading,
    optionsLoading,
    createVariant: createVariant.mutate,
    updateVariant: updateVariant.mutate,
    deleteVariant: deleteVariant.mutate,
    saveOptions: saveOptions.mutate,
    generateVariants,
    isCreating: createVariant.isPending,
    isUpdating: updateVariant.isPending,
    isDeleting: deleteVariant.isPending
  }
}

// Helper to generate all combinations
function generateCombinations(options: ProductOption[]): Array<Array<{ name: string; value: string }>> {
  if (options.length === 0) return []
  if (options.length === 1) {
    return options[0].values.map(v => [{ name: options[0].name, value: v }])
  }

  const result: Array<Array<{ name: string; value: string }>> = []
  const firstOption = options[0]
  const restCombinations = generateCombinations(options.slice(1))

  for (const value of firstOption.values) {
    for (const combo of restCombinations) {
      result.push([{ name: firstOption.name, value }, ...combo])
    }
  }

  return result
}

export type { ProductVariant, ProductOption }
