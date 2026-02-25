/**
 * Point d'entrée principal du système de routing
 * Architecture modulaire optimisée - Routes consolidées et nettoyées
 * 
 * OPTIMISATIONS v5.7.3:
 * - Suppression des ~100 redirections inline
 * - Gestionnaire de redirections centralisé (LegacyRedirectHandler)
 * - Structure claire et maintenable
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Layouts
import { ChannableLayout } from '@/components/channable/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';

// Centralized Legacy Redirect Handler
import { LegacyRedirectHandler } from './LegacyRedirectsHandler';

// Route modules (lazy loaded for code splitting)
const PublicRoutes = lazy(() => import('./PublicRoutes').then(m => ({ default: m.PublicRoutes })));
const CoreRoutes = lazy(() => import('./CoreRoutes').then(m => ({ default: m.CoreRoutes })));
const ProductRoutes = lazy(() => import('./ProductRoutes').then(m => ({ default: m.ProductRoutes })));
const CatalogRoutes = lazy(() => import('./CatalogRoutes').then(m => ({ default: m.CatalogRoutes })));
const OrderRoutes = lazy(() => import('./OrderRoutes').then(m => ({ default: m.OrderRoutes })));
const CustomerRoutes = lazy(() => import('./CustomerRoutes').then(m => ({ default: m.CustomerRoutes })));
const AnalyticsRoutes = lazy(() => import('./AnalyticsRoutes').then(m => ({ default: m.AnalyticsRoutes })));
const AutomationRoutes = lazy(() => import('./AutomationRoutes').then(m => ({ default: m.AutomationRoutes })));
const MarketingRoutes = lazy(() => import('./MarketingRoutes').then(m => ({ default: m.MarketingRoutes })));
const IntegrationRoutes = lazy(() => import('./IntegrationRoutes').then(m => ({ default: m.IntegrationRoutes })));
const EnterpriseRoutes = lazy(() => import('./EnterpriseRoutes').then(m => ({ default: m.EnterpriseRoutes })));
const SettingsRoutes = lazy(() => import('./SettingsRoutes').then(m => ({ default: m.SettingsRoutes })));
const ExtensionRoutes = lazy(() => import('./ExtensionRoutes').then(m => ({ default: m.ExtensionRoutes })));
const AuditRoutes = lazy(() => import('./AuditRoutes').then(m => ({ default: m.AuditRoutes })));
const StockRoutes = lazy(() => import('./StockRoutes').then(m => ({ default: m.StockRoutes })));
const ImportRoutes = lazy(() => import('./ImportRoutes').then(m => ({ default: m.ImportRoutes })));
const FeedRoutes = lazy(() => import('./FeedRoutes').then(m => ({ default: m.FeedRoutes })));
const AdminRoutes = lazy(() => import('./AdminRoutes').then(m => ({ default: m.AdminRoutes })));
const SupplierRoutes = lazy(() => import('./SupplierRoutes'));
const ChannelRoutes = lazy(() => import('./ChannelRoutes').then(m => ({ default: m.ChannelRoutes })));
const PricingRoutes = lazy(() => import('./PricingRoutes').then(m => ({ default: m.PricingRoutes })));
const AIRoutes = lazy(() => import('./AIRoutes').then(m => ({ default: m.AIRoutes })));
const ResearchRoutes = lazy(() => import('./ResearchRoutes').then(m => ({ default: m.ResearchRoutes })));
const ToolsRoutes = lazy(() => import('./ToolsRoutes').then(m => ({ default: m.ToolsRoutes })));
const IntelligenceHubPage = lazy(() => import('@/pages/intelligence/IntelligenceHubPage'));
const BusinessIntelligencePage = lazy(() => import('@/pages/intelligence/BusinessIntelligencePage'));

// Pages directes (lazy loaded)
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const SyncManagerPage = lazy(() => import('@/pages/sync/SyncManagerPage'));
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
// EnrichmentSettingsPage removed - functionality consolidated
const AdvancedAnalyticsPage = lazy(() => import('@/pages/AdvancedAnalyticsPage'));
const PerformanceMonitoringPage = lazy(() => import('@/pages/PerformanceMonitoringPage'));
const GrowthDashboardPage = lazy(() => import('@/pages/GrowthDashboardPage'));
const AIRecommendationsPage = lazy(() => import('@/pages/AIRecommendationsPage'));
const PlatformOnboardingPage = lazy(() => import('@/pages/PlatformOnboardingPage'));
const OnboardingWizardPage = lazy(() => import('@/pages/OnboardingWizardPage'));
const FreelanceMarketplacePage = lazy(() => import('@/pages/FreelanceMarketplacePage'));
const GettingStartedPage = lazy(() => import('@/pages/guides/GettingStartedPage'));
const AcademyHomePage = lazy(() => import('@/pages/academy/AcademyHomePage'));
const SupportMainPage = lazy(() => import('@/pages/support/SupportMainPage'));
const CatalogIntelligencePage = lazy(() => import('@/pages/catalog/CatalogIntelligencePage'));
const ABTestingPage = lazy(() => import('@/pages/ABTestingPage'));
const PageBuilderPage = lazy(() => import('@/pages/PageBuilderPage'));
const PageEditorPage = lazy(() => import('@/pages/PageEditorPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const AlertCenterPage = lazy(() => import('@/pages/alerts/AlertCenterPage'));
const Reports = lazy(() => import('@/pages/Reports'));
const ReviewsPage = lazy(() => import('@/pages/reviews/ReviewsPage'));
const CRMDashboardPage = lazy(() => import('@/pages/crm/CRMDashboardPage'));
const Sitemap = lazy(() => import('@/pages/Sitemap'));
const DocumentationPage = lazy(() => import('@/pages/documentation/DocumentationPage'));
const SEOContentHubPage = lazy(() => import('@/pages/seo/SEOContentHubPage'));

// Profile & Subscription (Settings group)
const SubscriptionDashboard = lazy(() => import('@/pages/SubscriptionDashboard'));
const ChoosePlanPage = lazy(() => import('@/pages/ChoosePlanPage'));
const BillingPage = lazy(() => import('@/pages/BillingPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const APIDocumentationPage = lazy(() => import('@/pages/APIDocumentationPage'));

// Loading components
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      <p className="text-sm text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

// Dashboard-specific skeleton for smoother perceived loading
const DashboardSkeleton = lazy(() => import('@/components/dashboard/DashboardSkeleton').then(m => ({ default: m.DashboardSkeleton })));

/**
 * Protected route wrapper helper
 */
