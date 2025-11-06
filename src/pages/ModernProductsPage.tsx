import React, { useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProductCategories } from '@/components/products/ProductCategories'
import ProductAnalytics from '@/components/products/ProductAnalytics'
import { ProductBulkOperations } from '@/components/products/ProductBulkOperations'
import { ProductSettings } from '@/components/products/ProductSettings'
import { ProductTemplates } from '@/components/products/ProductTemplates'
import { ProductInventory } from '@/components/products/ProductInventory'
import { ProductSEO } from '@/components/products/ProductSEO'
import { VirtualizedProductTable } from '@/components/products/VirtualizedProductTable'
import { VirtualizedProductGrid } from '@/components/products/VirtualizedProductGrid'
import { ProductFilters, ProductFiltersState } from '@/components/products/ProductFilters'
import { CreateProductDialog } from '@/components/modals/CreateProductDialog'
import { EditProductDialog } from '@/components/products/EditProductDialog'
import { useUnifiedProducts, UnifiedProduct } from '@/hooks/useUnifiedProducts'
import { AIProductOptimizer } from '@/components/ai/AIProductOptimizer'
import { BulkOptimizationPanel } from '@/components/ai/BulkOptimizationPanel'
import { useNavigate } from 'react-router-dom'
import { useLegacyPlan } from '@/lib/migration-helper'
import { useDebounce } from '@/components/performance/PerformanceOptimizations'
import { 
  Package, BarChart3, Grid3X3, Settings, 
  Tag, Warehouse, Search, FileText, Plus, TrendingUp, AlertCircle, DollarSign, AlertTriangle,
  LayoutList, LayoutGrid, Download, Upload, Database, Sparkles
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { importExportService } from '@/services/importExportService'
import { useToast } from '@/hooks/use-toast'

export default function ModernProductsPage() {
  const navigate = useNavigate()
  const { isPro } = useLegacyPlan()
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<UnifiedProduct | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [filters, setFilters] = useState<ProductFiltersState>({
    search: '',
    category: 'all',
    status: 'all',
    priceMin: '',
    priceMax: '',
    stockMin: '',
    lowStock: false,
    source: 'all'
  })
  const [selectedProductForAI, setSelectedProductForAI] = useState<UnifiedProduct | null>(null)
  const [showBulkOptimizer, setShowBulkOptimizer] = useState(false)

  // Debounce search for performance
  const debouncedSearch = useDebounce(filters.search, 300)

  // Fetch unified products data with debounced search
  const unifiedFilters = useMemo(() => ({
    status: filters.status !== 'all' ? filters.status as 'active' | 'inactive' : undefined,
    category: filters.category !== 'all' ? filters.category : undefined,
    search: debouncedSearch,
    minPrice: filters.priceMin ? parseFloat(filters.priceMin) : undefined,
    maxPrice: filters.priceMax ? parseFloat(filters.priceMax) : undefined,
    lowStock: filters.lowStock
  }), [filters, debouncedSearch])

  const { 
    products, 
    stats,
    isLoading, 
    updateProduct,
    deleteProduct,
    consolidateProducts,
    isUpdating,
    isDeleting,
    isConsolidating
  } = useUnifiedProducts(unifiedFilters)
  // Apply frontend filters (source, stockMin) with memoization
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (filters.source !== 'all' && product.source !== filters.source) return false
      if (filters.stockMin && (product.stock_quantity || 0) < parseInt(filters.stockMin)) return false
      return true
    })
  }, [products, filters.source, filters.stockMin])

  // Sort products with memoization
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const aValue = a[sortField as keyof UnifiedProduct]
      const bValue = b[sortField as keyof UnifiedProduct]
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredProducts, sortField, sortDirection])

  // Get unique categories for filter with memoization
  const categories = useMemo(() => 
    Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[]
  , [products])

  // Gestionnaires de sélection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(sortedProducts.map(p => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(sid => sid !== id))
    }
  }

  // Gestionnaires de tri
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Actions produit
  const handleView = (product: UnifiedProduct) => {
    navigate(`/products/${product.id}`)
  }

  const handleEdit = (product: UnifiedProduct) => {
    setEditingProduct(product)
  }

  const handleDuplicate = (product: UnifiedProduct) => {
    toast({
      title: "Fonctionnalité à venir",
      description: "La duplication de produits sera disponible prochainement"
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      deleteProduct(id)
    }
  }

  // Export
  const handleExport = () => {
    importExportService.exportToCSV(
      sortedProducts,
      `produits_${new Date().toISOString().split('T')[0]}.csv`
    )
    toast({
      title: "Export réussi",
      description: `${sortedProducts.length} produits exportés`
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto p-6 space-y-6 animate-pulse">
          <div className="h-32 bg-muted rounded-2xl"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 border border-primary/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Gestion des Produits
                </h1>
                <p className="text-muted-foreground text-lg">
                  {sortedProducts.length} sur {products.length} produits • Gestion professionnelle
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
                <Button size="lg" onClick={() => setCreateDialogOpen(true)} className="shadow-lg hover:shadow-xl transition-all duration-300">
                  <Plus className="h-5 w-5 mr-2" />
                  Nouveau produit
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total produits</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-success/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Produits actifs</p>
                  <p className="text-3xl font-bold text-success">{stats.active}</p>
                </div>
                <div className="p-3 bg-success/10 rounded-xl group-hover:bg-success/20 transition-colors">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-warning/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Sources</p>
                  <div className="space-y-1 text-xs mt-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Importés:</span>
                      <span className="font-medium">{stats.bySource.imported}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Catalogue:</span>
                      <span className="font-medium">{stats.bySource.catalog}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Premium:</span>
                      <span className="font-medium">{stats.bySource.premium}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Manuels:</span>
                      <span className="font-medium">{stats.bySource.products}</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-warning/10 rounded-xl group-hover:bg-warning/20 transition-colors">
                  <Database className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-info/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Valeur totale</p>
                  <p className="text-3xl font-bold text-info">{formatCurrency(stats.totalValue)}</p>
                </div>
                <div className="p-3 bg-info/10 rounded-xl group-hover:bg-info/20 transition-colors">
                  <DollarSign className="h-6 w-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-card/50 backdrop-blur-sm p-1 rounded-xl border border-border">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produits
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Catégories
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Stock
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              SEO
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Modèles
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          {/* Tab Produits */}
          <TabsContent value="products" className="space-y-6">
            <Card className="border-primary/20 shadow-lg">
              <CardContent className="p-6 space-y-6">
                {/* Barre d'outils */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                    >
                      <LayoutList className="h-4 w-4 mr-2" />
                      Liste
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Grille
                    </Button>
                    {selectedIds.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedIds.length} sélectionné(s)
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Bouton consolidation */}
                    {stats.bySource.imported > 0 && (
                      <Button
                        onClick={() => {
                          if (confirm(`Voulez-vous migrer ${stats.bySource.imported} produits importés vers la table principale ?`)) {
                            consolidateProducts()
                          }
                        }}
                        disabled={isConsolidating}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Database className="h-4 w-4" />
                        {isConsolidating ? 'Consolidation...' : `Consolider ${stats.bySource.imported}`}
                      </Button>
                    )}
                    
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/import')}>
                      <Upload className="h-4 w-4 mr-2" />
                      Importer
                    </Button>
                    {selectedIds.length > 0 && (
                      <Button
                        onClick={() => setShowBulkOptimizer(true)}
                        variant="default"
                        size="sm"
                        className="gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        Optimiser IA ({selectedIds.length})
                      </Button>
                    )}
                  </div>
                </div>

                {/* Filtres */}
                <ProductFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  categories={categories}
                />

                {/* Actions groupées */}
                {selectedIds.length > 0 && (
                  <ProductBulkOperations
                    selectedProducts={selectedIds}
                    onClearSelection={() => setSelectedIds([])}
                  />
                )}

                {/* Vue Tableau ou Grille - Virtualisée */}
                {viewMode === 'table' ? (
                  <VirtualizedProductTable
                    products={sortedProducts}
                    selectedIds={selectedIds}
                    onSelectAll={handleSelectAll}
                    onSelectOne={handleSelectOne}
                    onSort={handleSort}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    isPro={isPro()}
                  />
                ) : (
                  <VirtualizedProductGrid
                    products={sortedProducts}
                    selectedIds={selectedIds}
                    onSelectOne={handleSelectOne}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    isPro={isPro()}
                  />
                )}

                {/* AI Optimization Modals */}
                {selectedProductForAI && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <AIProductOptimizer 
                        product={selectedProductForAI}
                        onOptimized={() => setSelectedProductForAI(null)}
                      />
                      <div className="p-4">
                        <Button
                          onClick={() => setSelectedProductForAI(null)}
                          variant="outline"
                          className="w-full"
                        >
                          Fermer
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {showBulkOptimizer && selectedIds.length > 0 && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <BulkOptimizationPanel
                        products={sortedProducts.filter(p => selectedIds.includes(p.id))}
                        onComplete={() => {
                          setShowBulkOptimizer(false)
                          setSelectedIds([])
                        }}
                      />
                      <div className="p-4">
                        <Button
                          onClick={() => setShowBulkOptimizer(false)}
                          variant="outline"
                          className="w-full"
                        >
                          Fermer
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message vide */}
                {sortedProducts.length === 0 && products.length > 0 && (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                    <p className="text-muted-foreground">
                      Essayez d'ajuster vos filtres
                    </p>
                  </div>
                )}

                {products.length === 0 && (
                  <div className="text-center py-16">
                    <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Aucun produit</h3>
                    <p className="text-muted-foreground mb-6">
                      Commencez par importer vos premiers produits
                    </p>
                    <Button onClick={() => navigate('/import')}>
                      <Upload className="h-4 w-4 mr-2" />
                      Importer des produits
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Catégories */}
          <TabsContent value="categories">
            <ProductCategories />
          </TabsContent>

          {/* Tab Stock */}
          <TabsContent value="inventory">
            <ProductInventory />
          </TabsContent>

          {/* Tab Analytics */}
          <TabsContent value="analytics">
            <ProductAnalytics productId={null} />
          </TabsContent>

          {/* Tab SEO */}
          <TabsContent value="seo">
            <ProductSEO />
          </TabsContent>

          {/* Tab Modèles */}
          <TabsContent value="templates">
            <ProductTemplates />
          </TabsContent>

          {/* Tab Paramètres */}
          <TabsContent value="settings">
            <ProductSettings />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog création produit */}
      <CreateProductDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
      />

      {/* Dialog édition produit */}
      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
          onSave={async (updates) => {
            updateProduct({ id: editingProduct.id, updates })
            setEditingProduct(null)
          }}
        />
      )}
    </div>
  )
}
