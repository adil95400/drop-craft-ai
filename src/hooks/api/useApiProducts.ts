/**
 * useApiProducts - Hook pour les opérations produits via API V1
 * Zéro lecture directe Supabase — tout passe par le routeur REST unifié.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { productsApi } from '@/services/api/client'

export function useApiProducts() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['products-unified'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['product-stats'] })
    queryClient.invalidateQueries({ queryKey: ['imported-products'] })
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
      const resp = await productsApi.create({
        title: product.title,
        name: product.title,
        description: product.description,
        sku: product.sku,
        cost_price: product.costPrice ?? 0,
        price: product.salePrice,
        stock_quantity: product.stock ?? 0,
        category: product.categoryId ?? null,
        images: product.images ?? [],
        status: 'draft',
      })
      return { success: true, data: resp }
    },
    onSuccess: () => {
      invalidate()
      toast({ title: 'Produit créé' })
    },
    onError: () => toast({ title: 'Erreur', description: 'Impossible de créer le produit', variant: 'destructive' }),
  })

  const updateProduct = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ title: string; description: string; costPrice: number; salePrice: number; stock: number; status: string }> }) => {
      const apiUpdates: Record<string, any> = {}
      if (updates.title) { apiUpdates.title = updates.title; apiUpdates.name = updates.title }
      if (updates.description) apiUpdates.description = updates.description
      if (updates.costPrice !== undefined) apiUpdates.cost_price = updates.costPrice
      if (updates.salePrice !== undefined) apiUpdates.price = updates.salePrice
      if (updates.stock !== undefined) apiUpdates.stock_quantity = updates.stock
      if (updates.status) apiUpdates.status = updates.status

      await productsApi.update(id, apiUpdates as any)
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
      await productsApi.delete(id)
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
      // Fetch current prices via API
      const resp = await productsApi.list({ per_page: 100 })
      const products = (resp.items ?? []).filter(p => productIds.includes(p.id))

      // Update each product via API
      for (const product of products) {
        const currentPrice = Number(product.price) || 0
        const newPrice = adjustmentType === 'percentage'
          ? currentPrice * (1 + adjustmentValue / 100)
          : currentPrice + adjustmentValue

        await productsApi.update(product.id, { price: Math.max(0, newPrice) } as any)
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
