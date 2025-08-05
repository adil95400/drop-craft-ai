import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  CheckCircle
} from "lucide-react";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  supplier: string;
  supplierLogo: string;
  price: number;
  costPrice: number;
  margin: number;
  rating: number;
  reviews: number;
  sales: number;
  stock: number;
  trend: string;
  category: string;
  imageUrl: string;
  isWinner: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  deliveryTime: string;
  tags: string[];
}

interface ProductGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onImportProduct: (product: Product) => void;
  onToggleFavorite: (productId: string) => void;
  favorites: string[];
}

export const ProductGrid = ({ 
  products, 
  onProductClick, 
  onImportProduct, 
  onToggleFavorite,
  favorites 
}: ProductGridProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-3 h-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 50) return 'text-green-600';
    if (margin >= 40) return 'text-blue-600';
    if (margin >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStockStatus = (stock: number) => {
    if (stock > 100) return { color: 'text-green-600', icon: CheckCircle, text: 'En stock' };
    if (stock > 20) return { color: 'text-orange-600', icon: AlertTriangle, text: 'Stock limité' };
    return { color: 'text-red-600', icon: AlertTriangle, text: 'Stock faible' };
  };

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {products.length} produits trouvés
        </p>
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grille
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('list')}
          >
            Liste
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
          const stockStatus = getStockStatus(product.stock);
          const isFavorite = favorites.includes(product.id);

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
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.isWinner && (
                      <Badge className="bg-yellow-500 text-black text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        Winner
                      </Badge>
                    )}
                    {product.isTrending && (
                      <Badge className="bg-green-500 text-white text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                    {product.isBestSeller && (
                      <Badge className="bg-purple-500 text-white text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Best
                      </Badge>
                    )}
                  </div>

                  {/* Favorite Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 w-8 h-8 p-0 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(product.id);
                    }}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                  </Button>
                </div>

                {/* Product Info */}
                <div className={`space-y-2 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  {/* Supplier */}
                  <div className="flex items-center gap-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={product.supplierLogo} />
                      <AvatarFallback>{product.supplier.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{product.supplier}</span>
                  </div>

                  {/* Product Name */}
                  <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                    {product.name}
                  </h3>

                  {/* Rating & Reviews */}
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(Math.floor(product.rating))}</div>
                    <span className="text-xs text-muted-foreground">
                      {product.rating} ({product.reviews})
                    </span>
                  </div>

                  {/* Price & Margin */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-primary">{product.price}€</p>
                      <p className="text-xs text-muted-foreground">Coût: {product.costPrice}€</p>
                    </div>
                    <Badge variant="outline" className={getMarginColor(product.margin)}>
                      {product.margin}% marge
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3 text-muted-foreground" />
                      <span>{product.sales} ventes</span>
                    </div>
                    <div className={`flex items-center gap-1 ${stockStatus.color}`}>
                      <stockStatus.icon className="w-3 h-3" />
                      <span>{product.stock}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {product.tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onProductClick(product);
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Voir
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onImportProduct(product);
                      }}
                    >
                      <Package className="w-3 h-3 mr-1" />
                      Importer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Load More */}
      {products.length > 0 && (
        <div className="text-center pt-6">
          <Button variant="outline" className="w-48">
            Charger plus de produits
          </Button>
        </div>
      )}
    </div>
  );
};