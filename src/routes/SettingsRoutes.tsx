/**
 * Routes Settings - Paramètres
 * URL uniformisées: /settings au lieu de /dashboard/settings
 */
import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

const Settings = lazy(() => import('@/pages/Settings'));
const APIManagementPage = lazy(() => import('@/pages/APIManagementPage'));
const BillingPage = lazy(() => import('@/pages/BillingPage'));
const SecurityDashboard = lazy(() => import('@/pages/SecurityDashboard'));

export function SettingsRoutes() {
  return (
    <Routes>
      <Route index element={<Settings />} />
      <Route path="api" element={<APIManagementPage />} />
      <Route path="billing" element={<BillingPage />} />
      <Route path="security" element={<SecurityDashboard />} />
    </Routes>
  );
}
