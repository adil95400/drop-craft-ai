/**
 * Routes Core - Dashboard, Stores, Orders, Customers
 * Consolidé - Suppression des pages dupliquées
 * Redirections gérées par LegacyRedirectHandler
 */
import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

// Dashboard
const DashboardHome = lazy(() => import('@/pages/Dashboard'));
const Profile = lazy(() => import('@/pages/Profile'));
const Settings = lazy(() => import('@/pages/Settings'));

// Quick actions
const SyncManagerPage = lazy(() => import('@/pages/sync/SyncManagerPage'));
const MarketplaceSyncDashboard = lazy(() => import('@/pages/MarketplaceSyncDashboard'));
const MultiStoreCentralDashboard = lazy(() => import('@/pages/MultiStoreCentralDashboard'));
const StoreSyncDashboard = lazy(() => import('@/pages/StoreSyncDashboard'));
const StockManagementDashboard = lazy(() => import('@/pages/StockManagementDashboard'));
const AdvancedNotificationCenter = lazy(() => import('@/pages/AdvancedNotificationCenter'));
const MultiStoreAnalyticsDashboard = lazy(() => import('@/pages/MultiStoreAnalyticsDashboard'));

// Order Management - Consolidated
const AIStoreBuilderHub = lazy(() => import('@/pages/store/AIStoreBuilderHub'));
const BrandingInvoicesHub = lazy(() => import('@/pages/invoices/BrandingInvoicesHub'));
const PrintOnDemandHub = lazy(() => import('@/pages/pod/PrintOnDemandHub'));
const CompetitiveIntelligenceHub = lazy(() => import('@/pages/research/CompetitiveIntelligenceHub'));

// Stock & Reports
const StockManagement = lazy(() => import('@/pages/stock/StockManagementPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));

// Analytics & Products
const AnalyticsDashboard = lazy(() => import('@/pages/AnalyticsDashboard'));
const ProductsMainPage = lazy(() => import('@/pages/products/ProductsMainPage'));

// AI & Automation
const AIInsightsPage = lazy(() => import('@/pages/AIInsightsPage'));
const WorkflowsPage = lazy(() => import('@/pages/WorkflowsPage'));

// Settings & Management
const APIManagementPage = lazy(() => import('@/pages/APIManagementPage'));
const BillingPage = lazy(() => import('@/pages/BillingPage'));

// Learning & Security
const AcademyPage = lazy(() => import('@/pages/AcademyPage'));
const SecurityDashboard = lazy(() => import('@/pages/SecurityDashboard'));

// Subscription - Consolidated to SubscriptionDashboard
const SubscriptionDashboard = lazy(() => import('@/pages/SubscriptionDashboard'));

// Onboarding
const OnboardingHubPage = lazy(() => import('@/pages/onboarding/OnboardingHubPage'));

export function CoreRoutes() {
  return (
    <Routes>
      {/* Dashboard */}
      <Route index element={<DashboardHome />} />
      <Route path="profile" element={<Profile />} />
      <Route path="settings" element={<Settings />} />
      
      {/* Module E: AI Store Builder */}
      <Route path="store/builder" element={<AIStoreBuilderHub />} />
      
      {/* Module G: Custom Invoices */}
      <Route path="invoices" element={<BrandingInvoicesHub />} />
      
      {/* Module H: Print On Demand */}
      <Route path="pod" element={<PrintOnDemandHub />} />
      
      {/* Module F: Competitive Intelligence */}
      <Route path="research/intelligence" element={<CompetitiveIntelligenceHub />} />
      
      {/* Quick Actions */}
      <Route path="sync-manager" element={<SyncManagerPage />} />
      <Route path="marketplace-sync" element={<MarketplaceSyncDashboard />} />
      <Route path="multi-store" element={<MultiStoreCentralDashboard />} />
      <Route path="notifications" element={<AdvancedNotificationCenter />} />
      
      {/* Stock & Reports */}
      <Route path="stock" element={<StockManagement />} />
      <Route path="reports" element={<ReportsPage />} />
      
      {/* Analytics & Products */}
      <Route path="analytics" element={<AnalyticsDashboard />} />
      <Route path="products" element={<ProductsMainPage />} />
      
      {/* AI & Automation */}
      <Route path="ai-insights" element={<AIInsightsPage />} />
      <Route path="workflows" element={<WorkflowsPage />} />
      
      {/* Settings & Management */}
      <Route path="api" element={<APIManagementPage />} />
      <Route path="billing" element={<BillingPage />} />
      
      {/* Learning & Security */}
      <Route path="academy" element={<AcademyPage />} />
      <Route path="security" element={<SecurityDashboard />} />
      
      {/* Onboarding */}
      <Route path="onboarding" element={<OnboardingHubPage />} />
      
      {/* Subscription & Notifications */}
      <Route path="subscription" element={<SubscriptionDashboard />} />
    </Routes>
  );
}
