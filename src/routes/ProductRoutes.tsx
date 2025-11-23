/**
 * Routes Products - Catalogue, Import, Suppliers, Winners
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Products
const ModernProductsPage = lazy(() => import('@/pages/products/ProductsMainPage'));
const ProductDetailsPage = lazy(() => import('@/pages/ProductDetailsPage'));
const ProductPublishing = lazy(() => import('@/pages/ProductPublishing'));
const Catalogue = lazy(() => import('@/pages/CatalogueReal'));

// Import
const ImportHub = lazy(() => import('@/pages/import/ImportHub'));
const QuickImport = lazy(() => import('@/pages/import/QuickImport'));
const URLImportPage = lazy(() => import('@/pages/import/URLImportPage'));
const ShopifyStoreImportPage = lazy(() => import('@/pages/ShopifyStoreImportPage'));
const AdvancedImport = lazy(() => import('@/pages/import/AdvancedImport'));
const ImportManagement = lazy(() => import('@/pages/import/ImportManagement'));
const ImportedProductsList = lazy(() => import('@/pages/import/manage/ImportedProductsList'));
const ImportHistoryPage = lazy(() => import('@/pages/import/history/SimpleHistoryPage'));
const ImportResults = lazy(() => import('@/pages/import/ImportResults'));
const ImportSources = lazy(() => import('@/pages/import/ImportSources'));

// Suppliers
const SuppliersHub = lazy(() => import('@/pages/suppliers/SuppliersHub'));
const ManageSuppliers = lazy(() => import('@/pages/suppliers/ManageSuppliers'));
const SuppliersMarketplace = lazy(() => import('@/pages/suppliers/SuppliersMarketplace'));
const ManageSuppliersList = lazy(() => import('@/pages/suppliers/manage/ManageSuppliersList'));
const ManageSuppliersConnectors = lazy(() => import('@/pages/suppliers/manage/ManageSuppliersConnectors'));

// Winners & Research
const WinnersPage = lazy(() => import('@/pages/WinnersPage'));
const ProductResearchPage = lazy(() => import('@/pages/ProductResearchPage'));
const AIMarketplacePage = lazy(() => import('@/pages/AIMarketplacePage'));
const PremiumCatalog = lazy(() => import('@/pages/PremiumCatalog'));
const PremiumNetworkPage = lazy(() => import('@/pages/PremiumNetworkPage'));

// Tools
const ProfitCalculatorPage = lazy(() => import('@/pages/ProfitCalculatorPage'));
const BulkContentCreationPage = lazy(() => import('@/pages/BulkContentCreationPage'));
const InventoryPredictorPage = lazy(() => import('@/pages/InventoryPredictorPage'));

// Product Management
const ProductVariants = lazy(() => import('@/pages/ProductVariants'));
const WarehouseManagement = lazy(() => import('@/pages/WarehouseManagement'));
const DropshippingCenterPage = lazy(() => import('@/pages/DropshippingCenterPage'));
const VendorManagementPage = lazy(() => import('@/pages/VendorManagementPage'));

export function ProductRoutes() {
  return (
    <Routes>
      {/* Products Management */}
      <Route index element={<ModernProductsPage />} />
      <Route path=":id" element={<ProductDetailsPage />} />
      <Route path="publish" element={<ProductPublishing />} />
      <Route path="catalogue" element={<Catalogue />} />
      
      {/* Import Hub */}
      <Route path="import" element={<ImportHub />} />
      <Route path="import/quick" element={<QuickImport />} />
      <Route path="import/url" element={<URLImportPage />} />
      <Route path="import/shopify-store" element={<ShopifyStoreImportPage />} />
      <Route path="import/advanced" element={<AdvancedImport />} />
      <Route path="import/manage" element={<ImportManagement />} />
      <Route path="import/manage/products" element={<ImportedProductsList />} />
      <Route path="import/manage/history" element={<ImportHistoryPage />} />
      <Route path="import/results" element={<ImportResults />} />
      <Route path="import/sources" element={<ImportSources />} />
      
      {/* Suppliers */}
      <Route path="suppliers" element={<SuppliersHub />} />
      <Route path="suppliers/marketplace" element={<SuppliersMarketplace />} />
      <Route path="suppliers/manage" element={<ManageSuppliers />} />
      <Route path="suppliers/manage/list" element={<ManageSuppliersList />} />
      <Route path="suppliers/manage/connectors" element={<ManageSuppliersConnectors />} />
      
      {/* Product Research */}
      <Route path="winners" element={<WinnersPage />} />
      <Route path="research" element={<ProductResearchPage />} />
      <Route path="ai-marketplace" element={<AIMarketplacePage />} />
      <Route path="premium-catalog" element={<PremiumCatalog />} />
      <Route path="premium-network" element={<PremiumNetworkPage />} />
      
      {/* Tools */}
      <Route path="profit-calculator" element={<ProfitCalculatorPage />} />
      <Route path="bulk-content" element={<BulkContentCreationPage />} />
      <Route path="inventory-predictor" element={<InventoryPredictorPage />} />
      
      {/* Product Management */}
      <Route path="variants" element={<ProductVariants />} />
      <Route path="warehouse" element={<WarehouseManagement />} />
      <Route path="dropshipping-center" element={<DropshippingCenterPage />} />
      <Route path="vendors" element={<VendorManagementPage />} />
      
      {/* Legacy redirects */}
      <Route path="catalogue-ultra-pro" element={<Navigate to="/products/catalogue" replace />} />
      <Route path="import-advanced" element={<Navigate to="/products/import/advanced" replace />} />
    </Routes>
  );
}
