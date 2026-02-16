/**
 * Routes Settings - Paramètres
 */
import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

const ChannableSettingsPage = lazy(() => import('@/pages/ChannableSettingsPage'));
const StoreDashboard = lazy(() => import('@/pages/stores/StoreDashboard'));
const APIManagementPage = lazy(() => import('@/pages/APIManagementPage'));
const BillingPage = lazy(() => import('@/pages/BillingPage'));
const SecurityDashboard = lazy(() => import('@/pages/SecurityDashboard'));
const WhiteLabelPage = lazy(() => import('@/pages/settings/WhiteLabelPage'));
const DomainRegistrationPage = lazy(() => import('@/pages/settings/DomainRegistrationPage'));
const WebhookManagementPage = lazy(() => import('@/pages/settings/WebhookManagementPage'));
const DataExportCenterPage = lazy(() => import('@/pages/settings/DataExportCenterPage'));
const NotificationPreferencesPage = lazy(() => import('@/pages/settings/NotificationPreferencesPage'));
const TeamManagementPage = lazy(() => import('@/pages/settings/TeamManagementPage'));
const OnboardingRetentionPage = lazy(() => import('@/pages/settings/OnboardingRetentionPage'));

export function SettingsRoutes() {
  return (
    <Routes>
      <Route index element={<ChannableSettingsPage />} />
      <Route path="stores" element={<StoreDashboard />} />
      <Route path="team" element={<TeamManagementPage />} />
      <Route path="api" element={<APIManagementPage />} />
      <Route path="billing" element={<BillingPage />} />
      <Route path="security" element={<SecurityDashboard />} />
      <Route path="white-label" element={<WhiteLabelPage />} />
      <Route path="domains" element={<DomainRegistrationPage />} />
      <Route path="webhooks" element={<WebhookManagementPage />} />
      <Route path="export" element={<DataExportCenterPage />} />
      <Route path="notifications" element={<NotificationPreferencesPage />} />
      <Route path="onboarding" element={<OnboardingRetentionPage />} />
    </Routes>
  );
}
