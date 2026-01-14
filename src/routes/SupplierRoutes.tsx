import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy } from 'react'

// Lazy loading des pages - Page Channable-style comme point d'entrée principal
const ChannableStyleSuppliersPage = lazy(() => import('@/pages/suppliers/ChannableStyleSuppliersPage'))
const MySuppliersPage = lazy(() => import('@/pages/suppliers/my/MySuppliersPage'))
const SupplierDetails = lazy(() => import('@/pages/suppliers/SupplierDetails'))
const SupplierCatalogPage = lazy(() => import('@/pages/suppliers/catalog/SupplierCatalogPage'))
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
 * Architecture simplifiée avec page Channable-style unifiée
 */
export default function SupplierRoutes() {
  return (
    <Routes>
      {/* Page Channable-style - Point d'entrée principal */}
      <Route index element={<ChannableStyleSuppliersPage />} />
      
      {/* Marketplace - Redirige vers la page connecteurs unifiée */}
      <Route path="marketplace" element={<Navigate to="/integrations/connectors?category=supplier" replace />} />
      
      {/* Mes fournisseurs */}
      <Route path="my" element={<MySuppliersPage />} />
      
      {/* Analytics */}
      <Route path="analytics" element={<SupplierAnalyticsDashboard />} />
      
      {/* Settings */}
      <Route path="settings" element={<SupplierSettingsPage />} />
      
      {/* Feeds - redirige vers Channable-style */}
      <Route path="feeds" element={<ChannableFeedManager />} />
      
      {/* Variant Mapping */}
      <Route path="variant-mapping" element={<VariantMappingPage />} />
      
      {/* Moteur Fournisseur Avancé */}
      <Route path="engine" element={<AdvancedSupplierEnginePage />} />
      
      {/* Création */}
      <Route path="create" element={<CreateSupplier />} />
      <Route path="add" element={<CreateSupplier />} />
      
      {/* Import BTS CSV */}
      <Route path="bts/import" element={<BTSImportPage />} />

      {/* Redirections des anciennes routes de connecteurs vers la page principale */}
      <Route path="bigbuy" element={<Navigate to="/suppliers?supplier=bigbuy" replace />} />
      <Route path="cj-dropshipping" element={<Navigate to="/suppliers?supplier=cj-dropshipping" replace />} />
      <Route path="dropshipping" element={<Navigate to="/suppliers?supplier=cj-dropshipping" replace />} />
      <Route path="bts" element={<Navigate to="/suppliers?supplier=bts" replace />} />
      <Route path="aliexpress" element={<Navigate to="/suppliers?supplier=aliexpress" replace />} />
      <Route path="amazon" element={<Navigate to="/suppliers?supplier=amazon" replace />} />
      <Route path="shopify" element={<Navigate to="/suppliers?supplier=shopify" replace />} />
      <Route path="woocommerce" element={<Navigate to="/suppliers?supplier=woocommerce" replace />} />
      <Route path="prestashop" element={<Navigate to="/suppliers?supplier=prestashop" replace />} />
      
      {/* Routes par fournisseur (générique avec ID) */}
      <Route path=":supplierId" element={<SupplierDetails />} />
      <Route path=":supplierId/catalog" element={<SupplierCatalogPage />} />
      <Route path=":supplierId/advanced" element={<SupplierAdvancedPage />} />
      <Route path=":supplierId/import" element={<SupplierImportPage />} />
      <Route path=":supplierId/feeds" element={<ChannableFeedManager />} />
      <Route path=":supplierId/edit" element={<CreateSupplier />} />
    </Routes>
  )
}
