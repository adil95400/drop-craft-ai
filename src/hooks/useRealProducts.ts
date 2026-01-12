/**
 * @deprecated Use useProductsUnified from '@/hooks/unified' instead
 * This file is kept for backward compatibility and will be removed in a future version
 */
import { useProductsUnified, UnifiedProduct } from '@/hooks/unified'

// Re-export Product type for backward compatibility
export type Product = UnifiedProduct

export const useRealProducts = (filters?: any) => {
  console.warn('[DEPRECATED] useRealProducts - utilisez useProductsUnified de @/hooks/unified')
  
  const result = useProductsUnified({
    filters: {
      status: filters?.status,
      category: filters?.category,
      search: filters?.search,
      low_stock: filters?.low_stock,
      page: filters?.page || 0,
      pageSize: filters?.pageSize || 100
    }
  })

  return {
    products: result.products,
    stats: result.stats,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
    addProduct: result.add,
    updateProduct: result.update,
    deleteProduct: result.delete,
    isAdding: result.isAdding,
    isUpdating: result.isUpdating,
    isDeleting: result.isDeleting
  }
}
