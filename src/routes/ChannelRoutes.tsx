/**
 * Routes Boutiques et Canaux - Module unifié
 * Inclut Shopify (déplacé depuis Import)
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Channel pages
const StoresAndChannelsHub = lazy(() => import('@/pages/channels/StoresAndChannelsHub'));
const ChannelConnectPage = lazy(() => import('@/pages/channels/ChannelConnectPage'));
const ChannelDetailPage = lazy(() => import('@/pages/channels/ChannelDetailPage'));

// Legacy store pages (kept for specific routes)
const ManageIntegrationPage = lazy(() => import('@/pages/stores/ManageIntegrationPage'));
const ShopifyDiagnostic = lazy(() => import('@/pages/ShopifyDiagnostic'));
const ShopifyManagementPage = lazy(() => import('@/pages/ShopifyManagementPage'));

// Shopify (déplacé depuis Import)
const ShopifyImportHub = lazy(() => import('@/pages/import/ShopifyImportHub'));

// Sync & Analytics
const StoreSyncDashboard = lazy(() => import('@/pages/StoreSyncDashboard'));
const StockManagementDashboard = lazy(() => import('@/pages/StockManagementDashboard'));
const MultiStoreAnalyticsDashboard = lazy(() => import('@/pages/MultiStoreAnalyticsDashboard'));

export function ChannelRoutes() {
  return (
    <Routes>
      {/* Unified hub */}
      <Route index element={<StoresAndChannelsHub />} />
      <Route path="connect" element={<ChannelConnectPage />} />
      <Route path="connect/:platform" element={<ChannelConnectPage />} />
      
      {/* Shopify - déplacé depuis Import */}
      <Route path="shopify" element={<ShopifyImportHub />} />
      
      <Route path=":channelId" element={<ChannelDetailPage />} />
      
      {/* Legacy routes - redirected to new paths */}
      <Route path="integrations" element={<Navigate to="/stores-channels" replace />} />
      <Route path="integrations/:id" element={<ManageIntegrationPage />} />
      <Route path="imported-products" element={<Navigate to="/products/import/manage" replace />} />
      <Route path="shopify-diagnostic" element={<ShopifyDiagnostic />} />
      <Route path="shopify-management" element={<ShopifyManagementPage />} />
      
      {/* Sync & Analytics */}
      <Route path="sync" element={<StoreSyncDashboard />} />
      <Route path="stock-intelligence" element={<StockManagementDashboard />} />
      <Route path="analytics" element={<MultiStoreAnalyticsDashboard />} />
    </Routes>
  );
}
