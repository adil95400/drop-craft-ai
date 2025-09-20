import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { UnifiedAuthProvider } from '@/contexts/UnifiedAuthContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UnifiedPlanProvider } from '@/components/plan/UnifiedPlanProvider';
import { HelmetProvider } from 'react-helmet-async';
import { AppLayout } from '@/layouts/AppLayout';
import { NotificationProvider } from '@/components/notifications/NotificationService';
import { ThemeProvider } from 'next-themes';
import { GlobalModals } from '@/components/GlobalModals';
import '@/lib/i18n';

// Pages
import Index from '@/pages/Index';
import UnifiedDashboard from '@/pages/unified/UnifiedDashboard';
import Orders from '@/pages/Orders';
import Customers from '@/pages/Customers';
import Marketing from '@/pages/Marketing';
import SubscriptionDashboard from '@/pages/SubscriptionDashboard';
import QuotaManagerPage from '@/pages/QuotaManagerPage';
import Suppliers from "@/pages/Suppliers";
import AutomationPage from '@/pages/AutomationPage';
import ProductIntelligencePage from '@/pages/ProductIntelligencePage';
import UnifiedImport from '@/pages/unified/UnifiedImport';
import URLImportConfig from '@/pages/import/URLImportConfig';
import XMLImportConfig from '@/pages/import/XMLImportConfig';
import FTPImportConfig from '@/pages/import/FTPImportConfig';
import ScheduledImportConfig from '@/pages/import/ScheduledImportConfig';
import BulkImportConfig from '@/pages/import/BulkImportConfig';
import AIImportConfig from '@/pages/import/AIImportConfig';
import ImportHistory from '@/pages/ImportHistory';
import ImportedProducts from '@/pages/ImportedProducts';
import { ModuleRoutes } from '@/components/routing/ModuleRoutes';
import Products from '@/pages/Products';
import { RequirePlan } from '@/components/plan/RequirePlan';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Nouvelles pages modernes
import ModernProducts from '@/pages/modern/ModernProducts';
import ModernSuppliers from '@/pages/modern/ModernSuppliers';
import ModernImport from '@/pages/modern/ModernImport';
import ModernCustomers from '@/pages/modern/ModernCustomers';
import ModernOrders from '@/pages/modern/ModernOrders';
import ModernMarketing from '@/pages/modern/ModernMarketing';
import { ModernNavigation } from '@/components/layout/ModernNavigation';
import ModernBilling from '@/pages/modern/ModernBilling';
import { AdminLayout } from '@/layouts/AdminLayout';

// Nouvelles pages avancées
import { AdvancedImportPage } from '@/pages/AdvancedImportPage';
import { AdvancedProductsPage } from '@/pages/AdvancedProductsPage';
import { AdvancedSuppliersPage } from '@/pages/AdvancedSuppliersPage';
import { AdvancedModulesHub } from '@/pages/AdvancedModulesHub';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminProducts } from '@/pages/admin/AdminProducts';
import { AdminOrders } from '@/pages/admin/AdminOrders';
import { AdminCustomers } from '@/pages/admin/AdminCustomers';
import { AdminSuppliers } from '@/pages/admin/AdminSuppliers';
import AdminSubscriptions from '@/pages/admin/AdminSubscriptions';
import AdminIntegrations from '@/pages/admin/AdminIntegrations';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminSEO from '@/pages/admin/AdminSEO';
import AdminCRM from '@/pages/admin/AdminCRM';
import AdminMarketing from '@/pages/admin/AdminMarketing';
import AdminBlog from '@/pages/admin/AdminBlog';
import AdminAI from '@/pages/admin/AdminAI';
import AdminAutomation from '@/pages/admin/AdminAutomation';
import AdminSecurity from '@/pages/admin/AdminSecurity';
import AdminImport from '@/pages/admin/AdminImport';
import SyncManager from '@/pages/SyncManager';
import OrdersCenter from '@/pages/OrdersCenter';
import DashboardHome from '@/pages/DashboardHome';
import ImportManagement from '@/pages/ImportManagement';

