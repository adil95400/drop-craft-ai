import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Filter, Star, Heart, ShoppingCart, Eye, Package, TrendingUp, Grid3X3, List, Bookmark, BarChart3, Zap, Download, Settings, Crown } from "lucide-react"
import { useProducts } from "@/hooks/useProducts"
import { useCatalogProductsDemo as useCatalogProducts } from "@/hooks/useCatalogProductsDemo"
import type { CatalogProduct } from "@/hooks/useCatalogProducts"
import { CatalogProductGrid } from "@/components/catalog/CatalogProductGrid"
import { CatalogAnalytics } from "@/components/catalog/CatalogAnalytics"
import { BulkImportDialog } from "@/components/catalog/BulkImportDialog"
import { AdvancedFilters } from "@/components/catalog/AdvancedFilters"
import { toast } from "sonner"
import { Link } from "react-router-dom"

export default function Catalogue() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSupplier, setSelectedSupplier] = useState("all")
  const [priceRange, setPriceRange] = useState("all")
  const [sortBy, setSortBy] = useState("rating")
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  
  const { addProduct } = useProducts()
  
  // Filtres pour les produits du catalogue
  const filters = {
    search: searchQuery || undefined,
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    supplier: selectedSupplier !== "all" ? selectedSupplier : undefined,
    ...(activeTab === "trending" && { isTrending: true }),
    ...(activeTab === "winners" && { isWinner: true }),
    ...(activeTab === "bestsellers" && { isBestseller: true })
  }
  
  const { 
    products, 
    categories, 
    suppliers, 
    userFavorites, 
    stats,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    addSourcingHistory 
  } = useCatalogProducts(filters)

  // Filtrer les produits selon l'onglet actif
  const filteredProducts = activeTab === "favorites" 
    ? products.filter(p => userFavorites.includes(p.id))
    : products

  const handleToggleFavorite = (productId: string, isFavorite: boolean) => {
    if (isFavorite) {
      removeFromFavorites(productId)
    } else {
      addToFavorites(productId)
    }
    
    // Ajouter à l'historique de sourcing
    addSourcingHistory({ 
      productId, 
      action: isFavorite ? 'unfavorite' : 'favorite' 
    })
  }

  const handleImportProduct = (product: CatalogProduct) => {
    addProduct({
      name: product.name,
      price: product.price,
      cost_price: product.cost_price || product.price * 0.6,
      category: product.category,
      status: "active" as const,
      image_url: product.image_url,
      description: product.description || `Produit importé: ${product.name}`,
      supplier: product.supplier_name,
      sku: product.sku,
      tags: product.tags
    })
    
    // Ajouter à l'historique de sourcing
    addSourcingHistory({ 
      productId: product.id, 
      action: 'import',
      metadata: { import_date: new Date().toISOString() }
    })
    
    toast.success(`${product.name} ajouté au catalogue !`)
  }

  const handleProductClick = (product: CatalogProduct) => {
    setSelectedProduct(product)
    
    // Ajouter à l'historique de sourcing
    addSourcingHistory({ 
      productId: product.id, 
      action: 'view' 
    })
  }

  return (
    <div className="p-6 max-w-full mx-auto">
      {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              Catalogue & Sourcing
            </h1>
            <p className="text-muted-foreground mt-2">
              Découvrez et importez des produits gagnants avec IA prédictive
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtres IA
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics Marché
            </Button>
            <Link to="/catalogue-ultra-pro">
              <Button 
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                <Crown className="w-4 h-4 mr-2" />
                Catalogue Ultra Pro
              </Button>
            </Link>
            <Button className="bg-primary hover:bg-primary/90">
              <Package className="w-4 h-4 mr-2" />
              Importer Sélection
            </Button>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Produits</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.winners}</p>
                  <p className="text-sm text-muted-foreground">Winners</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.trending}</p>
                  <p className="text-sm text-muted-foreground">Tendances</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{userFavorites.length}</p>
                  <p className="text-sm text-muted-foreground">Favoris</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search & Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher des produits, marques, références..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtres Avancés
            </Button>
          </div>

          {/* Advanced Filters */}
          <div className="flex flex-wrap gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous fournisseurs</SelectItem>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Prix" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous prix</SelectItem>
                <SelectItem value="0-25">0€ - 25€</SelectItem>
                <SelectItem value="25-50">25€ - 50€</SelectItem>
                <SelectItem value="50-100">50€ - 100€</SelectItem>
                <SelectItem value="100+">100€+</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Mieux notés</SelectItem>
                <SelectItem value="price-asc">Prix croissant</SelectItem>
                <SelectItem value="price-desc">Prix décroissant</SelectItem>
                <SelectItem value="popular">Popularité</SelectItem>
                <SelectItem value="newest">Nouveautés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Tous ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="winners" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Winners ({stats.winners})
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Tendances ({stats.trending})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Favoris ({userFavorites.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <CatalogProductGrid
              products={filteredProducts}
              onProductClick={handleProductClick}
              onImportProduct={handleImportProduct}
              onToggleFavorite={handleToggleFavorite}
              favorites={userFavorites}
            />
          </TabsContent>

          <TabsContent value="winners" className="space-y-6">
            <CatalogProductGrid
              products={filteredProducts}
              onProductClick={handleProductClick}
              onImportProduct={handleImportProduct}
              onToggleFavorite={handleToggleFavorite}
              favorites={userFavorites}
            />
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            <CatalogProductGrid
              products={filteredProducts}
              onProductClick={handleProductClick}
              onImportProduct={handleImportProduct}
              onToggleFavorite={handleToggleFavorite}
              favorites={userFavorites}
            />
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            <CatalogProductGrid
              products={filteredProducts}
              onProductClick={handleProductClick}
              onImportProduct={handleImportProduct}
              onToggleFavorite={handleToggleFavorite}
              favorites={userFavorites}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <CatalogAnalytics products={products} stats={stats} />
          </TabsContent>
        </Tabs>

        {/* Product Detail Dialog */}
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedProduct?.name}</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img 
                    src={selectedProduct.image_url || "/placeholder.svg"} 
                    alt={selectedProduct.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedProduct.name}</h3>
                    <p className="text-muted-foreground">{selectedProduct.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      {selectedProduct.price}€
                    </span>
                    <Badge variant="outline">
                      {selectedProduct.profit_margin.toFixed(0)}% marge
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => handleImportProduct(selectedProduct)}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Importer
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleToggleFavorite(selectedProduct.id, userFavorites.includes(selectedProduct.id))}
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
    </div>
  )
}