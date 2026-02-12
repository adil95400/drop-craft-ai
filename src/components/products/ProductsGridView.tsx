import { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Package, Eye, Edit, Trash2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  cost_price?: number;
  stock_quantity?: number;
  status?: string;
  category?: string;
  image_url?: string;
  source?: string;
  description?: string;
  images?: string[];
}

interface ProductsGridViewProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onView: (product: Product) => void;
  selectedProducts?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

function getMargin(p: Product): number | null {
  if (!p.cost_price || !p.price || p.price <= 0) return null;
  return ((p.price - p.cost_price) / p.price) * 100;
}

function getHealthScore(p: Product): number {
  let score = 0;
  if (p.name && p.name.length >= 10) score++;
  if (p.description && p.description.length >= 50) score++;
  if (p.image_url || (p.images && p.images.length > 0)) score++;
  if (p.sku) score++;
  if (p.category) score++;
  if (p.price && p.price > 0) score++;
  return Math.round((score / 6) * 100);
}

export const ProductsGridView = memo(function ProductsGridView({
  products,
  onEdit,
  onDelete,
  onView,
  selectedProducts = [],
  onSelectionChange,
}: ProductsGridViewProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
          <Package className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Aucun produit</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Commencez par créer ou importer des produits pour les voir apparaître ici
        </p>
      </div>
    );
  }

  const handleToggleSelect = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedProducts.includes(id)) {
      onSelectionChange(selectedProducts.filter(pid => pid !== id));
    } else {
      onSelectionChange([...selectedProducts, id]);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {products.map((product) => {
        const isSelected = selectedProducts.includes(product.id);
        const margin = getMargin(product);
        const health = getHealthScore(product);

        return (
          <Card
            key={product.id}
            className={cn(
              "group relative overflow-hidden transition-all duration-200 hover:shadow-lg",
              isSelected && "ring-2 ring-primary shadow-md"
            )}
          >
            {/* Selection checkbox */}
            {onSelectionChange && (
              <div className="absolute top-3 left-3 z-10">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggleSelect(product.id)}
                  className="bg-background/90 shadow-sm border-2 h-5 w-5 data-[state=checked]:bg-primary"
                />
              </div>
            )}

            {/* Quick actions on hover */}
            <div className="absolute top-3 right-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="secondary" size="sm" className="h-7 w-7 p-0 shadow-sm" onClick={() => onView(product)}>
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button variant="secondary" size="sm" className="h-7 w-7 p-0 shadow-sm" onClick={() => onEdit(product)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Image */}
            <div
              className="aspect-square overflow-hidden bg-muted/50 cursor-pointer"
              onClick={() => onView(product)}
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}
            </div>

            <CardContent className="p-3 space-y-2">
              {/* Title */}
              <h4 className="font-medium text-sm line-clamp-2 leading-tight cursor-pointer hover:text-primary transition-colors" onClick={() => onView(product)}>
                {product.name}
              </h4>

              {/* Price + Margin */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">
                  {product.price?.toFixed(2) ?? '0.00'} €
                </span>
                {margin !== null && (
                  <Badge
                    variant={margin >= 30 ? 'success' : margin >= 15 ? 'warning' : 'destructive'}
                    className="text-[10px]"
                  >
                    {margin.toFixed(0)}%
                  </Badge>
                )}
              </div>

              {/* Stock + Status */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge
                  variant={(product.stock_quantity ?? 0) < 10 ? 'destructive' : 'secondary'}
                  className="text-[10px]"
                >
                  Stock: {product.stock_quantity ?? 0}
                </Badge>
                <Badge
                  variant={product.status === 'active' ? 'default' : 'outline'}
                  className="text-[10px]"
                >
                  {product.status === 'active' ? 'Actif' : 'Inactif'}
                </Badge>
              </div>

              {/* Health score bar */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <Progress value={health} className="h-1.5 flex-1" />
                      <span className="text-[10px] text-muted-foreground">{health}%</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Complétude: {health}%</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});
