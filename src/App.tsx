import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UnifiedPlanProvider } from '@/components/plan/UnifiedPlanProvider';
import { HelmetProvider } from 'react-helmet-async';
import { AppLayout } from '@/layouts/AppLayout';
import { NotificationProvider } from '@/components/notifications/NotificationService';

// Pages
import Index from '@/pages/Index';
import UnifiedDashboard from '@/pages/unified/UnifiedDashboard';
import Orders from '@/pages/Orders';
import Customers from '@/pages/Customers';
import Marketing from '@/pages/Marketing';
import SubscriptionDashboard from '@/pages/SubscriptionDashboard';
import QuotaManagerPage from '@/pages/QuotaManagerPage';
import Suppliers from "@/pages/Suppliers";
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
import AdminDashboard from '@/components/modern/AdminDashboard';

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

// Profile & Settings Pages
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';

// Extensions Pages
import ExtensionsHub from '@/pages/ExtensionsHub';
import MarketplacePage from '@/pages/extensions/MarketplacePage';
import DeveloperPage from '@/pages/extensions/DeveloperPage';
import CLIToolsPage from '@/pages/extensions/CLIToolsPage';
import WhiteLabelPage from '@/pages/extensions/WhiteLabelPage';
import SSOPage from '@/pages/extensions/SSOPage';

// Landing Pages
import Features from '@/pages/Features';
import Pricing from '@/pages/Pricing';
import Contact from '@/pages/Contact';
import Testimonials from '@/pages/Testimonials';
import About from '@/pages/About';
import Blog from '@/pages/Blog';

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
        <AuthProvider>
          <UnifiedPlanProvider>
            <NotificationProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <AppLayout><ProfilePage /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <AppLayout><ModernSettingsPage /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/modern" element={<AppLayout><ModernNavigation /></AppLayout>} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <AppLayout><ModernDashboard /></AppLayout>
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
                <Route path="/extensions" element={<AppLayout><ExtensionsHub /></AppLayout>} />
                <Route path="/extensions/marketplace" element={<AppLayout><MarketplacePage /></AppLayout>} />
                <Route path="/extensions/developer" element={<AppLayout><DeveloperPage /></AppLayout>} />
                <Route path="/extensions/cli" element={<AppLayout><CLIToolsPage /></AppLayout>} />
                <Route path="/extensions/white-label" element={<AppLayout><WhiteLabelPage /></AppLayout>} />
                <Route path="/extensions/sso" element={<AppLayout><SSOPage /></AppLayout>} />
                
                {/* Landing Pages */}
                <Route path="/features" element={<Features />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/testimonials" element={<Testimonials />} />
                <Route path="/about" element={<About />} />
                <Route path="/blog" element={<Blog />} />
                
                <Route path="/*" element={<AppLayout><ModuleRoutes /></AppLayout>} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={
                  <AppLayout>
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  </AppLayout>
                } />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Toaster />
              <SonnerToaster />
            </NotificationProvider>
          </UnifiedPlanProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;