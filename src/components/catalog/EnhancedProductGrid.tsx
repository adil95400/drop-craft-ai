import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  List,
  Bell,
  BarChart3
} from "lucide-react";
import { useState } from "react";

interface CatalogProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost_price?: number;
  category: string;
  supplier: string;
  supplier_logo?: string;
  image_url?: string;
  rating: number;
  reviews_count: number;
  stock_quantity: number;
  sales_count: number;
  margin_percentage: number;
  is_winner: boolean;
  is_trending: boolean;
  is_best_seller: boolean;
  delivery_time: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface EnhancedProductGridProps {
  products: CatalogProduct[];
  favorites: string[];
  onProductClick: (product: CatalogProduct) => void;
  onImportProduct: (product: CatalogProduct) => void;
  onToggleFavorite: (productId: string) => void;
  onCreatePriceAlert: (productId: string, targetPrice: number) => void;
  isLoading?: boolean;
}

export const EnhancedProductGrid = ({ 
  products, 
  favorites,
  onProductClick, 
  onImportProduct, 
  onToggleFavorite,
  onCreatePriceAlert,
  isLoading = false
}: EnhancedProductGridProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [priceAlertProduct, setPriceAlertProduct] = useState<CatalogProduct | null>(null);
  const [targetPrice, setTargetPrice] = useState('');

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-3 h-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 50) return 'text-green-600 bg-green-50';
    if (margin >= 40) return 'text-blue-600 bg-blue-50';
    if (margin >= 30) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getStockStatus = (stock: number) => {
    if (stock > 100) return { color: 'text-green-600', icon: CheckCircle, text: 'En stock', bg: 'bg-green-50' };
    if (stock > 20) return { color: 'text-orange-600', icon: AlertTriangle, text: 'Stock limité', bg: 'bg-orange-50' };
    return { color: 'text-red-600', icon: AlertTriangle, text: 'Stock faible', bg: 'bg-red-50' };
  };

  const handleBulkImport = () => {
    const selectedProductObjects = products.filter(p => selectedProducts.includes(p.id));
    selectedProductObjects.forEach(product => onImportProduct(product));
    setSelectedProducts([]);
  };

  const handleCreatePriceAlert = () => {
    if (priceAlertProduct && targetPrice) {
      onCreatePriceAlert(priceAlertProduct.id, parseFloat(targetPrice));
      setPriceAlertProduct(null);
      setTargetPrice('');
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="aspect-square bg-muted rounded-lg mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {products.length} produits trouvés
          </p>
          {selectedProducts.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedProducts.length} sélectionnés</Badge>
              <Button size="sm" onClick={handleBulkImport}>
                <Package className="w-4 h-4 mr-2" />
                Importer sélection
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
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

      {/* Products Grid */}
      <div className={`grid gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1'
      }`}>
        {products.map((product) => {
          const stockStatus = getStockStatus(product.stock_quantity);
          const isFavorite = favorites.includes(product.id);
          const isSelected = selectedProducts.includes(product.id);

          return (
            <Card 
              key={product.id} 
              className={`group hover:shadow-lg transition-all duration-200 cursor-pointer ${
                isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
              } ${viewMode === 'list' ? 'flex' : ''}`}
              onClick={() => onProductClick(product)}
            >
              <CardContent className={`p-4 ${viewMode === 'list' ? 'flex gap-4 w-full' : ''}`}>
                {/* Product Image */}
                <div className={`relative ${viewMode === 'list' ? 'w-32 h-32 flex-shrink-0' : 'aspect-square mb-4'}`}>
                  <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <Package className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>

                  {/* Selection Checkbox */}
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-primary"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          setSelectedProducts(prev => [...prev, product.id]);
                        } else {
                          setSelectedProducts(prev => prev.filter(id => id !== product.id));
                        }
                      }}
                    />
                  </div>

                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {product.is_winner && (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-xs shadow-lg">
                        <Crown className="w-3 h-3 mr-1" />
                        Winner
                      </Badge>
                    )}
                    {product.is_trending && (
                      <Badge className="bg-gradient-to-r from-green-400 to-green-500 text-white text-xs shadow-lg">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                    {product.is_best_seller && (
                      <Badge className="bg-gradient-to-r from-purple-400 to-purple-500 text-white text-xs shadow-lg">
                        <Zap className="w-3 h-3 mr-1" />
                        Best
                      </Badge>
                    )}
                  </div>

                  {/* Favorite & Alert Buttons */}
                  <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0 bg-white/90 hover:bg-white shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPriceAlertProduct(product);
                      }}
                    >
                      <Bell className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0 bg-white/90 hover:bg-white shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(product.id);
                      }}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                    </Button>
                  </div>
                </div>

                {/* Product Info */}
                <div className={`space-y-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  {/* Supplier */}
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={product.supplier_logo} />
                      <AvatarFallback className="text-xs">{product.supplier.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground font-medium">{product.supplier}</span>
                    <Badge variant="outline" className="text-xs">{product.category}</Badge>
                  </div>

                  {/* Product Name */}
                  <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
                    {product.name}
                  </h3>

                  {/* Rating & Reviews */}
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(Math.floor(product.rating))}</div>
                    <span className="text-xs text-muted-foreground">
                      {product.rating} ({product.reviews_count})
                    </span>
                  </div>

                  {/* Price & Margin */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-primary">{product.price.toFixed(2)}€</p>
                      {product.cost_price && (
                        <p className="text-xs text-muted-foreground">Coût: {product.cost_price.toFixed(2)}€</p>
                      )}
                    </div>
                    <Badge variant="outline" className={`${getMarginColor(product.margin_percentage)} border-0`}>
                      {product.margin_percentage.toFixed(0)}% marge
                    </Badge>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3 text-muted-foreground" />
                      <span>{product.sales_count} ventes</span>
                    </div>
                    <div className={`flex items-center gap-1 ${stockStatus.color}`}>
                      <stockStatus.icon className="w-3 h-3" />
                      <span>{product.stock_quantity}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3 text-muted-foreground" />
                      <span>{product.delivery_time}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {product.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {product.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{product.tags.length - 3}
                      </Badge>
                    )}
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
                      className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
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

      {/* Price Alert Dialog */}
      <Dialog open={!!priceAlertProduct} onOpenChange={(open) => !open && setPriceAlertProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une alerte prix</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {priceAlertProduct && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <img 
                  src={priceAlertProduct.image_url || '/placeholder.svg'} 
                  alt={priceAlertProduct.name}
                  className="w-12 h-12 object-cover rounded"
                />
                <div>
                  <p className="font-medium">{priceAlertProduct.name}</p>
                  <p className="text-sm text-muted-foreground">Prix actuel: {priceAlertProduct.price.toFixed(2)}€</p>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Prix cible (€)</label>
              <Input
                type="number"
                placeholder="Entrez le prix souhaité"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPriceAlertProduct(null)}>
                Annuler
              </Button>
              <Button className="flex-1" onClick={handleCreatePriceAlert}>
                Créer l'alerte
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load More */}
      {products.length > 0 && products.length % 20 === 0 && (
        <div className="text-center pt-6">
          <Button variant="outline" className="w-48">
            Charger plus de produits
          </Button>
        </div>
      )}
    </div>
  );
};