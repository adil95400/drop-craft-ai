/**
 * Routes Products - Catalogue, Import, Winners
 * Suppliers routes are handled separately in SupplierRoutes.tsx
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Products
const ChannableProductsPage = lazy(() => import('@/pages/products/ChannableProductsPage'));
const EnhancedCatalog = lazy(() => import('@/pages/products/EnhancedCatalog'));
const ProductDetailsPage = lazy(() => import('@/pages/ProductDetailsPage'));
const ProductPublishing = lazy(() => import('@/pages/ProductPublishing'));

// Import - Redirects to /import module
const ImportHub = lazy(() => import('@/pages/import/ImportHub'));

// Winners & Research
const WinnersPage = lazy(() => import('@/pages/WinnersPage'));
const ProductResearchPage = lazy(() => import('@/pages/ProductResearchPage'));
const AdsSpyPage = lazy(() => import('@/pages/AdsSpyPage'));
const MarketplaceCampaignsPage = lazy(() => import('@/pages/MarketplaceCampaignsPage'));

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

// Product Module Routes
// ProductRulesPage supprimé - intégré dans /products?tab=rules
const ProductAuditPage = lazy(() => import('@/pages/products/ProductAuditPage'));
const ProductResearchPageNew = lazy(() => import('@/pages/products/ProductResearchPage'));
const ProductIntelligencePage = lazy(() => import('@/pages/ProductIntelligencePage'));
const ProductQAPage = lazy(() => import('@/pages/qa/ProductsQA'));
const ProductSourcingPage = lazy(() => import('@/pages/products/ProductSourcingPage'));
const PriceRulesPage = lazy(() => import('@/pages/products/PriceRulesPage'));
const ProductScoringPage = lazy(() => import('@/pages/products/ProductScoringPage'));
const AIContentPage = lazy(() => import('@/pages/products/AIContentPage'));
const ImageAuditPage = lazy(() => import('@/pages/ImageAuditPage'));

export function ProductRoutes() {
  return (
    <Routes>
      {/* Products Management */}
      <Route index element={<ChannableProductsPage />} />
      <Route path="enhanced-catalog" element={<EnhancedCatalog />} />
      <Route path=":id" element={<ProductDetailsPage />} />
      <Route path="publish" element={<ProductPublishing />} />
      <Route path="catalogue" element={<Navigate to="/products" replace />} />
      <Route path="advanced" element={<AdvancedProductsPage />} />
      
      {/* Product Module Structure */}
      <Route path="rules" element={<Navigate to="/products?tab=rules" replace />} />
      <Route path="audit" element={<ProductAuditPage />} />
      <Route path="research" element={<ProductResearchPageNew />} />
      <Route path="intelligence" element={<ProductIntelligencePage />} />
      <Route path="qa" element={<ProductQAPage />} />
      <Route path="sourcing" element={<ProductSourcingPage />} />
      <Route path="price-rules" element={<PriceRulesPage />} />
      <Route path="scoring" element={<ProductScoringPage />} />
      <Route path="ai-content" element={<AIContentPage />} />
      <Route path="image-audit" element={<ImageAuditPage />} />
      
      {/* Import - Redirect to dedicated module */}
      <Route path="import/*" element={<Navigate to="/import" replace />} />
      
      {/* Suppliers - Redirect to dedicated module */}
      <Route path="suppliers/*" element={<Navigate to="/suppliers" replace />} />
      
      {/* Product Research & Marketplace */}
      <Route path="winners" element={<WinnersPage />} />
      <Route path="ads-spy" element={<AdsSpyPage />} />
      <Route path="marketplace-campaigns" element={<MarketplaceCampaignsPage />} />
      <Route path="research-legacy" element={<ProductResearchPage />} />
      
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
      <Route path="import-advanced" element={<Navigate to="/import/advanced" replace />} />
      <Route path="premium-network" element={<Navigate to="/suppliers/marketplace" replace />} />
      <Route path="global-marketplace" element={<Navigate to="/suppliers/marketplace" replace />} />
      <Route path="ai-marketplace" element={<Navigate to="/suppliers/marketplace" replace />} />
    </Routes>
  );
}
