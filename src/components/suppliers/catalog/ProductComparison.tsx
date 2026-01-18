/**
 * ProductComparison - Modal de comparaison de produits
 * Permet de comparer jusqu'à 4 produits côte à côte
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  ShoppingCart,
  Crown,
  TrendingUp,
  Sparkles,
  Star,
  Truck,
  Package,
  DollarSign,
  BarChart3,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CatalogProduct } from './CatalogProductCard';

interface ProductComparisonProps {
  products: CatalogProduct[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: (id: string) => void;
  onImport: (id: string) => void;
  isImporting?: boolean;
}

export const ProductComparison = memo(function ProductComparison({
  products,
  open,
  onOpenChange,
  onRemove,
  onImport,
  isImporting,
}: ProductComparisonProps) {
  if (products.length === 0) return null;

  // Find best values for highlighting
  const bestPrice = Math.min(...products.map(p => p.retail_price));
  const bestCost = Math.min(...products.map(p => p.cost_price));
  const bestMargin = Math.max(...products.map(p => p.profit_margin));
  const bestScore = Math.max(...products.map(p => p.ai_score));
  const bestStock = Math.max(...products.map(p => p.stock_quantity));
  const bestRating = Math.max(...products.map(p => p.rating));
  const bestSales = Math.max(...products.map(p => p.orders_count));

  const getScoreColor = (score: number) => {
    const percent = score * 100;
    if (percent >= 80) return 'text-emerald-500';
    if (percent >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const CompareRow = ({ 
    label, 
    icon: Icon, 
    values, 
    bestValue, 
    format = 'default',
    higherIsBetter = true 
  }: { 
    label: string; 
    icon: React.ElementType;
    values: (string | number)[];
    bestValue: number;
    format?: 'price' | 'percent' | 'score' | 'number' | 'default';
    higherIsBetter?: boolean;
  }) => (
    <div className="grid gap-4" style={{ gridTemplateColumns: `150px repeat(${products.length}, 1fr)` }}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {values.map((value, idx) => {
        const numValue = typeof value === 'number' ? value : parseFloat(value as string);
        const isBest = higherIsBetter ? numValue >= bestValue : numValue <= bestValue;
        
        let displayValue = value;
        if (format === 'price') displayValue = `${numValue.toFixed(2)}€`;
        else if (format === 'percent') displayValue = `${numValue.toFixed(1)}%`;
        else if (format === 'score') displayValue = `${Math.round(numValue * 100)}%`;
        else if (format === 'number') displayValue = numValue.toLocaleString();

        return (
          <div
            key={idx}
            className={cn(
              "text-center py-2 px-3 rounded-lg font-medium",
              isBest ? "bg-emerald-500/10 text-emerald-600" : "bg-muted/50"
            )}
          >
            {displayValue}
            {isBest && <CheckCircle className="h-3 w-3 inline-block ml-1" />}
          </div>
        );
      })}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Comparaison de produits ({products.length})
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 p-4">
            {/* Product Headers */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `150px repeat(${products.length}, 1fr)` }}>
              <div />
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative text-center"
                >
                  <button
                    onClick={() => onRemove(product.id)}
                    className="absolute -top-2 -right-2 p-1 bg-muted rounded-full hover:bg-destructive/20 transition-colors z-10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="relative mx-auto w-24 h-24 rounded-lg overflow-hidden mb-3 border">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {product.is_winner && (
                      <Badge className="absolute top-1 left-1 bg-amber-500 text-white text-[10px] px-1">
                        <Crown className="h-2.5 w-2.5 mr-0.5" />
                        Winner
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm line-clamp-2 mb-1">{product.name}</h4>
                  <p className="text-xs text-muted-foreground">{product.supplier_name}</p>
                  <div className="flex gap-1 justify-center mt-2">
                    {product.is_winner && (
                      <Badge variant="outline" className="text-[10px]">
                        <Crown className="h-2.5 w-2.5 mr-0.5 text-amber-500" />
                        Winner
                      </Badge>
                    )}
                    {product.is_trending && (
                      <Badge variant="outline" className="text-[10px]">
                        <TrendingUp className="h-2.5 w-2.5 mr-0.5 text-purple-500" />
                        Trend
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3">
              <h5 className="font-semibold text-sm text-muted-foreground">Prix et Marges</h5>
              <CompareRow
                label="Prix de vente"
                icon={DollarSign}
                values={products.map(p => p.retail_price)}
                bestValue={bestPrice}
                format="price"
                higherIsBetter={false}
              />
              <CompareRow
                label="Prix d'achat"
                icon={DollarSign}
                values={products.map(p => p.cost_price)}
                bestValue={bestCost}
                format="price"
                higherIsBetter={false}
              />
              <CompareRow
                label="Marge"
                icon={BarChart3}
                values={products.map(p => p.profit_margin)}
                bestValue={bestMargin}
                format="percent"
              />
            </div>

            <div className="border-t pt-4 space-y-3">
              <h5 className="font-semibold text-sm text-muted-foreground">Performance</h5>
              <CompareRow
                label="Score IA"
                icon={Sparkles}
                values={products.map(p => p.ai_score)}
                bestValue={bestScore}
                format="score"
              />
              <CompareRow
                label="Note"
                icon={Star}
                values={products.map(p => p.rating.toFixed(1))}
                bestValue={bestRating}
              />
              <CompareRow
                label="Ventes"
                icon={BarChart3}
                values={products.map(p => p.orders_count)}
                bestValue={bestSales}
                format="number"
              />
            </div>

            <div className="border-t pt-4 space-y-3">
              <h5 className="font-semibold text-sm text-muted-foreground">Logistique</h5>
              <CompareRow
                label="Stock"
                icon={Package}
                values={products.map(p => p.stock_quantity)}
                bestValue={bestStock}
                format="number"
              />
              
              {/* Delivery time row */}
              <div className="grid gap-4" style={{ gridTemplateColumns: `150px repeat(${products.length}, 1fr)` }}>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  <span className="text-sm font-medium">Livraison</span>
                </div>
                {products.map((product) => (
                  <div key={product.id} className="text-center py-2 px-3 rounded-lg bg-muted/50 text-sm">
                    {product.delivery_time || product.shipping_time}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t pt-4">
              <div className="grid gap-4" style={{ gridTemplateColumns: `150px repeat(${products.length}, 1fr)` }}>
                <div />
                {products.map((product) => (
                  <Button
                    key={product.id}
                    onClick={() => onImport(product.id)}
                    disabled={isImporting}
                    className="w-full"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Importer
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
});
