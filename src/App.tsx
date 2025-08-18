import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';

import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/layouts/AppLayout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { OptimizedSkeleton } from '@/components/common/OptimizedSkeleton';
import { ModalContextProvider } from '@/hooks/useModalHelpers';
import { ModalProvider } from '@/components/ModalProvider';

// Lazy loaded heavy pages
import {
  DashboardLazy,
  DashboardUltraProLazy,
  ImportLazy,
  ImportUltraProLazy,
  CatalogueRealLazy,
  CatalogueUltraProRealLazy,
  CatalogueUltraProAdvancedLazy,
  OrdersLazy,
  OrdersUltraProRealLazy,
  CRMLazy,
  CRMUltraProRealLazy,
  CRMProspectsUltraProLazy,
  TrackingRealLazy,
  TrackingUltraProLazy,
  SEOLazy,
  SEOUltraProLazy,
  MarketingLazy,
  MarketingUltraProLazy,
  InventoryLazy,
  InventoryUltraProRealLazy,
  AutomationLazy,
  AutomationUltraProLazy,
  AnalyticsLazy,
  AnalyticsUltraProLazy,
  ReviewsLazy,
  ReviewsUltraProLazy,
  SecurityLazy,
  SecurityUltraProLazy,
  SupportLazy,
  SupportUltraProLazy,
  BlogLazy,
  BlogUltraProLazy,
  PluginsLazy,
  PluginsUltraProLazy,
  MobileLazy,
  MobileUltraProLazy,
  ExtensionLazy,
  ExtensionUltraProLazy,
  StockLazy,
  StockUltraProLazy,
  SuppliersLazy,
  SuppliersUltraProLazy,
  AdminLazy,
  PaymentSuccessLazy,
} from '@/components/lazy/LazyPages';

// Light pages (direct imports)
import Index from './pages/Index';
import Auth from './pages/Auth';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Contact from './pages/Contact';
import BlogPage from './pages/Blog';
import BlogNew from './pages/BlogNew';
import PricingPlansFull from './pages/PricingPlansFull';
import FAQComplete from './pages/FAQComplete';
import CompanyPage from './pages/CompanyPage';
import Testimonials from './pages/Testimonials';
import Guides from './pages/Guides';
import Changelog from './pages/Changelog';
import ApiDocs from './pages/ApiDocs';
import FAQNew from './pages/FAQNew';
import Legal from './pages/Legal';
import Suppliers from './pages/Suppliers';
import WinnersPage from './domains/winners/pages/WinnersPage';
import Settings from './pages/Settings';
import MarketplaceOptimized from './pages/MarketplaceOptimized';
import IntegrationsOptimized from './pages/IntegrationsOptimized';
import FAQ from './pages/FAQ';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';
import CRMLeads from './pages/CRMLeads';
import CRMActivity from './pages/CRMActivity';
import CRMCalendar from './pages/CRMCalendar';
import CRMEmails from './pages/CRMEmails';
import CRMCalls from './pages/CRMCalls';
import TrackingInTransit from './pages/TrackingInTransit';
import TrackingToday from './pages/TrackingToday';
import SuiviEnTransitUltraPro from './pages/SuiviEnTransitUltraPro';
import AvisPositifUltraPro from './pages/AvisPositifUltraPro';
import PricingPage from './pages/PricingPage';

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ModalContextProvider>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <ModalProvider>
              <Routes>
            {/* Public routes */}
            <Route path="/" element={
              <AuthGuard requireAuth={false}>
                <Index />
              </AuthGuard>
            } />
            <Route path="/auth" element={
              <AuthGuard requireAuth={false}>
                <Auth />
              </AuthGuard>
            } />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/pricing-plans" element={<PricingPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/testimonials" element={<Testimonials />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/api-docs" element={<ApiDocs />} />
            <Route path="/faq-new" element={<FAQNew />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/pricing-plans-full" element={<PricingPlansFull />} />
            <Route path="/blog-new" element={<BlogNew />} />
            <Route path="/faq-complete" element={<FAQComplete />} />
            <Route path="/company" element={<CompanyPage />} />
            
            {/* Protected routes with layout */}
            <Route path="/dashboard" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <DashboardLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/dashboard/ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <DashboardUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/import" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <ImportLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/import-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <ImportUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/catalogue" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="grid" />}>
                    <CatalogueRealLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/catalogue-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="grid" />}>
                    <CatalogueUltraProRealLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/catalogue-ultra-pro-real" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="grid" />}>
                    <CatalogueUltraProRealLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/catalogue-ultra-pro-advanced" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="grid" />}>
                    <CatalogueUltraProAdvancedLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/marketplace" element={
              <AuthGuard>
                <AppLayout>
                  <MarketplaceOptimized />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/orders" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <OrdersLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/orders-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <OrdersUltraProRealLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <CRMLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <CRMUltraProRealLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm/leads" element={
              <AuthGuard>
                <AppLayout>
                  <CRMLeads />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm/activity" element={
              <AuthGuard>
                <AppLayout>
                  <CRMActivity />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm/calendar" element={
              <AuthGuard>
                <AppLayout>
                  <CRMCalendar />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm/emails" element={
              <AuthGuard>
                <AppLayout>
                  <CRMEmails />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm/calls" element={
              <AuthGuard>
                <AppLayout>
                  <CRMCalls />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm/prospects-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <CRMProspectsUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/tracking" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <TrackingRealLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/tracking-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <TrackingUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/tracking/in-transit" element={
              <AuthGuard>
                <AppLayout>
                  <TrackingInTransit />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/tracking/today" element={
              <AuthGuard>
                <AppLayout>
                  <TrackingToday />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/suivi/en-transit-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <SuiviEnTransitUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/reviews" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <ReviewsLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/reviews-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <ReviewsUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/avis/positif-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <AvisPositifUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/seo" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <SEOLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/seo-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <SEOUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/marketing" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <MarketingLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/marketing-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <MarketingUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/inventory" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <InventoryLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/inventory-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <InventoryUltraProRealLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/automation" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <AutomationLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/automation-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <AutomationUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/plugins" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="grid" />}>
                    <PluginsLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/plugins-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="grid" />}>
                    <PluginsUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/extension" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="detail" />}>
                    <ExtensionLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/extension-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="detail" />}>
                    <ExtensionUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/mobile" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="detail" />}>
                    <MobileLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/mobile-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="detail" />}>
                    <MobileUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/integrations" element={
              <AuthGuard>
                <AppLayout>
                  <IntegrationsOptimized />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/support" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="detail" />}>
                    <SupportLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/support-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="detail" />}>
                    <SupportUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/analytics" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <AnalyticsLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/analytics-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <AnalyticsUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/stock" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <StockLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/stock-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <StockUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/winners" element={
              <AuthGuard>
                <AppLayout>
                  <WinnersPage />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/blog" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <BlogLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/blog-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <BlogUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/settings" element={
              <AuthGuard>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/admin" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <AdminLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/faq" element={
              <AuthGuard>
                <AppLayout>
                  <FAQ />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/security" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <SecurityLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/security-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <SecurityUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/notifications" element={
              <AuthGuard>
                <AppLayout>
                  <Notifications />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/suppliers" element={
              <AuthGuard>
                <AppLayout>
                  <Suppliers />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/suppliers-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <SuppliersUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/dashboard-ultra-pro" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <DashboardUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/payment/success" element={
              <AuthGuard>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="detail" />}>
                    <PaymentSuccessLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
            </ModalProvider>
          </TooltipProvider>
        </ModalContextProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )

export default App;