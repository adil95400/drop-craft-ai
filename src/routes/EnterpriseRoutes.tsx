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

export function EnterpriseRoutes() {
  return (
    <Routes>
      {/* Admin */}
      <Route index element={<AdminDashboard />} />
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="suppliers" element={<SupplierAdminPage />} />
      
      {/* Multi-tenant */}
      <Route path="multi-tenant" element={<MultiTenantPage />} />
      <Route path="multi-tenant/management" element={<MultiTenantManagementPage />} />
      
      {/* Security */}
      <Route path="security" element={<SecurityDashboard />} />
      
      {/* Monitoring */}
      <Route path="monitoring" element={<PerformanceMonitoringPage />} />
      <Route path="monitoring/advanced" element={<AdvancedMonitoringPage />} />
      
      {/* Platform */}
      <Route path="platform" element={<PlatformManagementPage />} />
    </Routes>
  );
}
