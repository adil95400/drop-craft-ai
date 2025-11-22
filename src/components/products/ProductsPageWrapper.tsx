import { useState } from 'react';
import { ProductActionsBar } from './ProductActionsBar';
import { ProductBulkOperations } from './ProductBulkOperations';
import { ProductsTableView } from './ProductsTableView';
import { ProductsGridView } from './ProductsGridView';
import { UnifiedProduct } from '@/hooks/useUnifiedProducts';
import { useProductActions } from '@/hooks/useProductActions';
import { useModals } from '@/hooks/useModals';

interface ProductsPageWrapperProps {
  products: UnifiedProduct[];
  onEdit: (product: UnifiedProduct) => void;
  onDelete: (id: string) => void;
  onView: (product: UnifiedProduct) => void;
  onRefresh?: () => void;
}

/**
 * Wrapper complet pour la page produits avec toutes les actions connectées
 */
export function ProductsPageWrapper({
  products,
  onEdit,
  onDelete,
  onView,
  onRefresh
}: ProductsPageWrapperProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  const { handleImport, handleExport, isExporting } = useProductActions();
  const { openModal } = useModals();

  // Filtrage des produits
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        onSearchChange={setSearchTerm}
        selectedCount={selectedProducts.length}
        totalCount={filteredProducts.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateNew={handleCreateNew}
        onImport={handleImport}
        onExport={handleExportClick}
      />

      {selectedProducts.length > 0 && (
        <ProductBulkOperations
          selectedProducts={selectedProducts}
          onClearSelection={() => setSelectedProducts([])}
        />
      )}

      {viewMode === 'grid' ? (
        <ProductsGridView
          products={filteredProducts}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          selectedProducts={selectedProducts}
          onSelectionChange={setSelectedProducts}
        />
      ) : (
        <ProductsTableView
          products={filteredProducts}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          onBulkDelete={(ids) => {
            ids.forEach(id => onDelete(id));
            setSelectedProducts([]);
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
