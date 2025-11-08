/**
 * Routes Core - Dashboard, Stores, Orders, Customers
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Dashboard
const DashboardHome = lazy(() => import('@/pages/DashboardHome'));
const Profile = lazy(() => import('@/pages/Profile'));
const Settings = lazy(() => import('@/pages/Settings'));

// Stores
const StoreDashboard = lazy(() => import('@/pages/stores/StoreDashboard').then(m => ({ default: m.StoreDashboard })));
const ConnectStorePage = lazy(() => import('@/pages/stores/ConnectStorePage'));
const IntegrationsPage = lazy(() => import('@/pages/stores/IntegrationsPage').then(m => ({ default: m.IntegrationsPage })));
const ManageIntegrationPage = lazy(() => import('@/pages/stores/ManageIntegrationPage').then(m => ({ default: m.ManageIntegrationPage })));

// Orders
const ModernOrdersPage = lazy(() => import('@/pages/ModernOrdersPage'));
const OrdersCenterPage = lazy(() => import('@/pages/OrdersCenterPage'));

// Customers
const ModernCustomersPage = lazy(() => import('@/pages/ModernCustomersPage'));

// Quick actions
const SyncManagerPage = lazy(() => import('@/pages/SyncManagerPage'));
const MarketplaceSyncDashboard = lazy(() => import('@/pages/MarketplaceSyncDashboard'));

// Order Management
const ReturnManagementPage = lazy(() => import('@/pages/ReturnManagementPage'));
const ShippingManagementPage = lazy(() => import('@/pages/ShippingManagementPage'));

export function CoreRoutes() {
  return (
    <Routes>
      {/* Dashboard */}
      <Route index element={<DashboardHome />} />
      <Route path="profile" element={<Profile />} />
      <Route path="settings" element={<Settings />} />
      
      {/* Legacy dashboard redirects */}
      <Route path="super" element={<Navigate to="/dashboard" replace />} />
      <Route path="classic" element={<Navigate to="/dashboard" replace />} />
      
      {/* Stores Management */}
      <Route path="stores" element={<StoreDashboard />} />
      <Route path="stores/connect" element={<ConnectStorePage />} />
      <Route path="stores/integrations" element={<IntegrationsPage />} />
      <Route path="stores/integrations/:id" element={<ManageIntegrationPage />} />
      
      {/* Orders Management */}
      <Route path="orders" element={<ModernOrdersPage />} />
      <Route path="orders/center" element={<OrdersCenterPage />} />
      <Route path="orders/returns" element={<ReturnManagementPage />} />
      <Route path="orders/shipping" element={<ShippingManagementPage />} />
      
      {/* Customers */}
      <Route path="customers" element={<ModernCustomersPage />} />
      
      {/* Quick Actions */}
      <Route path="sync-manager" element={<SyncManagerPage />} />
      <Route path="marketplace-sync" element={<MarketplaceSyncDashboard />} />
      
      {/* Settings (accessible from sidebar) */}
      <Route path="parametres" element={<Settings />} />
    </Routes>
  );
}
