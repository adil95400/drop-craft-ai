import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductActionsBar } from './ProductActionsBar';
import { ProductBulkOperations } from './ProductBulkOperations';
import { ProductsTableView } from './ProductsTableView';
import { ProductsGridView } from './ProductsGridView';
import { UnifiedProduct } from '@/hooks/useUnifiedProducts';
import { FilterState } from '@/hooks/useProductFilters';
import { useProductActions } from '@/hooks/useProductActions';

interface ProductsPageWrapperProps {
  products: UnifiedProduct[];
  allProducts?: UnifiedProduct[];
  onEdit: (product: UnifiedProduct) => void;
  onDelete: (id: string) => void;
  onView: (product: UnifiedProduct) => void;
  onRefresh?: () => void;
  filters?: FilterState;
  categories?: string[];
  onFilterChange?: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
  onSelectionChange?: (selected: string[]) => void;
  selectedProducts?: string[];
  isLoading?: boolean;
}

/**
 * Wrapper complet pour la page produits avec toutes les actions connectées
 * Gère la recherche, le tri, les filtres, la pagination et les actions en masse
 */
export function ProductsPageWrapper({
  products,
  allProducts = products,
  onEdit,
  onDelete,
  onView,
  onRefresh,
  filters,
  categories = [],
  onFilterChange,
  onResetFilters,
  hasActiveFilters = false,
  onSelectionChange,
  selectedProducts = [],
  isLoading = false
}: ProductsPageWrapperProps) {
  const [searchTerm, setSearchTerm] = useState(filters?.search || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [localSelectedProducts, setLocalSelectedProducts] = useState<string[]>(selectedProducts || []);
  
  const { handleImport, handleExport, isExporting } = useProductActions();
  const navigate = useNavigate();

  // Sync local selection with parent
  const handleSelectionChange = useCallback((newSelection: string[]) => {
    setLocalSelectedProducts(newSelection);
    onSelectionChange?.(newSelection);
  }, [onSelectionChange]);

  // Recherche locale rapide avec debounce implicite via useMemo
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

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    if (onFilterChange) {
      onFilterChange('search', value);
    }
  }, [onFilterChange]);

  const handleSortChange = useCallback((value: string) => {
    // Format: field_order (ex: created_at_desc, name_asc)
    const parts = value.split('_');
    const order = parts.pop() as 'asc' | 'desc';
    const field = parts.join('_');
    
    if (onFilterChange) {
      onFilterChange('sortBy', field as any);
      onFilterChange('sortOrder', order);
    }
  }, [onFilterChange]);

  const handleCreateNew = useCallback(() => {
    navigate('/products/create');
  }, [navigate]);

  const handleExportClick = useCallback(async () => {
    await handleExport(localSelectedProducts.length > 0 ? localSelectedProducts : undefined);
  }, [handleExport, localSelectedProducts]);

  const handleClearSelection = useCallback(() => {
    handleSelectionChange([]);
  }, [handleSelectionChange]);

  return (
    <div className="space-y-6">
      <ProductActionsBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        selectedCount={localSelectedProducts.length}
        totalCount={displayedProducts.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateNew={handleCreateNew}
        onImport={handleImport}
        onExport={handleExportClick}
        onRefresh={onRefresh}
        categories={categories}
        onCategoryChange={(cat) => onFilterChange?.('category', cat)}
        onStatusChange={(status) => onFilterChange?.('status', status as any)}
        onSortChange={handleSortChange}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={onResetFilters}
        isLoading={isLoading}
      />

      {localSelectedProducts.length > 0 && (
        <ProductBulkOperations
          selectedProducts={localSelectedProducts}
          onClearSelection={handleClearSelection}
        />
      )}

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
          onBulkEdit={(ids) => {
            // Naviguer vers l'édition en masse
            navigate(`/products/bulk-edit?ids=${ids.join(',')}`);
          }}
          onProductUpdate={onRefresh}
        />
      )}
    </div>
  );
}
