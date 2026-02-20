/**
 * Routes Core - Dashboard, Stores, Orders, Customers
 * Consolidé - Utilise exports nommés correctement
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Dashboard
const DashboardHome = lazy(() => import('@/pages/Dashboard'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const ChannableSettingsPage = lazy(() => import('@/pages/ChannableSettingsPage'));
const SyncManagerPage = lazy(() => import('@/pages/sync/SyncManagerPage'));
const StoreSyncDashboard = lazy(() => import('@/pages/StoreSyncDashboard'));
const StoreDashboard = lazy(() => import('@/pages/stores/StoreDashboard'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const EmailTemplatesPage = lazy(() => import('@/pages/notifications/EmailTemplatesPage'));
const WebhooksOutgoingPage = lazy(() => import('@/pages/notifications/WebhooksOutgoingPage'));
const AdvancedAnalyticsPage = lazy(() => import('@/pages/AdvancedAnalyticsPage'));
const AIStoreBuilderHub = lazy(() => import('@/pages/store/AIStoreBuilderHub'));
const BrandingInvoicesHub = lazy(() => import('@/pages/invoices/BrandingInvoicesHub'));
const PrintOnDemandHub = lazy(() => import('@/pages/pod/PrintOnDemandHub'));
const CompetitiveIntelligenceHub = lazy(() => import('@/pages/research/CompetitiveIntelligenceHub'));
const StockManagement = lazy(() => import('@/pages/stock/StockManagementPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const CatalogProductsPage = lazy(() => import('@/pages/products/CatalogProductsPage'));
const PredictiveAnalyticsPage = lazy(() => import('@/pages/PredictiveAnalyticsPage'));
const AutomationPage = lazy(() => import('@/pages/AutomationPage'));
const APIManagementPage = lazy(() => import('@/pages/APIManagementPage'));
const BillingPage = lazy(() => import('@/pages/BillingPage'));
const AcademyPage = lazy(() => import('@/pages/AcademyPage'));
const SecurityDashboard = lazy(() => import('@/pages/SecurityDashboard'));
const SubscriptionDashboard = lazy(() => import('@/pages/SubscriptionDashboard'));
const OnboardingHubPage = lazy(() => import('@/pages/onboarding/OnboardingHubPage'));
const OnboardingWizardPage = lazy(() => import('@/pages/onboarding/OnboardingWizardPage'));
const ConsumptionPage = lazy(() => import('@/pages/ConsumptionPage'));
const PerformanceMonitoringPage = lazy(() => import('@/pages/monitoring/PerformanceMonitoringPage'));
const CRMServicePage = lazy(() => import('@/pages/crm/CRMServicePage'));
const RevenueAnalyticsPage = lazy(() => import('@/pages/RevenueAnalyticsPage'));
const ReferralPage = lazy(() => import('@/pages/ReferralPage'));

export function CoreRoutes() {
  return (
    <Routes>
      <Route index element={<DashboardHome />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="settings" element={<ChannableSettingsPage />} />
      <Route path="store/builder" element={<AIStoreBuilderHub />} />
      <Route path="invoices" element={<BrandingInvoicesHub />} />
      <Route path="pod" element={<PrintOnDemandHub />} />
      <Route path="research/intelligence" element={<CompetitiveIntelligenceHub />} />
      <Route path="sync-manager" element={<SyncManagerPage />} />
      <Route path="marketplace-sync" element={<StoreSyncDashboard />} />
      <Route path="multi-store" element={<StoreDashboard />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="notifications/email-templates" element={<EmailTemplatesPage />} />
      <Route path="notifications/webhooks" element={<WebhooksOutgoingPage />} />
      <Route path="stock" element={<StockManagement />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="analytics" element={<AdvancedAnalyticsPage />} />
      <Route path="products" element={<CatalogProductsPage />} />
      <Route path="ai-insights" element={<PredictiveAnalyticsPage />} />
      <Route path="workflows" element={<AutomationPage />} />
      <Route path="api" element={<APIManagementPage />} />
      <Route path="billing" element={<BillingPage />} />
      <Route path="academy" element={<AcademyPage />} />
      <Route path="security" element={<SecurityDashboard />} />
      <Route path="onboarding" element={<OnboardingHubPage />} />
      <Route path="onboarding/wizard" element={<OnboardingWizardPage />} />
      <Route path="subscription" element={<SubscriptionDashboard />} />
      <Route path="consumption" element={<ConsumptionPage />} />
      <Route path="monitoring" element={<PerformanceMonitoringPage />} />
      <Route path="crm" element={<CRMServicePage />} />
      <Route path="revenue-analytics" element={<RevenueAnalyticsPage />} />
      <Route path="referral" element={<ReferralPage />} />
    </Routes>
  );
}
