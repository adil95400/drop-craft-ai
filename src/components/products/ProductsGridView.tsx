import { memo } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { UnifiedProduct } from '@/hooks/useUnifiedProducts';
import { Eye, Edit, Trash2, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductsGridViewProps {
  products: UnifiedProduct[];
  onEdit: (product: UnifiedProduct) => void;
  onDelete: (id: string) => void;
  onView: (product: UnifiedProduct) => void;
  selectedProducts?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export const ProductsGridView = memo(function ProductsGridView({
  products,
  onEdit,
  onDelete,
  onView,
  selectedProducts = [],
  onSelectionChange
}: ProductsGridViewProps) {
  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (!onSelectionChange) return;
    
    if (checked) {
      onSelectionChange([...selectedProducts, productId]);
    } else {
      onSelectionChange(selectedProducts.filter(id => id !== productId));
    }
  };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucun produit</h3>
        <p className="text-sm text-muted-foreground">
          Commencez par créer ou importer des produits
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => {
        const isSelected = selectedProducts.includes(product.id);
        const imageUrl = product.image_url;

        return (
          <Card 
            key={product.id}
            className={cn(
              "relative group transition-all duration-300",
              "hover:shadow-xl hover:scale-[1.02]",
              "border-border/50 bg-card/50 backdrop-blur",
              isSelected && "ring-2 ring-primary shadow-lg"
            )}
          >
            {onSelectionChange && (
              <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                  className="bg-background shadow-lg border-2"
                />
              </div>
            )}

            <CardHeader className="p-0">
              <div 
                className="aspect-square w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-muted/50 to-muted cursor-pointer relative group"
                onClick={() => onView(product)}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 
                  className="font-semibold line-clamp-2 cursor-pointer hover:text-primary transition-colors leading-snug"
                  onClick={() => onView(product)}
                >
                  {product.name}
                </h3>
                <Badge 
                  variant={product.status === 'active' ? 'default' : 'secondary'}
                  className="shrink-0"
                >
                  {product.status}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                {product.description || 'Aucune description'}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {product.price.toFixed(2)} €
                </span>
                {product.stock_quantity !== undefined && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{product.stock_quantity}</span> en stock
                  </div>
                )}
              </div>

              {product.sku && (
                <div className="text-xs text-muted-foreground font-mono bg-muted/30 px-2 py-1 rounded">
                  SKU: {product.sku}
                </div>
              )}
            </CardContent>

            <CardFooter className="p-4 pt-0 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 bg-background/50 hover:bg-accent"
                onClick={() => onView(product)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Voir
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-background/50 hover:bg-accent"
                onClick={() => onEdit(product)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="hover:bg-destructive/90"
                onClick={() => {
                  if (confirm('Supprimer ce produit ?')) {
                    onDelete(product.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
});
