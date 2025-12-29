import { useState, useMemo } from 'react';
import { ProductActionsBar } from './ProductActionsBar';
import { ProductBulkOperations } from './ProductBulkOperations';
import { ProductsTableView } from './ProductsTableView';
import { ProductsGridView } from './ProductsGridView';
import { UnifiedProduct } from '@/hooks/useUnifiedProducts';
import { FilterState } from '@/hooks/useProductFilters';
import { useProductActions } from '@/hooks/useProductActions';
import { useModals } from '@/hooks/useModals';
import { useBulkOperations } from '@/hooks/useBulkOperations';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
}

/**
 * Wrapper complet pour la page produits avec toutes les actions connectées
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
  selectedProducts = []
}: ProductsPageWrapperProps) {
  const [searchTerm, setSearchTerm] = useState(filters?.search || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [localSelectedProducts, setLocalSelectedProducts] = useState<string[]>(selectedProducts || []);
  
  const { handleImport, handleExport } = useProductActions();
  const { openModal } = useModals();
  const { bulkDelete } = useBulkOperations();
  const { toast } = useToast();

  // Optimisation IA en masse
  const handleBulkOptimize = async () => {
    if (localSelectedProducts.length === 0) return;
    
    toast({
      title: "Optimisation IA en cours...",
      description: `Optimisation de ${localSelectedProducts.length} produit(s)`,
    });
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-optimize-products', {
        body: { productIds: localSelectedProducts }
      });
      
      if (error) throw error;
      
      toast({
        title: "Optimisation terminée",
        description: `${localSelectedProducts.length} produit(s) optimisé(s) avec succès`,
      });
      
      onRefresh?.();
      handleSelectionChange([]);
    } catch (error) {
      toast({
        title: "Erreur d'optimisation",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive"
      });
    }
  };

  // Publication en masse
  const handleBulkPublish = async () => {
    if (localSelectedProducts.length === 0) return;
    
    openModal('bulkPublish', { 
      selectedProducts: localSelectedProducts,
      onSuccess: () => {
        handleSelectionChange([]);
        onRefresh?.();
      }
    });
  };

  // Suppression en masse
  const handleBulkDeleteAction = async () => {
    if (localSelectedProducts.length === 0) return;
    
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${localSelectedProducts.length} produit(s) ? Cette action est irréversible.`
    );
    
    if (!confirmed) return;
    
    const result = await bulkDelete(localSelectedProducts);
    
    if (result.success) {
      handleSelectionChange([]);
      onRefresh?.();
    }
  };

  // Sync local selection with parent
  const handleSelectionChange = (newSelection: string[]) => {
    setLocalSelectedProducts(newSelection);
    onSelectionChange?.(newSelection);
  };

  // Recherche locale rapide
  const displayedProducts = useMemo(() => {
    if (!searchTerm) return products;
    
    const search = searchTerm.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(search) ||
      product.description?.toLowerCase().includes(search) ||
      product.sku?.toLowerCase().includes(search)
    );
  }, [products, searchTerm]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (onFilterChange) {
      onFilterChange('search', value);
    }
  };

  const handleSortChange = (value: string) => {
    const [field, order] = value.split('_') as [keyof FilterState, 'asc' | 'desc'];
    if (onFilterChange) {
      onFilterChange('sortBy', field as any);
      onFilterChange('sortOrder', order);
    }
  };

  const handleCreateNew = () => {
    openModal('createProduct');
  };

  const handleExportClick = async () => {
    await handleExport(selectedProducts.length > 0 ? selectedProducts : undefined);
  };

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
        categories={categories}
        onCategoryChange={(cat) => onFilterChange?.('category', cat)}
        onStatusChange={(status) => onFilterChange?.('status', status as any)}
        onSortChange={handleSortChange}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={onResetFilters}
        onBulkOptimize={handleBulkOptimize}
        onBulkPublish={handleBulkPublish}
        onBulkDelete={handleBulkDeleteAction}
      />

      {localSelectedProducts.length > 0 && (
        <ProductBulkOperations
          selectedProducts={localSelectedProducts}
          onClearSelection={() => handleSelectionChange([])}
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
            handleSelectionChange([]);
            onRefresh?.();
          }}
          onBulkEdit={(ids) => {
            openModal('bulkActions', { selectedItems: ids });
          }}
          onProductUpdate={onRefresh}
        />
      )}
    </div>
  );
}