// Nouvelles pages de refonte
import ModernDashboard from '@/pages/ModernDashboard';
import ModernSuppliersHub from '@/pages/ModernSuppliersHub'; 
import ModernProductsPage from '@/pages/ModernProductsPage';
import ModernSuppliersPage from '@/pages/ModernSuppliersPage';
import ModernImportPage from '@/pages/ModernImportPage';
import ModernOrdersPage from '@/pages/ModernOrdersPage';
import ModernIntegrationsHub from '@/pages/ModernIntegrationsHub';
import ModernMarketingPage from '@/pages/ModernMarketingPage';
import ModernCustomersPage from '@/pages/ModernCustomersPage';
import ModernAnalyticsPage from '@/pages/ModernAnalyticsPage';
import ModernMarketplacePage from '@/pages/ModernMarketplacePage';
import ModernSettingsPage from '@/pages/ModernSettingsPage';

// Import specialized pages
import CSVImportPage from '@/pages/import/CSVImportPage';
import WebScrapingPage from '@/pages/import/WebScrapingPage';
import APIImportPage from '@/pages/import/APIImportPage';
import DatabaseImportPage from '@/pages/import/DatabaseImportPage';
import AIGenerationPage from '@/pages/import/AIGenerationPage';
import ScheduledImportsPage from '@/pages/import/ScheduledImportsPage';

// Marketplace pages
import ProductDetailPage from '@/pages/marketplace/ProductDetailPage';
import CategoryPage from '@/pages/marketplace/CategoryPage';
import SupplierCatalogPage from '@/pages/marketplace/SupplierCatalogPage';

// Auth Page
import AuthPage from '@/pages/AuthPage';
import AdminPanel from '@/pages/AdminPanel';
import AIStudio from '@/pages/AIStudio';
import AutomationStudio from '@/pages/AutomationStudio';
import AnalyticsStudio from '@/pages/AnalyticsStudio';

// Business Pages
import CatalogPage from '@/pages/CatalogPage';
import CrmPage from '@/pages/CrmPage';
import MonitoringPage from '@/pages/MonitoringPage';

// Phase 3 Pages - Différenciation
import MarketplaceHubPage from '@/pages/MarketplaceHubPage';
import MultiTenantPage from '@/pages/MultiTenantPage';

// Profile & Settings Pages
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';

// Extensions Pages
import ExtensionsHub from '@/pages/ExtensionsHub';
import Extensions from '@/pages/Extensions';
import ExtensionMarketplace from '@/pages/ExtensionMarketplace';
import ExtensionDeveloper from '@/pages/ExtensionDeveloper';
import ExtensionCLI from '@/pages/ExtensionCLI';
import ExtensionWhiteLabel from '@/pages/ExtensionWhiteLabel';
import ExtensionSSO from '@/pages/ExtensionSSO';

// Phase 4 Pages
import ExtensionMarketplacePage from '@/pages/ExtensionMarketplacePage';
import AIAutomationPage from '@/pages/AIAutomationPage';
import BusinessIntelligencePage from '@/pages/BusinessIntelligencePage';
import PrintManager from '@/components/print/PrintManager';

// Landing Pages
import Features from '@/pages/Features';
import Pricing from '@/pages/Pricing';
import Contact from '@/pages/Contact';
import Testimonials from '@/pages/Testimonials';
import About from '@/pages/About';
import ModernBlog from '@/pages/ModernBlog';
import { BlogPostDetail } from '@/pages/BlogPostDetail';
import { BlogCategories } from '@/pages/BlogCategories';
import Legal from '@/pages/Legal';
import Status from '@/pages/Status';

// Super Dashboard Concurrentiel
import SuperDashboard from '@/pages/SuperDashboard';

// Unified Pages
import UnifiedDashboardPage from '@/pages/UnifiedDashboardPage';

import { StoreDashboard } from '@/pages/stores/StoreDashboard';
import { IntegrationsPage } from '@/pages/stores/IntegrationsPage';
import { ManageIntegrationPage } from '@/pages/stores/ManageIntegrationPage';
import ConnectStorePage from '@/pages/stores/ConnectStorePage';
import StoreDetailPage from '@/pages/stores/StoreDetailPage';
import { StoreSettingsPage } from '@/pages/stores/StoreSettingsPage';

import { ExtensionDownloadPage } from "./pages/ExtensionDownloadPage";
import { DashboardLayout } from '@/components/layout/DashboardLayout';
// Optimized client dashboard for ShopOpti+
import OptimizedClientDashboard from '@/components/dashboard/OptimizedClientDashboard';
import NotFoundPage from '@/pages/NotFoundPage';
import { AuthDebug } from '@/components/debug/AuthDebug';

