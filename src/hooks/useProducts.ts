// DEPRECATED: Use useUnifiedProducts instead
// This file is kept for backward compatibility only
import { useUnifiedProducts as useUnifiedProductsBase, UnifiedProduct } from './useUnifiedData'

// Backward compatibility wrapper
export const useProducts = (filters?: {
  category?: string
  search?: string
  status?: 'active' | 'inactive' | 'archived'
}) => {
  const result = useUnifiedProductsBase(filters)
  
  return {
    products: result.data,
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