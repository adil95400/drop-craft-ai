/**
 * Routes Enterprise - Admin, Multi-tenant, Security, Monitoring
 */
import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

// Admin
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const SupplierAdminPage = lazy(() => import('@/pages/SupplierAdminPage'));

// Multi-tenant
const MultiTenantPage = lazy(() => import('@/pages/MultiTenantPage'));
const MultiTenantManagementPage = lazy(() => import('@/pages/MultiTenantManagementPage'));

// Security
const SecurityDashboard = lazy(() => import('@/pages/SecurityDashboard'));

// Monitoring
const PerformanceMonitoringPage = lazy(() => import('@/pages/PerformanceMonitoringPage'));
const AdvancedMonitoringPage = lazy(() => import('@/pages/AdvancedMonitoringPage'));

// Platform
const PlatformManagementPage = lazy(() => import('@/pages/PlatformManagementPage'));

// Admin Management
const ApplicationStatusPage = lazy(() => import('@/pages/ApplicationStatusPage'));
const TaxManagementPage = lazy(() => import('@/pages/TaxManagementPage'));
const TeamManagement = lazy(() => import('@/pages/TeamManagement'));
const InternationalizationPage = lazy(() => import('@/pages/InternationalizationPage'));
const QuotaManagerPage = lazy(() => import('@/pages/QuotaManagerPage'));
const SubscriptionManagementPage = lazy(() => import('@/pages/SubscriptionManagementPage'));
const MultiChannelManagementPage = lazy(() => import('@/pages/MultiChannelManagementPage'));
const ComplianceCenter = lazy(() => import('@/pages/ComplianceCenter'));

export function EnterpriseRoutes() {
  return (
    <Routes>
      {/* Commerce Pro */}
      <Route path="commerce" element={<MultiChannelManagementPage />} />
      
      {/* Multi-tenant */}
      <Route path="multi-tenant" element={<MultiTenantPage />} />
      <Route path="multi-tenant/management" element={<MultiTenantManagementPage />} />
      
      {/* Monitoring & Observability */}
      <Route path="monitoring" element={<PerformanceMonitoringPage />} />
      <Route path="monitoring/advanced" element={<AdvancedMonitoringPage />} />
      
      {/* Platform */}
      <Route path="platform" element={<PlatformManagementPage />} />
      
      {/* System Management */}
      <Route path="status" element={<ApplicationStatusPage />} />
      <Route path="tax" element={<TaxManagementPage />} />
      <Route path="team" element={<TeamManagement />} />
      <Route path="i18n" element={<InternationalizationPage />} />
      <Route path="quotas" element={<QuotaManagerPage />} />
      <Route path="subscriptions" element={<SubscriptionManagementPage />} />
      <Route path="compliance" element={<ComplianceCenter />} />
    </Routes>
  );
}
