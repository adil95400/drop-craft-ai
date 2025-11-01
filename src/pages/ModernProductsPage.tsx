import React, { useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ProductsOverview } from '@/components/products/ProductsOverview'
import { ProductsUpgradeBanner } from '@/components/products/ProductsUpgradeBanner'
import { ProductsListSimple } from '@/components/products/ProductsListSimple'
import { ProductCategories } from '@/components/products/ProductCategories'
import ProductAnalytics from '@/components/products/ProductAnalytics'
import { ProductBulkOperations } from '@/components/products/ProductBulkOperations'
import { ProductSettings } from '@/components/products/ProductSettings'
import { ProductTemplates } from '@/components/products/ProductTemplates'
import { ProductInventory } from '@/components/products/ProductInventory'
import { ProductActionsBar } from '@/components/products/ProductActionsBar'
import { ProductSEO } from '@/components/products/ProductSEO'
import { ProductDetails } from '@/components/products/ProductDetails'
import { CreateProductDialog } from '@/components/modals/CreateProductDialog'
import { useRealProducts } from '@/hooks/useRealProducts'
import { useNavigate } from 'react-router-dom'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  Package, BarChart3, Grid3X3, Settings, 
  Tag, Warehouse, Search, FileText, Plus, TrendingUp, AlertCircle, DollarSign, Filter, X, Eye 
} from 'lucide-react'

