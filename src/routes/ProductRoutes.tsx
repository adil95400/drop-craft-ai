/**
 * Routes Products - Catalogue, Import, Winners
 * Suppliers routes are handled separately in SupplierRoutes.tsx
 * Consolidé - Imports orphelins supprimés
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Products
const CatalogProductsPage = lazy(() => import('@/pages/products/CatalogProductsPage'));
const ProductCockpitPage = lazy(() => import('@/pages/products/ProductCockpitPage'));
const ProductDetailsPage = lazy(() => import('@/pages/ProductDetailsPage'));
const ProductPublishing = lazy(() => import('@/pages/ProductPublishing'));

// Import - Redirects to /import module
const ImportHub = lazy(() => import('@/pages/import/ImportHub'));

// Winners & Research - Redirect to /research module
const ProductResearchPageNew = lazy(() => import('@/pages/products/ProductResearchPage'));
const MarketplaceCampaignsPage = lazy(() => import('@/pages/MarketplaceCampaignsPage'));

// Tools
const ProfitCalculatorPage = lazy(() => import('@/pages/ProfitCalculatorPage'));
const BulkContentCreationPage = lazy(() => import('@/pages/BulkContentCreationPage'));
const InventoryPredictorPage = lazy(() => import('@/pages/InventoryPredictorPage'));

// Product Management - Using catalog variants page
const CatalogVariantsPage = lazy(() => import('@/pages/catalog/VariantsPage'));
const WarehouseManagement = lazy(() => import('@/pages/WarehouseManagement'));
const VendorManagementPage = lazy(() => import('@/pages/VendorManagementPage'));

// Advanced Products
const AdvancedProductsPage = lazy(() => import('@/pages/products/AdvancedProductsPage'));

// Product Module Routes
const ProductAuditPage = lazy(() => import('@/pages/products/ProductAuditPage'));
const PredictiveAnalyticsPage = lazy(() => import('@/pages/PredictiveAnalyticsPage'));
const ProductSourcingPage = lazy(() => import('@/pages/products/ProductSourcingPage'));
const PriceRulesPage = lazy(() => import('@/pages/products/PriceRulesPage'));
const PriceMonitoringPage = lazy(() => import('@/pages/products/PriceMonitoringPage'));
const PricingEnginePage = lazy(() => import('@/pages/products/PricingEnginePage'));
const ProductScoringPage = lazy(() => import('@/pages/products/ProductScoringPage'));
const AIContentPage = lazy(() => import('@/pages/products/AIContentPage'));
const ImageAuditPage = lazy(() => import('@/pages/ImageAuditPage'));

export function ProductRoutes() {
  return (
    <Routes>
      {/* Products Management */}
      <Route index element={<CatalogProductsPage />} />
      <Route path="cockpit" element={<ProductCockpitPage />} />
      <Route path="enhanced-catalog" element={<Navigate to="/products" replace />} />
      <Route path="publish" element={<ProductPublishing />} />
      <Route path="catalogue" element={<Navigate to="/products" replace />} />
      <Route path="advanced" element={<AdvancedProductsPage />} />
      
      {/* Import - Redirect to dedicated module with path preservation */}
      <Route path="import" element={<Navigate to="/import" replace />} />
      <Route path="import/manage" element={<Navigate to="/import/manage" replace />} />
      <Route path="import/manage/history" element={<Navigate to="/import/history" replace />} />
      <Route path="import/manage/products" element={<Navigate to="/import/products" replace />} />
      <Route path="import/manage/publishing" element={<Navigate to="/import/publishing" replace />} />
      <Route path="import/manage/marketplace" element={<Navigate to="/import/marketplace" replace />} />
      <Route path="import/history" element={<Navigate to="/import/history" replace />} />
      <Route path="import/url" element={<Navigate to="/import/url" replace />} />
      <Route path="import/quick" element={<Navigate to="/import/quick" replace />} />
      <Route path="import/advanced" element={<Navigate to="/import/advanced" replace />} />
      <Route path="import/bulk" element={<Navigate to="/import/bulk" replace />} />
      <Route path="import/*" element={<Navigate to="/import" replace />} />
      
      {/* Dynamic product ID route (must be after specific routes) */}
      <Route path=":id" element={<ProductDetailsPage />} />
      <Route path=":id/edit" element={<ProductDetailsPage />} />
      
      {/* Product Module Structure */}
      <Route path="rules" element={<Navigate to="/products?tab=rules" replace />} />
      <Route path="audit" element={<ProductAuditPage />} />
      <Route path="research" element={<ProductResearchPageNew />} />
      <Route path="intelligence" element={<PredictiveAnalyticsPage />} />
      <Route path="sourcing" element={<ProductSourcingPage />} />
      <Route path="price-rules" element={<PriceRulesPage />} />
      <Route path="price-monitoring" element={<PriceMonitoringPage />} />
      <Route path="pricing-engine" element={<PricingEnginePage />} />
      <Route path="scoring" element={<ProductScoringPage />} />
      <Route path="ai-content" element={<AIContentPage />} />
      <Route path="image-audit" element={<ImageAuditPage />} />
      
      {/* Import redirect already defined above */}
      
      {/* Suppliers - Redirect to dedicated module */}
      <Route path="suppliers/*" element={<Navigate to="/suppliers" replace />} />
      
      {/* Product Research & Marketplace - Redirect to /research */}
      <Route path="winners" element={<Navigate to="/research/winning" replace />} />
      <Route path="ads-spy" element={<Navigate to="/research/ads" replace />} />
      <Route path="marketplace-campaigns" element={<MarketplaceCampaignsPage />} />
      <Route path="research-legacy" element={<Navigate to="/research" replace />} />
      
      {/* Tools */}
      <Route path="profit-calculator" element={<ProfitCalculatorPage />} />
      <Route path="bulk-content" element={<BulkContentCreationPage />} />
      <Route path="inventory-predictor" element={<InventoryPredictorPage />} />
      
      {/* Product Management - variants uses catalog page */}
      <Route path="variants" element={<CatalogVariantsPage />} />
      <Route path="warehouse" element={<WarehouseManagement />} />
      <Route path="dropshipping-center" element={<Navigate to="/suppliers" replace />} />
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
