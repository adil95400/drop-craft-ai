import { Routes, Route } from 'react-router-dom'
import { lazy } from 'react'

// Lazy loading des pages
const SuppliersHub = lazy(() => import('@/pages/suppliers/SuppliersHub'))
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

/**
 * ROUTES DU MODULE FOURNISSEURS
 * Architecture unifiée simplifiée
 */
export default function SupplierRoutes() {
  return (
    <Routes>
      {/* Hub principal */}
      <Route index element={<SuppliersHub />} />
      
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
      
      {/* Création */}
      <Route path="create" element={<CreateSupplier />} />
      
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
