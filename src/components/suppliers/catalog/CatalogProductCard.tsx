/**
 * CatalogProductCard - Carte produit optimisée pour le catalogue
 * Design moderne avec prix d'achat/vente, marge, score IA
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  ShoppingCart,
  Eye,
  Heart,
  Crown,
  Sparkles,
  TrendingUp,
  Package,
  AlertTriangle,
  CheckCircle,
  Truck,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  supplier_name: string;
  supplier_id: string;
  connector_id?: string;
  cost_price: number;
  retail_price: number;
  profit: number;
  profit_margin: number;
  stock_quantity: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  ai_score: number;
  image_url: string;
  images: string[];
  category: string;
  brand: string;
  currency: string;
  shipping_time: string;
  rating: number;
  orders_count: number;
  sku: string;
  is_winner: boolean;
  is_trending: boolean;
  status: 'active' | 'inactive' | 'draft';
  delivery_time?: string;
  supplier_rating?: number;
}

interface ConnectorInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface CatalogProductCardProps {
  product: CatalogProduct;
  connector?: ConnectorInfo;
  isSelected: boolean;
  isFavorite: boolean;
  viewMode: 'grid' | 'list';
  onSelect: (id: string) => void;
  onFavorite: (id: string) => void;
  onImport: (id: string) => void;
  onView: (product: CatalogProduct) => void;
  isImporting?: boolean;
}

export const CatalogProductCard = memo(function CatalogProductCard({
  product,
  connector,
  isSelected,
  isFavorite,
  viewMode,
  onSelect,
  onFavorite,
  onImport,
  onView,
  isImporting
}: CatalogProductCardProps) {
  const aiScorePercent = Math.round(product.ai_score * 100);
  
  const getStockConfig = (status: string) => {
    switch (status) {
      case 'in_stock':
        return { 
          label: 'En stock', 
          color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
          icon: CheckCircle 
        };
      case 'low_stock':
        return { 
          label: 'Stock faible', 
          color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
          icon: AlertTriangle 
        };
      default:
        return { 
          label: 'Rupture', 
          color: 'bg-red-500/10 text-red-600 border-red-500/20',
          icon: Package 
        };
    }
  };

  const stockConfig = getStockConfig(product.stock_status);
  const StockIcon = stockConfig.icon;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full"
      >
        <Card className={cn(
          "overflow-hidden hover:shadow-lg transition-all duration-200 border-border/50",
          isSelected && "ring-2 ring-primary border-primary/50"
        )}>
          <div className="flex items-center gap-4 p-4">
            {/* Checkbox */}
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(product.id)}
            />

            {/* Image */}
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              {product.is_winner && (
                <div className="absolute top-1 left-1">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-1 rounded-full">
                    <Crown className="h-3 w-3" />
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Truck className="h-3 w-3" />
                    <span className="truncate">{product.supplier_name}</span>
                    {connector && (
                      <>
                        <span>•</span>
                        <span>{connector.icon} {connector.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <Badge className={stockConfig.color}>
                  <StockIcon className="h-3 w-3 mr-1" />
                  {product.stock_quantity}
                </Badge>
              </div>
            </div>

            {/* Prices */}
            <div className="text-right shrink-0">
              <div className="text-lg font-bold text-primary">{product.retail_price.toFixed(2)}€</div>
              <div className="text-sm text-muted-foreground">Achat: {product.cost_price.toFixed(2)}€</div>
              <Badge className="bg-emerald-500/10 text-emerald-600 mt-1">
                +{product.profit.toFixed(2)}€ ({product.profit_margin.toFixed(0)}%)
              </Badge>
            </div>

            {/* Score */}
            <div className="w-20 shrink-0">
              <div className="flex items-center justify-between mb-1">
                <Sparkles className={cn("h-4 w-4", getScoreColor(aiScorePercent))} />
                <span className={cn("text-sm font-bold", getScoreColor(aiScorePercent))}>
                  {aiScorePercent}%
                </span>
              </div>
              <Progress 
                value={aiScorePercent} 
                className="h-1.5"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onFavorite(product.id);
                }}
              >
                <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onView(product)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => onImport(product.id)}
                disabled={isImporting}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Importer
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Grid Mode
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        "group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30 h-full",
        isSelected && "ring-2 ring-primary border-primary/50"
      )}>
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {/* Checkbox */}
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(product.id)}
              className="bg-background/90 backdrop-blur-sm"
            />
          </div>

          {/* Image */}
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
          
          {/* Badges overlay */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end">
            {product.is_winner && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
                <Crown className="h-3 w-3 mr-1" />
                Winner
              </Badge>
            )}
            {product.is_trending && !product.is_winner && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                <TrendingUp className="h-3 w-3 mr-1" />
                Tendance
              </Badge>
            )}
            {connector && (
              <Badge className={cn("text-xs shadow-sm", connector.color)}>
                {connector.icon} {connector.name}
              </Badge>
            )}
          </div>

          {/* Score Badge */}
          <div className="absolute bottom-2 left-2">
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold",
              "bg-background/90 backdrop-blur-sm border border-border/50 shadow-sm"
            )}>
              <Sparkles className={cn("h-3.5 w-3.5", getScoreColor(aiScorePercent))} />
              <span className={getScoreColor(aiScorePercent)}>{aiScorePercent}%</span>
            </div>
          </div>

          {/* Favorite button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(product.id);
            }}
            className={cn(
              "absolute bottom-2 right-2 p-2 rounded-full transition-all duration-200",
              "bg-background/90 backdrop-blur-sm border border-border/50 shadow-sm",
              "hover:scale-110 hover:bg-background",
              isFavorite && "bg-red-50 border-red-200"
            )}
          >
            <Heart className={cn(
              "h-4 w-4 transition-colors",
              isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-500"
            )} />
          </button>
        </div>

        {/* Content */}
        <CardContent className="p-4 space-y-3">
          {/* Title & Supplier */}
          <div>
            <h3 className="font-semibold text-foreground line-clamp-2 text-sm leading-tight mb-1">
              {product.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Truck className="h-3 w-3" />
              <span className="truncate">{product.supplier_name}</span>
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-primary/5 rounded-lg p-2">
              <div className="text-xs text-muted-foreground">Vente</div>
              <div className="text-lg font-bold text-primary">{product.retail_price.toFixed(2)}€</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="text-xs text-muted-foreground">Achat</div>
              <div className="text-sm font-semibold">{product.cost_price.toFixed(2)}€</div>
            </div>
          </div>

          {/* Margin & Stock */}
          <div className="flex items-center justify-between">
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
              +{product.profit.toFixed(2)}€ • {product.profit_margin.toFixed(0)}%
            </Badge>
            <Badge className={cn(stockConfig.color, "text-xs")}>
              <StockIcon className="h-3 w-3 mr-1" />
              {product.stock_quantity}
            </Badge>
          </div>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-medium">{product.rating.toFixed(1)}</span>
              <span>• {product.orders_count} ventes</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => onImport(product.id)}
              disabled={isImporting}
            >
              <ShoppingCart className="h-4 w-4" />
              Importer
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => onView(product)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
