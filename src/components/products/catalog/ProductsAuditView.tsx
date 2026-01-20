/**
 * Vue Audit des produits avec onglets Qualité, Filtres, Doublons, Simulateur
 */
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Target, AlertCircle, TrendingUp, Package } from 'lucide-react'
import { CatalogQualityDashboard } from '@/components/products/CatalogQualityDashboard'
import { AdvancedAuditFilters } from '@/components/products/AdvancedAuditFilters'
import { BulkAIActions } from '@/components/products/BulkAIActions'
import { DuplicateDetector } from '@/components/products/DuplicateDetector'
import { OptimizationSimulator } from '@/components/products/OptimizationSimulator'
import { PriorityManager } from '@/components/products/PriorityManager'
import { ProductsPageWrapper } from '@/components/products/ProductsPageWrapper'
import { ChannableEmptyState } from '@/components/channable'
import { UnifiedProduct } from '@/hooks/useUnifiedProducts'
import { FilterState } from '@/hooks/useProductFilters'

interface ProductsAuditViewProps {
  products: UnifiedProduct[]
  allProducts: UnifiedProduct[]
  filteredProducts: UnifiedProduct[]
  expertMode: boolean
  onExpertModeChange: (enabled: boolean) => void
  selectedProducts: string[]
  onSelectionChange: (ids: string[]) => void
  auditFilters: any
  onAuditFilterChange: (updates: Partial<any>) => void
  onAuditFiltersReset: () => void
  auditActiveCount: number
  filters: FilterState
  categories: string[]
  onFilterChange: (key: keyof FilterState, value: any) => void
  onResetFilters: () => void
  onEdit: (product: UnifiedProduct) => void
  onDelete: (id: string) => void
  onView: (product: UnifiedProduct) => void
  onRefresh: () => void
  isLoading: boolean
}

export function ProductsAuditView({
  products,
  allProducts,
  filteredProducts,
  expertMode,
  onExpertModeChange,
  selectedProducts,
  onSelectionChange,
  auditFilters,
  onAuditFilterChange,
  onAuditFiltersReset,
  auditActiveCount,
  filters,
  categories,
  onFilterChange,
  onResetFilters,
  onEdit,
  onDelete,
  onView,
  onRefresh,
  isLoading
}: ProductsAuditViewProps) {
  return (
    <Tabs defaultValue="quality" className="space-y-6">
      <TabsList className="bg-muted/50 p-1 flex-wrap">
        <TabsTrigger value="quality" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Qualité
        </TabsTrigger>
        <TabsTrigger value="filters" className="gap-2">
          <Target className="h-4 w-4" />
          Filtres
        </TabsTrigger>
        <TabsTrigger value="duplicates" className="gap-2">
          <AlertCircle className="h-4 w-4" />
          Doublons
        </TabsTrigger>
        <TabsTrigger value="simulator" className="gap-2">
          <TrendingUp className="h-4 w-4" />
          Simulateur
        </TabsTrigger>
        <TabsTrigger value="products" className="gap-2">
          <Package className="h-4 w-4" />
          Liste ({filteredProducts.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="quality" className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <CatalogQualityDashboard products={allProducts} />
        </motion.div>
      </TabsContent>

      <TabsContent value="duplicates" className="space-y-6">
        {expertMode ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <DuplicateDetector products={allProducts} />
          </motion.div>
        ) : (
          <ChannableEmptyState
            icon={AlertCircle}
            title="Mode Expert requis"
            description="Activez le Mode Expert pour accéder au détecteur de doublons"
            action={{
              label: 'Activer Mode Expert',
              onClick: () => onExpertModeChange(true)
            }}
          />
        )}
      </TabsContent>

      <TabsContent value="simulator" className="space-y-6">
        {expertMode ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <PriorityManager 
              products={allProducts}
              onSelectProducts={onSelectionChange}
            />
            <OptimizationSimulator 
              productIds={selectedProducts.length > 0 ? selectedProducts : allProducts.slice(0, 10).map(p => p.id)}
              onExecute={onRefresh}
            />
          </motion.div>
        ) : (
          <ChannableEmptyState
            icon={TrendingUp}
            title="Mode Expert requis"
            description="Activez le Mode Expert pour accéder au simulateur d'optimisation"
            action={{
              label: 'Activer Mode Expert',
              onClick: () => onExpertModeChange(true)
            }}
          />
        )}
      </TabsContent>

      <TabsContent value="filters" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <AdvancedAuditFilters
              filters={auditFilters}
              onFilterChange={onAuditFilterChange}
              onReset={onAuditFiltersReset}
              activeCount={auditActiveCount}
            />
          </div>
          <div className="lg:col-span-2 space-y-4">
            {selectedProducts.length > 0 && (
              <BulkAIActions
                selectedProducts={selectedProducts}
                onComplete={() => {
                  onSelectionChange([])
                  onRefresh()
                }}
              />
            )}
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Produits filtrés</span>
                  <Badge variant="secondary">{filteredProducts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProductsPageWrapper
                  products={filteredProducts}
                  allProducts={allProducts}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onView={onView}
                  onRefresh={onRefresh}
                  filters={filters}
                  categories={categories}
                  onFilterChange={onFilterChange}
                  onResetFilters={onResetFilters}
                  hasActiveFilters={auditActiveCount > 0}
                  onSelectionChange={onSelectionChange}
                  selectedProducts={selectedProducts}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="products" className="space-y-6">
        {selectedProducts.length > 0 && (
          <BulkAIActions
            selectedProducts={selectedProducts}
            onComplete={() => {
              onSelectionChange([])
              onRefresh()
            }}
          />
        )}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tous les produits</span>
              <Badge variant="secondary">{filteredProducts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductsPageWrapper
              products={filteredProducts}
              allProducts={allProducts}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              onRefresh={onRefresh}
              filters={filters}
              categories={categories}
              onFilterChange={onFilterChange}
              onResetFilters={onResetFilters}
              hasActiveFilters={auditActiveCount > 0}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