// Competitive Intelligence Components
import { WinningProductsMarketplace } from '@/components/intelligence/WinningProductsMarketplace';
import { SocialTrendsAnalyzer } from '@/components/intelligence/SocialTrendsAnalyzer';
import { OrderAutomationCenter } from '@/components/automation/OrderAutomationCenter';
import { StockManagementHub } from '@/components/automation/StockManagementHub';
import { CreativeStudio } from '@/components/creative/CreativeStudio';
import { CompetitiveAdvantageHub } from '@/components/dashboard/CompetitiveAdvantageHub';
import { UnifiedDashboard as CommandCenter } from '@/components/dashboard/UnifiedDashboard';
import { MobileAppDashboard } from '@/components/mobile/MobileAppDashboard';
import { TeamCollaboration } from '@/components/team/TeamCollaboration';
import { WhiteLabelSolution } from '@/components/enterprise/WhiteLabelSolution';
import { EnterpriseAPI } from '@/components/enterprise/EnterpriseAPI';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <UnifiedAuthProvider>
              <UnifiedPlanProvider>
                <NotificationProvider>
              <Routes>
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <AppLayout><DashboardHome /></AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <AppLayout><Profile /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <AppLayout><Settings /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/modern" element={<AppLayout><ModernNavigation /></AppLayout>} />
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
                <Route path="/dashboard-old" element={
                  <ProtectedRoute>
                    <AppLayout><UnifiedDashboard /></AppLayout>
                  </ProtectedRoute>
                } />
                
                {/* Hub fournisseurs moderne */}
                <Route path="/suppliers" element={
                  <ProtectedRoute>
                    <AppLayout><ModernSuppliersHub /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/suppliers-old" element={
                  <ProtectedRoute>
                    <AppLayout><Suppliers /></AppLayout>
                  </ProtectedRoute>
                } />
                {/* Products moderne */}
                <Route path="/products" element={
                  <ProtectedRoute>
                    <AppLayout><ModernProductsPage /></AppLayout>
                  </ProtectedRoute>
                } />
                
                {/* Orders moderne */}
                <Route path="/orders" element={
                  <ProtectedRoute>
                    <AppLayout><ModernOrdersPage /></AppLayout>
                  </ProtectedRoute>
                } />
                
                {/* Customers moderne */}
                <Route path="/customers" element={
                  <ProtectedRoute>
                    <AppLayout><ModernCustomersPage /></AppLayout>
                  </ProtectedRoute>
                } />
                
                {/* Analytics moderne */}
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <AppLayout><ModernAnalyticsPage /></AppLayout>
                  </ProtectedRoute>
                } />
                
                {/* Intégrations Hub */}
                <Route path="/integrations" element={
                  <ProtectedRoute>
                    <AppLayout><ModernIntegrationsHub /></AppLayout>
                  </ProtectedRoute>
                } />
                
                {/* Marketing Hub */}
                <Route path="/marketing" element={
                  <ProtectedRoute>
                    <AppLayout><ModernMarketingPage /></AppLayout>
                  </ProtectedRoute>
                } />
                
                {/* Stores */}
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
                <Route path="/stores/:storeId" element={
                  <ProtectedRoute>
                    <AppLayout><StoreDetailPage /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/stores/:storeId/settings" element={
                  <ProtectedRoute>
                    <AppLayout><StoreSettingsPage /></AppLayout>
                  </ProtectedRoute>
                } />
                
                {/* Dashboard Stores Routes */}
                <Route path="/dashboard/stores" element={
                  <ProtectedRoute>
                    <AppLayout><StoreDashboard /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/stores/connect" element={
                  <ProtectedRoute>
                    <AppLayout><ConnectStorePage /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/stores/:storeId" element={
                  <ProtectedRoute>
                    <AppLayout><StoreDetailPage /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/stores/:storeId/settings" element={
                  <ProtectedRoute>
                    <AppLayout><StoreSettingsPage /></AppLayout>
                  </ProtectedRoute>
                } />
                
                {/* Marketplace */}
                <Route path="/marketplace" element={
                  <ProtectedRoute>
                    <AppLayout><ModernMarketplacePage /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/marketplace/product/:id" element={
                  <ProtectedRoute>
                    <AppLayout><ProductDetailPage /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/marketplace/category/:category" element={
                  <ProtectedRoute>
                    <AppLayout><CategoryPage /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/marketplace/supplier/:supplierId" element={
                  <ProtectedRoute>
                    <AppLayout><SupplierCatalogPage /></AppLayout>
                  </ProtectedRoute>
                 } />
                 
                 {/* Catalog Management */}
                 <Route path="/catalog/*" element={
                   <ProtectedRoute>
                     <AppLayout><CatalogPage /></AppLayout>
                   </ProtectedRoute>
                 } />
                 
                 {/* CRM & Marketing */}
                 <Route path="/crm" element={
                   <ProtectedRoute>
                     <AppLayout><CrmPage /></AppLayout>
                   </ProtectedRoute>
                 } />
                 
                 {/* System Monitoring */}
                 <Route path="/monitoring" element={
                   <ProtectedRoute>
                     <AppLayout><MonitoringPage /></AppLayout>
                   </ProtectedRoute>
                 } />
                 
                 {/* Phase 3 - Différenciation Routes */}
                 <Route path="/marketplace-hub" element={
                   <ProtectedRoute>
                     <RequirePlan minPlan="ultra_pro">
                       <AppLayout><MarketplaceHubPage /></AppLayout>
                     </RequirePlan>
                   </ProtectedRoute>
                 } />
                 <Route path="/multi-tenant" element={
                   <ProtectedRoute>
                     <RequirePlan minPlan="ultra_pro">
                       <AppLayout><MultiTenantPage /></AppLayout>
                     </RequirePlan>
                   </ProtectedRoute>
                 } />
                 <Route path="/observability" element={
                   <ProtectedRoute>
                     <RequirePlan minPlan="ultra_pro">
                       <AppLayout><MonitoringPage /></AppLayout>
                     </RequirePlan>
                   </ProtectedRoute>
                 } />
                 
                 {/* Import moderne */}
                <Route path="/import" element={
                  <ProtectedRoute>
                    <AppLayout><ModernImportPage /></AppLayout>
                  </ProtectedRoute>
                } />
                
                {/* Hub modules avancés */}
                <Route path="/advanced" element={
                  <ProtectedRoute>
                    <AppLayout><AdvancedModulesHub /></AppLayout>
                  </ProtectedRoute>
                } />
                
                {/* Pages avancées inspirées des concurrents */}
                <Route path="/import/advanced" element={
                  <ProtectedRoute>
                    <RequirePlan minPlan="ultra_pro">
                      <AppLayout><AdvancedImportPage /></AppLayout>
                    </RequirePlan>
                  </ProtectedRoute>
                } />
                
                <Route path="/products/advanced" element={
                  <ProtectedRoute>
                    <RequirePlan minPlan="ultra_pro">
                      <AppLayout><AdvancedProductsPage /></AppLayout>
                    </RequirePlan>
                  </ProtectedRoute>
                } />
                
                <Route path="/suppliers/advanced" element={
                  <ProtectedRoute>
                    <RequirePlan minPlan="ultra_pro">
                      <AppLayout><AdvancedSuppliersPage /></AppLayout>
                    </RequirePlan>
                  </ProtectedRoute>
                } />
                <Route path="/import/csv" element={
                  <ProtectedRoute>
                    <AppLayout><CSVImportPage /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/import/url" element={
                  <ProtectedRoute>
                    <AppLayout><WebScrapingPage /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/import/api" element={
                  <ProtectedRoute>
                    <AppLayout><APIImportPage /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/import/database" element={
                  <ProtectedRoute>
                    <AppLayout><DatabaseImportPage /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/import/ai-generation" element={
                  <ProtectedRoute>
                    <AppLayout><AIGenerationPage /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/import/scheduled" element={
                  <ProtectedRoute>
                    <AppLayout><ScheduledImportsPage /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/automation" element={
                  <ProtectedRoute>
                    <AppLayout><AutomationPage /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/product-intelligence" element={
                  <ProtectedRoute>
                    <AppLayout><ProductIntelligencePage /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/import-old" element={<AppLayout><UnifiedImport /></AppLayout>} />
                
                {/* Routes modernes avec protection par plan */}
                <Route path="/modern/products" element={
                  <AppLayout>
                    <RequirePlan minPlan="pro">
                      <ModernProducts />
                    </RequirePlan>
                  </AppLayout>
                } />
                <Route path="/modern/suppliers" element={
                  <AppLayout>
                    <RequirePlan minPlan="pro">
                      <ModernSuppliers />
                    </RequirePlan>
                  </AppLayout>
                } />
                
                {/* Nouvelles routes refonte */}
                <Route path="/suppliers-v2" element={
                  <ProtectedRoute>
                    <AppLayout><ModernSuppliersPage /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/import-v2" element={
                  <ProtectedRoute>
                    <AppLayout><ModernImportPage /></AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/modern/billing" element={<AppLayout><ModernBilling /></AppLayout>} />
                <Route path="/modern/customers" element={
                  <AppLayout>
                    <RequirePlan minPlan="pro">
                      <ModernCustomers />
                    </RequirePlan>
                  </AppLayout>
                } />
                <Route path="/modern/orders" element={
                  <AppLayout>
                    <RequirePlan minPlan="pro">
                      <ModernOrders />
                    </RequirePlan>
                  </AppLayout>
                } />
                <Route path="/modern/marketing" element={
                  <AppLayout>
                    <RequirePlan minPlan="ultra_pro">
                      <ModernMarketing />
                    </RequirePlan>
                  </AppLayout>
                } />
                
                <Route path="/import/url-config" element={<AppLayout><URLImportConfig /></AppLayout>} />
                <Route path="/import/xml-config" element={<AppLayout><XMLImportConfig /></AppLayout>} />
                <Route path="/import/ftp-config" element={<AppLayout><FTPImportConfig /></AppLayout>} />
                <Route path="/import/scheduled-config" element={<AppLayout><ScheduledImportConfig /></AppLayout>} />
                <Route path="/import/bulk-config" element={<AppLayout><BulkImportConfig /></AppLayout>} />
                <Route path="/import/ai-config" element={<AppLayout><AIImportConfig /></AppLayout>} />
                <Route path="/import/history" element={<AppLayout><ImportHistory /></AppLayout>} />
                <Route path="/import/products" element={<AppLayout><ImportedProducts /></AppLayout>} />
                <Route path="/subscription" element={<AppLayout><SubscriptionDashboard /></AppLayout>} />
                <Route path="/quotas" element={<AppLayout><QuotaManagerPage /></AppLayout>} />
                
                {/* Extensions Routes */}
                <Route path="/extensions" element={
                  <ProtectedRoute>
                    <AppLayout><Extensions /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/extensions/hub" element={
                  <ProtectedRoute>
                    <AppLayout><ExtensionsHub /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/extensions/marketplace" element={
                  <ProtectedRoute>
                    <AppLayout><ExtensionMarketplace /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/extensions/developer" element={
                  <ProtectedRoute>
                    <AppLayout><ExtensionDeveloper /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/extensions/cli" element={
                  <ProtectedRoute>
                    <RequirePlan minPlan="pro">
                      <AppLayout><ExtensionCLI /></AppLayout>
                    </RequirePlan>
                  </ProtectedRoute>
                } />
                <Route path="/extensions/white-label" element={
                  <ProtectedRoute>
                    <RequirePlan minPlan="ultra_pro">
                      <AppLayout><ExtensionWhiteLabel /></AppLayout>
                    </RequirePlan>
                  </ProtectedRoute>
                } />
                <Route path="/extensions/sso" element={
                  <ProtectedRoute>
                    <RequirePlan minPlan="ultra_pro">
                      <AppLayout><ExtensionSSO /></AppLayout>
                    </RequirePlan>
                  </ProtectedRoute>
                } />
                <Route path="/print" element={
                  <ProtectedRoute>
                    <AppLayout><PrintManager /></AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/extension-download" element={<ExtensionDownloadPage />} />
                
                {/* Competitive Intelligence Routes */}
                <Route path="/winning-products" element={
                  <ProtectedRoute>
                    <AppLayout><WinningProductsMarketplace /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/social-trends" element={
                  <ProtectedRoute>
                    <AppLayout><SocialTrendsAnalyzer /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/automation-center" element={
                  <ProtectedRoute>
                    <AppLayout><OrderAutomationCenter /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/stock-management" element={
                  <ProtectedRoute>
                    <AppLayout><StockManagementHub /></AppLayout>
                  </ProtectedRoute>
                } />
                
                {/* Phase 4: Extension Marketplace & AI Features */}
                <Route path="/extensions-marketplace" element={
                  <ProtectedRoute>
                    <RequirePlan minPlan="ultra_pro">
                      <AppLayout><ExtensionMarketplacePage /></AppLayout>
                    </RequirePlan>
                  </ProtectedRoute>
                } />
                <Route path="/ai-automation" element={
                  <ProtectedRoute>
                    <RequirePlan minPlan="ultra_pro">
                      <AppLayout><AIAutomationPage /></AppLayout>
                    </RequirePlan>
                  </ProtectedRoute>
                } />
                <Route path="/business-intelligence" element={
                  <ProtectedRoute>
                    <RequirePlan minPlan="ultra_pro">
                      <AppLayout><BusinessIntelligencePage /></AppLayout>
                    </RequirePlan>
                  </ProtectedRoute>
                } />
                
                {/* Phase 4: Mobile & Enterprise Routes */}
                <Route path="/mobile-apps" element={
                  <ProtectedRoute>
                    <AppLayout><MobileAppDashboard /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/team-collaboration" element={
                  <ProtectedRoute>
                    <AppLayout><TeamCollaboration /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/white-label" element={
                  <ProtectedRoute>
                    <AppLayout><WhiteLabelSolution /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/enterprise-api" element={
                  <ProtectedRoute>
                    <AppLayout><EnterpriseAPI /></AppLayout>
                  </ProtectedRoute>
                } />
                
                {/* Phase 5: Final Integration & Polish Routes */}
                <Route path="/creative-studio" element={
                  <ProtectedRoute>
                    <AppLayout><CreativeStudio /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/competitive-advantage" element={
                  <ProtectedRoute>
                    <AppLayout><CompetitiveAdvantageHub /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/command-center" element={
                  <ProtectedRoute>
                    <AppLayout><CommandCenter /></AppLayout>
                  </ProtectedRoute>
                } />
                
                {/* Landing Pages */}
                <Route path="/features" element={<Features />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/testimonials" element={<Testimonials />} />
                <Route path="/about" element={<About />} />
                <Route path="/blog" element={
                  <ProtectedRoute>
                    <AppLayout><ModernBlog /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/blog/post/:id" element={
                  <ProtectedRoute>
                    <AppLayout><BlogPostDetail /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/blog/categories" element={
                  <ProtectedRoute>
                    <AppLayout><BlogCategories /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/blog/category/:category" element={
                  <ProtectedRoute>
                    <AppLayout><ModernBlog /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/status" element={<Status />} />
                
                <Route path="/*" element={<AppLayout><ModuleRoutes /></AppLayout>} />
                
                {/* Sync Manager Route */}
                <Route path="/sync-manager" element={
                  <ProtectedRoute>
                    <AppLayout><SyncManager /></AppLayout>
                  </ProtectedRoute>
                } />
                
                {/* Orders Center Route */}
                <Route path="/orders-center" element={
                  <ProtectedRoute>
                    <AppLayout><OrdersCenter /></AppLayout>
                  </ProtectedRoute>
                } />
                
                {/* Import Advanced Route */}
                <Route path="/import/advanced" element={
                  <ProtectedRoute>
                    <AppLayout><ImportManagement /></AppLayout>
                  </ProtectedRoute>
                } />
                
                {/* Admin Panel Route */}
                <Route path="/admin-panel" element={
                  <AdminRoute>
                    <AppLayout><AdminPanel /></AppLayout>
                  </AdminRoute>
                } />

                {/* Admin Routes avec AdminLayout moderne et Outlet */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="import" element={<AdminImport />} />
                  <Route path="suppliers" element={<AdminSuppliers />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="crm" element={
                    <RequirePlan minPlan="pro">
                      <AdminCRM />
                    </RequirePlan>
                  } />
                  <Route path="marketing" element={
                    <RequirePlan minPlan="pro">
                      <AdminMarketing />
                    </RequirePlan>
                  } />
                  <Route path="seo" element={
                    <RequirePlan minPlan="pro">
                      <AdminSEO />
                    </RequirePlan>
                  } />
                  <Route path="blog" element={
                    <RequirePlan minPlan="pro">
                      <AdminBlog />
                    </RequirePlan>
                  } />
                  <Route path="ai" element={
                    <RequirePlan minPlan="ultra_pro">
                      <AdminAI />
                    </RequirePlan>
                  } />
                  <Route path="automation" element={
                    <RequirePlan minPlan="ultra_pro">
                      <AdminAutomation />
                    </RequirePlan>
                  } />
                  <Route path="security" element={
                    <RequirePlan minPlan="ultra_pro">
                      <AdminSecurity />
                    </RequirePlan>
                  } />
                  <Route path="integrations" element={<AdminIntegrations />} />
                  <Route path="subscriptions" element={<AdminSubscriptions />} />
                </Route>

                {/* 404 Not Found Page */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <Toaster />
              <SonnerToaster />
              <GlobalModals />
              <AuthDebug />
            </NotificationProvider>
          </UnifiedPlanProvider>
        </UnifiedAuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </QueryClientProvider>
</HelmetProvider>
  );
}

export default App;