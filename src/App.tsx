import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { UnifiedAuthProvider } from '@/contexts/UnifiedAuthContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UnifiedPlanProvider } from '@/components/plan/UnifiedPlanProvider';
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
const Catalog = lazy(() => import('@/pages/CatalogueReal'));
const Reports = lazy(() => import('@/pages/Reports'));
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const Suppliers = lazy(() => import('@/pages/ModernSuppliersHub'));
const Orders = lazy(() => import('@/pages/ModernOrdersPage'));
const Customers = lazy(() => import('@/pages/ModernCustomersPage'));

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
                <UnifiedPlanProvider>
                  <NotificationProvider>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<Index />} />
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/pricing" element={<Pricing />} />
                        
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
                </UnifiedPlanProvider>
              </UnifiedAuthProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </PerformanceProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
