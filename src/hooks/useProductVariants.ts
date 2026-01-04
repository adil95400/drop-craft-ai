import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  sku?: string
  price?: number
  compare_at_price?: number
  cost_price?: number
  stock_quantity: number
  weight?: number
  option1_name?: string
  option1_value?: string
  option2_name?: string
  option2_value?: string
  option3_name?: string
  option3_value?: string
  image_url?: string
  is_default: boolean
  status: 'active' | 'inactive' | 'archived'
  user_id: string
  created_at: string
  updated_at: string
}

export interface ProductOption {
  name: string
  values: string[]
  position: number
}

export type ProductVariantInput = Omit<ProductVariant, 'id' | 'user_id' | 'created_at' | 'updated_at'>

export function useProductVariants(productId?: string) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: variants = [], isLoading: variantsLoading, error } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async () => {
      if (!productId) return []
      
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as ProductVariant[]
    },
    enabled: !!productId
  })

  const createVariantMutation = useMutation({
    mutationFn: async (variant: ProductVariantInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('product_variants')
        .insert([{ ...variant, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      toast({ title: 'Variante ajoutée', description: 'La variante a été créée avec succès' })
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  const updateVariantMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ProductVariant> }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('product_variants')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      toast({ title: 'Variante mise à jour' })
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  const deleteVariantMutation = useMutation({
    mutationFn: async (variantId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      toast({ title: 'Variante supprimée' })
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  const setDefaultVariantMutation = useMutation({
    mutationFn: async (variantId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Remove default from all variants of this product
      await supabase
        .from('product_variants')
        .update({ is_default: false })
        .eq('product_id', productId)
        .eq('user_id', user.id)

      // Set new default
      const { data, error } = await supabase
        .from('product_variants')
        .update({ is_default: true })
        .eq('id', variantId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      toast({ title: 'Variante par défaut mise à jour' })
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  })

  // Generate variants from options
  const generateVariants = async (options: ProductOption[]) => {
    if (!productId) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    // Generate all combinations
    const combinations = generateCombinations(options)

    // Create variants for each combination
    for (const combo of combinations) {
      const variantName = combo.map(c => c.value).join(' / ')
      const variantSKU = `VAR-${combo.map(c => c.value.substring(0, 3).toUpperCase()).join('-')}-${Date.now().toString(36)}`
      
      const variantData: ProductVariantInput = {
        product_id: productId,
        name: variantName,
        sku: variantSKU,
        stock_quantity: 0,
        is_default: false,
        status: 'active',
        option1_name: combo[0]?.name,
        option1_value: combo[0]?.value,
        option2_name: combo[1]?.name,
        option2_value: combo[1]?.value,
        option3_name: combo[2]?.name,
        option3_value: combo[2]?.value,
      }

      await createVariantMutation.mutateAsync(variantData)
    }
  }

  // Keep backward compatibility
  const options: ProductOption[] = []
  const optionsLoading = false
  const saveOptions = () => {}

  return {
    variants,
    options,
    variantsLoading,
    optionsLoading,
    createVariant: createVariantMutation.mutate,
    updateVariant: updateVariantMutation.mutate,
    deleteVariant: deleteVariantMutation.mutate,
    setDefaultVariant: setDefaultVariantMutation.mutate,
    saveOptions,
    generateVariants,
    isCreating: createVariantMutation.isPending,
    isUpdating: updateVariantMutation.isPending,
    isDeleting: deleteVariantMutation.isPending,
    // Additional aliases for compatibility
    addVariant: createVariantMutation.mutate,
    isAdding: createVariantMutation.isPending,
    error
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
