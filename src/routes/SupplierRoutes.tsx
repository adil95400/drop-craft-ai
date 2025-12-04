import { Routes, Route } from 'react-router-dom'
import { lazy } from 'react'

// Lazy loading des pages
const SuppliersHub = lazy(() => import('@/pages/suppliers/SuppliersHub'))
const SupplierMarketplacePage = lazy(() => import('@/pages/suppliers/marketplace/SupplierMarketplacePage'))
const MySuppliersPage = lazy(() => import('@/pages/suppliers/my/MySuppliersPage'))
const PremiumSuppliersPage = lazy(() => import('@/pages/suppliers/premium/PremiumSuppliersPage'))
const SupplierDetails = lazy(() => import('@/pages/suppliers/SupplierDetails'))
const SupplierCatalogPage = lazy(() => import('@/pages/suppliers/catalog/SupplierCatalogPage'))
const SupplierAdvancedPage = lazy(() => import('@/pages/suppliers/SupplierAdvancedPage'))
const SupplierImportPage = lazy(() => import('@/pages/suppliers/import/SupplierImportPage'))
const SupplierFeedsPage = lazy(() => import('@/pages/suppliers/feeds/SupplierFeedsPage'))
const SupplierAnalyticsPage = lazy(() => import('@/pages/suppliers/analytics/SupplierAnalyticsDashboard'))
const ManageSuppliersConnectors = lazy(() => import('@/pages/suppliers/manage/ManageSuppliersConnectors'))
const CreateSupplier = lazy(() => import('@/pages/suppliers/CreateSupplier'))

/**
 * ROUTES DU MODULE FOURNISSEURS
 * Architecture unifiée avec Import et Feeds
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
      
      {/* Premium */}
      <Route path="premium" element={<PremiumSuppliersPage />} />
      
      {/* Analytics */}
      <Route path="analytics" element={<SupplierAnalyticsPage />} />
      
      {/* Settings / Connecteurs */}
      <Route path="settings" element={<ManageSuppliersConnectors />} />
      
      {/* Création */}
      <Route path="create" element={<CreateSupplier />} />
      
      {/* Routes par fournisseur */}
      <Route path=":supplierId" element={<SupplierDetails />} />
      <Route path=":supplierId/catalog" element={<SupplierCatalogPage />} />
      <Route path=":supplierId/advanced" element={<SupplierAdvancedPage />} />
      <Route path=":supplierId/import" element={<SupplierImportPage />} />
      <Route path=":supplierId/feeds" element={<SupplierFeedsPage />} />
    </Routes>
  )
}
