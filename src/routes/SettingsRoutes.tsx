/**
 * Routes Settings - Paramètres
 */
import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

const StoreDashboard = lazy(() => import('@/pages/stores/StoreDashboard'));
const APIManagementPage = lazy(() => import('@/pages/APIManagementPage'));
const BillingPage = lazy(() => import('@/pages/BillingPage'));
const SecurityDashboard = lazy(() => import('@/pages/SecurityDashboard'));

export function SettingsRoutes() {
  return (
    <Routes>
      <Route index element={<StoreDashboard />} />
      <Route path="api" element={<APIManagementPage />} />
      <Route path="billing" element={<BillingPage />} />
      <Route path="security" element={<SecurityDashboard />} />
    </Routes>
  );
}
