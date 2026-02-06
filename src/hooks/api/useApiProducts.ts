/**
 * useApiProducts - Hook pour les opérations produits via Supabase direct
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export function useApiProducts() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['products-unified'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['product-stats'] })
  }

  const createProduct = useMutation({
    mutationFn: async (product: {
      title: string
      description?: string
      sku?: string
      costPrice?: number
      salePrice: number
      stock?: number
      categoryId?: string
      supplierId?: string
      images?: string[]
    }) => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Non authentifié')

      const { data, error } = await (supabase
        .from('products') as any)
        .insert({
          user_id: userData.user.id,
          name: product.title,
          description: product.description,
          sku: product.sku,
          cost_price: product.costPrice,
          price: product.salePrice,
          stock_quantity: product.stock || 0,
          category: product.categoryId,
          image_url: product.images?.[0],
          status: 'draft',
        })
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    },
    onSuccess: () => {
      invalidate()
      toast({ title: 'Produit créé' })
    },
    onError: () => toast({ title: 'Erreur', description: 'Impossible de créer le produit', variant: 'destructive' }),
  })

  const updateProduct = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ title: string; description: string; costPrice: number; salePrice: number; stock: number; status: string }> }) => {
      const updateData: Record<string, any> = {}
      if (updates.title) updateData.name = updates.title
      if (updates.description) updateData.description = updates.description
      if (updates.costPrice !== undefined) updateData.cost_price = updates.costPrice
      if (updates.salePrice !== undefined) updateData.price = updates.salePrice
      if (updates.stock !== undefined) updateData.stock_quantity = updates.stock
      if (updates.status) updateData.status = updates.status

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      invalidate()
      toast({ title: 'Produit mis à jour' })
    },
    onError: () => toast({ title: 'Erreur', description: 'Impossible de mettre à jour', variant: 'destructive' }),
  })

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      invalidate()
      toast({ title: 'Produit supprimé' })
    },
    onError: () => toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' }),
  })

  const bulkUpdatePrices = useMutation({
    mutationFn: async ({ productIds, adjustmentType, adjustmentValue }: {
      productIds: string[]
      adjustmentType: 'percentage' | 'fixed'
      adjustmentValue: number
    }) => {
      // Get current prices
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, price')
        .in('id', productIds)

      if (fetchError) throw fetchError

      // Update each product
      for (const product of (products || [])) {
        const currentPrice = Number(product.price) || 0
        const newPrice = adjustmentType === 'percentage'
          ? currentPrice * (1 + adjustmentValue / 100)
          : currentPrice + adjustmentValue

        await supabase
          .from('products')
          .update({ price: Math.max(0, newPrice) })
          .eq('id', product.id)
      }

      return { success: true }
    },
    onSuccess: () => {
      toast({ title: 'Prix mis à jour' })
      invalidate()
    },
  })

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    bulkUpdatePrices,
    invalidate,
  }
}
