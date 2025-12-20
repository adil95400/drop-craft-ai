import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

// Mock types since product_variants and product_options tables don't exist
interface ProductVariant {
  id: string
  product_id: string
  user_id: string
  name: string
  variant_sku: string | null
  price: number
  cost_price: number | null
  stock_quantity: number | null
  image_url: string | null
  options: Record<string, string> | null
  is_active: boolean
  created_at: string
}

interface ProductOption {
  id: string
  product_id: string
  user_id: string
  name: string
  values: string[]
  position: number
}

type ProductVariantInsert = Omit<ProductVariant, 'id' | 'created_at'>
type ProductOptionInsert = Omit<ProductOption, 'id'>

// Helper to get variants from localStorage
const getStoredVariants = (productId: string): ProductVariant[] => {
  try {
    const stored = localStorage.getItem(`product_variants_${productId}`)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Helper to save variants to localStorage
const saveStoredVariants = (productId: string, variants: ProductVariant[]) => {
  localStorage.setItem(`product_variants_${productId}`, JSON.stringify(variants))
}

// Helper to get options from localStorage
const getStoredOptions = (productId: string): ProductOption[] => {
  try {
    const stored = localStorage.getItem(`product_options_${productId}`)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Helper to save options to localStorage
const saveStoredOptions = (productId: string, options: ProductOption[]) => {
  localStorage.setItem(`product_options_${productId}`, JSON.stringify(options))
}

export const useProductVariants = (productId?: string) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [options, setOptions] = useState<ProductOption[]>([])
  const [variantsLoading, setVariantsLoading] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load variants and options from localStorage
  useEffect(() => {
    if (productId) {
      setVariantsLoading(true)
      setOptionsLoading(true)
      
      const storedVariants = getStoredVariants(productId)
      const storedOptions = getStoredOptions(productId)
      
      setVariants(storedVariants)
      setOptions(storedOptions)
      
      setVariantsLoading(false)
      setOptionsLoading(false)
    }
  }, [productId])

  // Create variant
  const createVariant = (variantData: Omit<ProductVariantInsert, 'user_id'>) => {
    if (!user?.id || !productId) {
      toast({
        title: "Erreur",
        description: "Utilisateur non authentifié",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)
    try {
      const newVariant: ProductVariant = {
        id: crypto.randomUUID(),
        ...variantData,
        user_id: user.id,
        created_at: new Date().toISOString(),
      }
      
      const updated = [...variants, newVariant]
      setVariants(updated)
      saveStoredVariants(productId, updated)
      
      queryClient.invalidateQueries({ queryKey: ['product-variants'] })
      toast({
        title: "Variante créée",
        description: "La variante a été ajoutée avec succès"
      })
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Update variant
  const updateVariant = ({ id, updates }: { id: string; updates: Partial<ProductVariant> }) => {
    if (!productId) return

    setIsUpdating(true)
    try {
      const updated = variants.map(v => v.id === id ? { ...v, ...updates } : v)
      setVariants(updated)
      saveStoredVariants(productId, updated)
      
      queryClient.invalidateQueries({ queryKey: ['product-variants'] })
      toast({
        title: "Variante mise à jour",
        description: "Les modifications ont été enregistrées"
      })
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Delete variant
  const deleteVariant = (id: string) => {
    if (!productId) return

    setIsDeleting(true)
    try {
      const updated = variants.filter(v => v.id !== id)
      setVariants(updated)
      saveStoredVariants(productId, updated)
      
      queryClient.invalidateQueries({ queryKey: ['product-variants'] })
      toast({
        title: "Variante supprimée",
        description: "La variante a été supprimée"
      })
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Save options
  const saveOptions = (optionsData: Array<Omit<ProductOptionInsert, 'user_id'>>) => {
    if (!user?.id || !productId) {
      toast({
        title: "Erreur",
        description: "Utilisateur non authentifié",
        variant: "destructive"
      })
      return
    }

    try {
      const newOptions: ProductOption[] = optionsData.map((opt, index) => ({
        id: crypto.randomUUID(),
        ...opt,
        user_id: user.id,
        position: index,
      }))
      
      setOptions(newOptions)
      saveStoredOptions(productId, newOptions)
      
      queryClient.invalidateQueries({ queryKey: ['product-options'] })
      toast({
        title: "Options enregistrées",
        description: "Les options ont été mises à jour"
      })
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  // Generate variants from options
  const generateVariants = async (opts: ProductOption[]) => {
    if (!productId || !user?.id) return

    // Generate all combinations
    const combinations = generateCombinations(opts)

    // Create variants
    for (const combo of combinations) {
      const variantName = combo.map(c => c.value).join(' / ')
      const variantSKU = `PROD-${combo.map(c => c.value.substring(0, 3).toUpperCase()).join('-')}`
      
      const variantData: Omit<ProductVariantInsert, 'user_id'> = {
        product_id: productId,
        name: variantName,
        variant_sku: variantSKU,
        price: 0,
        cost_price: null,
        stock_quantity: 0,
        image_url: null,
        options: combo.reduce((acc, c) => ({ ...acc, [c.name]: c.value }), {}),
        is_active: true
      }

      createVariant(variantData)
    }
  }

  return {
    variants,
    options,
    variantsLoading,
    optionsLoading,
    createVariant,
    updateVariant,
    deleteVariant,
    saveOptions,
    generateVariants,
    isCreating,
    isUpdating,
    isDeleting
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
