/**
 * Point d'entrée principal du système de routing
 * Architecture modulaire optimisée pour la maintenance et les performances
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Layouts
import { AppLayout } from '@/layouts/AppLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';

// Route modules
import { PublicRoutes } from './PublicRoutes';
import { CoreRoutes } from './CoreRoutes';
import { ProductRoutes } from './ProductRoutes';
import { AnalyticsRoutes } from './AnalyticsRoutes';
import { AutomationRoutes } from './AutomationRoutes';
import { MarketingRoutes } from './MarketingRoutes';
import { EnterpriseRoutes } from './EnterpriseRoutes';
import { IntegrationRoutes } from './IntegrationRoutes';
import { ExtensionRoutes } from './ExtensionRoutes';
import { AuditRoutes } from './AuditRoutes';
import { RewriteRoutes } from './RewriteRoutes';
import { AttributesRoutes } from './AttributesRoutes';
import { StockRoutes } from './StockRoutes';
import { ImportRoutes } from './ImportRoutes';
import { FeedRoutes } from './FeedRoutes';
import { AdminRoutes } from './AdminRoutes';
import SupplierRoutes from './SupplierRoutes';
import { ChannelRoutes } from './ChannelRoutes';
import { FulfillmentRoutes } from './FulfillmentRoutes';

// Import pages
import ShopifyImportHub from '@/pages/import/ShopifyImportHub';

// Pages directes
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const AvisPositifUltraPro = lazy(() => import('@/pages/AvisPositifUltraPro'));
const AdvancedImportPage = lazy(() => import('@/pages/import/AdvancedImportPage'));
const SyncManagerPage = lazy(() => import('@/pages/sync/SyncManagerPage'));
const OrdersCenterPage = lazy(() => import('@/pages/orders/OrdersCenterPage'));
const ProductsQA = lazy(() => import('@/pages/qa/ProductsQA'));
const OrdersQA = lazy(() => import('@/pages/qa/OrdersQA'));
const QADashboard = lazy(() => import('@/pages/qa/QADashboard'));
const ShopifyStore = lazy(() => import('@/pages/ShopifyStore'));
const ShopifyProductDetail = lazy(() => import('@/pages/ShopifyProductDetail'));
const CreateProduct = lazy(() => import('@/pages/products/CreateProduct'));
const CreateOrder = lazy(() => import('@/pages/orders/CreateOrder'));
const CreateCustomer = lazy(() => import('@/pages/customers/CreateCustomer'));
const CreateNotification = lazy(() => import('@/pages/notifications/CreateNotification'));
const CouponsManagementPage = lazy(() => import('@/pages/CouponsManagementPage'));
const FreeTrialActivationPage = lazy(() => import('@/pages/FreeTrialActivationPage'));
const FulfillmentDashboardPage = lazy(() => import('@/pages/FulfillmentDashboardPage'));
const FulfillmentRulesPage = lazy(() => import('@/pages/FulfillmentRulesPage'));
const CarriersManagementPage = lazy(() => import('@/pages/CarriersManagementPage'));
const PWAInstallPage = lazy(() => import('@/pages/PWAInstallPage'));
const SimplifiedImportPage = lazy(() => import('@/pages/import/SimplifiedImportPage'));
const SwaggerPage = lazy(() => import('@/pages/SwaggerPage'));
const EnrichmentSettingsPage = lazy(() => import('@/pages/enrichment/EnrichmentSettingsPage'));

// Additional pages
const AdvancedModulesPage = lazy(() => import('@/pages/AdvancedModulesPage'));
const MonitoringPage = lazy(() => import('@/pages/MonitoringPage'));
const APIDocumentationDetailPage = lazy(() => import('@/pages/integrations/APIDocumentationDetailPage'));
const GettingStartedPage = lazy(() => import('@/pages/guides/GettingStartedPage'));
const AcademyHomePage = lazy(() => import('@/pages/academy/AcademyHomePage'));
const SupportCenterPage = lazy(() => import('@/pages/support/SupportCenterPage'));
const ExtensionsMarketplacePage = lazy(() => import('@/pages/extensions/ExtensionsMarketplacePage'));
const ProductRulesPage = lazy(() => import('@/pages/rules/ProductRulesPage'));
const CatalogIntelligencePage = lazy(() => import('@/pages/catalog/CatalogIntelligencePage'));
const ABTestingPage = lazy(() => import('@/pages/ABTestingPage'));
const ProductionReadinessPage = lazy(() => import('@/pages/ProductionReadinessPage'));
const UnifiedDashboardPage = lazy(() => import('@/pages/UnifiedDashboardPage'));
const OptimizedHomePage = lazy(() => import('@/pages/OptimizedHomePage'));
const AdSpyPage = lazy(() => import('@/pages/AdSpyPage'));
const WarehousePage = lazy(() => import('@/pages/WarehousePage'));
const BIAnalyticsPage = lazy(() => import('@/pages/BIAnalyticsPage'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      <p className="text-sm text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

/**
 * Router principal de l'application
 * Structure hiérarchique avec lazy loading optimisé
 */
