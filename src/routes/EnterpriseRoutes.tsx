/**
 * Routes Enterprise - Admin, Multi-tenant, Security, Monitoring
 * Consolidé v6.0 - Nettoyage fichiers orphelins
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Admin - consolidated to AdminPanel
const AdminPanel = lazy(() => import('@/pages/AdminPanel'));

// Multi-tenant - Using MultiTenantManagementPage as main
const MultiTenantManagementPage = lazy(() => import('@/pages/MultiTenantManagementPage'));

// Security
const SecurityDashboard = lazy(() => import('@/pages/SecurityDashboard'));

// Monitoring
const PerformanceMonitoringPage = lazy(() => import('@/pages/PerformanceMonitoringPage'));
const AdvancedMonitoringPage = lazy(() => import('@/pages/PerformanceMonitoringPage'));

// Platform
const PlatformManagementPage = lazy(() => import('@/pages/PlatformManagementPage'));

// Admin Management
const TaxManagementPage = lazy(() => import('@/pages/TaxManagementPage'));
const CollaborationPage = lazy(() => import('@/pages/CollaborationPage'));
const InternationalizationPage = lazy(() => import('@/pages/InternationalizationPage'));
const QuotaManagerPage = lazy(() => import('@/pages/QuotaManagerPage'));
const MultiChannelManagementPage = lazy(() => import('@/pages/MultiChannelManagementPage'));
const ComplianceCenter = lazy(() => import('@/pages/ComplianceCenter'));

// Subscription
const SubscriptionDashboard = lazy(() => import('@/pages/SubscriptionDashboard'));

// Phase 6 - Production Readiness
const ObservabilityDashboard = lazy(() => import('@/pages/ObservabilityDashboard'));
const PublicApiDashboard = lazy(() => import('@/pages/PublicApiDashboard'));
const DeploymentHealthPage = lazy(() => import('@/pages/DeploymentHealthPage'));

export function EnterpriseRoutes() {
  return (
    <Routes>
      {/* Commerce Pro */}
      <Route path="commerce" element={<MultiChannelManagementPage />} />
      
      {/* Multi-tenant */}
      <Route path="multi-tenant" element={<MultiTenantManagementPage />} />
      <Route path="multi-tenant/management" element={<MultiTenantManagementPage />} />
      
      {/* Monitoring & Observability */}
      <Route path="monitoring" element={<PerformanceMonitoringPage />} />
      <Route path="monitoring/advanced" element={<AdvancedMonitoringPage />} />
      <Route path="observability" element={<ObservabilityDashboard />} />
      
      {/* Platform */}
      <Route path="platform" element={<PlatformManagementPage />} />
      
      {/* Public API */}
      <Route path="api" element={<PublicApiDashboard />} />
      
      {/* Deployment & Infrastructure */}
      <Route path="deployment" element={<DeploymentHealthPage />} />
      
      {/* System Management */}
      <Route path="status" element={<Navigate to="/status" replace />} />
      <Route path="tax" element={<TaxManagementPage />} />
      <Route path="team" element={<CollaborationPage />} />
      <Route path="i18n" element={<InternationalizationPage />} />
      <Route path="quotas" element={<QuotaManagerPage />} />
      <Route path="subscriptions" element={<SubscriptionDashboard />} />
      <Route path="compliance" element={<ComplianceCenter />} />
    </Routes>
  );
}
