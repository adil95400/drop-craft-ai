import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ProductActionsBar } from '@/components/products/ProductActionsBar';
import { ProductsTable } from '@/components/products/ProductsTable';
import { ProductExportDialog } from '@/components/products/ProductExportDialog';
import { ProductImportDialog } from '@/components/products/ProductImportDialog';
import { CreateProductDialog } from '@/components/products/CreateProductDialog';
import { BulkPublishDialog } from '@/components/products/BulkPublishDialog';
import { useRealProducts } from '@/hooks/useRealProducts';

export default function Products() {
  const { products, isLoading } = useRealProducts();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [bulkPublishDialogOpen, setBulkPublishDialogOpen] = useState(false);

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['real-products'] });

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Produits</h1>
        <p className="text-muted-foreground">Gérez votre catalogue de produits</p>
      </div>

      <ProductActionsBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCount={selectedProducts.length}
        totalCount={filteredProducts.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateNew={() => setCreateDialogOpen(true)}
        onImport={() => setImportDialogOpen(true)}
        onExport={() => setExportDialogOpen(true)}
      />

      <ProductsTable
        products={filteredProducts}
        isLoading={isLoading}
        selectedProducts={selectedProducts}
        onSelectionChange={setSelectedProducts}
        onBulkPublish={() => setBulkPublishDialogOpen(true)}
      />

      <ProductExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
      />

      <ProductImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />

      <CreateProductDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => refetch()}
      />

      <BulkPublishDialog
        open={bulkPublishDialogOpen}
        onOpenChange={setBulkPublishDialogOpen}
        productIds={selectedProducts}
        onSuccess={() => {
          refetch();
          setSelectedProducts([]);
        }}
      />
    </div>
  );
}
