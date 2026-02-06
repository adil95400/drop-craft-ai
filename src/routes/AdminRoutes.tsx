/**
 * Routes Admin - Panel Administration, Security, Video Tutorials
 */
import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

// Admin
const AdminPanel = lazy(() => import('@/pages/AdminPanel'));
const SecurityDashboard = lazy(() => import('@/pages/SecurityDashboard'));
const VideoTutorialsPage = lazy(() => import('@/pages/admin/VideoTutorialsPage'));
const ChannableStyleSuppliersPage = lazy(() => import('@/pages/suppliers/ChannableStyleSuppliersPage'));
const AdminConsumptionPage = lazy(() => import('@/pages/admin/AdminConsumptionPage'));

export function AdminRoutes() {
  return (
    <Routes>
      {/* Admin Panel */}
      <Route index element={<AdminPanel />} />
      
      {/* Security */}
      <Route path="security" element={<SecurityDashboard />} />
      
      {/* Video Tutorials Management */}
      <Route path="video-tutorials" element={<VideoTutorialsPage />} />
      
      {/* Suppliers Management */}
      <Route path="suppliers" element={<ChannableStyleSuppliersPage />} />
      
      {/* Consumption Tracking */}
      <Route path="consumption" element={<AdminConsumptionPage />} />
    </Routes>
  );
}