export default function ModernProductsPage() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [showFilters, setShowFilters] = useState(false)
  
  const { products, stats, isLoading } = useRealProducts()
  const navigate = useNavigate()

  // Filtrage avancé
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter
      
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
      
      const matchesPriceMin = !priceRange.min || product.price >= parseFloat(priceRange.min)
      const matchesPriceMax = !priceRange.max || product.price <= parseFloat(priceRange.max)
      
      return matchesSearch && matchesStatus && matchesCategory && matchesPriceMin && matchesPriceMax
    })
  }, [products, searchTerm, statusFilter, categoryFilter, priceRange])

  // Catégories uniques
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean))
    return Array.from(cats)
  }, [products])

  const resetFilters = () => {
    setStatusFilter('all')
    setCategoryFilter('all')
    setPriceRange({ min: '', max: '' })
    setSearchTerm('')
  }

  const hasActiveFilters = statusFilter !== 'all' || categoryFilter !== 'all' || priceRange.min || priceRange.max

  if (selectedProductId) {
    return (
      <ProductDetails 
        productId={selectedProductId} 
        onClose={() => setSelectedProductId(null)} 
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <ProductsUpgradeBanner />
      
      <div className="container mx-auto p-6 space-y-8">
        {/* Hero Header with gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 border border-primary/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Gestion des Produits
                </h1>
                <p className="text-muted-foreground text-lg">
                  Gérez votre catalogue avec des outils professionnels intelligents
                </p>
              </div>
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nouveau produit
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards with animations */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total produits</p>
                    <p className="text-3xl font-bold text-foreground">{stats.total}</p>
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
                    <p className="text-3xl font-bold text-info">{Math.round(stats.totalValue)}€</p>
                  </div>
                  <div className="p-3 bg-info/10 rounded-xl group-hover:bg-info/20 transition-colors">
                    <DollarSign className="h-6 w-6 text-info" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtres avancés */}
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, SKU ou catégorie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtres
                  {hasActiveFilters && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-foreground text-primary rounded-full">
                      {[statusFilter !== 'all', categoryFilter !== 'all', priceRange.min, priceRange.max].filter(Boolean).length}
                    </span>
                  )}
                </Button>
                {hasActiveFilters && (
                  <Button variant="ghost" onClick={resetFilters} className="gap-2">
                    <X className="h-4 w-4" />
                    Réinitialiser
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''}
                >
                  Liste
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''}
                >
                  Grille
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium mb-2 block">Statut</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Catégorie</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Prix min</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Prix max</label>
                  <Input
                    type="number"
                    placeholder="9999.99"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {filteredProducts.length} produit(s) sur {products.length}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nouveau produit
                </Button>
                <Button variant="outline" onClick={() => navigate('/import/advanced')} className="gap-2">
                  Importer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Operations */}
        {selectedProducts.length > 0 && (
          <ProductBulkOperations 
            selectedProducts={selectedProducts}
            onClearSelection={() => setSelectedProducts([])}
          />
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 bg-card/50 backdrop-blur-sm p-1 rounded-xl border border-border">
            <TabsTrigger 
              value="products" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Package className="h-4 w-4" />
              Produits
            </TabsTrigger>
            <TabsTrigger 
              value="categories" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Tag className="h-4 w-4" />
              Catégories
            </TabsTrigger>
            <TabsTrigger 
              value="inventory" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Warehouse className="h-4 w-4" />
              Stock
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="seo" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Search className="h-4 w-4" />
              SEO
            </TabsTrigger>
            <TabsTrigger 
              value="templates" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <FileText className="h-4 w-4" />
              Modèles
            </TabsTrigger>
            <TabsTrigger 
              value="bulk" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Grid3X3 className="h-4 w-4" />
              Actions
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Settings className="h-4 w-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6 animate-in fade-in-50 duration-500">
            {viewMode === 'list' ? (
              <Card className="border-primary/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="rounded-lg border border-primary/20 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50 border-b">
                            <th className="p-4 text-left text-sm font-medium">
                              <input
                                type="checkbox"
                                checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedProducts(filteredProducts.map(p => p.id))
                                  } else {
                                    setSelectedProducts([])
                                  }
                                }}
                                className="rounded border-border"
                              />
                            </th>
                            <th className="p-4 text-left text-sm font-medium">Produit</th>
                            <th className="p-4 text-left text-sm font-medium">SKU</th>
                            <th className="p-4 text-left text-sm font-medium">Catégorie</th>
                            <th className="p-4 text-left text-sm font-medium">Prix</th>
                            <th className="p-4 text-left text-sm font-medium">Stock</th>
                            <th className="p-4 text-left text-sm font-medium">Statut</th>
                            <th className="p-4 text-left text-sm font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map((product) => (
                            <tr key={product.id} className="border-b hover:bg-primary/5 transition-colors">
                              <td className="p-4">
                                <input
                                  type="checkbox"
                                  checked={selectedProducts.includes(product.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedProducts([...selectedProducts, product.id])
                                    } else {
                                      setSelectedProducts(selectedProducts.filter(id => id !== product.id))
                                    }
                                  }}
                                  className="rounded border-border"
                                />
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  {product.image_url ? (
                                    <img
                                      src={product.image_url}
                                      alt={product.name}
                                      className="w-12 h-12 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                      <Package className="h-5 w-5 text-primary" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-semibold">{product.name}</div>
                                    <div className="text-sm text-muted-foreground line-clamp-1">
                                      {product.description}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <code className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                  {product.sku || 'N/A'}
                                </code>
                              </td>
                              <td className="p-4">
                                <span className="text-sm">{product.category || '-'}</span>
                              </td>
                              <td className="p-4">
                                <div>
                                  <div className="font-semibold">{product.price.toFixed(2)}€</div>
                                  {product.cost_price && (
                                    <div className="text-xs text-muted-foreground">
                                      Coût: {product.cost_price.toFixed(2)}€
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  (product.stock_quantity || 0) === 0 
                                    ? 'bg-destructive/10 text-destructive'
                                    : (product.stock_quantity || 0) < 10
                                    ? 'bg-warning/10 text-warning'
                                    : 'bg-success/10 text-success'
                                }`}>
                                  {product.stock_quantity || 0}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  product.status === 'active'
                                    ? 'bg-success/10 text-success'
                                    : 'bg-secondary/10 text-secondary'
                                }`}>
                                  {product.status === 'active' ? 'Actif' : 'Inactif'}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedProductId(product.id)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filteredProducts.length === 0 && (
                      <div className="p-12 text-center text-muted-foreground">
                        Aucun produit trouvé
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/20">
                    <CardContent className="p-0">
                      <div className="relative">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-48 object-cover rounded-t-lg"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-lg flex items-center justify-center">
                            <Package className="h-12 w-12 text-primary" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.status === 'active'
                              ? 'bg-success text-success-foreground'
                              : 'bg-secondary text-secondary-foreground'
                          }`}>
                            {product.status === 'active' ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description || 'Aucune description'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-primary">{product.price.toFixed(2)}€</div>
                            {product.cost_price && (
                              <div className="text-xs text-muted-foreground">
                                Coût: {product.cost_price.toFixed(2)}€
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${
                              (product.stock_quantity || 0) === 0 
                                ? 'text-destructive'
                                : (product.stock_quantity || 0) < 10
                                ? 'text-warning'
                                : 'text-success'
                            }`}>
                              Stock: {product.stock_quantity || 0}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setSelectedProductId(product.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Button>
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts([...selectedProducts, product.id])
                              } else {
                                setSelectedProducts(selectedProducts.filter(id => id !== product.id))
                              }
                            }}
                            className="rounded border-border"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-6 animate-in fade-in-50 duration-500">
            <ProductCategories />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6 animate-in fade-in-50 duration-500">
            <ProductInventory />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 animate-in fade-in-50 duration-500">
            <ProductAnalytics productId="" />
          </TabsContent>

          <TabsContent value="seo" className="space-y-6 animate-in fade-in-50 duration-500">
            <ProductSEO />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6 animate-in fade-in-50 duration-500">
            <ProductTemplates />
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6 animate-in fade-in-50 duration-500">
            <ProductBulkOperations 
              selectedProducts={selectedProducts}
              onClearSelection={() => setSelectedProducts([])}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 animate-in fade-in-50 duration-500">
            <ProductSettings />
          </TabsContent>
        </Tabs>
      </div>

      <CreateProductDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </div>
  )
}