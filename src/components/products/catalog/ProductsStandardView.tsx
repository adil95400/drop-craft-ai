/**
 * Vue Standard du catalogue produits - Simplifiée sans boutons en double
 * Phase 2: Support du mode Business avec viewMode
 * V3: Support des badges IA
 */
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, BarChart3, Brain } from 'lucide-react'
import { ProductsGridView } from '@/components/products/ProductsGridView'
import { UnifiedProduct } from '@/hooks/useUnifiedProducts'
import { FilterState } from '@/hooks/useProductFilters'
import { ViewMode, ProductAIBadge } from '@/components/products/command-center'

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
  // Selection props
  selectedProducts?: string[]
  onSelectionChange?: (ids: string[]) => void
  // Phase 2: View mode
  viewMode?: ViewMode
  // V3: AI Badges
  productBadges?: Map<string, ProductAIBadge>
  isAISorted?: boolean
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
  isLoading,
  selectedProducts = [],
  onSelectionChange,
  viewMode = 'standard',
  productBadges,
  isAISorted = false
}: ProductsStandardViewProps) {
  const isBusinessMode = viewMode === 'business'
  
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
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                isAISorted ? 'bg-primary/10' : isBusinessMode ? 'bg-emerald-500/10' : 'bg-primary/10'
              }`}>
                {isAISorted ? (
                  <Brain className="h-5 w-5 text-primary" />
                ) : isBusinessMode ? (
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Package className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span>{isBusinessMode ? 'Vue Business' : 'Catalogue complet'}</span>
                {isAISorted && (
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                    Tri IA
                  </Badge>
                )}
              </div>
            </div>
            <Badge variant="secondary" className="text-base px-3 py-1">
              {totalCount} produits
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ProductsGridView
            products={products}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            selectedProducts={selectedProducts}
            onSelectionChange={onSelectionChange}
            viewMode={viewMode}
            productBadges={productBadges}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}
