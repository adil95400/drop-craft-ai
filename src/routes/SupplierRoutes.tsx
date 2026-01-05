import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy } from 'react'

// Lazy loading des pages - Hub Unifié comme point d'entrée principal
const SuppliersHubUnified = lazy(() => import('@/pages/suppliers/SuppliersHubUnified'))
const SupplierMarketplacePage = lazy(() => import('@/pages/suppliers/marketplace/SupplierMarketplacePage'))
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

/**
 * ROUTES DU MODULE FOURNISSEURS
 * Architecture unifiée simplifiée
 */
export default function SupplierRoutes() {
  return (
    <Routes>
      {/* Hub Unifié - Point d'entrée principal */}
      <Route index element={<SuppliersHubUnified />} />
      
      {/* Marketplace */}
      <Route path="marketplace" element={<SupplierMarketplacePage />} />
      
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
      
      {/* Création */}
      <Route path="create" element={<CreateSupplier />} />
      
      {/* Import BTS CSV */}
      <Route path="bts/import" element={<BTSImportPage />} />
      
      {/* Routes par fournisseur */}
      <Route path=":supplierId" element={<SupplierDetails />} />
      <Route path=":supplierId/catalog" element={<SupplierCatalogPage />} />
      <Route path=":supplierId/advanced" element={<SupplierAdvancedPage />} />
      <Route path=":supplierId/import" element={<SupplierImportPage />} />
      <Route path=":supplierId/feeds" element={<ChannableFeedManager />} />
      <Route path=":supplierId/edit" element={<CreateSupplier />} />
    </Routes>
  )
}
