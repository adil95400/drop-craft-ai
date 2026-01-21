/**
 * Point d'entrée principal du système de routing
 * Architecture modulaire optimisée - Routes consolidées
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Layouts
import { ChannableLayout } from '@/components/channable/navigation';
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
// FulfillmentRoutes supprimé - intégré dans OrderRoutes
import { PricingRoutes } from './PricingRoutes';
import { AIRoutes } from './AIRoutes';
import { ResearchRoutes } from './ResearchRoutes';
import { ToolsRoutes } from './ToolsRoutes';
import { OrderRoutes } from './OrderRoutes';
import { CustomerRoutes } from './CustomerRoutes';
import { SettingsRoutes } from './SettingsRoutes';

// Pages directes (lazy loaded)
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const AvisPositifUltraPro = lazy(() => import('@/pages/AvisPositifUltraPro'));
const SyncManagerPage = lazy(() => import('@/pages/sync/SyncManagerPage'));
const OrdersCenterPage = lazy(() => import('@/pages/orders/OrdersCenterPage'));
const BulkOrdersPage = lazy(() => import('@/pages/orders/BulkOrdersPage'));
const ShopifyStore = lazy(() => import('@/pages/ShopifyStore'));
const ShopifyProductDetail = lazy(() => import('@/pages/ShopifyProductDetail'));
const CreateProduct = lazy(() => import('@/pages/products/CreateProduct'));
const CreateOrder = lazy(() => import('@/pages/orders/CreateOrder'));
const CreateCustomer = lazy(() => import('@/pages/customers/CreateCustomer'));
const CreateNotification = lazy(() => import('@/pages/notifications/CreateNotification'));
const CouponsManagementPage = lazy(() => import('@/pages/CouponsManagementPage'));
const FreeTrialActivationPage = lazy(() => import('@/pages/FreeTrialActivationPage'));
const PWAInstallPage = lazy(() => import('@/pages/PWAInstallPage'));
const SwaggerPage = lazy(() => import('@/pages/SwaggerPage'));
const EnrichmentSettingsPage = lazy(() => import('@/pages/enrichment/EnrichmentSettingsPage'));
const AdvancedModulesPage = lazy(() => import('@/pages/AdvancedModulesPage'));
const MonitoringPage = lazy(() => import('@/pages/MonitoringPage'));
const GettingStartedPage = lazy(() => import('@/pages/guides/GettingStartedPage'));
const AcademyHomePage = lazy(() => import('@/pages/academy/AcademyHomePage'));
const SupportCenterPage = lazy(() => import('@/pages/support/SupportCenterPage'));
const SupportMainPage = lazy(() => import('@/pages/support/SupportMainPage'));
// ProductRulesPage supprimé - intégré dans /products?tab=rules
const CatalogIntelligencePage = lazy(() => import('@/pages/catalog/CatalogIntelligencePage'));
const ABTestingPage = lazy(() => import('@/pages/ABTestingPage'));
const ProductionReadinessPage = lazy(() => import('@/pages/ProductionReadinessPage'));
const PageBuilderPage = lazy(() => import('@/pages/PageBuilderPage'));
const PageEditorPage = lazy(() => import('@/pages/PageEditorPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const RepricingPage = lazy(() => import('@/pages/RepricingPage'));
const AdsSpyPage = lazy(() => import('@/pages/AdsSpyPage'));
const Reports = lazy(() => import('@/pages/Reports'));
const Sitemap = lazy(() => import('@/pages/Sitemap'));
const SEOManagerPage = lazy(() => import('@/pages/SEOManager'));
const KeywordResearch = lazy(() => import('@/pages/KeywordResearch'));
const RankTracker = lazy(() => import('@/pages/RankTracker'));

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
        
        {/* Redirections de compatibilité: /dashboard/* → /* */}
        <Route path="/dashboard/orders/*" element={<Navigate to="/orders" replace />} />
        <Route path="/dashboard/orders" element={<Navigate to="/orders" replace />} />
        <Route path="/dashboard/customers/*" element={<Navigate to="/customers" replace />} />
        <Route path="/dashboard/customers" element={<Navigate to="/customers" replace />} />
        <Route path="/dashboard/settings" element={<Navigate to="/settings" replace />} />
        <Route path="/dashboard/stores/*" element={<Navigate to="/stores-channels" replace />} />
        <Route path="/dashboard/stores" element={<Navigate to="/stores-channels" replace />} />
        
        {/* Profile & Subscription direct routes */}
        <Route path="/profile" element={<ProtectedRoute><ChannableLayout><Navigate to="/dashboard/profile" replace /></ChannableLayout></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><ChannableLayout><Navigate to="/dashboard/subscription" replace /></ChannableLayout></ProtectedRoute>} />
        
        {/* Compat: old subscription url */}
        <Route path="/subscription-dashboard" element={<Navigate to="/dashboard/subscription" replace />} />
        
        {/* Autres redirections standardisées */}
        <Route path="/tracking" element={<Navigate to="/orders" replace />} />
        <Route path="/crm" element={<Navigate to="/customers" replace />} />
        <Route path="/modern" element={<Navigate to="/dashboard" replace />} />
        <Route path="/catalog" element={<Navigate to="/products/catalogue" replace />} />
        
        {/* API Documentation redirect */}
        <Route path="/api/documentation" element={<Navigate to="/integrations/api/documentation" replace />} />
        <Route path="/api/*" element={<Navigate to="/integrations/api/documentation" replace />} />
        
        {/* SEO Routes Direct - Redirect to marketing/seo */}
        <Route path="/seo" element={<Navigate to="/marketing/seo" replace />} />
        <Route path="/seo/rank-tracker" element={<Navigate to="/marketing/seo/rank-tracker" replace />} />
        <Route path="/seo/keywords" element={<Navigate to="/marketing/seo/keywords" replace />} />
        <Route path="/seo/keyword-research" element={<Navigate to="/marketing/seo/keywords" replace />} />
        <Route path="/seo/schema-generator" element={<Navigate to="/marketing/seo/schema" replace />} />
        <Route path="/seo/schema" element={<Navigate to="/marketing/seo/schema" replace />} />
        <Route path="/seo/competitor-analysis" element={<Navigate to="/marketing/seo" replace />} />
        <Route path="/seo/analytics" element={<Navigate to="/marketing/seo" replace />} />
        <Route path="/seo/tools" element={<Navigate to="/marketing/seo/tools" replace />} />
        
        {/* Protected App Routes - Authentification requise */}
        <Route path="/dashboard/*" element={<ProtectedRoute><ChannableLayout><CoreRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/orders/*" element={<ProtectedRoute><ChannableLayout><OrderRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/customers/*" element={<ProtectedRoute><ChannableLayout><CustomerRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/settings/*" element={<ProtectedRoute><ChannableLayout><SettingsRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/products/*" element={<ProtectedRoute><ChannableLayout><ProductRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/analytics/*" element={<ProtectedRoute><ChannableLayout><AnalyticsRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/automation/*" element={<ProtectedRoute><ChannableLayout><AutomationRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/marketing/*" element={<ProtectedRoute><ChannableLayout><MarketingRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/integrations/*" element={<ProtectedRoute><ChannableLayout><IntegrationRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/enterprise/*" element={<ProtectedRoute><ChannableLayout><EnterpriseRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/extensions/*" element={<ProtectedRoute><ChannableLayout><ExtensionRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/audit/*" element={<ProtectedRoute><ChannableLayout><AuditRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/rewrite/*" element={<ProtectedRoute><ChannableLayout><RewriteRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/attributes/*" element={<ProtectedRoute><ChannableLayout><AttributesRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/stock/*" element={<ProtectedRoute><ChannableLayout><StockRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/import/*" element={<ProtectedRoute><ChannableLayout><ImportRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/feeds/*" element={<ProtectedRoute><ChannableLayout><FeedRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/suppliers/*" element={<ProtectedRoute><ChannableLayout><SupplierRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/stores-channels/*" element={<ProtectedRoute><ChannableLayout><ChannelRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/channels/*" element={<ProtectedRoute><ChannableLayout><ChannelRoutes /></ChannableLayout></ProtectedRoute>} />
        {/* Fulfillment - Redirection vers /orders/fulfillment */}
        <Route path="/fulfillment" element={<Navigate to="/orders/fulfillment" replace />} />
        <Route path="/fulfillment/carriers" element={<Navigate to="/orders/fulfillment/carriers" replace />} />
        <Route path="/fulfillment/rules" element={<Navigate to="/orders/fulfillment/rules" replace />} />
        <Route path="/fulfillment/dashboard" element={<Navigate to="/orders/fulfillment" replace />} />
        <Route path="/fulfillment/*" element={<Navigate to="/orders/fulfillment" replace />} />
        <Route path="/pricing/*" element={<ProtectedRoute><ChannableLayout><PricingRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/ai/*" element={<ProtectedRoute><ChannableLayout><AIRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/research/*" element={<ProtectedRoute><ChannableLayout><ResearchRoutes /></ChannableLayout></ProtectedRoute>} />
        <Route path="/tools/*" element={<ProtectedRoute><ChannableLayout><ToolsRoutes /></ChannableLayout></ProtectedRoute>} />
        
        {/* Reviews */}
        <Route path="/reviews" element={<ProtectedRoute><ChannableLayout><AvisPositifUltraPro /></ChannableLayout></ProtectedRoute>} />
        
        {/* Sync & Orders */}
        <Route path="/sync-manager" element={<ProtectedRoute><ChannableLayout><SyncManagerPage /></ChannableLayout></ProtectedRoute>} />
        <Route path="/orders-center" element={<ProtectedRoute><ChannableLayout><OrdersCenterPage /></ChannableLayout></ProtectedRoute>} />
        
        {/* Shopify Store (public) */}
        <Route path="/store" element={<ShopifyStore />} />
        <Route path="/store/product/:handle" element={<ShopifyProductDetail />} />
        
        {/* Creation Pages */}
        <Route path="/products/create" element={<ProtectedRoute><ChannableLayout><CreateProduct /></ChannableLayout></ProtectedRoute>} />
        <Route path="/orders/create" element={<ProtectedRoute><ChannableLayout><CreateOrder /></ChannableLayout></ProtectedRoute>} />
        <Route path="/orders/bulk" element={<ProtectedRoute><ChannableLayout><BulkOrdersPage /></ChannableLayout></ProtectedRoute>} />
        <Route path="/customers/create" element={<ProtectedRoute><ChannableLayout><CreateCustomer /></ChannableLayout></ProtectedRoute>} />
        <Route path="/notifications/create" element={<ProtectedRoute><ChannableLayout><CreateNotification /></ChannableLayout></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><ChannableLayout><NotificationsPage /></ChannableLayout></ProtectedRoute>} />
        
        {/* Feature Pages */}
        <Route path="/advanced" element={<ProtectedRoute><ChannableLayout><AdvancedModulesPage /></ChannableLayout></ProtectedRoute>} />
        <Route path="/monitoring" element={<ProtectedRoute><ChannableLayout><MonitoringPage /></ChannableLayout></ProtectedRoute>} />
        <Route path="/rules" element={<Navigate to="/products?tab=rules" replace />} />
        <Route path="/catalog-intelligence" element={<ProtectedRoute><ChannableLayout><CatalogIntelligencePage /></ChannableLayout></ProtectedRoute>} />
        <Route path="/coupons" element={<ProtectedRoute><ChannableLayout><CouponsManagementPage /></ChannableLayout></ProtectedRoute>} />
        <Route path="/trial" element={<ProtectedRoute><ChannableLayout><FreeTrialActivationPage /></ChannableLayout></ProtectedRoute>} />
        <Route path="/ab-testing" element={<ProtectedRoute><ChannableLayout><ABTestingPage /></ChannableLayout></ProtectedRoute>} />
        {/* Production Readiness - DISABLED IN PRODUCTION (internal tool) */}
        {/* <Route path="/production-readiness" element={<ProtectedRoute><ChannableLayout><ProductionReadinessPage /></ChannableLayout></ProtectedRoute>} /> */}
        <Route path="/repricing" element={<ProtectedRoute><ChannableLayout><RepricingPage /></ChannableLayout></ProtectedRoute>} />
        
        {/* Ads Spy */}
        <Route path="/ads-spy" element={<ProtectedRoute><ChannableLayout><AdsSpyPage /></ChannableLayout></ProtectedRoute>} />
        <Route path="/ads-spy/*" element={<ProtectedRoute><ChannableLayout><AdsSpyPage /></ChannableLayout></ProtectedRoute>} />
        
        {/* Page Builder */}
        <Route path="/page-builder" element={<ProtectedRoute><ChannableLayout><PageBuilderPage /></ChannableLayout></ProtectedRoute>} />
        <Route path="/page-builder/:pageId" element={<ProtectedRoute><PageEditorPage /></ProtectedRoute>} />
        
        {/* Enrichment */}
        <Route path="/enrichment" element={<ProtectedRoute><ChannableLayout><EnrichmentSettingsPage /></ChannableLayout></ProtectedRoute>} />
        <Route path="/enrichment/settings" element={<Navigate to="/enrichment" replace />} />
        
        {/* Documentation & API - DISABLED IN PRODUCTION (developer tools) */}
        {/* <Route path="/api-docs" element={<ProtectedRoute><ChannableLayout><SwaggerPage /></ChannableLayout></ProtectedRoute>} /> */}
        <Route path="/swagger" element={<Navigate to="/api-docs" replace />} />
        <Route path="/pwa-install" element={<PWAInstallPage />} />
        
        {/* Reports & SEO direct routes */}
        <Route path="/reports" element={<ProtectedRoute><ChannableLayout><Reports /></ChannableLayout></ProtectedRoute>} />
        <Route path="/seo" element={<ProtectedRoute><ChannableLayout><SEOManagerPage /></ChannableLayout></ProtectedRoute>} />
        <Route path="/seo/keywords" element={<ProtectedRoute><ChannableLayout><KeywordResearch /></ChannableLayout></ProtectedRoute>} />
        <Route path="/seo/rank-tracker" element={<ProtectedRoute><ChannableLayout><RankTracker /></ChannableLayout></ProtectedRoute>} />
        
        {/* Public pages */}
        <Route path="/guides/getting-started" element={<GettingStartedPage />} />
        <Route path="/academy" element={<AcademyHomePage />} />
        <Route path="/academy/course/:id" element={<AcademyHomePage />} />
        <Route path="/support" element={<ProtectedRoute><ChannableLayout><SupportMainPage /></ChannableLayout></ProtectedRoute>} />
        
        {/* Legacy redirects consolidés */}
        <Route path="/modern/*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/unified-dashboard" element={<Navigate to="/dashboard" replace />} />
        <Route path="/home-optimized" element={<Navigate to="/dashboard" replace />} />
        <Route path="/import/simplified" element={<Navigate to="/import" replace />} />
        
        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute>
            <AdminRoute>
              <ChannableLayout>
                <AdminRoutes />
              </ChannableLayout>
            </AdminRoute>
          </ProtectedRoute>
        } />
        
        {/* Sitemap */}
        <Route path="/sitemap" element={<ProtectedRoute><ChannableLayout><Sitemap /></ChannableLayout></ProtectedRoute>} />
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
