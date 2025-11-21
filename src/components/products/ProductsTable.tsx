import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Product } from '@/hooks/useRealProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, Upload } from 'lucide-react';

interface ProductsTableProps {
  products: Product[];
  isLoading: boolean;
  selectedProducts: string[];
  onSelectionChange: (ids: string[]) => void;
  onBulkPublish: () => void;
}

export function ProductsTable({
  products,
  isLoading,
  selectedProducts,
  onSelectionChange,
  onBulkPublish
}: ProductsTableProps) {
  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(products.map(p => p.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedProducts.includes(id)) {
      onSelectionChange(selectedProducts.filter(pid => pid !== id));
    } else {
      onSelectionChange([...selectedProducts, id]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedProducts.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedProducts.length} produit(s) sélectionné(s)
          </span>
          <Button onClick={onBulkPublish}>
            <Upload className="h-4 w-4 mr-2" />
            Publier la sélection
          </Button>
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={() => handleSelectOne(product.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.sku}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{product.price?.toFixed(2)} €</p>
                    {product.cost_price && (
                      <p className="text-sm text-muted-foreground">
                        Coût: {product.cost_price.toFixed(2)} €
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={(product.stock_quantity || 0) < 10 ? 'destructive' : 'default'}>
                    {product.stock_quantity || 0}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                    {product.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{product.category || '-'}</span>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucun produit trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
