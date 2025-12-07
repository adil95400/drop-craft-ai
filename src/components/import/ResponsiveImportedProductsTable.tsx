import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Upload, 
  Check, 
  X,
  ExternalLink,
  Package,
  Loader2
} from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';

interface ImportedProduct {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  image_url?: string;
  source_platform?: string;
  source_url?: string;
  status: string;
  review_status?: string;
  created_at: string;
  sku?: string;
  category?: string;
}

interface ResponsiveImportedProductsTableProps {
  products: ImportedProduct[];
  isLoading?: boolean;
  selectedProducts: string[];
  onSelectionChange: (ids: string[]) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onPublish?: (id: string) => void;
  onEdit?: (product: ImportedProduct) => void;
  onDelete?: (id: string) => void;
  onView?: (product: ImportedProduct) => void;
}

const StatusBadge = ({ status, reviewStatus }: { status: string; reviewStatus?: string }) => {
  if (reviewStatus === 'approved') {
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Approuvé</Badge>;
  }
  if (reviewStatus === 'rejected') {
    return <Badge variant="destructive">Rejeté</Badge>;
  }
  if (status === 'published') {
    return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Publié</Badge>;
  }
  return <Badge variant="secondary">En attente</Badge>;
};

const PlatformBadge = ({ platform }: { platform?: string }) => {
  if (!platform) return null;
  
  const platformColors: Record<string, string> = {
    aliexpress: 'bg-orange-100 text-orange-800',
    amazon: 'bg-yellow-100 text-yellow-800',
    ebay: 'bg-blue-100 text-blue-800',
    etsy: 'bg-purple-100 text-purple-800',
    shopify: 'bg-green-100 text-green-800',
    cjdropshipping: 'bg-indigo-100 text-indigo-800',
  };

  return (
    <Badge 
      variant="outline" 
      className={platformColors[platform.toLowerCase()] || 'bg-muted'}
    >
      {platform}
    </Badge>
  );
};

