/**
 * Routes Import - Module complet 100%
 * Toutes les routes d'import de produits
 */
import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Hub principal
const ImportHub = lazy(() => import('@/pages/import/ImportHub'))
const ImportConfigPage = lazy(() => import('@/pages/import/ImportConfigPage'))

// Pages plateformes professionnelles
const ShopifyImportPage = lazy(() => import('@/pages/import/platforms/ShopifyImportPage'))
const AmazonImportPage = lazy(() => import('@/pages/import/platforms/AmazonImportPage'))
const AliExpressImportPage = lazy(() => import('@/pages/import/platforms/AliExpressImportPage'))
const EbayImportPage = lazy(() => import('@/pages/import/platforms/EbayImportPage'))
const EtsyImportPage = lazy(() => import('@/pages/import/platforms/EtsyImportPage'))
const CJDropshippingImportPage = lazy(() => import('@/pages/import/platforms/CJDropshippingImportPage'))
const TemuImportPage = lazy(() => import('@/pages/import/platforms/TemuImportPage'))
const CdiscountImportPage = lazy(() => import('@/pages/import/platforms/CdiscountImportPage'))

// Méthodes d'import
const QuickImportPage = lazy(() => import('@/pages/import/quick/QuickImportPage'))
const UrlImportPage = lazy(() => import('@/pages/import/UrlImportPage'))
const AutoDSImportPage = lazy(() => import('@/pages/import/AutoDSImportPage'))
const FeedURLImportPage = lazy(() => import('@/pages/import/FeedURLImportPage'))
const AdvancedImportPage = lazy(() => import('@/pages/import/AdvancedImportPage'))
const BulkImportPage = lazy(() => import('@/pages/import/BulkImportPage'))
const MultiStoreImportPage = lazy(() => import('@/pages/import/MultiStoreImportPage'))
const SearchAllSuppliersPage = lazy(() => import('@/pages/import/SearchAllSuppliersPage'))
const ShopifyImportHub = lazy(() => import('@/pages/import/ShopifyImportHub'))

// IA & Génération
const AIGenerationPage = lazy(() => import('@/pages/import/AIGenerationPage'))

// Extensions & Navigateur
const ExtensionNavigatorPage = lazy(() => import('@/pages/import/ExtensionNavigatorPage'))

// Gestion & Historique
const ImportHistoryPage = lazy(() => import('@/pages/import/manage/ImportHistoryPage'))
const ImportScheduledPage = lazy(() => import('@/pages/import/ImportScheduledPage'))
const ImportedProductsList = lazy(() => import('@/pages/import/manage/ImportedProductsList'))

// Publication & Marketplaces
const ImportPublishingPage = lazy(() => import('@/pages/import/manage/ImportPublishingPage'))
const ImportMarketplacePage = lazy(() => import('@/pages/import/manage/ImportMarketplacePage'))

// Historique simplifié
const SimpleHistoryPage = lazy(() => import('@/pages/import/history/SimpleHistoryPage'))

// Rules & Retry
const PreImportRulesPage = lazy(() => import('@/pages/import/PreImportRulesPage'))
const ItemRetryPage = lazy(() => import('@/pages/import/ItemRetryPage'))

export function ImportRoutes() {
  return (
    <Routes>
      {/* Hub principal */}
      <Route index element={<ImportHub />} />
      <Route path="config" element={<ImportConfigPage />} />
      
      {/* Pages plateformes professionnelles */}
      <Route path="shopify" element={<ShopifyImportPage />} />
      <Route path="amazon" element={<AmazonImportPage />} />
      <Route path="aliexpress" element={<AliExpressImportPage />} />
      <Route path="ebay" element={<EbayImportPage />} />
      <Route path="etsy" element={<EtsyImportPage />} />
      <Route path="cj-dropshipping" element={<CJDropshippingImportPage />} />
      <Route path="temu" element={<TemuImportPage />} />
      <Route path="cdiscount" element={<CdiscountImportPage />} />
      
      {/* Méthodes d'import */}
      <Route path="quick" element={<QuickImportPage />} />
      <Route path="url" element={<UrlImportPage />} />
      <Route path="autods" element={<AutoDSImportPage />} />
      <Route path="feed-url" element={<FeedURLImportPage />} />
      <Route path="advanced" element={<AdvancedImportPage />} />
      <Route path="bulk" element={<BulkImportPage />} />
      <Route path="multi-store" element={<MultiStoreImportPage />} />
      <Route path="search-suppliers" element={<SearchAllSuppliersPage />} />
      <Route path="shopify-hub" element={<ShopifyImportHub />} />
      <Route path="aliexpress-legacy" element={<Navigate to="/import/aliexpress" replace />} />
      
      {/* IA & Génération */}
      <Route path="ai-generation" element={<AIGenerationPage />} />
      <Route path="ai" element={<AIGenerationPage />} />
      
      {/* Extensions */}
      <Route path="extensions" element={<ExtensionNavigatorPage />} />
      <Route path="navigator" element={<ExtensionNavigatorPage />} />
      
      {/* Gestion & Historique */}
      <Route path="history" element={<ImportHistoryPage />} />
      <Route path="history/simple" element={<SimpleHistoryPage />} />
      <Route path="scheduled" element={<ImportScheduledPage />} />
      <Route path="products" element={<ImportedProductsList />} />
      <Route path="manage" element={<ImportedProductsList />} />
      
      {/* Publication & Marketplaces */}
      <Route path="publishing" element={<ImportPublishingPage />} />
      <Route path="marketplace" element={<ImportMarketplacePage />} />
      
      {/* Sous-routes manage/ */}
      <Route path="manage/history" element={<ImportHistoryPage />} />
      <Route path="manage/products" element={<ImportedProductsList />} />
      <Route path="manage/publishing" element={<ImportPublishingPage />} />
      <Route path="manage/marketplace" element={<ImportMarketplacePage />} />
      
      {/* Rules & Retry */}
      <Route path="rules" element={<PreImportRulesPage />} />
      <Route path="pre-import-rules" element={<PreImportRulesPage />} />
      <Route path="item-retry" element={<ItemRetryPage />} />
      <Route path="item-retry/:jobId" element={<ItemRetryPage />} />
      
      {/* Legacy redirects */}
      <Route path="csv" element={<Navigate to="/import/quick" replace />} />
      <Route path="excel" element={<Navigate to="/import/quick" replace />} />
      <Route path="ftp" element={<Navigate to="/import/advanced" replace />} />
      <Route path="xml" element={<Navigate to="/import/advanced" replace />} />
      <Route path="api" element={<Navigate to="/import/advanced" replace />} />
    </Routes>
  )
}
