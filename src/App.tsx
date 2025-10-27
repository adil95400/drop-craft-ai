import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { UnifiedAuthProvider } from '@/contexts/UnifiedAuthContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UnifiedProvider } from '@/components/unified/UnifiedProvider';
import { HelmetProvider } from 'react-helmet-async';
import { PerformanceProvider } from '@/components/providers/PerformanceProvider';
import { NotificationProvider } from '@/components/notifications/NotificationService';
import { ThemeProvider } from 'next-themes';
import { GlobalModals } from '@/components/GlobalModals';
import '@/lib/i18n';
import { Loader2 } from 'lucide-react';

// Critical pages loaded immediately
import Index from '@/pages/Index';
import AuthPage from '@/pages/AuthPage';
import NotFoundPage from '@/pages/NotFoundPage';
import { AppLayout } from '@/layouts/AppLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';

// Public pages
const ModernBlog = lazy(() => import('@/pages/ModernBlog'));
const Contact = lazy(() => import('@/pages/Contact'));
const FAQ = lazy(() => import('@/pages/FAQ'));
const GuidePage = lazy(() => import('@/pages/GuidePage'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const About = lazy(() => import('@/pages/About'));

// Lazy load all other pages for performance
const DashboardHome = lazy(() => import('@/pages/DashboardHome'));
const SuperDashboard = lazy(() => import('@/pages/SuperDashboard'));
const OptimizedClientDashboard = lazy(() => import('@/components/dashboard/OptimizedClientDashboard'));
const Profile = lazy(() => import('@/pages/Profile'));
const Settings = lazy(() => import('@/pages/Settings'));
const ModernSuppliersHub = lazy(() => import('@/pages/ModernSuppliersHub'));
const ModernProductsPage = lazy(() => import('@/pages/ModernProductsPage'));
const ModernOrdersPage = lazy(() => import('@/pages/ModernOrdersPage'));
const ModernCustomersPage = lazy(() => import('@/pages/ModernCustomersPage'));
const ModernAnalyticsPage = lazy(() => import('@/pages/ModernAnalyticsPage'));
const ModernIntegrationsHub = lazy(() => import('@/pages/ModernIntegrationsHub'));
const ModernMarketingPage = lazy(() => import('@/pages/ModernMarketingPage'));
const StoreDashboard = lazy(() => import('@/pages/stores/StoreDashboard').then(m => ({ default: m.StoreDashboard })));
const CRM = lazy(() => import('@/pages/CRM'));
const CRMLeads = lazy(() => import('@/pages/CRMLeads'));
const CRMActivity = lazy(() => import('@/pages/CRMActivity'));
const CRMEmails = lazy(() => import('@/pages/CRMEmails'));
const CRMCalls = lazy(() => import('@/pages/CRMCalls'));
const CRMCalendar = lazy(() => import('@/pages/CRMCalendar'));
const Catalogue = lazy(() => import('@/pages/CatalogueReal'));
const Extension = lazy(() => import('@/pages/Extension'));
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const AIStudio = lazy(() => import('@/pages/AIStudio'));
const AutomationStudio = lazy(() => import('@/pages/AutomationStudio'));
const AnalyticsStudio = lazy(() => import('@/pages/AnalyticsStudio'));
const AdvancedAnalytics = lazy(() => import('@/pages/AdvancedAnalytics'));
const AIAutomationHub = lazy(() => import('@/pages/AIAutomationHub'));
const APIDocumentationPage = lazy(() => import('@/pages/APIDocumentationPage'));
const APIDeveloperPage = lazy(() => import('@/pages/APIDeveloperPage'));
const MultiTenantManagementPage = lazy(() => import('@/pages/MultiTenantManagementPage'));
const PerformanceMonitoringPage = lazy(() => import('@/pages/PerformanceMonitoringPage'));
const SettingsPage = lazy(() => import('@/pages/Settings'));

// Payment pages
const PaymentSuccess = lazy(() => import('@/pages/PaymentSuccess'));
const PaymentCancelled = lazy(() => import('@/pages/PaymentCancelled'));
const Pricing = lazy(() => import('@/pages/Pricing'));

// Admin pages
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

// Additional pages
const SEO = lazy(() => import('@/pages/SEO'));
const Automations = lazy(() => import('@/pages/AutomationPage'));
const Integrations = lazy(() => import('@/pages/Integrations'));
const Reports = lazy(() => import('@/pages/Reports'));
const ConnectStorePage = lazy(() => import('@/pages/stores/ConnectStorePage'));
const IntegrationsPage = lazy(() => import('@/pages/stores/IntegrationsPage').then(m => ({ default: m.IntegrationsPage })));
const ManageIntegrationPage = lazy(() => import('@/pages/stores/ManageIntegrationPage').then(m => ({ default: m.ManageIntegrationPage })));
const MarketplaceHubPage = lazy(() => import('@/pages/MarketplaceHubPage'));
const MultiTenantPage = lazy(() => import('@/pages/MultiTenantPage'));
const AdvancedMonitoringPage = lazy(() => import('@/pages/AdvancedMonitoringPage'));
const ImportSourcesPage = lazy(() => import('@/pages/ImportSourcesPage'));
const UnifiedImport = lazy(() => import('@/pages/UnifiedImport'));
const Tracking = lazy(() => import('@/pages/Tracking'));
const Reviews = lazy(() => import('@/pages/Reviews'));
const Inventory = lazy(() => import('@/pages/Inventory'));
const Plugins = lazy(() => import('@/pages/Plugins'));
const Mobile = lazy(() => import('@/pages/Mobile'));
const Support = lazy(() => import('@/pages/Support'));
const ExtensionsHub = lazy(() => import('@/pages/ExtensionsHub'));
const WinnersPage = lazy(() => import('@/pages/WinnersPage'));
const CommercePage = lazy(() => import('@/pages/CommercePage'));
const SEOManagerPage = lazy(() => import('@/pages/SEOManagerPage'));
const CrmPage = lazy(() => import('@/pages/CrmPage'));
const AutomationPage = lazy(() => import('@/pages/AutomationPage'));
const SecurityDashboard = lazy(() => import('@/pages/SecurityDashboard'));
const AIPage = lazy(() => import('@/pages/AIPage'));
const MarketplaceIntegrationsPage = lazy(() => import('@/pages/MarketplaceIntegrationsPage'));
const PremiumSuppliersPage = lazy(() => import('@/pages/PremiumSuppliersPage'));
const FeedManagerPage = lazy(() => import('@/pages/FeedManagerPage'));
const AIIntelligencePage = lazy(() => import('@/pages/AIIntelligencePage'));
const PWAInstallPage = lazy(() => import('@/pages/PWAInstallPage'));
const ExtensionAPIPage = lazy(() => import('@/pages/ExtensionAPIPage'));
const AdvancedAnalyticsPage = lazy(() => import('@/pages/AdvancedAnalyticsPage'));
const CollaborationPage = lazy(() => import('@/pages/CollaborationPage'));

// Priority pages (from QuickActions)
const AdvancedImportPage = lazy(() => import('@/pages/AdvancedImportPage'));
const SyncManagerPage = lazy(() => import('@/pages/SyncManagerPage'));
const OrdersCenterPage = lazy(() => import('@/pages/OrdersCenterPage'));

// Optimized QueryClient with caching strategies
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
      gcTime: 10 * 60 * 1000,   // 10 minutes - cache retention
      refetchOnWindowFocus: false, // Reduce unnecessary refetches
      refetchOnReconnect: true,
      retry: 1, // Only retry failed requests once
      networkMode: 'offlineFirst', // Prefer cached data when available
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      <p className="text-sm text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <PerformanceProvider showWidget={false}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
              <ErrorBoundary>
                <UnifiedAuthProvider>
                  <UnifiedProvider>
                    <NotificationProvider>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<Index />} />
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/pricing" element={<Pricing />} />
                        <Route path="/blog" element={<ModernBlog />} />
                        <Route path="/blog/:id" element={<ModernBlog />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/faq" element={<FAQ />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/terms" element={<TermsOfService />} />
                        <Route path="/about" element={<About />} />
                        
                        {/* Payment Routes */}
                        <Route path="/payment/success" element={<PaymentSuccess />} />
                        <Route path="/payment/cancelled" element={<PaymentCancelled />} />
                        
                        {/* Protected routes */}
                        <Route path="/dashboard" element={
                          <ProtectedRoute>
                            <AppLayout><DashboardHome /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/dashboard-super" element={
                          <ProtectedRoute>
                            <AppLayout><SuperDashboard /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/dashboard-classic" element={
                          <ProtectedRoute>
                            <AppLayout><OptimizedClientDashboard /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/profile" element={
                          <ProtectedRoute>
                            <AppLayout><Profile /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/settings" element={
                          <ProtectedRoute>
                            <AppLayout><SettingsPage /></AppLayout>
                          </ProtectedRoute>
                        } />

                        {/* Core features */}
                        <Route path="/suppliers" element={
                          <ProtectedRoute>
                            <AppLayout><ModernSuppliersHub /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/products" element={
                          <ProtectedRoute>
                            <AppLayout><ModernProductsPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/orders" element={
                          <ProtectedRoute>
                            <AppLayout><ModernOrdersPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/customers" element={
                          <ProtectedRoute>
                            <AppLayout><ModernCustomersPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/analytics" element={
                          <ProtectedRoute>
                            <AppLayout><ModernAnalyticsPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/integrations" element={
                          <ProtectedRoute>
                            <AppLayout><ModernIntegrationsHub /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/marketplace-integrations" element={
                          <ProtectedRoute>
                            <AppLayout><MarketplaceIntegrationsPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/premium-suppliers" element={
                          <ProtectedRoute>
                            <AppLayout><PremiumSuppliersPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/feed-manager" element={
                          <ProtectedRoute>
                            <AppLayout><FeedManagerPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/ai-intelligence" element={
                          <ProtectedRoute>
                            <AppLayout><AIIntelligencePage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/pwa-install" element={
                          <ProtectedRoute>
                            <AppLayout><PWAInstallPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/extensions-api" element={
                          <ProtectedRoute>
                            <AppLayout><ExtensionAPIPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/advanced-analytics" element={
                          <ProtectedRoute>
                            <AppLayout><AdvancedAnalyticsPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/collaboration" element={
                          <ProtectedRoute>
                            <AppLayout><CollaborationPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/marketing" element={
                          <ProtectedRoute>
                            <AppLayout><ModernMarketingPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/stores" element={
                          <ProtectedRoute>
                            <AppLayout><StoreDashboard /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/stores/connect" element={
                          <ProtectedRoute>
                            <AppLayout><ConnectStorePage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/stores/integrations" element={
                          <ProtectedRoute>
                            <AppLayout><IntegrationsPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/stores/integrations/:id" element={
                          <ProtectedRoute>
                            <AppLayout><ManageIntegrationPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/marketplace-hub" element={
                          <ProtectedRoute>
                            <AppLayout><MarketplaceHubPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/multi-tenant" element={
                          <ProtectedRoute>
                            <AppLayout><MultiTenantPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/observability" element={
                          <ProtectedRoute>
                            <AppLayout><AdvancedMonitoringPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/import" element={
                          <ProtectedRoute>
                            <AppLayout><UnifiedImport /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/import/sources" element={
                          <ProtectedRoute>
                            <AppLayout><ImportSourcesPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/tracking" element={
                          <ProtectedRoute>
                            <AppLayout><Tracking /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/reviews" element={
                          <ProtectedRoute>
                            <AppLayout><Reviews /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/inventory" element={
                          <ProtectedRoute>
                            <AppLayout><Inventory /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/plugins" element={
                          <ProtectedRoute>
                            <AppLayout><Plugins /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/mobile" element={
                          <ProtectedRoute>
                            <AppLayout><Mobile /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/support" element={
                          <ProtectedRoute>
                            <AppLayout><Support /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/guide" element={
                          <ProtectedRoute>
                            <AppLayout><GuidePage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/extensions-hub" element={
                          <ProtectedRoute>
                            <AppLayout><ExtensionsHub /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/winners" element={
                          <ProtectedRoute>
                            <AppLayout><WinnersPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/commerce" element={
                          <ProtectedRoute>
                            <AppLayout><CommercePage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/seo" element={
                          <ProtectedRoute>
                            <AppLayout><SEOManagerPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/crm" element={
                          <ProtectedRoute>
                            <AppLayout><CrmPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/automation" element={
                          <ProtectedRoute>
                            <AppLayout><AutomationPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/security" element={
                          <ProtectedRoute>
                            <AppLayout><SecurityDashboard /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/ai" element={
                          <ProtectedRoute>
                            <AppLayout><AIPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/import/advanced" element={
                          <ProtectedRoute>
                            <AppLayout><AdvancedImportPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/sync-manager" element={
                          <ProtectedRoute>
                            <AppLayout><SyncManagerPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/orders-center" element={
                          <ProtectedRoute>
                            <AppLayout><OrdersCenterPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/crm" element={
                          <ProtectedRoute>
                            <AppLayout><CRM /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/crm/leads" element={
                          <ProtectedRoute>
                            <AppLayout><CRMLeads /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/crm/activity" element={
                          <ProtectedRoute>
                            <AppLayout><CRMActivity /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/crm/emails" element={
                          <ProtectedRoute>
                            <AppLayout><CRMEmails /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/crm/calls" element={
                          <ProtectedRoute>
                            <AppLayout><CRMCalls /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/crm/calendar" element={
                          <ProtectedRoute>
                            <AppLayout><CRMCalendar /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/catalog" element={
                          <ProtectedRoute>
                            <AppLayout><Catalogue /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/extension" element={
                          <ProtectedRoute>
                            <AppLayout><Extension /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/marketplace" element={
                          <ProtectedRoute>
                            <AppLayout><Marketplace /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        {/* AI & Automation Studios */}
                        <Route path="/ai-studio" element={
                          <ProtectedRoute>
                            <AppLayout><AIStudio /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/automation-studio" element={
                          <ProtectedRoute>
                            <AppLayout><AutomationStudio /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/analytics-studio" element={
                          <ProtectedRoute>
                            <AppLayout><AnalyticsStudio /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/advanced-analytics" element={
                          <ProtectedRoute>
                            <AppLayout><AdvancedAnalytics /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/ai-automation" element={
                          <ProtectedRoute>
                            <AppLayout><AIAutomationHub /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/api-docs" element={
                          <ProtectedRoute>
                            <AppLayout><APIDocumentationPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/api-developer" element={
                          <ProtectedRoute>
                            <AppLayout><APIDeveloperPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/multi-tenant-management" element={
                          <ProtectedRoute>
                            <AppLayout><MultiTenantManagementPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/performance-monitoring" element={
                          <ProtectedRoute>
                            <AppLayout><PerformanceMonitoringPage /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/seo" element={
                          <ProtectedRoute>
                            <AppLayout><SEO /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/automations" element={
                          <ProtectedRoute>
                            <AppLayout><Automations /></AppLayout>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/reports" element={
                          <ProtectedRoute>
                            <AppLayout><Reports /></AppLayout>
                          </ProtectedRoute>
                        } />

                        {/* Admin routes */}
                        <Route path="/admin/*" element={
                          <AdminRoute>
                            <AdminLayout />
                          </AdminRoute>
                        } />

                        {/* 404 - must be last */}
                        <Route path="*" element={<NotFoundPage />} />
                      </Routes>
                    </Suspense>
                    
                    <GlobalModals />
                    <Toaster />
                    <SonnerToaster />
                    </NotificationProvider>
                  </UnifiedProvider>
                </UnifiedAuthProvider>
              </ErrorBoundary>
          </ThemeProvider>
        </PerformanceProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