const ProductImage = ({ src, alt }: { src?: string; alt: string }) => {
  const [error, setError] = useState(false);
  
  if (!src || error) {
    return (
      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
        <Package className="w-5 h-5 text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <img
      src={src}
      alt={alt}
      className="w-12 h-12 object-cover rounded flex-shrink-0"
      onError={() => setError(true)}
      loading="lazy"
    />
  );
};

// Mobile Card View
const MobileProductCard = ({
  product,
  isSelected,
  onSelect,
  onApprove,
  onReject,
  onPublish,
  onEdit,
  onDelete,
  onView
}: {
  product: ImportedProduct;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onPublish?: (id: string) => void;
  onEdit?: (product: ImportedProduct) => void;
  onDelete?: (id: string) => void;
  onView?: (product: ImportedProduct) => void;
}) => (
  <Card className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          className="mt-1"
        />
        <ProductImage src={product.image_url} alt={product.name} />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{product.name}</h4>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="font-semibold text-sm">
              {product.price?.toFixed(2) || '0.00'} €
            </span>
            <StatusBadge status={product.status} reviewStatus={product.review_status} />
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <PlatformBadge platform={product.source_platform} />
            {product.sku && (
              <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onView && (
              <DropdownMenuItem onClick={() => onView(product)}>
                <Eye className="h-4 w-4 mr-2" />
                Voir détails
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
            )}
            {product.source_url && (
              <DropdownMenuItem asChild>
                <a href={product.source_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Voir source
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onApprove && product.review_status !== 'approved' && (
              <DropdownMenuItem onClick={() => onApprove(product.id)}>
                <Check className="h-4 w-4 mr-2 text-green-600" />
                Approuver
              </DropdownMenuItem>
            )}
            {onReject && product.review_status !== 'rejected' && (
              <DropdownMenuItem onClick={() => onReject(product.id)}>
                <X className="h-4 w-4 mr-2 text-orange-600" />
                Rejeter
              </DropdownMenuItem>
            )}
            {onPublish && product.review_status === 'approved' && product.status !== 'published' && (
              <DropdownMenuItem onClick={() => onPublish(product.id)}>
                <Upload className="h-4 w-4 mr-2 text-blue-600" />
                Publier
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem 
                onClick={() => onDelete(product.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardContent>
  </Card>
);

// Loading skeleton
const LoadingSkeleton = ({ isMobile }: { isMobile: boolean }) => {
  if (isMobile) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3 animate-pulse">
                <div className="w-5 h-5 bg-muted rounded" />
                <div className="w-12 h-12 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="w-5 h-5 bg-muted rounded" />
            <div className="w-12 h-12 bg-muted rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/4" />
            </div>
            <div className="h-6 bg-muted rounded w-16" />
            <div className="h-6 bg-muted rounded w-20" />
            <div className="w-8 h-8 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ResponsiveImportedProductsTable: React.FC<ResponsiveImportedProductsTableProps> = ({
  products,
  isLoading = false,
  selectedProducts,
  onSelectionChange,
  onApprove,
  onReject,
  onPublish,
  onEdit,
  onDelete,
  onView
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(products.map(p => p.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedProducts, id]);
    } else {
      onSelectionChange(selectedProducts.filter(pid => pid !== id));
    }
  };

  if (isLoading) {
    return <LoadingSkeleton isMobile={isMobile} />;
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Aucun produit importé</h3>
          <p className="text-sm text-muted-foreground">
            Utilisez l'import par URL ou CSV pour ajouter des produits.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Mobile view
  if (isMobile) {
    return (
      <div className="space-y-3">
        {/* Select all header */}
        <div className="flex items-center gap-2 px-2">
          <Checkbox
            checked={selectedProducts.length === products.length && products.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectedProducts.length > 0 
              ? `${selectedProducts.length} sélectionné(s)`
              : 'Tout sélectionner'
            }
          </span>
        </div>
        
        {products.map(product => (
          <MobileProductCard
            key={product.id}
            product={product}
            isSelected={selectedProducts.includes(product.id)}
            onSelect={(checked) => handleSelectOne(product.id, checked)}
            onApprove={onApprove}
            onReject={onReject}
            onPublish={onPublish}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
          />
        ))}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedProducts.length === products.length && products.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead className="w-16">Image</TableHead>
            <TableHead>Produit</TableHead>
            <TableHead className="w-24">Prix</TableHead>
            <TableHead className="w-28">Plateforme</TableHead>
            <TableHead className="w-28">Statut</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map(product => (
            <TableRow 
              key={product.id}
              className={selectedProducts.includes(product.id) ? 'bg-muted/50' : ''}
            >
              <TableCell>
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={(checked) => handleSelectOne(product.id, checked as boolean)}
                />
              </TableCell>
              <TableCell>
                <ProductImage src={product.image_url} alt={product.name} />
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium truncate max-w-[300px]">{product.name}</p>
                  {product.sku && (
                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="font-semibold">{product.price?.toFixed(2) || '0.00'} €</span>
              </TableCell>
              <TableCell>
                <PlatformBadge platform={product.source_platform} />
              </TableCell>
              <TableCell>
                <StatusBadge status={product.status} reviewStatus={product.review_status} />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onView && (
                      <DropdownMenuItem onClick={() => onView(product)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(product)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                    )}
                    {product.source_url && (
                      <DropdownMenuItem asChild>
                        <a href={product.source_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Voir source
                        </a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {onApprove && product.review_status !== 'approved' && (
                      <DropdownMenuItem onClick={() => onApprove(product.id)}>
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                        Approuver
                      </DropdownMenuItem>
                    )}
                    {onReject && product.review_status !== 'rejected' && (
                      <DropdownMenuItem onClick={() => onReject(product.id)}>
                        <X className="h-4 w-4 mr-2 text-orange-600" />
                        Rejeter
                      </DropdownMenuItem>
                    )}
                    {onPublish && product.review_status === 'approved' && product.status !== 'published' && (
                      <DropdownMenuItem onClick={() => onPublish(product.id)}>
                        <Upload className="h-4 w-4 mr-2 text-blue-600" />
                        Publier
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(product.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
