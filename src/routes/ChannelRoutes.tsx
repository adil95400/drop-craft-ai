/**
 * Routes Boutiques et Canaux - Module unifié
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

const StoresAndChannelsHub = lazy(() => import('@/pages/channels/StoresAndChannelsHub'));
const ChannelConnectPage = lazy(() => import('@/pages/channels/ChannelConnectPage'));
const ChannelDetailPage = lazy(() => import('@/pages/channels/ChannelDetailPage'));
const ManageIntegrationPage = lazy(() => import('@/pages/stores/ManageIntegrationPage'));
const ShopifyDiagnostic = lazy(() => import('@/pages/ShopifyDiagnostic'));
const ShopifyManagementPage = lazy(() => import('@/pages/ShopifyManagementPage'));
const StoreSyncDashboard = lazy(() => import('@/pages/StoreSyncDashboard'));
const AdvancedAnalyticsPage = lazy(() => import('@/pages/AdvancedAnalyticsPage'));

export function ChannelRoutes() {
  return (
    <Routes>
      <Route index element={<StoresAndChannelsHub />} />
      <Route path="connect" element={<ChannelConnectPage />} />
      <Route path="connect/:platform" element={<ChannelConnectPage />} />
      <Route path=":channelId" element={<ChannelDetailPage />} />
      <Route path="integrations" element={<Navigate to="/stores-channels" replace />} />
      <Route path="integrations/:id" element={<ManageIntegrationPage />} />
      <Route path="imported-products" element={<Navigate to="/products/import/manage" replace />} />
      <Route path="shopify-diagnostic" element={<ShopifyDiagnostic />} />
      <Route path="shopify-management" element={<ShopifyManagementPage />} />
      <Route path="sync" element={<StoreSyncDashboard />} />
      <Route path="stock-intelligence" element={<Navigate to="/stock" replace />} />
      <Route path="analytics" element={<AdvancedAnalyticsPage />} />
    </Routes>
  );
}
