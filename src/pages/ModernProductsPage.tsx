import React, { useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ProductCategories } from '@/components/products/ProductCategories'
import ProductAnalytics from '@/components/products/ProductAnalytics'
import { ProductBulkOperations } from '@/components/products/ProductBulkOperations'
import { ProductSettings } from '@/components/products/ProductSettings'
import { ProductTemplates } from '@/components/products/ProductTemplates'
import { ProductInventory } from '@/components/products/ProductInventory'
import { ProductSEO } from '@/components/products/ProductSEO'
import { ProductTable } from '@/components/products/ProductTable'
import { ProductGridView } from '@/components/products/ProductGridView'
import { ProductFilters, ProductFiltersState } from '@/components/products/ProductFilters'
import { CreateProductDialog } from '@/components/modals/CreateProductDialog'
import { EditProductDialog } from '@/components/products/EditProductDialog'
import { useUnifiedProducts } from '@/hooks/useUnifiedProducts'
import { useRealProducts, Product } from '@/hooks/useRealProducts'
import { useNavigate } from 'react-router-dom'
import { useLegacyPlan } from '@/lib/migration-helper'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { 
  Package, BarChart3, Grid3X3, Settings, 
  Tag, Warehouse, Search, FileText, Plus, TrendingUp, AlertCircle, DollarSign, 
  LayoutList, LayoutGrid, Download, Upload
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { importExportService } from '@/services/importExportService'
import { useToast } from '@/hooks/use-toast'

export default function ModernProductsPage() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortField, setSortField] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  const [filters, setFilters] = useState<ProductFiltersState>({
    search: '',
    category: 'all',
    status: 'all',
    priceMin: '',
    priceMax: '',
    stockMin: '',
    lowStock: false
  })
  
  const { products, stats, isLoading, deleteProduct, addProduct, updateProduct } = useRealProducts()
  const { isPro } = useLegacyPlan()
  const { toast } = useToast()
  const navigate = useNavigate()

  // Filtrage et tri des produits
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products]

    // Filtres de recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower) ||
        p.category?.toLowerCase().includes(searchLower)
      )
    }

    // Filtre catégorie
    if (filters.category !== 'all') {
      result = result.filter(p => p.category === filters.category)
    }

    // Filtre statut
    if (filters.status !== 'all') {
      result = result.filter(p => p.status === filters.status)
    }

    // Filtre prix
    if (filters.priceMin) {
      result = result.filter(p => p.price >= parseFloat(filters.priceMin))
    }
    if (filters.priceMax) {
      result = result.filter(p => p.price <= parseFloat(filters.priceMax))
    }

    // Filtre stock
    if (filters.stockMin) {
      result = result.filter(p => (p.stock_quantity || 0) >= parseInt(filters.stockMin))
    }
    if (filters.lowStock) {
      result = result.filter(p => (p.stock_quantity || 0) < 10)
    }

    // Tri
    result.sort((a, b) => {
      let aVal: any = a[sortField as keyof Product]
      let bVal: any = b[sortField as keyof Product]
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      
      if (aVal === undefined || aVal === null) return 1
      if (bVal === undefined || bVal === null) return -1
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return result
  }, [products, filters, sortField, sortDirection])

  // Catégories disponibles
  const categories = useMemo(() => 
    [...new Set(products.map(p => p.category).filter(Boolean))] as string[],
    [products]
  )

  // Gestionnaires de sélection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredAndSortedProducts.map(p => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, id])
    } else {
      setSelectedProducts(selectedProducts.filter(sid => sid !== id))
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
  const handleView = (product: Product) => {
    setSelectedProduct(product)
    setShowProductModal(true)
  }

  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
  }

  const handleDuplicate = async (product: Product) => {
    try {
      const { id, created_at, updated_at, user_id, ...productData } = product
      await addProduct({
        ...productData,
        name: `${product.name} (copie)`,
        sku: product.sku ? `${product.sku}-COPY` : undefined
      })
    } catch (error) {
      // Géré par le hook
    }
  }

  const handleDelete = (id: string) => {
    deleteProduct(id)
  }

  // Export
  const handleExport = () => {
    importExportService.exportToCSV(
      filteredAndSortedProducts,
      `produits_${new Date().toISOString().split('T')[0]}.csv`
    )
    toast({
      title: "Export réussi",
      description: `${filteredAndSortedProducts.length} produits exportés`
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
                  {filteredAndSortedProducts.length} sur {products.length} produits • Gestion professionnelle
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
                  <p className="text-sm text-muted-foreground mb-1">Stock faible</p>
                  <p className="text-3xl font-bold text-warning">{stats.lowStock}</p>
                </div>
                <div className="p-3 bg-warning/10 rounded-xl group-hover:bg-warning/20 transition-colors">
                  <AlertCircle className="h-6 w-6 text-warning" />
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
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
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
                    {selectedProducts.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedProducts.length} sélectionné(s)
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/import')}>
                      <Upload className="h-4 w-4 mr-2" />
                      Importer
                    </Button>
                  </div>
                </div>

                {/* Filtres */}
                <ProductFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  categories={categories}
                />

                {/* Actions groupées */}
                {selectedProducts.length > 0 && (
                  <ProductBulkOperations
                    selectedProducts={selectedProducts}
                    onClearSelection={() => setSelectedProducts([])}
                  />
                )}

                {/* Vue Tableau ou Grille */}
                {viewMode === 'list' ? (
                  <ProductTable
                    products={filteredAndSortedProducts}
                    selectedIds={selectedProducts}
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
                  <ProductGridView
                    products={filteredAndSortedProducts}
                    selectedIds={selectedProducts}
                    onSelectOne={handleSelectOne}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    isPro={isPro()}
                  />
                )}

                {/* Message vide */}
                {filteredAndSortedProducts.length === 0 && products.length > 0 && (
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

      {/* Modal détails produit */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
            <DialogDescription>Détails du produit</DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-6">
              {/* Image */}
              {selectedProduct.image_url && (
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={selectedProduct.image_url} 
                    alt={selectedProduct.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Informations */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Prix de vente</h4>
                    <p className="text-2xl font-bold">{formatCurrency(selectedProduct.price)}</p>
                  </div>
                  
                  {isPro() && selectedProduct.cost_price && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Prix de revient</h4>
                      <p className="text-lg">{formatCurrency(selectedProduct.cost_price)}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Stock</h4>
                    <p className="text-lg">{selectedProduct.stock_quantity || 0} unités</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">SKU</h4>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {selectedProduct.sku || 'N/A'}
                    </code>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Catégorie</h4>
                    <Badge variant="outline">{selectedProduct.category || 'Non catégorisé'}</Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Statut</h4>
                    <Badge variant={selectedProduct.status === 'active' ? 'default' : 'secondary'}>
                      {selectedProduct.status}
                    </Badge>
                  </div>

                  {isPro() && selectedProduct.profit_margin && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Marge</h4>
                      <p className="text-lg font-semibold text-emerald-600">
                        {selectedProduct.profit_margin.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                  <p className="text-sm leading-relaxed">{selectedProduct.description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button onClick={() => handleEdit(selectedProduct)} className="flex-1">
                  Modifier
                </Button>
                <Button variant="outline" onClick={() => handleDuplicate(selectedProduct)}>
                  Dupliquer
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    handleDelete(selectedProduct.id)
                    setShowProductModal(false)
                  }}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog création produit */}
      <CreateProductDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}
