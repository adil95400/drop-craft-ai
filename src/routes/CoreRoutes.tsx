/**
 * Routes Core - Dashboard, Stores, Orders, Customers
 * Consolidé - Utilise exports nommés correctement
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Dashboard
const DashboardHome = lazy(() => import('@/pages/Dashboard'));
const ProfilePage = lazy(() => import('@/pages/stores/StoreDashboard'));
const SettingsPage = lazy(() => import('@/pages/stores/StoreDashboard'));
const SyncManagerPage = lazy(() => import('@/pages/sync/SyncManagerPage'));
const MarketplaceSyncDashboard = lazy(() => import('@/pages/MarketplaceSyncDashboard'));
const StoreDashboard = lazy(() => import('@/pages/stores/StoreDashboard'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const AdvancedAnalyticsPage = lazy(() => import('@/pages/AdvancedAnalyticsPage'));
const AIStoreBuilderHub = lazy(() => import('@/pages/store/AIStoreBuilderHub'));
const BrandingInvoicesHub = lazy(() => import('@/pages/invoices/BrandingInvoicesHub'));
const PrintOnDemandHub = lazy(() => import('@/pages/pod/PrintOnDemandHub'));
const CompetitiveIntelligenceHub = lazy(() => import('@/pages/research/CompetitiveIntelligenceHub'));
const StockManagement = lazy(() => import('@/pages/stock/StockManagementPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const ChannableProductsPage = lazy(() => import('@/pages/products/ChannableProductsPage'));
const PredictiveAnalyticsPage = lazy(() => import('@/pages/PredictiveAnalyticsPage'));
const WorkflowBuilderAdvanced = lazy(() => import('@/pages/automation/WorkflowBuilderPage'));
const APIManagementPage = lazy(() => import('@/pages/APIManagementPage'));
const BillingPage = lazy(() => import('@/pages/BillingPage'));
const AcademyPage = lazy(() => import('@/pages/AcademyPage'));
const SecurityDashboard = lazy(() => import('@/pages/SecurityDashboard'));
const SubscriptionDashboard = lazy(() => import('@/pages/SubscriptionDashboard'));
const OnboardingHubPage = lazy(() => import('@/pages/onboarding/OnboardingHubPage'));

export function CoreRoutes() {
  return (
    <Routes>
      <Route index element={<DashboardHome />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="store/builder" element={<AIStoreBuilderHub />} />
      <Route path="invoices" element={<BrandingInvoicesHub />} />
      <Route path="pod" element={<PrintOnDemandHub />} />
      <Route path="research/intelligence" element={<CompetitiveIntelligenceHub />} />
      <Route path="sync-manager" element={<SyncManagerPage />} />
      <Route path="marketplace-sync" element={<MarketplaceSyncDashboard />} />
      <Route path="multi-store" element={<StoreDashboard />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="stock" element={<StockManagement />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="analytics" element={<AdvancedAnalyticsPage />} />
      <Route path="products" element={<ChannableProductsPage />} />
      <Route path="ai-insights" element={<PredictiveAnalyticsPage />} />
      <Route path="workflows" element={<WorkflowBuilderAdvanced />} />
      <Route path="api" element={<APIManagementPage />} />
      <Route path="billing" element={<BillingPage />} />
      <Route path="academy" element={<AcademyPage />} />
      <Route path="security" element={<SecurityDashboard />} />
      <Route path="onboarding" element={<OnboardingHubPage />} />
      <Route path="subscription" element={<SubscriptionDashboard />} />
    </Routes>
  );
}
