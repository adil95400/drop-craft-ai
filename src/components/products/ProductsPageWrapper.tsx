import { useState, useMemo, useCallback } from 'react';
import { ProductsGridView } from './ProductsGridView';
import { ProductsTableView } from './ProductsTableView';
import { UnifiedProduct } from '@/hooks/useUnifiedProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutGrid, Table2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductsPageWrapperProps {
  products: UnifiedProduct[];
  onEdit: (product: UnifiedProduct) => void;
  onDelete: (id: string) => void;
  onView: (product: UnifiedProduct) => void;
  onRefresh?: () => void;
  selectedProducts?: string[];
  onSelectionChange?: (selected: string[]) => void;
  showSearch?: boolean;
  showViewToggle?: boolean;
  defaultView?: 'grid' | 'list';
}

/**
 * Wrapper simplifié pour afficher les produits en grille ou tableau
 * Sans boutons en double - les actions principales sont dans ProductsQuickActionsBar
 */
export function ProductsPageWrapper({
  products,
  onEdit,
  onDelete,
  onView,
  onRefresh,
  selectedProducts = [],
  onSelectionChange,
  showSearch = true,
  showViewToggle = true,
  defaultView = 'grid'
}: ProductsPageWrapperProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultView);
  const [localSelectedProducts, setLocalSelectedProducts] = useState<string[]>(selectedProducts);

  const handleSelectionChange = useCallback((newSelection: string[]) => {
    setLocalSelectedProducts(newSelection);
    onSelectionChange?.(newSelection);
  }, [onSelectionChange]);

  // Recherche locale
  const displayedProducts = useMemo(() => {
    if (!searchTerm) return products;
    
    const search = searchTerm.toLowerCase().trim();
    return products.filter(product =>
      product.name.toLowerCase().includes(search) ||
      product.description?.toLowerCase().includes(search) ||
      product.sku?.toLowerCase().includes(search) ||
      product.category?.toLowerCase().includes(search)
    );
  }, [products, searchTerm]);

  const handleClearSelection = useCallback(() => {
    handleSelectionChange([]);
  }, [handleSelectionChange]);

  return (
    <div className="space-y-4">
      {/* Barre de recherche et toggle vue - compacte */}
      {(showSearch || showViewToggle) && (
        <div className="flex items-center gap-3">
          {showSearch && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-9 h-9 bg-background/80"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          
          {showViewToggle && (
            <div className="flex border border-border/50 rounded-lg overflow-hidden bg-background/80">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={cn("rounded-none h-9 w-9 p-0", viewMode === 'grid' && "shadow-sm")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={cn("rounded-none h-9 w-9 p-0", viewMode === 'list' && "shadow-sm")}
              >
                <Table2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {displayedProducts.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {displayedProducts.length} produit{displayedProducts.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Vue grille ou tableau */}
      {viewMode === 'grid' ? (
        <ProductsGridView
          products={displayedProducts}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          selectedProducts={localSelectedProducts}
          onSelectionChange={handleSelectionChange}
        />
      ) : (
        <ProductsTableView
          products={displayedProducts}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          onBulkDelete={(ids) => {
            ids.forEach(id => onDelete(id));
            handleClearSelection();
            onRefresh?.();
          }}
          onBulkEdit={() => { /* TODO: bulk edit modal */ }}
          onProductUpdate={onRefresh}
        />
      )}
    </div>
  );
}
