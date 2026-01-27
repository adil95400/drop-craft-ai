import { memo, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { UnifiedProduct } from '@/hooks/useUnifiedProducts';
import { EnhancedProductCard } from './EnhancedProductCard';
import { ProductsPagination } from './ProductsPagination';
import { ProductViewModal } from '@/components/modals/ProductViewModal';
import { Package } from 'lucide-react';
import { ViewMode } from './command-center';

interface ProductsGridViewProps {
  products: UnifiedProduct[];
  onEdit: (product: UnifiedProduct) => void;
  onDelete: (id: string) => void;
  onView: (product: UnifiedProduct) => void;
  selectedProducts?: string[];
  onSelectionChange?: (ids: string[]) => void;
  itemsPerPage?: number;
  viewMode?: ViewMode;
}

export const ProductsGridView = memo(function ProductsGridView({
  products,
  onEdit,
  onDelete,
  onView,
  selectedProducts = [],
  onSelectionChange,
  itemsPerPage: initialItemsPerPage = 24,
  viewMode = 'standard'
}: ProductsGridViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [viewModalProduct, setViewModalProduct] = useState<UnifiedProduct | null>(null);

  // Pagination
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = products.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (!onSelectionChange) return;
    
    if (checked) {
      onSelectionChange([...selectedProducts, productId]);
    } else {
      onSelectionChange(selectedProducts.filter(id => id !== productId));
    }
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    const currentPageIds = paginatedProducts.map(p => p.id);
    const allSelected = currentPageIds.every(id => selectedProducts.includes(id));
    
    if (allSelected) {
      onSelectionChange(selectedProducts.filter(id => !currentPageIds.includes(id)));
    } else {
      const newSelection = [...new Set([...selectedProducts, ...currentPageIds])];
      onSelectionChange(newSelection);
    }
  };

  const handleViewProduct = (product: UnifiedProduct) => {
    setViewModalProduct(product);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const currentPageIds = paginatedProducts.map(p => p.id);
  const allCurrentSelected = currentPageIds.every(id => selectedProducts.includes(id));
  const someCurrentSelected = currentPageIds.some(id => selectedProducts.includes(id));

  return (
    <div className="space-y-4">
      {/* Sélection en masse de la page */}
      {onSelectionChange && (
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={allCurrentSelected}
              onCheckedChange={handleSelectAll}
              className="data-[state=indeterminate]:bg-primary"
              {...(someCurrentSelected && !allCurrentSelected ? { 'data-state': 'indeterminate' } : {})}
            />
            <span className="text-sm text-muted-foreground">
              {allCurrentSelected 
                ? `Tous sélectionnés (${currentPageIds.length})`
                : someCurrentSelected
                  ? `${selectedProducts.filter(id => currentPageIds.includes(id)).length} sélectionné(s)`
                  : 'Sélectionner tout'
              }
            </span>
          </div>
          {selectedProducts.length > 0 && (
            <Badge variant="secondary">
              {selectedProducts.length} au total
            </Badge>
          )}
        </div>
      )}

      {/* Grille de produits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {paginatedProducts.map((product) => {
          const isSelected = selectedProducts.includes(product.id);
          const uniqueKey = `${product.source}-${product.id}`;

          return (
            <EnhancedProductCard
              key={uniqueKey}
              product={product}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={handleViewProduct}
              isSelected={isSelected}
              onSelectChange={(checked) => handleSelectProduct(product.id, checked)}
              showSelection={!!onSelectionChange}
              viewMode={viewMode}
            />
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <ProductsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={products.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={(items) => {
            setItemsPerPage(items);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Modal de visualisation */}
      <ProductViewModal
        open={!!viewModalProduct}
        onOpenChange={(open) => !open && setViewModalProduct(null)}
        product={viewModalProduct}
        onEdit={() => {
          if (viewModalProduct) {
            onEdit(viewModalProduct);
            setViewModalProduct(null);
          }
        }}
        onDelete={() => {
          if (viewModalProduct) {
            onDelete(viewModalProduct.id);
            setViewModalProduct(null);
          }
        }}
      />
    </div>
  );
});
