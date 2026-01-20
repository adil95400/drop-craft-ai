/**
 * Vue Standard du catalogue produits
 */
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package } from 'lucide-react'
import { ProductsPageWrapper } from '@/components/products/ProductsPageWrapper'
import { UnifiedProduct } from '@/hooks/useUnifiedProducts'
import { FilterState } from '@/hooks/useProductFilters'

interface ProductsStandardViewProps {
  products: UnifiedProduct[]
  allProducts: UnifiedProduct[]
  totalCount: number
  filters: FilterState
  categories: string[]
  onFilterChange: (key: keyof FilterState, value: any) => void
  onResetFilters: () => void
  hasActiveFilters: boolean
  onEdit: (product: UnifiedProduct) => void
  onDelete: (id: string) => void
  onView: (product: UnifiedProduct) => void
  onRefresh: () => void
  isLoading: boolean
}

export function ProductsStandardView({
  products,
  allProducts,
  totalCount,
  filters,
  categories,
  onFilterChange,
  onResetFilters,
  hasActiveFilters,
  onEdit,
  onDelete,
  onView,
  onRefresh,
  isLoading
}: ProductsStandardViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <span>Catalogue complet</span>
            </div>
            <Badge variant="secondary" className="text-base px-3 py-1">
              {totalCount} produits
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductsPageWrapper
            products={products}
            allProducts={allProducts}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            onRefresh={onRefresh}
            filters={filters}
            categories={categories}
            onFilterChange={onFilterChange}
            onResetFilters={onResetFilters}
            hasActiveFilters={hasActiveFilters}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}
