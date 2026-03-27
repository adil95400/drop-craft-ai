/**
 * Routes Admin - Panel Administration, Security, Video Tutorials
 */
import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

// Admin
const AdminPanel = lazy(() => import('@/pages/AdminPanel'));
const SecurityDashboard = lazy(() => import('@/pages/SecurityDashboard'));
const VideoTutorialsPage = lazy(() => import('@/pages/admin/VideoTutorialsPage'));
const AdminSupplierManagementPage = lazy(() => import('@/pages/admin/AdminSupplierManagementPage'));
const AdminConsumptionPage = lazy(() => import('@/pages/admin/AdminConsumptionPage'));
const AdminSecurityPage = lazy(() => import('@/pages/admin/AdminSecurityPage'));
const BetaLaunchChecklist = lazy(() => import('@/pages/admin/BetaLaunchChecklist'));

export function AdminRoutes() {
  return (
    <Routes>
      {/* Admin Panel */}
      <Route index element={<AdminPanel />} />
      
      {/* Security - Full dashboard */}
      <Route path="security" element={<AdminSecurityPage />} />
      
      {/* Legacy security route */}
      <Route path="security-legacy" element={<SecurityDashboard />} />
      
      {/* Video Tutorials Management */}
      <Route path="video-tutorials" element={<VideoTutorialsPage />} />
      
      {/* Suppliers Management Center */}
      <Route path="suppliers" element={<AdminSupplierManagementPage />} />
      
      {/* Consumption Tracking */}
      <Route path="consumption" element={<AdminConsumptionPage />} />
      
      {/* Beta Launch Checklist */}
      <Route path="beta-launch" element={<BetaLaunchChecklist />} />
    </Routes>
  );
}
