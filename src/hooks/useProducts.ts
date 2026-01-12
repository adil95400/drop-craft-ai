// DEPRECATED: Use useProductsUnified instead
// This file is kept for backward compatibility only
import { useProductsUnified } from './unified/useProductsUnified'

// Backward compatibility wrapper
export const useProducts = (filters?: {
  category?: string
  search?: string
  status?: 'active' | 'inactive' | 'archived'
}) => {
  console.warn('[DEPRECATED] useProducts - utilisez useProductsUnified à la place')
  const result = useProductsUnified({ filters: filters as any })
  
  return {
    products: result.products,
    stats: result.stats,
    isLoading: result.isLoading,
    error: result.error,
    addProduct: result.add,
    updateProduct: result.update,
    deleteProduct: result.delete,
    isAdding: result.isAdding,
    isUpdating: result.isUpdating,
    isDeleting: result.isDeleting
  }
}