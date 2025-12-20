import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Heart, Star, TrendingUp, Filter, Search, Grid, List, SortAsc, Eye, ShoppingCart, Zap } from 'lucide-react'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useRealTracking } from '@/hooks/useRealTracking'
import { CatalogProduct } from '@/hooks/useCatalogProducts'

export function CatalogUltraProInterface() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [sortBy, setSortBy] = useState('created_at')
  const [showFilters, setShowFilters] = useState(false)
  const [onlyWinners, setOnlyWinners] = useState(false)
  const [onlyTrending, setOnlyTrending] = useState(false)
  const [onlyBestsellers, setOnlyBestsellers] = useState(false)

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
  } = useCatalogProducts({
    search: searchQuery,
    category: selectedCategory,
    supplier: selectedSupplier,
    min_price: priceRange[0],
    max_price: priceRange[1],
    sort_by: sortBy,
    trending: onlyTrending,
    winner: onlyWinners,
    bestseller: onlyBestsellers
  })

  const { updateOrderTracking } = useRealTracking()

  const handleAddToStore = (product: any) => {
    addSourcingHistory({
      productId: product.id,
      action: 'added_to_store',
      metadata: {
        supplier: product.supplier_name,
        price: product.price,
        original_price: product.original_price
      }
    })
  }

  const handleFavoriteToggle = (productId: string) => {
    if (userFavorites.includes(productId)) {
      removeFromFavorites(productId)
    } else {
      addToFavorites(productId)
    }
  }

  const getProfitMargin = (price: number, cost: number) => {
    if (!cost || cost === 0) return 0
    return Math.round(((price - cost) / cost) * 100)
  }

  const getWinnerBadge = (product: any) => {
    const badges = []
    if (product.is_winner) badges.push('Winner')
    if (product.is_trending) badges.push('Trending')
    if (product.is_bestseller) badges.push('Bestseller')
    return badges
  }

  const ProductCard = ({ product }: { product: CatalogProduct }) => (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardHeader className="p-4">
        <div className="relative">
          <img
            src={product.image_url || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-48 object-cover rounded-lg"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => handleFavoriteToggle(product.id)}
          >
            <Heart 
              className={`w-4 h-4 ${userFavorites.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} 
            />
          </Button>
          
          {/* Badges */}
          <div className="absolute top-2 left-2 space-y-1">
            {getWinnerBadge(product).map((badge, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {badge === 'Winner' && <Star className="w-3 h-3 mr-1" />}
                {badge === 'Trending' && <TrendingUp className="w-3 h-3 mr-1" />}
                {badge}
              </Badge>
            ))}
          </div>

          {/* Profit Margin */}
          {product.cost_price && (
            <Badge className="absolute bottom-2 right-2 bg-green-500">
              +{getProfitMargin(product.price, product.cost_price)}%
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 space-y-3">
        <div>
          <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
          <p className="text-xs text-muted-foreground">{product.supplier_name}</p>
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
            <span className="text-xs text-muted-foreground">({product.reviews_count || 0})</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Stock: {product.stock_quantity || 0}</span>
          <span>Ventes: {product.sales_count || 0}</span>
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => handleAddToStore(product)}>
            <ShoppingCart className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const ProductListItem = ({ product }: { product: CatalogProduct }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <img
            src={product.image_url || '/placeholder.svg'}
            alt={product.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.supplier_name}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFavoriteToggle(product.id)}
              >
                <Heart 
                  className={`w-4 h-4 ${userFavorites.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} 
                />
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-lg font-bold">{product.price}€</span>
                  {product.original_price && (
                    <span className="text-sm text-muted-foreground line-through ml-2">
                      {product.original_price}€
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{product.rating || 0}</span>
                </div>

                <div className="flex gap-1">
                  {getWinnerBadge(product).map((badge, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => handleAddToStore(product)}>
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Catalogue Ultra Pro</h2>
        <p className="text-muted-foreground">
          Découvrez des produits gagnants avec l'analyse IA avancée
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Produits</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Grid className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Winners</p>
                <p className="text-2xl font-bold">{stats.winners}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Trending</p>
                <p className="text-2xl font-bold">{stats.trending}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Bestsellers</p>
                <p className="text-2xl font-bold">{stats.bestsellers}</p>
              </div>
              <Zap className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Note Moyenne</p>
                <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
              </div>
              <Star className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher des produits..."
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
                    {categories.map((category: string) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
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
                    {suppliers.map((supplier) => (
                      <SelectItem key={typeof supplier === 'string' ? supplier : supplier.id} value={typeof supplier === 'string' ? supplier : supplier.id}>
                        {typeof supplier === 'string' ? supplier : supplier.name}
                      </SelectItem>
                    ))}
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
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Plus récents</SelectItem>
                    <SelectItem value="price_asc">Prix croissant</SelectItem>
                    <SelectItem value="price_desc">Prix décroissant</SelectItem>
                    <SelectItem value="rating">Mieux notés</SelectItem>
                    <SelectItem value="sales">Plus vendus</SelectItem>
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

      {/* Products Grid/List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p>Chargement des produits...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {products.length} produits trouvés
              </p>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <ProductListItem key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}