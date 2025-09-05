import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UnifiedProvider } from '@/components/unified/UnifiedProvider';
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
          <UnifiedProvider>
            <NotificationProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/modern" element={<AppLayout><ModernNavigation /></AppLayout>} />
                <Route path="/dashboard" element={<AppLayout><UnifiedDashboard /></AppLayout>} />
                <Route path="/products" element={<AppLayout><Products /></AppLayout>} />
                <Route path="/orders" element={<AppLayout><Orders /></AppLayout>} />
                <Route path="/customers" element={<AppLayout><Customers /></AppLayout>} />
                <Route path="/marketing" element={<AppLayout><Marketing /></AppLayout>} />
                <Route path="/suppliers" element={<AppLayout><Suppliers /></AppLayout>} />
                <Route path="/import" element={<AppLayout><UnifiedImport /></AppLayout>} />
                
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
                <Route path="/modern/billing" element={<AppLayout><ModernBilling /></AppLayout>} />
                
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
          </UnifiedProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;