const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <ChannableLayout>
      {children}
    </ChannableLayout>
  </ProtectedRoute>
);

/**
 * Router principal de l'application
 * Structure hiérarchique avec lazy loading optimisé
 */
export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LegacyRedirectHandler>
        <Routes>
          {/* ═══════════════════════════════════════════════════════════════
              PUBLIC ROUTES - Non authentifiés
          ═══════════════════════════════════════════════════════════════ */}
          <Route path="/*" element={<PublicRoutes />} />
          
          {/* Shopify Store (public) */}
          <Route path="/store" element={<ShopifyStore />} />
          <Route path="/store/product/:handle" element={<ShopifyProductDetail />} />
          
          {/* Public pages */}
          <Route path="/guides/getting-started" element={<GettingStartedPage />} />
          <Route path="/academy" element={<AcademyHomePage />} />
          <Route path="/academy/course/:id" element={<AcademyHomePage />} />
          <Route path="/pwa-install" element={<PWAInstallPage />} />

          {/* ═══════════════════════════════════════════════════════════════
              CORE PROTECTED ROUTES - Modules principaux
          ═══════════════════════════════════════════════════════════════ */}
          
          {/* Dashboard & Core */}
          <Route path="/dashboard/*" element={<Protected><CoreRoutes /></Protected>} />
          
          {/* Products & Catalog */}
          <Route path="/products/*" element={<Protected><ProductRoutes /></Protected>} />
          <Route path="/catalog/*" element={<Protected><CatalogRoutes /></Protected>} />
          
          {/* Orders & Customers */}
          <Route path="/orders/*" element={<Protected><OrderRoutes /></Protected>} />
          <Route path="/customers/*" element={<Protected><CustomerRoutes /></Protected>} />
          
          {/* Stores & Channels */}
          <Route path="/stores-channels/*" element={<Protected><ChannelRoutes /></Protected>} />
          <Route path="/channels/*" element={<Protected><ChannelRoutes /></Protected>} />
          
          {/* Sources & Import */}
          <Route path="/import/*" element={<Protected><ImportRoutes /></Protected>} />
          <Route path="/suppliers/*" element={<Protected><SupplierRoutes /></Protected>} />
          <Route path="/feeds/*" element={<Protected><FeedRoutes /></Protected>} />
          
          {/* Analytics & Insights */}
          <Route path="/analytics/*" element={<Protected><AnalyticsRoutes /></Protected>} />
          <Route path="/audit/*" element={<Protected><AuditRoutes /></Protected>} />
          <Route path="/research/*" element={<Protected><ResearchRoutes /></Protected>} />
          <Route path="/intelligence" element={<Protected><IntelligenceHubPage /></Protected>} />
          <Route path="/intelligence/bi" element={<Protected><BusinessIntelligencePage /></Protected>} />
          <Route path="/intelligence/predictions" element={<Protected><IntelligenceHubPage /></Protected>} />
          <Route path="/intelligence/opportunities" element={<Protected><IntelligenceHubPage /></Protected>} />
          
          {/* Automation & AI */}
          <Route path="/automation/*" element={<Protected><AutomationRoutes /></Protected>} />
          <Route path="/ai/*" element={<Protected><AIRoutes /></Protected>} />
          <Route path="/pricing-manager/*" element={<Protected><PricingRoutes /></Protected>} />
          
          {/* Marketing, SEO & CRM */}
          <Route path="/marketing/*" element={<Protected><MarketingRoutes /></Protected>} />
          <Route path="/seo/content-hub" element={<Protected><SEOContentHubPage /></Protected>} />
          <Route path="/seo/*" element={<Navigate to="/seo/content-hub" replace />} />
          <Route path="/crm/*" element={<Protected><CRMDashboardPage /></Protected>} />
          <Route path="/inventory/*" element={<Navigate to="/stock" replace />} />
          
          {/* Tools & Utilities */}
          <Route path="/tools/*" element={<Protected><ToolsRoutes /></Protected>} />
          <Route path="/stock/*" element={<Protected><StockRoutes /></Protected>} />
          
          {/* Integrations & Extensions */}
          <Route path="/integrations/*" element={<Protected><IntegrationRoutes /></Protected>} />
          <Route path="/extensions/*" element={<Protected><ExtensionRoutes /></Protected>} />
          
          {/* Settings */}
          <Route path="/settings/*" element={<Protected><SettingsRoutes /></Protected>} />
          
          {/* Enterprise */}
          <Route path="/enterprise/*" element={<Protected><EnterpriseRoutes /></Protected>} />

          {/* ═══════════════════════════════════════════════════════════════
              STANDALONE PROTECTED PAGES
          ═══════════════════════════════════════════════════════════════ */}
          
          {/* Creation Pages */}
          <Route path="/products/create" element={<Protected><CreateProduct /></Protected>} />
          <Route path="/orders/create" element={<Protected><CreateOrder /></Protected>} />
          <Route path="/orders/bulk" element={<Protected><BulkOrdersPage /></Protected>} />
          <Route path="/customers/create" element={<Protected><CreateCustomer /></Protected>} />
          <Route path="/notifications/create" element={<Protected><CreateNotification /></Protected>} />
          <Route path="/notifications" element={<Protected><NotificationsPage /></Protected>} />
          <Route path="/alerts" element={<Protected><AlertCenterPage /></Protected>} />
          
          {/* Feature Pages */}
          <Route path="/sync-manager" element={<Protected><SyncManagerPage /></Protected>} />
          <Route path="/reviews" element={<Protected><ReviewsPage /></Protected>} />
          <Route path="/advanced" element={<Protected><AdvancedAnalyticsPage /></Protected>} />
          <Route path="/monitoring" element={<Protected><PerformanceMonitoringPage /></Protected>} />
          <Route path="/catalog-intelligence" element={<Protected><CatalogIntelligencePage /></Protected>} />
          <Route path="/coupons" element={<Protected><CouponsManagementPage /></Protected>} />
          <Route path="/trial" element={<Protected><FreeTrialActivationPage /></Protected>} />
          <Route path="/ab-testing" element={<Protected><ABTestingPage /></Protected>} />
          <Route path="/repricing" element={<Navigate to="/pricing-manager/repricing" replace />} />
          <Route path="/enrichment" element={<Navigate to="/catalog/attributes" replace />} />
          <Route path="/reports" element={<Protected><Reports /></Protected>} />
          <Route path="/growth" element={<Protected><GrowthDashboardPage /></Protected>} />
          <Route path="/ai-recommendations" element={<Protected><AIRecommendationsPage /></Protected>} />
          <Route path="/onboarding/platform" element={<Protected><PlatformOnboardingPage /></Protected>} />
          <Route path="/onboarding/wizard" element={<ProtectedRoute><OnboardingWizardPage /></ProtectedRoute>} />
          <Route path="/services" element={<Protected><FreelanceMarketplacePage /></Protected>} />
          
          {/* Profile & Subscription (Settings group) */}
          <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
          <Route path="/subscription" element={<Protected><SubscriptionDashboard /></Protected>} />
          <Route path="/choose-plan" element={<Protected><ChoosePlanPage /></Protected>} />
          <Route path="/api/documentation" element={<Protected><APIDocumentationPage /></Protected>} />
          
          {/* Ads Spy - redirect to research */}
          <Route path="/ads-spy" element={<Navigate to="/research/ads" replace />} />
          <Route path="/ads-spy/*" element={<Navigate to="/research/ads" replace />} />
          
          {/* Page Builder */}
          <Route path="/page-builder" element={<Protected><PageBuilderPage /></Protected>} />
          <Route path="/page-builder/:pageId" element={<ProtectedRoute><PageEditorPage /></ProtectedRoute>} />
          
          {/* Help & Support */}
          <Route path="/help-center/documentation/:moduleSlug" element={<Protected><DocumentationPage /></Protected>} />
          <Route path="/help-center/documentation" element={<Protected><DocumentationPage /></Protected>} />
          <Route path="/help-center" element={<Protected><DocumentationPage /></Protected>} />
          <Route path="/support" element={<Protected><SupportMainPage /></Protected>} />
          
          {/* Sitemap */}
          <Route path="/sitemap" element={<Protected><Sitemap /></Protected>} />

          {/* ═══════════════════════════════════════════════════════════════
              ADMIN ROUTES - Accès restreint
          ═══════════════════════════════════════════════════════════════ */}
          <Route path="/admin/*" element={
            <ProtectedRoute>
              <AdminRoute>
                <ChannableLayout>
                  <AdminRoutes />
                </ChannableLayout>
              </AdminRoute>
            </ProtectedRoute>
          } />

          {/* ═══════════════════════════════════════════════════════════════
              404 - Catch all
          ═══════════════════════════════════════════════════════════════ */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </LegacyRedirectHandler>
    </Suspense>
  );
}
