/**
 * Routes Core - Dashboard et sous-pages directes
 * Consolidé S3 — Seules les routes /dashboard/* restent ici
 * Les pages standalone (billing, subscription, etc.) sont dans index.tsx
 */
import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

// Dashboard sub-pages only
const DashboardHome = lazy(() => import('@/pages/Dashboard'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const ChannableSettingsPage = lazy(() => import('@/pages/ChannableSettingsPage'));
const SyncManagerPage = lazy(() => import('@/pages/sync/SyncManagerPage'));
const StoreSyncDashboard = lazy(() => import('@/pages/StoreSyncDashboard'));
const StoreDashboard = lazy(() => import('@/pages/stores/StoreDashboard'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const EmailTemplatesPage = lazy(() => import('@/pages/notifications/EmailTemplatesPage'));
const WebhooksOutgoingPage = lazy(() => import('@/pages/notifications/WebhooksOutgoingPage'));
const StockManagement = lazy(() => import('@/pages/stock/StockManagementPage'));
const CatalogProductsPage = lazy(() => import('@/pages/products/CatalogProductsPage'));
const OnboardingHubPage = lazy(() => import('@/pages/onboarding/OnboardingHubPage'));
const OnboardingWizardPage = lazy(() => import('@/pages/onboarding/OnboardingWizardPage'));
const CRMServicePage = lazy(() => import('@/pages/crm/CRMServicePage'));
const AIStoreBuilderHub = lazy(() => import('@/pages/store/AIStoreBuilderHub'));
const BrandingInvoicesHub = lazy(() => import('@/pages/invoices/BrandingInvoicesHub'));
const PrintOnDemandHub = lazy(() => import('@/pages/pod/PrintOnDemandHub'));
const CompetitiveIntelligenceHub = lazy(() => import('@/pages/research/CompetitiveIntelligenceHub'));

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
      <Route path="products" element={<CatalogProductsPage />} />
      <Route path="onboarding" element={<OnboardingHubPage />} />
      <Route path="onboarding/wizard" element={<OnboardingWizardPage />} />
      <Route path="crm" element={<CRMServicePage />} />
    </Routes>
  );
}
