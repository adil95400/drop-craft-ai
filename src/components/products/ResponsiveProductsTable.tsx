import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Upload, 
  Edit, 
  Trash2, 
  Eye, 
  Copy, 
  ExternalLink,
  Package,
  ImageIcon
} from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';
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
}

interface ResponsiveProductsTableProps {
  products: Product[];
  isLoading?: boolean;
  selectedProducts?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onBulkPublish?: () => void;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onView?: (product: Product) => void;
  onDuplicate?: (product: Product) => void;
}

// Composant Image avec lazy loading
function LazyProductImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={cn("flex items-center justify-center bg-muted rounded", className)}>
        <Package className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded animate-pulse">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          "rounded object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
      />
    </div>
  );
}

// Menu contextuel pour les actions
function ProductActionMenu({ 
  product, 
  onEdit, 
  onDelete, 
  onView, 
  onDuplicate 
}: { 
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onView?: (product: Product) => void;
  onDuplicate?: (product: Product) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Menu actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onView?.(product)}>
          <Eye className="h-4 w-4 mr-2" />
          Voir détails
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit?.(product)}>
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate?.(product)}>
          <Copy className="h-4 w-4 mr-2" />
          Dupliquer
        </DropdownMenuItem>
        {product.source === 'shopify' && (
          <DropdownMenuItem asChild>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir sur Shopify
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => onDelete?.(product.id)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Skeleton pour le chargement
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-12 w-12 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}

function MobileCardSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Skeleton className="h-16 w-16 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Vue mobile en cards
function MobileCardView({
  products,
  selectedProducts = [],
  onSelectionChange,
  onEdit,
  onDelete,
  onView,
  onDuplicate
}: Omit<ResponsiveProductsTableProps, 'isLoading' | 'onBulkPublish'>) {
  const handleToggleSelect = (id: string) => {
    if (!onSelectionChange) return;
    
    if (selectedProducts.includes(id)) {
      onSelectionChange(selectedProducts.filter(pid => pid !== id));
    } else {
      onSelectionChange([...selectedProducts, id]);
    }
  };

  if (products.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Aucun produit trouvé</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <Card 
          key={product.id}
          className={cn(
            "transition-all duration-200",
            selectedProducts.includes(product.id) && "ring-2 ring-primary bg-primary/5"
          )}
        >
          <CardContent className="p-3">
            <div className="flex gap-3">
              {/* Checkbox et Image */}
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={() => handleToggleSelect(product.id)}
                  className="mt-1"
                />
                <LazyProductImage
                  src={product.image_url}
                  alt={product.name}
                  className="h-16 w-16 flex-shrink-0"
                />
              </div>

              {/* Infos produit */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm truncate">{product.name}</h4>
                    {product.sku && (
                      <p className="text-xs text-muted-foreground truncate">SKU: {product.sku}</p>
                    )}
                  </div>
                  <ProductActionMenu
                    product={product}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onView={onView}
                    onDuplicate={onDuplicate}
                  />
                </div>

                {/* Prix et Stock */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="font-semibold text-sm">
                    {product.price?.toFixed(2) ?? '0.00'} €
                  </span>
                  {product.cost_price && (
                    <span className="text-xs text-muted-foreground">
                      (Coût: {product.cost_price.toFixed(2)} €)
                    </span>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <Badge 
                    variant={(product.stock_quantity ?? 0) < 10 ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    Stock: {product.stock_quantity ?? 0}
                  </Badge>
                  <Badge 
                    variant={product.status === 'active' ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {product.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                  {product.category && (
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Vue desktop en tableau
function DesktopTableView({
  products,
  selectedProducts = [],
  onSelectionChange,
  onEdit,
  onDelete,
  onView,
  onDuplicate
}: Omit<ResponsiveProductsTableProps, 'isLoading' | 'onBulkPublish'>) {
  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    if (selectedProducts.length === products.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(products.map(p => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (!onSelectionChange) return;
    
    if (selectedProducts.includes(id)) {
      onSelectionChange(selectedProducts.filter(pid => pid !== id));
    } else {
      onSelectionChange([...selectedProducts, id]);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12">
              <Checkbox
                checked={selectedProducts.length === products.length && products.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Produit</TableHead>
            <TableHead className="text-right">Prix</TableHead>
            <TableHead className="text-center">Stock</TableHead>
            <TableHead className="text-center">Statut</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow 
              key={product.id}
              className={cn(
                "transition-colors",
                selectedProducts.includes(product.id) && "bg-primary/5"
              )}
            >
              <TableCell>
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={() => handleToggleSelect(product.id)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <LazyProductImage
                    src={product.image_url}
                    alt={product.name}
                    className="h-10 w-10"
                  />
                  <div className="min-w-0">
                    <p className="font-medium truncate max-w-[200px]">{product.name}</p>
                    {product.sku && (
                      <p className="text-sm text-muted-foreground truncate">{product.sku}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div>
                  <p className="font-medium">{product.price?.toFixed(2) ?? '0.00'} €</p>
                  {product.cost_price && (
                    <p className="text-sm text-muted-foreground">
                      Coût: {product.cost_price.toFixed(2)} €
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={(product.stock_quantity ?? 0) < 10 ? 'destructive' : 'secondary'}>
                  {product.stock_quantity ?? 0}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={product.status === 'active' ? 'default' : 'outline'}>
                  {product.status === 'active' ? 'Actif' : 'Inactif'}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {product.category || '-'}
                </span>
              </TableCell>
              <TableCell>
                <ProductActionMenu
                  product={product}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onView={onView}
                  onDuplicate={onDuplicate}
                />
              </TableCell>
            </TableRow>
          ))}
          {products.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Aucun produit trouvé</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function ResponsiveProductsTable({
  products,
  isLoading = false,
  selectedProducts = [],
  onSelectionChange,
  onBulkPublish,
  onEdit,
  onDelete,
  onView,
  onDuplicate
}: ResponsiveProductsTableProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Loading state
  if (isLoading) {
    return isMobile ? <MobileCardSkeleton /> : <TableSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Barre d'actions bulk */}
      {selectedProducts.length > 0 && (
        <div className="flex items-center justify-between p-3 sm:p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">
            {selectedProducts.length} produit(s) sélectionné(s)
          </span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onSelectionChange?.([])}
            >
              Annuler
            </Button>
            {onBulkPublish && (
              <Button size="sm" onClick={onBulkPublish}>
                <Upload className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Publier</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Vue adaptative */}
      {isMobile ? (
        <MobileCardView
          products={products}
          selectedProducts={selectedProducts}
          onSelectionChange={onSelectionChange}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          onDuplicate={onDuplicate}
        />
      ) : (
        <DesktopTableView
          products={products}
          selectedProducts={selectedProducts}
          onSelectionChange={onSelectionChange}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          onDuplicate={onDuplicate}
        />
      )}
    </div>
  );
}
