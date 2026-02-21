import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  ImageIcon,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
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
  description?: string;
  seo_title?: string;
  seo_description?: string;
  images?: string[];
  brand?: string;
  variants?: any[];
}

type SortField = 'name' | 'price' | 'stock_quantity' | 'margin' | 'created_at';
type SortDirection = 'asc' | 'desc';

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
  sortField?: SortField;
  sortDirection?: SortDirection;
  onSort?: (field: SortField) => void;
}

// Helper: compute margin
function getMargin(product: Product): number | null {
  if (!product.cost_price || !product.price || product.price <= 0) return null;
  return ((product.price - product.cost_price) / product.price) * 100;
}

// Helper: compute health score (0-100)
function getHealthScore(product: Product): number {
  let score = 0;
  const total = 6;
  if (product.name && product.name.length >= 10) score++;
  if (product.description && product.description.length >= 50) score++;
  if (product.image_url || (product.images && product.images.length > 0)) score++;
  if (product.sku) score++;
  if (product.category) score++;
  if (product.price && product.price > 0) score++;
  return Math.round((score / total) * 100);
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

// Sortable header component
function SortableHeader({ 
  label, field, currentField, direction, onSort, className 
}: { 
  label: string; 
  field: SortField; 
  currentField?: SortField; 
  direction?: SortDirection; 
  onSort?: (field: SortField) => void;
  className?: string;
}) {
  const isActive = currentField === field;
  return (
    <TableHead 
      className={cn("cursor-pointer select-none hover:text-foreground transition-colors", className)}
      onClick={() => onSort?.(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    </TableHead>
  );
}

// Margin badge component
function MarginBadge({ product }: { product: Product }) {
  const margin = getMargin(product);
  if (margin === null) return <span className="text-xs text-muted-foreground">—</span>;
  
  const variant = margin >= 30 ? 'success' : margin >= 15 ? 'warning' : 'destructive';
  const profit = (product.price || 0) - (product.cost_price || 0);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="text-xs font-medium">
            {margin.toFixed(0)}%
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Profit: {profit.toFixed(2)} € / vente</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Health score mini indicator
function HealthIndicator({ product }: { product: Product }) {
  const score = getHealthScore(product);
  const color = score >= 80 ? 'bg-primary' : score >= 50 ? 'bg-accent-foreground' : 'bg-destructive';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <div className="w-8">
              <Progress value={score} className="h-1.5" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">{score}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Complétude: {score}%</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
}: Omit<ResponsiveProductsTableProps, 'isLoading' | 'onBulkPublish' | 'sortField' | 'sortDirection' | 'onSort'>) {
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
      {products.map((product) => {
        const margin = getMargin(product);
        return (
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
                    {/* Quick Actions Inline */}
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onView?.(product)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit?.(product)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Prix, Marge et Stock */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="font-semibold text-sm">
                      {product.price?.toFixed(2) ?? '0.00'} €
                    </span>
                    {margin !== null && (
                      <MarginBadge product={product} />
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
                      variant={product.status === 'active' ? 'default' : product.status === 'draft' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {product.status === 'active' ? 'Actif' : 
                       product.status === 'draft' ? 'Brouillon' : 
                       product.status === 'paused' ? 'En pause' : 
                       product.status === 'archived' ? 'Archivé' : 'Inactif'}
                    </Badge>
                    <HealthIndicator product={product} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
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
  onDuplicate,
  sortField,
  sortDirection,
  onSort
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
            <SortableHeader label="Produit" field="name" currentField={sortField} direction={sortDirection} onSort={onSort} />
            <SortableHeader label="Prix" field="price" currentField={sortField} direction={sortDirection} onSort={onSort} className="text-right" />
            <SortableHeader label="Marge" field="margin" currentField={sortField} direction={sortDirection} onSort={onSort} className="text-center" />
            <SortableHeader label="Stock" field="stock_quantity" currentField={sortField} direction={sortDirection} onSort={onSort} className="text-center" />
            <TableHead className="text-center">Statut</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Marque</TableHead>
            <TableHead className="text-center">Variantes</TableHead>
            <TableHead className="text-center">Santé</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="w-28 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow 
              key={product.id}
              className={cn(
                "transition-colors group",
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
              {/* Feature #1: Margin Column */}
              <TableCell className="text-center">
                <MarginBadge product={product} />
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={(product.stock_quantity ?? 0) < 10 ? 'destructive' : 'secondary'}>
                  {product.stock_quantity ?? 0}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={
                  product.status === 'active' ? 'default' : 
                  product.status === 'draft' ? 'secondary' : 
                  product.status === 'paused' ? 'outline' :
                  product.status === 'archived' ? 'outline' : 'outline'
                }>
                  {product.status === 'active' ? 'Actif' : 
                   product.status === 'draft' ? 'Brouillon' : 
                   product.status === 'paused' ? 'En pause' :
                   product.status === 'archived' ? 'Archivé' : 'Inactif'}
                </Badge>
              </TableCell>
              {/* Category */}
              <TableCell>
                {product.category ? (
                  <Badge variant="outline" className="text-xs">{product.category}</Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              {/* Brand */}
              <TableCell>
                {product.brand ? (
                  <span className="text-sm font-medium truncate max-w-[100px] block">{product.brand}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              {/* Variants count */}
              <TableCell className="text-center">
                <span className="text-sm text-muted-foreground">
                  {product.variants?.length || 0}
                </span>
              </TableCell>
              {/* Health Score */}
              <TableCell className="text-center">
                <HealthIndicator product={product} />
              </TableCell>
              <TableCell>
                {product.source ? (
                  <Badge variant="outline" className="text-xs capitalize">{product.source}</Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              {/* Feature #7: Inline Quick Actions + menu */}
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button 
                    variant="ghost" size="sm" 
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onView?.(product)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" size="sm" 
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onEdit?.(product)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
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
                </div>
              </TableCell>
            </TableRow>
          ))}
          {products.length === 0 && (
            <TableRow>
              <TableCell colSpan={12} className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground font-medium">Aucun produit trouvé</p>
                <p className="text-sm text-muted-foreground mt-1">Importez vos premiers produits ou ajustez vos filtres</p>
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
  onDuplicate,
  sortField,
  sortDirection,
  onSort
}: ResponsiveProductsTableProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Loading state
  if (isLoading) {
    return isMobile ? <MobileCardSkeleton /> : <TableSkeleton />;
  }

  return (
    <div>
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
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
        />
      )}
    </div>
  );
}
