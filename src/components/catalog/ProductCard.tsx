import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/hooks/useRealProducts";
import { ProductActionButtons } from "./ProductActionButtons";
import { Package, Star, TrendingUp, Crown, Zap } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  onDuplicate?: (product: Product) => void;
  onToggleFavorite?: (productId: string) => void;
  onViewAnalytics?: (productId: string) => void;
  onView?: (product: Product) => void;
  isFavorite?: boolean;
  variant?: 'default' | 'compact';
}

export const ProductCard = ({
  product,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onViewAnalytics,
  onView,
  isFavorite = false,
  variant = 'default'
}: ProductCardProps) => {
  const renderStars = (rating: number = 0) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-3 h-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const getStockColor = (stock: number = 0) => {
    if (stock > 50) return 'text-green-600';
    if (stock > 10) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const calculateMargin = () => {
    if (product.cost_price && product.price) {
      return Math.round(((product.price - product.cost_price) / product.price) * 100);
    }
    return product.profit_margin || 0;
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 50) return 'text-green-600';
    if (margin >= 30) return 'text-blue-600';
    return 'text-orange-600';
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all group">
      <CardHeader className="pb-3">
        <div className="relative aspect-square bg-muted rounded-md flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="h-12 w-12 text-muted-foreground" />
          )}
          
          {/* Badges overlay */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.status === 'active' && product.stock_quantity && product.stock_quantity > 0 && (
              <Badge className="bg-green-500 text-white text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                Actif
              </Badge>
            )}
            {product.profit_margin && product.profit_margin > 50 && (
              <Badge className="bg-yellow-500 text-black text-xs">
                <Crown className="w-3 h-3 mr-1" />
                Top Marge
              </Badge>
            )}
            {product.stock_quantity && product.stock_quantity > 100 && (
              <Badge className="bg-blue-500 text-white text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Stock+
              </Badge>
            )}
          </div>

          {/* Stock indicator */}
          <div className="absolute bottom-2 right-2">
            <Badge 
              variant={product.stock_quantity && product.stock_quantity > 10 ? 'default' : 'destructive'}
              className="text-xs"
            >
              Stock: {product.stock_quantity || 0}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Product info */}
        <div>
          <h3 className="font-semibold text-sm line-clamp-2 mb-1">
            {product.name}
          </h3>
          
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        {/* Category & SKU */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {product.category && (
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
          )}
          {product.sku && (
            <span>SKU: {product.sku}</span>
          )}
        </div>

        {/* Rating (si disponible) */}
        {/* Pour les produits réels, on peut simuler une note basée sur les performances */}
        <div className="flex items-center gap-2">
          <div className="flex">{renderStars(4)}</div>
          <span className="text-xs text-muted-foreground">
            4.0 (Simulé)
          </span>
        </div>

        {/* Price & Margin */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-primary">{formatCurrency(product.price)}</p>
              {product.cost_price && (
                <p className="text-xs text-muted-foreground">
                  Coût: {formatCurrency(product.cost_price)}
                </p>
              )}
            </div>
            <Badge 
              variant="outline" 
              className={getMarginColor(calculateMargin())}
            >
              +{calculateMargin()}%
            </Badge>
          </div>
        </div>

        {/* Stock status */}
        <div className={`text-xs ${getStockColor(product.stock_quantity || 0)}`}>
          {(product.stock_quantity || 0) > 50 ? '✅ Stock disponible' : 
           (product.stock_quantity || 0) > 10 ? '⚠️ Stock limité' : 
           '❌ Stock faible'}
        </div>

        {/* Actions */}
        <ProductActionButtons
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onToggleFavorite={onToggleFavorite}
          onViewAnalytics={onViewAnalytics}
          onView={onView}
          isFavorite={isFavorite}
          compact={variant === 'compact'}
        />
      </CardContent>
    </Card>
  );
};