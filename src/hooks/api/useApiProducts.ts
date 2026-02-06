/**
 * useApiProducts - Hook pour les opérations produits via FastAPI
 * Les lectures restent via Supabase (realtime), les mutations passent par FastAPI
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'

export function useApiProducts() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['products-unified'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['product-stats'] })
  }

  // Create product via FastAPI
  const createProduct = useMutation({
    mutationFn: (product: {
      title: string
      description?: string
      sku?: string
      costPrice?: number
      salePrice: number
      stock?: number
      categoryId?: string
      supplierId?: string
      images?: string[]
    }) => shopOptiApi.createProduct(product),
    onSuccess: (res) => {
      if (res.success) {
        invalidate()
        toast({ title: 'Produit créé', description: 'Le produit a été ajouté via le backend.' })
      } else {
        toast({ title: 'Erreur', description: res.error, variant: 'destructive' })
      }
    },
    onError: () => toast({ title: 'Erreur', description: 'Impossible de créer le produit', variant: 'destructive' }),
  })

  // Update product via FastAPI
  const updateProduct = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<{ title: string; description: string; costPrice: number; salePrice: number; stock: number; status: string }> }) =>
      shopOptiApi.updateProduct(id, updates),
    onSuccess: (res) => {
      if (res.success) {
        invalidate()
        toast({ title: 'Produit mis à jour' })
      } else {
        toast({ title: 'Erreur', description: res.error, variant: 'destructive' })
      }
    },
    onError: () => toast({ title: 'Erreur', description: 'Impossible de mettre à jour', variant: 'destructive' }),
  })

  // Delete product via FastAPI
  const deleteProduct = useMutation({
    mutationFn: (id: string) => shopOptiApi.deleteProduct(id),
    onSuccess: (res) => {
      if (res.success) {
        invalidate()
        toast({ title: 'Produit supprimé' })
      } else {
        toast({ title: 'Erreur', description: res.error, variant: 'destructive' })
      }
    },
    onError: () => toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' }),
  })

  // Bulk price update via FastAPI → returns job_id
  const bulkUpdatePrices = useMutation({
    mutationFn: ({ productIds, adjustmentType, adjustmentValue }: {
      productIds: string[]
      adjustmentType: 'percentage' | 'fixed'
      adjustmentValue: number
    }) => shopOptiApi.bulkUpdatePrices(productIds, adjustmentType, adjustmentValue),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: 'Mise à jour des prix lancée', description: `Job: ${res.job_id || 'en cours'}` })
        invalidate()
      } else {
        toast({ title: 'Erreur', description: res.error, variant: 'destructive' })
      }
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
