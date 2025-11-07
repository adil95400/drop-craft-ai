import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Package, 
  DollarSign,
  TrendingUp,
  AlertCircle,
  Plus,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLegacyPlan } from '@/lib/migration-helper'
import { useRealProducts, Product } from '@/hooks/useRealProducts'
import { ProductGridView } from '@/components/products/ProductGridView'
import { ProductFilters, ProductFiltersState } from '@/components/products/ProductFilters'
import { importExportService } from '@/services/importExportService'
import { Badge } from '@/components/ui/badge'
import { ProductsTableView } from '@/components/products/ProductsTableView'
import { ProductsViewToggle, ViewMode } from '@/components/products/ProductsViewToggle'
import { UnifiedProduct } from '@/hooks/useUnifiedProducts'

const Products = () => {
  const { toast } = useToast()
  const { isUltraPro, isPro } = useLegacyPlan()
  const { products, stats, isLoading, deleteProduct, addProduct } = useRealProducts()
  
  // États
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortField, setSortField] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  
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
      setSelectedIds(filteredAndSortedProducts.map(p => p.id))
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

  // Convertir Product vers UnifiedProduct
  const toUnifiedProduct = (product: Product): UnifiedProduct => ({
    ...product,
    status: product.status as 'active' | 'inactive',
    source: 'products' as const,
    images: product.image_url ? [product.image_url] : []
  })

  // Actions produit
  const handleView = (product: Product | UnifiedProduct) => {
    setSelectedProduct(product as Product)
    setShowProductModal(true)
  }

  const handleEdit = (product: Product | UnifiedProduct) => {
    toast({
      title: "Édition",
      description: "Fonctionnalité d'édition en cours de développement"
    })
  }

  // Actions en masse
  const handleBulkDelete = (ids: string[]) => {
    ids.forEach(id => deleteProduct(id))
    setSelectedIds([])
  }

  const handleBulkEdit = (ids: string[]) => {
    toast({
      title: "Édition en masse",
      description: `${ids.length} produit(s) sélectionné(s) pour modification`
    })
  }

  const handleDuplicate = async (product: Product) => {
    try {
      const { id, created_at, updated_at, user_id, ...productData } = product
      await addProduct({
        ...productData,
        name: `${product.name} (copie)`,
        sku: product.sku ? `${product.sku}-COPY` : undefined
      })
      toast({
        title: "Produit dupliqué",
        description: "Le produit a été dupliqué avec succès"
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de dupliquer le produit",
        variant: "destructive"
      })
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
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion des Produits</h2>
          <p className="text-muted-foreground">
            {filteredAndSortedProducts.length} sur {products.length} produits affichés
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/import">
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </a>
          </Button>
          <Button size="sm" asChild>
            <a href="/import">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau produit
            </a>
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.active || 0} actifs
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Inventaire total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prix Moyen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency((stats?.totalValue || 0) / Math.max(stats?.total || 1, 1))}
            </div>
            <p className="text-xs text-muted-foreground">
              Par produit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.lowStock || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              &lt; 10 unités
            </p>
          </CardContent>
        </Card>

        {isPro() && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Marge Moyenne</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {(() => {
                  const productsWithMargin = products.filter(p => p.profit_margin)
                  const avgMargin = productsWithMargin.length > 0
                    ? productsWithMargin.reduce((sum, p) => sum + (p.profit_margin || 0), 0) / productsWithMargin.length
                    : 0
                  return `${avgMargin.toFixed(1)}%`
                })()}
              </div>
              <p className="text-xs text-muted-foreground">
                Sur produits avec coût
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Barre d'outils */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Catalogue</CardTitle>
              <CardDescription>
                {selectedIds.length > 0 && (
                  <Badge variant="secondary" className="mt-1">
                    {selectedIds.length} produit(s) sélectionné(s)
                  </Badge>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <ProductsViewToggle 
                view={viewMode} 
                onViewChange={setViewMode}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtres */}
          <ProductFilters
            filters={filters}
            onFiltersChange={setFilters}
            categories={categories}
          />

          {/* Liste des produits */}
          {viewMode === 'table' ? (
            <ProductsTableView
              products={filteredAndSortedProducts.map(toUnifiedProduct)}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              onBulkEdit={handleBulkEdit}
            />
          ) : (
            <ProductGridView
              products={filteredAndSortedProducts.map(p => ({ ...p, source: 'products', images: p.image_url ? [p.image_url] : [] }))}
              selectedIds={selectedIds}
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
              <p className="text-muted-foreground mb-4">
                Essayez d'ajuster vos filtres de recherche
              </p>
              <Button 
                variant="outline" 
              onClick={() => setFilters({
                search: '',
                category: 'all',
                status: 'all',
                priceMin: '',
                priceMax: '',
                stockMin: '',
                lowStock: false,
                source: 'all'
              })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser les filtres
              </Button>
            </div>
          )}

          {products.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun produit</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par importer vos premiers produits
              </p>
              <Button asChild>
                <a href="/import">
                  <Upload className="h-4 w-4 mr-2" />
                  Importer des produits
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
                <Button 
                  variant="outline" 
                  onClick={() => handleDuplicate(selectedProduct)}
                >
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
    </div>
  )
}

export default Products
