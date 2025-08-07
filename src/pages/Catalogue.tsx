import { useState } from "react"
import { AppLayout } from "@/layouts/AppLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Filter, Star, Heart, ShoppingCart, Eye, Package, TrendingUp, Grid3X3, List, Bookmark, BarChart3, Zap, Download, Settings } from "lucide-react"
import { useProducts } from "@/hooks/useProducts"
import { toast } from "sonner"

export default function Catalogue() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSupplier, setSelectedSupplier] = useState("all")
  const [priceRange, setPriceRange] = useState("all")
  const [sortBy, setSortBy] = useState("rating")
  const [favorites, setFavorites] = useState<number[]>([])
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const { products: dbProducts, addProduct } = useProducts()

  const products = [
    {
      id: 1,
      name: "Montre intelligente Sport Pro",
      price: "89.99",
      originalPrice: "159.99",
      image: "/placeholder.svg",
      rating: 4.8,
      reviews: 234,
      category: "Électronique",
      supplier: "Tech Supplies",
      inStock: true,
      trending: true
    },
    {
      id: 2,
      name: "Écouteurs Bluetooth Premium",
      price: "45.99",
      originalPrice: "79.99",
      image: "/placeholder.svg",
      rating: 4.6,
      reviews: 189,
      category: "Audio",
      supplier: "AudioTech",
      inStock: true,
      trending: false
    }
  ]

  const categories = [
    { value: "all", label: "Toutes catégories", count: 15420 },
    { value: "electronics", label: "Électronique", count: 5840 },
    { value: "fashion", label: "Mode & Beauté", count: 3920 },
    { value: "home", label: "Maison & Jardin", count: 2890 },
    { value: "sports", label: "Sport & Loisirs", count: 1950 },
    { value: "health", label: "Santé & Bien-être", count: 820 }
  ]

  const handleToggleFavorite = (productId: number) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
    toast.success(favorites.includes(productId) ? "Retiré des favoris" : "Ajouté aux favoris")
  }

  const handleAddToCart = (product: any) => {
    addProduct({
      user_id: '', // Set by mutation
      name: product.name,
      price: parseFloat(product.price),
      cost_price: parseFloat(product.price) * 0.6,
      category: product.category,
      status: "active" as const,
      image_url: product.image,
      description: `Produit importé: ${product.name}`
    })
    toast.success(`${product.name} ajouté au catalogue !`)
  }

  const handleBulkImport = () => {
    const selected = products.filter(p => selectedProducts.includes(p.id))
    selected.forEach(product => handleAddToCart(product))
    setSelectedProducts([])
    toast.success(`${selected.length} produits importés !`)
  }

  const handleExportSelection = () => {
    toast.success("Export CSV en cours...")
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category.toLowerCase() === selectedCategory
    const matchesSupplier = selectedSupplier === "all" || product.supplier.toLowerCase().includes(selectedSupplier.toLowerCase())
    
    return matchesSearch && matchesCategory && matchesSupplier
  })

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
            <div className="flex border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
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
                <SelectItem value="all">Tous fournisseurs</SelectItem>
                <SelectItem value="tech">Tech Supplies</SelectItem>
                <SelectItem value="audio">AudioTech</SelectItem>
                <SelectItem value="bigbuy">BigBuy</SelectItem>
                <SelectItem value="amazon">Amazon</SelectItem>
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

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {selectedProducts.length} produit(s) sélectionné(s)
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportSelection}>
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                  </Button>
                  <Button size="sm" onClick={handleBulkImport}>
                    <Package className="w-4 h-4 mr-2" />
                    Importer tout
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Tous ({filteredProducts.length})
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Tendances ({products.filter(p => p.trending).length})
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
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredProducts.length} produits trouvés
              </p>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Personnaliser
                </Button>
                <Button size="sm">
                  <Zap className="w-4 h-4 mr-2" />
                  Import IA
                </Button>
              </div>
            </div>

            {/* Enhanced Products Grid/List */}
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
            }>
              {filteredProducts.map((product) => (
                <Card key={product.id} className={`group hover:shadow-lg transition-all duration-200 ${
                  selectedProducts.includes(product.id) ? 'ring-2 ring-primary' : ''
                } ${viewMode === 'list' ? 'flex' : ''}`}>
                  {viewMode === 'grid' ? (
                    <>
                      <CardHeader className="p-0">
                        <div className="relative overflow-hidden rounded-t-lg bg-muted">
                          <input
                            type="checkbox"
                            className="absolute top-2 left-2 z-10"
                            checked={selectedProducts.includes(product.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts(prev => [...prev, product.id])
                              } else {
                                setSelectedProducts(prev => prev.filter(id => id !== product.id))
                              }
                            }}
                          />
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute top-2 right-2 flex gap-1">
                            {product.trending && (
                              <Badge className="bg-red-500">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Trending
                              </Badge>
                            )}
                            {product.inStock && (
                              <Badge variant="secondary">En stock</Badge>
                            )}
                          </div>
                          <div className="absolute bottom-2 right-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 bg-white/80 hover:bg-white"
                              onClick={() => handleToggleFavorite(product.id)}
                            >
                              <Heart className={`w-4 h-4 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">{product.category}</Badge>
                            <Badge variant="outline" className="text-xs">{product.supplier}</Badge>
                          </div>
                          <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                          
                          <div className="flex items-center gap-1">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < Math.floor(product.rating)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {product.rating} ({product.reviews})
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-primary">€{product.price}</span>
                              <span className="text-sm text-muted-foreground line-through">
                                €{product.originalPrice}
                              </span>
                            </div>
                            <Badge variant="destructive" className="text-xs">
                              -{Math.round((1 - parseFloat(product.price) / parseFloat(product.originalPrice)) * 100)}%
                            </Badge>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              <Eye className="w-3 h-3 mr-1" />
                              Détails
                            </Button>
                            <Button size="sm" className="flex-1" onClick={() => handleAddToCart(product)}>
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              Ajouter
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    // List View
                    <div className="flex w-full">
                      <div className="w-24 h-24 relative m-4">
                        <input
                          type="checkbox"
                          className="absolute top-1 left-1 z-10"
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts(prev => [...prev, product.id])
                            } else {
                              setSelectedProducts(prev => prev.filter(id => id !== product.id))
                            }
                          }}
                        />
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{product.name}</h3>
                              {product.trending && <Badge className="bg-red-500 text-xs">Trending</Badge>}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <span>{product.category}</span>
                              <span>•</span>
                              <span>{product.supplier}</span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span>{product.rating} ({product.reviews})</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-primary">€{product.price}</span>
                                <span className="text-sm text-muted-foreground line-through">€{product.originalPrice}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleToggleFavorite(product.id)}
                            >
                              <Heart className={`w-4 h-4 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              Détails
                            </Button>
                            <Button size="sm" onClick={() => handleAddToCart(product)}>
                              <ShoppingCart className="w-4 h-4 mr-1" />
                              Ajouter
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.filter(p => p.trending).map((product) => (
                <Card key={product.id} className="group hover:shadow-lg transition-all duration-200">
                  <CardHeader className="p-0">
                    <div className="relative overflow-hidden rounded-t-lg bg-muted">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <Badge className="absolute top-2 left-2 bg-red-500">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Hot
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">€{product.price}</span>
                      <Button size="sm" onClick={() => handleAddToCart(product)}>
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            {favorites.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun favori</h3>
                <p className="text-muted-foreground">Ajoutez des produits à vos favoris en cliquant sur ❤️</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.filter(p => favorites.includes(p.id)).map((product) => (
                  <Card key={product.id} className="group hover:shadow-lg transition-all duration-200">
                    <CardHeader className="p-0">
                      <div className="relative overflow-hidden rounded-t-lg bg-muted">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="absolute top-2 right-2 h-8 w-8 bg-white/80 hover:bg-white"
                          onClick={() => handleToggleFavorite(product.id)}
                        >
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-2">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">€{product.price}</span>
                        <Button size="sm" onClick={() => handleAddToCart(product)}>
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Ajouter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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