import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePlan } from '@/hooks/usePlan'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Crown, 
  Zap, 
  BarChart3, 
  Package, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Star, 
  TrendingUp, 
  Heart,
  ShoppingCart,
  Eye,
  Plus,
  Download,
  ExternalLink
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export default function CatalogueReal() {
  const { user } = useAuth()
  const { hasPlan, plan } = usePlan(user)
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'profit_margin' | 'created_at'>('created_at')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [onlyWinners, setOnlyWinners] = useState(false)
  const [onlyTrending, setOnlyTrending] = useState(false)
  const [onlyBestsellers, setOnlyBestsellers] = useState(false)
  
  const isUltraPro = hasPlan('ultra_pro')
  const isPro = hasPlan('pro')

  // Fetch user's own products instead of marketplace data
  const { data: userProducts = [], isLoading, error } = useQuery({
    queryKey: ['user-products', { search: searchQuery, category: selectedCategory, sortBy }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order(sortBy === 'name' ? 'name' : sortBy === 'price' ? 'price' : 'created_at', 
               { ascending: sortBy === 'name' })
      
      if (error) throw error
      return data || []
    }
  })

  // Fetch marketplace products (catalog_products)
  const { data: marketplaceProducts = [], isLoading: isMarketplaceLoading } = useQuery({
    queryKey: ['marketplace-products', { search: searchQuery, category: selectedCategory }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_products')
        .select('*')
        .limit(50)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    }
  })

  // Filter products based on search and category
  const products = userProducts.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !selectedCategory || product.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const total = products.length
  const marketplaceTotal = marketplaceProducts.length

  const handleImportProduct = async (productId: string) => {
    try {
      // Get the marketplace product
      const product = marketplaceProducts.find(p => p.id === productId)
      if (!product) return

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Add to user's products
      const { error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          name: product.name,
          description: product.description,
          price: product.price,
          cost_price: product.cost_price,
          sku: product.sku,
          category: product.category,
          image_url: product.image_url,
          status: 'active',
          supplier: product.supplier_name
        })

      if (error) throw error

      toast({
        title: "Produit importé !",
        description: "Le produit a été ajouté à votre catalogue"
      })
    } catch (error) {
      console.error('Error importing product:', error)
      toast({
        title: "Erreur d'import",
        description: "Impossible d'importer le produit",
        variant: "destructive"
      })
    }
  }

  const ProductCard = ({ product, isMarketplace = false }: { product: any, isMarketplace?: boolean }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <CardHeader className="p-4">
        <div className="relative">
          <img
            src={product.image_url || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-48 object-cover rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg'
            }}
          />
          
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart className="w-4 h-4" />
          </Button>
          
          {/* Badges */}
          <div className="absolute top-2 left-2 space-y-1">
            {product.is_winner && (
              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                <Star className="w-3 h-3 mr-1" />
                Winner
              </Badge>
            )}
            {product.is_trending && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                <TrendingUp className="w-3 h-3 mr-1" />
                Trending
              </Badge>
            )}
            {product.is_bestseller && (
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                <Zap className="w-3 h-3 mr-1" />
                Bestseller
              </Badge>
            )}
          </div>

          {/* Profit Margin for owned products */}
          {!isMarketplace && product.cost_price && (
            <Badge className="absolute bottom-2 right-2 bg-green-500">
              +{Math.round(((product.price - product.cost_price) / product.cost_price) * 100)}%
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 space-y-3">
        <div>
          <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
          <p className="text-xs text-muted-foreground">{product.supplier_name || product.brand}</p>
          {product.category && (
            <p className="text-xs text-blue-600">{product.category}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold">{product.price}€</span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-sm text-muted-foreground line-through ml-2">
                {product.original_price}€
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs">{product.rating || 0}</span>
            <span className="text-xs text-muted-foreground">
              ({product.reviews_count || 0})
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>SKU: {product.sku || 'N/A'}</span>
          {product.availability_status && (
            <Badge 
              variant={product.availability_status === 'in_stock' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {product.availability_status === 'in_stock' ? 'En stock' : 'Rupture'}
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          {isMarketplace ? (
            <Button 
              size="sm" 
              className="flex-1" 
              onClick={() => handleImportProduct(product.id)}
              disabled={false}
            >
              <Plus className="w-4 h-4 mr-1" />
              Importer
            </Button>
          ) : (
            <Button size="sm" className="flex-1">
              <ShoppingCart className="w-4 h-4 mr-1" />
              Gérer
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-background">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                Catalogue Réel
                <Badge variant="default" className="bg-green-500">LIVE</Badge>
                {isUltraPro && <Badge variant="secondary">Ultra Pro</Badge>}
              </h1>
              <p className="text-muted-foreground mt-1">
                Catalogue avec données réelles et intégrations live
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter Produit
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="my-products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="my-products">Mes Produits</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="analytics" disabled={!isPro}>
              Analytics {!isPro && "🔒"}
            </TabsTrigger>
            <TabsTrigger value="ai-tools" disabled={!isUltraPro}>
              Outils IA {!isUltraPro && "🔒"}
            </TabsTrigger>
          </TabsList>

          {/* My Products Tab */}
          <TabsContent value="my-products" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Mon Catalogue</h2>
                <p className="text-muted-foreground">
                  {total} produits dans votre catalogue
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher dans mon catalogue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Catégorie</label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes les catégories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Toutes les catégories</SelectItem>
                          <SelectItem value="electronics">Électronique</SelectItem>
                          <SelectItem value="clothing">Vêtements</SelectItem>
                          <SelectItem value="home">Maison</SelectItem>
                          <SelectItem value="sports">Sport</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Fournisseur</label>
                      <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tous les fournisseurs" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Tous les fournisseurs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Prix: {priceRange[0]}€ - {priceRange[1]}€
                      </label>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={1000}
                        step={10}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Trier par</label>
                      <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="created_at">Plus récents</SelectItem>
                          <SelectItem value="price">Prix</SelectItem>
                          <SelectItem value="name">Nom A-Z</SelectItem>
                          <SelectItem value="profit_margin">Marge</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="winners"
                        checked={onlyWinners}
                        onCheckedChange={(checked) => setOnlyWinners(checked === true)}
                      />
                      <label htmlFor="winners" className="text-sm font-medium">
                        Seulement les Winners
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="trending"
                        checked={onlyTrending}
                        onCheckedChange={(checked) => setOnlyTrending(checked === true)}
                      />
                      <label htmlFor="trending" className="text-sm font-medium">
                        Seulement les Trending
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="bestsellers"
                        checked={onlyBestsellers}
                        onCheckedChange={(checked) => setOnlyBestsellers(checked === true)}
                      />
                      <label htmlFor="bestsellers" className="text-sm font-medium">
                        Seulement les Bestsellers
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products Grid */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>  
                  <p>Chargement des produits...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                  <p className="text-muted-foreground mb-4">
                    Commencez par importer des produits depuis la marketplace
                  </p>
                  <Button onClick={() => window.location.reload()}>
                    Actualiser
                  </Button>
                </div>
              ) : (
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                    : 'grid-cols-1'
                }`}>
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Marketplace</h2>
                <p className="text-muted-foreground">
                  Découvrez et importez de nouveaux produits
                </p>
              </div>
              <Button 
                onClick={() => window.location.reload()}
                disabled={isMarketplaceLoading}
              >
                {isMarketplaceLoading ? 'Chargement...' : 'Actualiser'}
              </Button>
            </div>

            {/* Marketplace Products */}
            <div className="space-y-4">
              {isMarketplaceLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>  
                  <p>Chargement de la marketplace...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {marketplaceProducts.map((product) => (
                    <ProductCard key={product.id} product={product} isMarketplace={true} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Analytics du Catalogue</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Produits</p>
                        <p className="text-3xl font-bold">{total}</p>
                      </div>
                      <Package className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Winners</p>
                        <p className="text-3xl font-bold">
                          {products.filter(p => p.status === 'active').length}
                        </p>
                      </div>
                      <Star className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Trending</p>
                        <p className="text-3xl font-bold">
                          {products.filter(p => p.category).length}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Valeur Totale</p>
                        <p className="text-3xl font-bold">
                          {products.reduce((sum, p) => sum + p.price, 0).toFixed(0)}€
                        </p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* AI Tools Tab */}
          <TabsContent value="ai-tools">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-purple-600" />
                <h2 className="text-2xl font-bold">Outils IA pour le Catalogue</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Optimisation Automatique</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Optimisez automatiquement les titres, descriptions et prix avec l'IA
                    </p>
                    <Button className="w-full">
                      <Zap className="w-4 h-4 mr-2" />
                      Optimiser le Catalogue
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Analyse de Tendances</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Analysez les tendances du marché et identifiez les opportunités
                    </p>
                    <Button className="w-full" variant="outline">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Analyser Tendances
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}