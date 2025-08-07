import { useState, useMemo } from "react"
import { AppLayout } from "@/layouts/AppLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Filter, Star, Heart, ShoppingCart, Eye, Package, TrendingUp, Grid3X3, List, Bookmark, BarChart3, Zap, Download, Settings, Bell, Target, Crown } from "lucide-react"
import { useCatalogProducts, useSourcingHistory, usePriceAlerts } from "@/hooks/useCatalogProducts"
import { useProducts } from "@/hooks/useProducts"
import { EnhancedProductGrid } from "@/components/catalog/EnhancedProductGrid"
import { toast } from "sonner"

export default function Catalogue() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSupplier, setSelectedSupplier] = useState("all")
  const [priceRange, setPriceRange] = useState("all")
  const [sortBy, setSortBy] = useState("rating")
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("all")

  // Enhanced filters
  const catalogFilters = useMemo(() => ({
    search: searchQuery || undefined,
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    supplier: selectedSupplier !== "all" ? selectedSupplier : undefined,
    minPrice: priceRange === "0-25" ? 0 : priceRange === "25-50" ? 25 : priceRange === "50-100" ? 50 : priceRange === "100+" ? 100 : undefined,
    maxPrice: priceRange === "0-25" ? 25 : priceRange === "25-50" ? 50 : priceRange === "50-100" ? 100 : undefined,
    isWinner: activeTab === "winners" ? true : undefined,
    isTrending: activeTab === "trending" ? true : undefined,
    sortBy: sortBy as any,
    sortOrder: 'desc' as const
  }), [searchQuery, selectedCategory, selectedSupplier, priceRange, sortBy, activeTab])

  const { 
    products: catalogProducts, 
    favorites, 
    stats,
    isLoading,
    toggleFavorite,
    importProduct,
    isImporting
  } = useCatalogProducts(catalogFilters)

  const { history } = useSourcingHistory()
  const { alerts, createAlert } = usePriceAlerts()
  const { addProduct } = useProducts()

  // Real data from Supabase
  const filteredProducts = useMemo(() => {
    let filtered = catalogProducts;
    
    if (activeTab === "favorites") {
      filtered = catalogProducts.filter(p => favorites.includes(p.id));
    }
    
    return filtered;
  }, [catalogProducts, favorites, activeTab])

  const categories = [
    { value: "all", label: "Toutes catégories", count: stats.total },
    { value: "Électronique", label: "Électronique", count: catalogProducts.filter(p => p.category === "Électronique").length },
    { value: "Mode", label: "Mode & Beauté", count: catalogProducts.filter(p => p.category === "Mode").length },
    { value: "Maison", label: "Maison & Jardin", count: catalogProducts.filter(p => p.category === "Maison").length },
    { value: "Sport", label: "Sport & Loisirs", count: catalogProducts.filter(p => p.category === "Sport").length },
    { value: "Santé", label: "Santé & Bien-être", count: catalogProducts.filter(p => p.category === "Santé").length }
  ]

  const suppliers = useMemo(() => {
    const supplierCounts = catalogProducts.reduce((acc, product) => {
      acc[product.supplier] = (acc[product.supplier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { value: "all", label: "Tous fournisseurs", count: stats.total },
      ...Object.entries(supplierCounts).map(([supplier, count]) => ({
        value: supplier,
        label: supplier,
        count
      }))
    ];
  }, [catalogProducts, stats.total])

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
  }

  const handleImportProduct = (product: any) => {
    importProduct(product);
  }

  const handleToggleFavorite = (productId: string) => {
    toggleFavorite(productId);
  }

  const handleCreatePriceAlert = (productId: string, targetPrice: number) => {
    createAlert({ productId, targetPrice });
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Catalogue & Sourcing</h1>
            <p className="text-muted-foreground mt-2">
              Découvrez et importez des produits gagnants pour votre boutique
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <Package className="w-4 h-4 mr-2" />
              Importer Sélection
            </Button>
          </div>
        </div>

        {/* Enhanced Search & Filters */}
        <div className="space-y-4">
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
                {categories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label} ({category.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Fournisseur" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.value} value={supplier.value}>
                    {supplier.label} ({supplier.count})
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <p className="text-2xl font-bold">{favorites.length}</p>
                  <p className="text-sm text-muted-foreground">Favoris</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
              Favoris ({favorites.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <EnhancedProductGrid
              products={filteredProducts}
              favorites={favorites}
              onProductClick={handleProductClick}
              onImportProduct={handleImportProduct}
              onToggleFavorite={handleToggleFavorite}
              onCreatePriceAlert={handleCreatePriceAlert}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="winners" className="space-y-6">
            <EnhancedProductGrid
              products={filteredProducts}
              favorites={favorites}
              onProductClick={handleProductClick}
              onImportProduct={handleImportProduct}
              onToggleFavorite={handleToggleFavorite}
              onCreatePriceAlert={handleCreatePriceAlert}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            <EnhancedProductGrid
              products={filteredProducts}
              favorites={favorites}
              onProductClick={handleProductClick}
              onImportProduct={handleImportProduct}
              onToggleFavorite={handleToggleFavorite}
              onCreatePriceAlert={handleCreatePriceAlert}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            <EnhancedProductGrid
              products={filteredProducts}
              favorites={favorites}
              onProductClick={handleProductClick}
              onImportProduct={handleImportProduct}
              onToggleFavorite={handleToggleFavorite}
              onCreatePriceAlert={handleCreatePriceAlert}
              isLoading={isLoading}
            />
          </TabsContent>


          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Vues produits</span>
                      <span className="font-bold">15.2K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Ajouts panier</span>
                      <span className="font-bold">1.8K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Conversions</span>
                      <span className="font-bold">11.8%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Catégories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categories.slice(1, 4).map(category => (
                      <div key={category.value} className="flex justify-between">
                        <span className="text-sm">{category.label}</span>
                        <span className="font-bold">{category.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tendances</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Cette semaine</span>
                      <Badge variant="outline" className="text-green-600">+24%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Ce mois</span>
                      <Badge variant="outline" className="text-green-600">+156%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Prédiction</span>
                      <Badge variant="outline" className="text-blue-600">+89%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}