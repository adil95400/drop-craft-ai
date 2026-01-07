import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy } from 'react'

// Lazy loading des pages - Hub Unifié comme point d'entrée principal
const SuppliersHubUnified = lazy(() => import('@/pages/suppliers/SuppliersHubUnified'))
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

// Connecteurs fournisseurs spécifiques
const BigBuyConnectorPage = lazy(() => import('@/pages/suppliers/connectors/BigBuyConnectorPage'))
const CJDropshippingConnectorPage = lazy(() => import('@/pages/suppliers/connectors/CJDropshippingConnectorPage'))
const AliExpressConnectorPage = lazy(() => import('@/pages/suppliers/connectors/AliExpressConnectorPage'))
const AmazonConnectorPage = lazy(() => import('@/pages/suppliers/connectors/AmazonConnectorPage'))
const ShopifyConnectorPage = lazy(() => import('@/pages/suppliers/connectors/ShopifyConnectorPage'))
const WooCommerceConnectorPage = lazy(() => import('@/pages/suppliers/connectors/WooCommerceConnectorPage'))
const CdiscountConnectorPage = lazy(() => import('@/pages/suppliers/connectors/CdiscountConnectorPage'))
const ZalandoConnectorPage = lazy(() => import('@/pages/suppliers/connectors/ZalandoConnectorPage'))
const RakutenConnectorPage = lazy(() => import('@/pages/suppliers/connectors/RakutenConnectorPage'))
const PrestaShopConnectorPage = lazy(() => import('@/pages/suppliers/connectors/PrestaShopConnectorPage'))
const EtsyConnectorPage = lazy(() => import('@/pages/suppliers/connectors/EtsyConnectorPage'))

/**
 * ROUTES DU MODULE FOURNISSEURS
 * Architecture unifiée simplifiée avec connecteurs spécifiques
 */
export default function SupplierRoutes() {
  return (
    <Routes>
      {/* Hub Unifié - Point d'entrée principal */}
      <Route index element={<SuppliersHubUnified />} />
      
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
      
      {/* Création */}
      <Route path="create" element={<CreateSupplier />} />
      <Route path="add" element={<CreateSupplier />} />
      
      {/* Import BTS CSV */}
      <Route path="bts/import" element={<BTSImportPage />} />

      {/* === CONNECTEURS FOURNISSEURS SPÉCIFIQUES === */}
      
      {/* Grossistes européens */}
      <Route path="bigbuy" element={<BigBuyConnectorPage />} />
      <Route path="cj-dropshipping" element={<CJDropshippingConnectorPage />} />
      <Route path="dropshipping" element={<CJDropshippingConnectorPage />} />
      
      {/* Marketplaces globales */}
      <Route path="aliexpress" element={<AliExpressConnectorPage />} />
      <Route path="amazon" element={<AmazonConnectorPage />} />
      
      {/* Marketplaces européennes */}
      <Route path="cdiscount" element={<CdiscountConnectorPage />} />
      <Route path="zalando" element={<ZalandoConnectorPage />} />
      <Route path="rakuten" element={<RakutenConnectorPage />} />
      
      {/* Plateformes E-commerce */}
      <Route path="shopify" element={<ShopifyConnectorPage />} />
      <Route path="woocommerce" element={<WooCommerceConnectorPage />} />
      <Route path="prestashop" element={<PrestaShopConnectorPage />} />
      <Route path="etsy" element={<EtsyConnectorPage />} />
      
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
