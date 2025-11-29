/**
 * Routes Products - Catalogue, Import, Suppliers, Winners
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Products
const ModernProductsPage = lazy(() => import('@/pages/products/ProductsMainPage'));
const EnhancedCatalog = lazy(() => import('@/pages/products/EnhancedCatalog'));
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
const ImportPublishingPage = lazy(() => import('@/pages/import/manage/ImportPublishingPage'));
const ImportMarketplacePage = lazy(() => import('@/pages/import/manage/ImportMarketplacePage'));

// Suppliers - Nouvelle structure unifiée
const SuppliersHub = lazy(() => import('@/pages/suppliers/SuppliersHub'));
const CreateSupplier = lazy(() => import('@/pages/suppliers/CreateSupplier'));
const SupplierDetails = lazy(() => import('@/pages/suppliers/SupplierDetails'));
const SupplierMarketplace = lazy(() => import('@/pages/suppliers/marketplace'));
const MySuppliersPage = lazy(() => import('@/pages/suppliers/my/MySuppliersPage'));
const PremiumSuppliersPage = lazy(() => import('@/pages/suppliers/premium/PremiumSuppliersPage'));
const SupplierAnalyticsPage = lazy(() => import('@/pages/suppliers/analytics/SupplierAnalyticsPage'));
const SupplierCatalogPage = lazy(() => import('@/pages/suppliers/catalog/SupplierCatalogPage'));
const SupplierSettingsPage = lazy(() => import('@/pages/suppliers/settings/SupplierSettingsPage'));
const UnifiedCatalog = lazy(() => import('@/pages/suppliers/catalog'));

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

// Advanced Products
const AdvancedProductsPage = lazy(() => import('@/pages/products/AdvancedProductsPage'));

// New Product Module Routes
const ProductRulesPage = lazy(() => import('@/pages/products/ProductRulesPage'));
const ProductAuditPage = lazy(() => import('@/pages/products/ProductAuditPage'));
const ProductResearchPageNew = lazy(() => import('@/pages/products/ProductResearchPage'));
const ProductIntelligencePage = lazy(() => import('@/pages/ProductIntelligencePage'));
const ProductQAPage = lazy(() => import('@/pages/qa/ProductsQA'));
const ProductSourcingPage = lazy(() => import('@/pages/products/ProductSourcingPage'));

export function ProductRoutes() {
  return (
    <Routes>
      {/* Products Management */}
      <Route index element={<ModernProductsPage />} />
      <Route path="enhanced-catalog" element={<EnhancedCatalog />} />
      <Route path=":id" element={<ProductDetailsPage />} />
      <Route path="publish" element={<ProductPublishing />} />
      <Route path="catalogue" element={<Catalogue />} />
      <Route path="advanced" element={<AdvancedProductsPage />} />
      
      {/* New Product Module Structure */}
      <Route path="rules" element={<ProductRulesPage />} />
      <Route path="audit" element={<ProductAuditPage />} />
      <Route path="research" element={<ProductResearchPageNew />} />
      <Route path="intelligence" element={<ProductIntelligencePage />} />
      <Route path="qa" element={<ProductQAPage />} />
      <Route path="sourcing" element={<ProductSourcingPage />} />
      
      {/* Import Hub */}
      <Route path="import" element={<ImportHub />} />
      <Route path="import/quick" element={<QuickImport />} />
      <Route path="import/url" element={<URLImportPage />} />
      <Route path="import/shopify-store" element={<ShopifyStoreImportPage />} />
      <Route path="import/advanced" element={<AdvancedImport />} />
      <Route path="import/manage" element={<ImportManagement />} />
      <Route path="import/manage/products" element={<ImportedProductsList />} />
      <Route path="import/manage/history" element={<ImportHistoryPage />} />
      <Route path="import/manage/publishing" element={<ImportPublishingPage />} />
      <Route path="import/manage/marketplace" element={<ImportMarketplacePage />} />
      <Route path="import/results" element={<ImportResults />} />
      <Route path="import/sources" element={<ImportSources />} />
      
      {/* Suppliers - Structure unifiée */}
      <Route path="suppliers" element={<SuppliersHub />} />
      <Route path="suppliers/marketplace" element={<SupplierMarketplace />} />
      <Route path="suppliers/my" element={<MySuppliersPage />} />
      <Route path="suppliers/premium" element={<PremiumSuppliersPage />} />
      <Route path="suppliers/analytics" element={<SupplierAnalyticsPage />} />
      <Route path="suppliers/settings" element={<SupplierSettingsPage />} />
      <Route path="suppliers/catalog" element={<UnifiedCatalog />} />
      <Route path="suppliers/create" element={<CreateSupplier />} />
      <Route path="suppliers/:id" element={<SupplierDetails />} />
      <Route path="suppliers/:id/catalog" element={<SupplierCatalogPage />} />
      <Route path="suppliers/:id/edit" element={<CreateSupplier />} />
      
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
