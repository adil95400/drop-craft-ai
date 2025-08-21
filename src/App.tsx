import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';

import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { AppLayout } from '@/layouts/AppLayout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { OptimizedSkeleton } from '@/components/common/OptimizedSkeleton';
import { ModalContextProvider } from '@/hooks/useModalHelpers';
import { ModalProvider } from '@/components/ModalProvider';

import IntegrationsOptimized from './pages/IntegrationsOptimized';
import IntegrationsUltraPro from './pages/IntegrationsUltraPro';
import Integrations from './pages/Integrations';

// Lazy loaded heavy pages
import {
  DashboardLazy,
  DashboardUltraProLazy,
  ImportLazy,
  ImportUltraProLazy,
  ImportedProductsLazy,
  ImportManagementLazy,
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
  MarketingCreateLazy,
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
  IntegrationsUltraProLazy,
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
import TestimonialsNew from './pages/TestimonialsNew';
import Guides from './pages/Guides';
import GuidesNew from './pages/GuidesNew';
import Changelog from './pages/Changelog';
import ApiDocs from './pages/ApiDocs';
import FAQNew from './pages/FAQNew';
import Legal from './pages/Legal';
import Suppliers from './pages/Suppliers';
import WinnersPage from './domains/winners/pages/WinnersPage';
import Settings from './pages/Settings';
import MarketplaceOptimized from './pages/MarketplaceOptimized';
import FAQ from './pages/FAQ';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';
import UserProfile from './pages/UserProfile';
import Reports from './pages/Reports';
import NotificationCenter from './pages/NotificationCenter';
import StockAlerts from './pages/StockAlerts';
import SupportCenter from './pages/SupportCenter';
import SubscriptionManagement from './pages/SubscriptionManagement';
import TeamManagement from './pages/TeamManagement';
import APIManagement from './pages/APIManagement';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import WorkflowBuilder from './pages/WorkflowBuilder';
import BusinessIntelligence from './pages/BusinessIntelligence';
import SecurityCenter from './pages/SecurityCenter';
import DataManagement from './pages/DataManagement';
import ComplianceCenter from './pages/ComplianceCenter';
import AIAssistant from './pages/AIAssistant';
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

// Ultra Pro Optimized pages (direct imports)
import ImportUltraProOptimized from './pages/ImportUltraProOptimized';
import CatalogueUltraProOptimized from './pages/CatalogueUltraProOptimized';
import OrdersUltraProOptimized from './pages/OrdersUltraProOptimized';
import CRMUltraProOptimized from './pages/CRMUltraProOptimized';
import AnalyticsUltraProOptimized from './pages/AnalyticsUltraProOptimized';
import AutomationUltraProOptimized from './pages/AutomationUltraProOptimized';
import SEOUltraProOptimized from './pages/SEOUltraProOptimized';
import MarketingUltraProOptimized from './pages/MarketingUltraProOptimized';
import ReviewsUltraProOptimized from './pages/ReviewsUltraProOptimized';

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
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={
              <AdminRoute>
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <AdminLazy />
                  </Suspense>
                </AppLayout>
              </AdminRoute>
            } />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/pricing-plans" element={<PricingPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/testimonials" element={<Testimonials />} />
            <Route path="/testimonials-new" element={<TestimonialsNew />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/guides-new" element={<GuidesNew />} />
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
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <ImportLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/import-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <ImportUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/imported-products" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <ImportedProductsLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/import-management" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <ImportManagementLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/catalogue" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="grid" />}>
                    <CatalogueRealLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/catalogue-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="grid" />}>
                    <CatalogueUltraProRealLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/catalogue-ultra-pro-real" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="grid" />}>
                    <CatalogueUltraProRealLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/catalogue-ultra-pro-advanced" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="grid" />}>
                    <CatalogueUltraProAdvancedLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/integrations" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Integrations />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/integrations-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <IntegrationsUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/marketplace" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <MarketplaceOptimized />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/orders" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <OrdersLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/orders-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <OrdersUltraProRealLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <CRMLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <CRMUltraProRealLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm/leads" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <CRMLeads />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm/activity" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <CRMActivity />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm/calendar" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <CRMCalendar />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm/emails" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <CRMEmails />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm/calls" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <CRMCalls />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm/prospects-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <CRMProspectsUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/tracking" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <TrackingRealLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/tracking-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <TrackingUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/tracking/in-transit" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <TrackingInTransit />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/tracking/today" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <TrackingToday />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/suivi/en-transit-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <SuiviEnTransitUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/reviews" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <ReviewsLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/reviews-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <ReviewsUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/avis/positif-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <AvisPositifUltraPro />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/seo" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <SEOLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/seo-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <SEOUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/marketing" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <MarketingLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/marketing/create" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <MarketingCreateLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/marketing-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <MarketingUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/inventory" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <InventoryLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/inventory-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <InventoryUltraProRealLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/automation" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <AutomationLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/automation-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <AutomationUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/plugins" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="grid" />}>
                    <PluginsLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/plugins-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="grid" />}>
                    <PluginsUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/extension" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="detail" />}>
                    <ExtensionLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/extension-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="detail" />}>
                    <ExtensionUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/mobile" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="detail" />}>
                    <MobileLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/mobile-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="detail" />}>
                    <MobileUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/support" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="detail" />}>
                    <SupportLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/support-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="detail" />}>
                    <SupportUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/analytics" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <AnalyticsLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/analytics-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <AnalyticsUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/stock" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <StockLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/stock-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <StockUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/winners" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <WinnersPage />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/blog" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <BlogLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/blog-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <BlogUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/settings" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Settings />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/faq" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <FAQ />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/security" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <SecurityLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/security-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <SecurityUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/notifications" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Notifications />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/user-profile" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <UserProfile />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/reports" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Reports />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/notification-center" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <NotificationCenter />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/stock-alerts" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <StockAlerts />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/support-center" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <SupportCenter />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/subscription" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <SubscriptionManagement />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/team" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <TeamManagement />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/api" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <APIManagement />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/advanced-analytics" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <AdvancedAnalytics />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/workflow-builder" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <WorkflowBuilder />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/business-intelligence" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <BusinessIntelligence />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/security-center" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <SecurityCenter />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/data-management" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <DataManagement />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/compliance-center" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <ComplianceCenter />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/ai-assistant" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <AIAssistant />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/suppliers" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suppliers />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/suppliers-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="list" />}>
                    <SuppliersUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/dashboard-ultra-pro" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="dashboard" />}>
                    <DashboardUltraProLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/payment/success" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <Suspense fallback={<OptimizedSkeleton variant="detail" />}>
                    <PaymentSuccessLazy />
                  </Suspense>
                </AppLayout>
              </AuthGuard>
            } />
            
            {/* Ultra Pro Optimized routes */}
            <Route path="/import-ultra-pro-optimized" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <ImportUltraProOptimized />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/catalogue-ultra-pro-optimized" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <CatalogueUltraProOptimized />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/orders-ultra-pro-optimized" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <OrdersUltraProOptimized />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/crm-ultra-pro-optimized" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <CRMUltraProOptimized />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/analytics-ultra-pro-optimized" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <AnalyticsUltraProOptimized />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/automation-ultra-pro-optimized" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <AutomationUltraProOptimized />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/seo-ultra-pro-optimized" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <SEOUltraProOptimized />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/marketing-ultra-pro-optimized" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <MarketingUltraProOptimized />
                </AppLayout>
              </AuthGuard>
            } />
            <Route path="/reviews-ultra-pro-optimized" element={
              <AuthGuard requireRole="user">
                <AppLayout>
                  <ReviewsUltraProOptimized />
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