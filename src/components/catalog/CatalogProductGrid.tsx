import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Star, 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Heart, 
  Eye,
  Zap,
  Crown,
  AlertTriangle,
  CheckCircle,
  Grid3X3,
  List
} from "lucide-react"
import { useState } from "react"
import { CatalogProduct } from "@/hooks/useCatalogProducts"
import { getSupplierById } from "@/data/suppliers"

interface CatalogProductGridProps {
  products: CatalogProduct[]
  onProductClick: (product: CatalogProduct) => void
  onImportProduct: (product: CatalogProduct) => void
  onToggleFavorite: (productId: string, isFavorite: boolean) => void
  favorites: string[]
}

export const CatalogProductGrid = ({ 
  products, 
  onProductClick, 
  onImportProduct, 
  onToggleFavorite,
  favorites 
}: CatalogProductGridProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-3 h-3 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }

  const getMarginColor = (margin: number) => {
    if (margin >= 50) return 'text-green-600'
    if (margin >= 40) return 'text-blue-600'
    if (margin >= 30) return 'text-orange-600'
    return 'text-red-600'
  }

  const getStockStatus = (stock: number) => {
    if (stock > 100) return { color: 'text-green-600', icon: CheckCircle, text: 'En stock' }
    if (stock > 20) return { color: 'text-orange-600', icon: AlertTriangle, text: 'Stock limité' }
    return { color: 'text-red-600', icon: AlertTriangle, text: 'Stock faible' }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const getSupplierLogo = (supplierId: string) => {
    const supplier = getSupplierById(supplierId)
    return supplier?.icon || '🏪'
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {products.length} produits trouvés
        </p>
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

      {/* Products Grid */}
      <div className={`grid gap-4 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1'
      }`}>
        {products.map((product) => {
          const stockStatus = getStockStatus(product.stock_quantity)
          const isFavorite = favorites.includes(product.id)
          const discountPercent = product.original_price ? 
            Math.round((1 - product.price / product.original_price) * 100) : 0

          return (
            <Card 
              key={product.id} 
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all group cursor-pointer"
              onClick={() => onProductClick(product)}
            >
              <CardContent className={`p-4 ${viewMode === 'list' ? 'flex gap-4' : ''}`}>
                {/* Product Image */}
                <div className={`relative ${viewMode === 'list' ? 'w-32 h-32 flex-shrink-0' : 'aspect-square mb-3'}`}>
                  <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.is_winner && (
                      <Badge className="bg-yellow-500 text-black text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        Winner
                      </Badge>
                    )}
                    {product.is_trending && (
                      <Badge className="bg-green-500 text-white text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                    {product.is_bestseller && (
                      <Badge className="bg-purple-500 text-white text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Best
                      </Badge>
                    )}
                    {discountPercent > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        -{discountPercent}%
                      </Badge>
                    )}
                  </div>

                  {/* Favorite Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 w-8 h-8 p-0 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleFavorite(product.id, isFavorite)
                    }}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                  </Button>
                </div>

                {/* Product Info */}
                <div className={`space-y-2 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  {/* Supplier */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getSupplierLogo(product.supplier_id)}</span>
                    <span className="text-xs text-muted-foreground">{product.supplier_name}</span>
                    {product.category && (
                      <Badge variant="outline" className="text-xs">{product.category}</Badge>
                    )}
                  </div>

                  {/* Product Name */}
                  <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                    {product.name}
                  </h3>

                  {/* Brand */}
                  {product.brand && (
                    <p className="text-xs text-muted-foreground">{product.brand}</p>
                  )}

                  {/* Rating & Reviews */}
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(product.rating)}</div>
                    <span className="text-xs text-muted-foreground">
                      {product.rating.toFixed(1)} ({product.reviews_count})
                    </span>
                  </div>

                  {/* Price & Margin */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-primary">{formatPrice(product.price)}</p>
                      {product.cost_price && (
                        <p className="text-xs text-muted-foreground">
                          Coût: {formatPrice(product.cost_price)}
                        </p>
                      )}
                      {product.original_price && product.original_price > product.price && (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatPrice(product.original_price)}
                        </p>
                      )}
                    </div>
                    {product.profit_margin > 0 && (
                      <Badge variant="outline" className={getMarginColor(product.profit_margin)}>
                        {product.profit_margin.toFixed(0)}% marge
                      </Badge>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3 text-muted-foreground" />
                      <span>{product.sales_count} ventes</span>
                    </div>
                    <div className={`flex items-center gap-1 ${stockStatus.color}`}>
                      <stockStatus.icon className="w-3 h-3" />
                      <span>{product.stock_quantity} stock</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {product.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        onProductClick(product)
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Voir
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        onImportProduct(product)
                      }}
                    >
                      <Package className="w-3 h-3 mr-1" />
                      Importer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Load More */}
      {products.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">Aucun produit trouvé</h3>
          <p className="text-sm text-muted-foreground">Essayez de modifier vos filtres de recherche</p>
        </div>
      )}

      {products.length > 0 && (
        <div className="text-center pt-6">
          <Button variant="outline" className="w-48">
            Charger plus de produits
          </Button>
        </div>
      )}
    </div>
  )
}