export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes - Non authentifiés */}
        <Route path="/*" element={<PublicRoutes />} />
        
        {/* Redirections pour profil et paramètres */}
        <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
        <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
        
        {/* Redirections routes legacy */}
        <Route path="/tracking" element={<Navigate to="/dashboard/orders" replace />} />
        <Route path="/crm" element={<Navigate to="/dashboard/customers" replace />} />
        <Route path="/customers" element={<Navigate to="/dashboard/customers" replace />} />
        <Route path="/orders" element={<Navigate to="/dashboard/orders" replace />} />
        
        {/* Protected App Routes - Authentification requise */}
        <Route path="/dashboard/*" element={<ProtectedRoute><AppLayout><CoreRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/products/*" element={<ProtectedRoute><AppLayout><ProductRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/analytics/*" element={<ProtectedRoute><AppLayout><AnalyticsRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/automation/*" element={<ProtectedRoute><AppLayout><AutomationRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/marketing/*" element={<ProtectedRoute><AppLayout><MarketingRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/integrations/*" element={<ProtectedRoute><AppLayout><IntegrationRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/enterprise/*" element={<ProtectedRoute><AppLayout><EnterpriseRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/extensions/*" element={<ProtectedRoute><AppLayout><ExtensionRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/audit/*" element={<ProtectedRoute><AppLayout><AuditRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/rewrite/*" element={<ProtectedRoute><AppLayout><RewriteRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/attributes/*" element={<ProtectedRoute><AppLayout><AttributesRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/stock/*" element={<ProtectedRoute><AppLayout><StockRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/reviews" element={<ProtectedRoute><AppLayout><AvisPositifUltraPro /></AppLayout></ProtectedRoute>} />
        <Route path="/import/*" element={<ProtectedRoute><AppLayout><ImportRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/feeds/*" element={<ProtectedRoute><AppLayout><FeedRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/suppliers/*" element={<ProtectedRoute><AppLayout><SupplierRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/stores-channels/*" element={<ProtectedRoute><AppLayout><ChannelRoutes /></AppLayout></ProtectedRoute>} />
        <Route path="/channels/*" element={<ProtectedRoute><AppLayout><ChannelRoutes /></AppLayout></ProtectedRoute>} />
        
        {/* Pages manquantes ajoutées - Phase 1 */}
        <Route path="/import/advanced" element={<ProtectedRoute><AppLayout><AdvancedImportPage /></AppLayout></ProtectedRoute>} />
        <Route path="/sync-manager" element={<ProtectedRoute><AppLayout><SyncManagerPage /></AppLayout></ProtectedRoute>} />
        <Route path="/orders-center" element={<ProtectedRoute><AppLayout><OrdersCenterPage /></AppLayout></ProtectedRoute>} />
        
        {/* QA Routes - Phase 4 */}
        <Route path="/qa" element={<ProtectedRoute><AppLayout><QADashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/qa/products" element={<ProtectedRoute><AppLayout><ProductsQA /></AppLayout></ProtectedRoute>} />
        <Route path="/qa/orders" element={<ProtectedRoute><AppLayout><OrdersQA /></AppLayout></ProtectedRoute>} />
        
        {/* Shopify Store Routes */}
        <Route path="/store" element={<ShopifyStore />} />
        <Route path="/store/product/:handle" element={<ShopifyProductDetail />} />
        
        {/* Creation Pages */}
        <Route path="/products/create" element={<ProtectedRoute><CreateProduct /></ProtectedRoute>} />
        <Route path="/orders/create" element={<ProtectedRoute><CreateOrder /></ProtectedRoute>} />
        <Route path="/customers/create" element={<ProtectedRoute><CreateCustomer /></ProtectedRoute>} />
        <Route path="/notifications/create" element={<ProtectedRoute><CreateNotification /></ProtectedRoute>} />
        
        {/* Additional Feature Pages */}
        <Route path="/advanced" element={<ProtectedRoute><AppLayout><AdvancedModulesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/modern" element={<Navigate to="/dashboard" replace />} />
        <Route path="/monitoring" element={<ProtectedRoute><AppLayout><MonitoringPage /></AppLayout></ProtectedRoute>} />
        <Route path="/catalog" element={<Navigate to="/products/catalogue" replace />} />
        <Route path="/subscription" element={<Navigate to="/dashboard/subscription" replace />} />
        
        {/* Catalog Intelligence & Rules */}
        <Route path="/rules" element={<ProtectedRoute><AppLayout><ProductRulesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/catalog-intelligence" element={<ProtectedRoute><AppLayout><CatalogIntelligencePage /></AppLayout></ProtectedRoute>} />
        
        {/* Fulfillment Module Routes */}
        <Route path="/fulfillment/*" element={<ProtectedRoute><AppLayout><FulfillmentRoutes /></AppLayout></ProtectedRoute>} />
        
        {/* Coupons & Trial */}
        <Route path="/coupons" element={<ProtectedRoute><AppLayout><CouponsManagementPage /></AppLayout></ProtectedRoute>} />
        <Route path="/trial" element={<ProtectedRoute><AppLayout><FreeTrialActivationPage /></AppLayout></ProtectedRoute>} />
        <Route path="/pwa-install" element={<PWAInstallPage />} />
        <Route path="/import/simplified" element={<ProtectedRoute><AppLayout><SimplifiedImportPage /></AppLayout></ProtectedRoute>} />
        <Route path="/ab-testing" element={<ProtectedRoute><AppLayout><ABTestingPage /></AppLayout></ProtectedRoute>} />
        <Route path="/production-readiness" element={<ProtectedRoute><AppLayout><ProductionReadinessPage /></AppLayout></ProtectedRoute>} />
        <Route path="/unified-dashboard" element={<ProtectedRoute><AppLayout><UnifiedDashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/home-optimized" element={<ProtectedRoute><AppLayout><OptimizedHomePage /></AppLayout></ProtectedRoute>} />
        
        {/* Research & Intelligence */}
        <Route path="/adspy" element={<ProtectedRoute><AppLayout><AdSpyPage /></AppLayout></ProtectedRoute>} />
        <Route path="/research/adspy" element={<ProtectedRoute><AppLayout><AdSpyPage /></AppLayout></ProtectedRoute>} />
        <Route path="/warehouse" element={<ProtectedRoute><AppLayout><WarehousePage /></AppLayout></ProtectedRoute>} />
        <Route path="/bi-analytics" element={<ProtectedRoute><AppLayout><BIAnalyticsPage /></AppLayout></ProtectedRoute>} />
        
        {/* Enrichment Settings */}
        <Route path="/enrichment" element={<ProtectedRoute><AppLayout><EnrichmentSettingsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/enrichment/settings" element={<ProtectedRoute><AppLayout><EnrichmentSettingsPage /></AppLayout></ProtectedRoute>} />
        
        {/* Modern Routes - Redirections vers interfaces principales */}
        <Route path="/modern/products" element={<Navigate to="/products" replace />} />
        <Route path="/modern/customers" element={<Navigate to="/dashboard/customers" replace />} />
        <Route path="/modern/orders" element={<Navigate to="/dashboard/orders" replace />} />
        <Route path="/modern/marketing" element={<Navigate to="/marketing" replace />} />
        <Route path="/modern/suppliers" element={<Navigate to="/suppliers" replace />} />
        <Route path="/modern/import" element={<Navigate to="/import" replace />} />
        <Route path="/modern/billing" element={<Navigate to="/dashboard/billing" replace />} />
        
        
        {/* Guides & Documentation */}
        <Route path="/integrations/api/documentation" element={<ProtectedRoute><AppLayout><APIDocumentationDetailPage /></AppLayout></ProtectedRoute>} />
        <Route path="/api-docs" element={<ProtectedRoute><AppLayout><SwaggerPage /></AppLayout></ProtectedRoute>} />
        <Route path="/swagger" element={<ProtectedRoute><AppLayout><SwaggerPage /></AppLayout></ProtectedRoute>} />
        <Route path="/guides/getting-started" element={<GettingStartedPage />} />
        <Route path="/academy" element={<AcademyHomePage />} />
        <Route path="/academy/course/:id" element={<AcademyHomePage />} />
        <Route path="/support" element={<SupportCenterPage />} />
        <Route path="/extensions" element={<ExtensionsMarketplacePage />} />
        
        {/* Admin Routes - Rôle admin requis */}
        <Route path="/admin/*" element={
          <ProtectedRoute>
            <AdminRoute>
              <AppLayout>
                <AdminRoutes />
              </AppLayout>
            </AdminRoute>
          </ProtectedRoute>
        } />
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
