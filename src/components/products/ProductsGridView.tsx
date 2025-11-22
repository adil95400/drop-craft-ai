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

export function ProductsGridView({
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
              "relative group hover:shadow-md transition-shadow",
              isSelected && "ring-2 ring-primary"
            )}
          >
            {onSelectionChange && (
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                  className="bg-background"
                />
              </div>
            )}

            <CardHeader className="p-0">
              <div 
                className="aspect-square w-full overflow-hidden rounded-t-lg bg-muted cursor-pointer"
                onClick={() => onView(product)}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 
                    className="font-semibold line-clamp-2 cursor-pointer hover:text-primary"
                    onClick={() => onView(product)}
                  >
                    {product.name}
                  </h3>
                  <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                    {product.status}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description || 'Aucune description'}
                </p>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-lg font-bold text-primary">
                    {product.price.toFixed(2)} €
                  </span>
                  {product.sku && (
                    <span className="text-xs text-muted-foreground">
                      SKU: {product.sku}
                    </span>
                  )}
                </div>

                {product.stock_quantity !== undefined && (
                  <div className="text-xs text-muted-foreground">
                    Stock: <span className="font-medium">{product.stock_quantity}</span>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onView(product)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Voir
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(product)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
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
}
