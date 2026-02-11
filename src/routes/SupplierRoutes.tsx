import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy } from 'react'

const SupplierMarketplace = lazy(() => import('@/pages/SupplierMarketplace'))

// Lazy loading des pages - Architecture simplifiée et optimisée
const ChannableStyleSuppliersPage = lazy(() => import('@/pages/suppliers/ChannableStyleSuppliersPage'))
const MySuppliersPage = lazy(() => import('@/pages/suppliers/my/MySuppliersPage'))
const SupplierDetails = lazy(() => import('@/pages/suppliers/SupplierDetails'))
const EnhancedUnifiedCatalog = lazy(() => import('@/pages/suppliers/catalog/EnhancedUnifiedCatalog'))
const SupplierAdvancedPage = lazy(() => import('@/pages/suppliers/SupplierAdvancedPage'))
const SupplierImportPage = lazy(() => import('@/pages/suppliers/import/SupplierImportPage'))
const SupplierAnalyticsDashboard = lazy(() => import('@/pages/suppliers/analytics/SupplierAnalyticsDashboard'))
const SupplierSettingsPage = lazy(() => import('@/pages/suppliers/settings/SupplierSettingsPage'))
const CreateSupplier = lazy(() => import('@/pages/suppliers/CreateSupplier'))
const ChannableFeedManager = lazy(() => import('@/pages/feeds/ChannableFeedManager'))
const BTSImportPage = lazy(() => import('@/pages/suppliers/BTSImportPage'))
const VariantMappingPage = lazy(() => import('@/pages/suppliers/VariantMappingPage'))
const AdvancedSupplierEnginePage = lazy(() => import('@/pages/suppliers/AdvancedSupplierEnginePage'))

/**
 * ROUTES DU MODULE FOURNISSEURS
 * Architecture simplifiée et optimisée
 * 
 * Structure:
 * /suppliers - Vue d'ensemble (Channable-style)
 * /suppliers/catalog - Catalogue Unifié (tous produits, par fournisseur, catégorie, connecteur)
 * /suppliers/engine - Moteur fournisseur avancé
 * /suppliers/my - Mes fournisseurs
 * /suppliers/analytics - Analytics fournisseurs
 */
export default function SupplierRoutes() {
  return (
    <Routes>
      {/* Page Channable-style - Point d'entrée principal */}
      <Route index element={<ChannableStyleSuppliersPage />} />
      
      {/* Catalogue Unifié - NOUVEAU: une seule page pour tout */}
      <Route path="catalog" element={<EnhancedUnifiedCatalog />} />
      
      
      {/* Moteur Fournisseur Avancé */}
      <Route path="engine" element={<AdvancedSupplierEnginePage />} />
      
      {/* Mes fournisseurs */}
      <Route path="my" element={<MySuppliersPage />} />
      
      {/* Analytics */}
      <Route path="analytics" element={<SupplierAnalyticsDashboard />} />
      
      {/* Settings */}
      <Route path="settings" element={<SupplierSettingsPage />} />
      
      {/* Feeds */}
      <Route path="feeds" element={<ChannableFeedManager />} />
      
      {/* Variant Mapping */}
      <Route path="variant-mapping" element={<VariantMappingPage />} />
      
      {/* Création */}
      <Route path="create" element={<CreateSupplier />} />
      <Route path="add" element={<CreateSupplier />} />
      
      {/* Import BTS CSV */}
      <Route path="bts/import" element={<BTSImportPage />} />

      {/* Marketplace de fournisseurs */}
      <Route path="marketplace" element={<SupplierMarketplace />} />

      {/* Ancienne route connectors - Redirige vers catalogue */}
      <Route path="connectors" element={<Navigate to="/suppliers/catalog" replace />} />

      {/* Redirections des anciennes routes de connecteurs vers le catalogue avec filtre */}
      <Route path="bigbuy" element={<Navigate to="/suppliers/catalog?connector=bigbuy" replace />} />
      <Route path="cj-dropshipping" element={<Navigate to="/suppliers/catalog?connector=cj_dropshipping" replace />} />
      <Route path="dropshipping" element={<Navigate to="/suppliers/catalog?connector=cj_dropshipping" replace />} />
      <Route path="bts" element={<Navigate to="/suppliers/catalog?connector=bts" replace />} />
      <Route path="aliexpress" element={<Navigate to="/suppliers/catalog?connector=aliexpress" replace />} />
      <Route path="amazon" element={<Navigate to="/suppliers/catalog?connector=amazon" replace />} />
      <Route path="shopify" element={<Navigate to="/suppliers/catalog?connector=shopify" replace />} />
      <Route path="woocommerce" element={<Navigate to="/suppliers/catalog?connector=woocommerce" replace />} />
      <Route path="prestashop" element={<Navigate to="/suppliers/catalog?connector=prestashop" replace />} />
      
      {/* Routes par fournisseur (générique avec ID) */}
      <Route path=":supplierId" element={<SupplierDetails />} />
      <Route path=":supplierId/catalog" element={<EnhancedUnifiedCatalog />} />
      <Route path=":supplierId/advanced" element={<SupplierAdvancedPage />} />
      <Route path=":supplierId/import" element={<SupplierImportPage />} />
      <Route path=":supplierId/feeds" element={<ChannableFeedManager />} />
      <Route path=":supplierId/edit" element={<CreateSupplier />} />
      
      {/* B2B Sourcing - New routes */}
      <Route path="b2b" element={<AdvancedSupplierEnginePage />} />
      <Route path="b2b/connect" element={<AdvancedSupplierEnginePage />} />
      <Route path="b2b/compare" element={<AdvancedSupplierEnginePage />} />
    </Routes>
  )
}
