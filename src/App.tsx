import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { UnifiedAuthProvider } from '@/contexts/UnifiedAuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UnifiedPlanProvider } from '@/components/plan/UnifiedPlanProvider';
import { HelmetProvider } from 'react-helmet-async';
import { AppLayout } from '@/layouts/AppLayout';
import { NotificationProvider } from '@/components/notifications/NotificationService';
import { ThemeProvider } from 'next-themes';
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
import { AdminLayout } from '@/components/admin/AdminLayout';
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

// Business Pages
import CatalogPage from '@/pages/CatalogPage';
import CrmPage from '@/pages/CrmPage';
import MonitoringPage from '@/pages/MonitoringPage';

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
import PrintManager from '@/components/print/PrintManager';

// Landing Pages
import Features from '@/pages/Features';
import Pricing from '@/pages/Pricing';
import Contact from '@/pages/Contact';
import Testimonials from '@/pages/Testimonials';
import About from '@/pages/About';
import Blog from '@/pages/Blog';
import Legal from '@/pages/Legal';
import Status from '@/pages/Status';

// Unified Pages
import UnifiedDashboardPage from '@/pages/UnifiedDashboardPage';

// Store Pages
import StoresPage from '@/pages/stores/StoresPage';
import ConnectStorePage from '@/pages/stores/ConnectStorePage';
import StoreDetailPage from '@/pages/stores/StoreDetailPage';
import { StoreSettingsPage } from '@/pages/stores/StoreSettingsPage';

import { ExtensionDownloadPage } from "./pages/ExtensionDownloadPage";
import { DashboardLayout } from '@/components/layout/DashboardLayout';
// Optimized client dashboard for ShopOpti+
import OptimizedClientDashboard from '@/components/dashboard/OptimizedClientDashboard';

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
          <AuthProvider>
            <UnifiedAuthProvider>
              <UnifiedPlanProvider>
                <NotificationProvider>
              <Routes>
                <Route path="/" element={<Index />} />
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
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <AppLayout><OptimizedClientDashboard /></AppLayout>
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
                    <AppLayout><StoresPage /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/stores/connect" element={
                  <ProtectedRoute>
                    <AppLayout><ConnectStorePage /></AppLayout>
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
                    <AppLayout><StoresPage /></AppLayout>
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
                 <Route path="/catalog" element={
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
                 
                 {/* Import moderne */}
                <Route path="/import" element={
                  <ProtectedRoute>
                    <AppLayout><ModernImportPage /></AppLayout>
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
                
                {/* Landing Pages */}
                <Route path="/features" element={<Features />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/testimonials" element={<Testimonials />} />
                <Route path="/about" element={<About />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/status" element={<Status />} />
                
                <Route path="/*" element={<AppLayout><ModuleRoutes /></AppLayout>} />
                
                {/* Admin Panel Simple */}
                <Route path="/admin-panel" element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Toaster />
              <SonnerToaster />
            </NotificationProvider>
          </UnifiedPlanProvider>
        </UnifiedAuthProvider>
        </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;