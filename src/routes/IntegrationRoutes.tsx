/**
 * Routes Integrations - APIs, Marketplace, Extensions (consolidées)
 * Style Channable - Hub d'intégrations multicanal moderne
 * Consolidé - Imports orphelins supprimés
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Main integrations hub - Style Channable
const ChannableStyleIntegrationsPage = lazy(() => import('@/pages/integrations/ChannableStyleIntegrationsPage'));
const TikTokShopPage = lazy(() => import('@/pages/integrations/TikTokShopPage'));
const MarketplaceConnectorsPage = lazy(() => import('@/pages/integrations/MarketplaceConnectorsPage'));

// Marketplace (consolidated)
const MarketplaceHubPage = lazy(() => import('@/pages/MarketplaceHubPage'));
const FeedManagerPage = lazy(() => import('@/pages/FeedManagerPage'));

// Extensions - Redirect to /extensions route
const ExtensionsHub = lazy(() => import('@/pages/extensions/ExtensionsHub'));
const ExtensionAPIPage = lazy(() => import('@/pages/ExtensionAPIPage'));
const ChromeExtensionConfigPage = lazy(() => import('@/pages/ChromeExtensionConfigPage'));

// API - Using existing documentation page
const APIDocumentationPage = lazy(() => import('@/pages/APIDocumentationPage'));

// Support & Learning - Using SupportMainPage as consolidated support
const SupportMainPage = lazy(() => import('@/pages/support/SupportMainPage'));
const AcademyPage = lazy(() => import('@/pages/AcademyPage'));
const CourseDetailPage = lazy(() => import('@/pages/CourseDetailPage'));

// Sync Configuration
const SyncConfigPage = lazy(() => import('@/pages/SyncConfigPage'));

// Content Management
const ContentManagementPage = lazy(() => import('@/pages/ContentManagementPage'));

// Multi-Channel
const MultiChannelPage = lazy(() => import('@/pages/integrations/MultiChannelPage'));
const MultiStoreSyncPage = lazy(() => import('@/pages/integrations/MultiStoreSyncPage'));

export function IntegrationRoutes() {
  return (
    <Routes>
      {/* Integrations Hub - Style Channable (principal) */}
      <Route index element={<ChannableStyleIntegrationsPage />} />
      
      {/* Legacy routes - redirect to main page */}
      <Route path="legacy" element={<Navigate to="/integrations" replace />} />
      <Route path="hub" element={<Navigate to="/integrations" replace />} />
      <Route path="unified" element={<Navigate to="/integrations" replace />} />
      <Route path="sync-config" element={<SyncConfigPage />} />
      <Route path="tiktok-shop" element={<TikTokShopPage />} />
      <Route path="connectors" element={<MarketplaceConnectorsPage />} />
      
      {/* Marketplace - Consolidated */}
      <Route path="marketplace" element={<MarketplaceHubPage />} />
      <Route path="marketplace/hub" element={<Navigate to="/integrations/marketplace" replace />} />
      <Route path="marketplace/integrations" element={<Navigate to="/integrations/marketplace" replace />} />
      <Route path="marketplace/integration-guides" element={<Navigate to="/integrations/marketplace" replace />} />
      <Route path="marketplace/feed-manager" element={<FeedManagerPage />} />
      <Route path="marketplace/multi-store" element={<Navigate to="/stores-channels" replace />} />
      
      {/* Extensions */}
      <Route path="extensions" element={<ExtensionsHub />} />
      <Route path="extensions/hub" element={<Navigate to="/integrations/extensions" replace />} />
      <Route path="extensions/api" element={<ExtensionAPIPage />} />
      <Route path="extensions/chrome-config" element={<ChromeExtensionConfigPage />} />
      
      {/* API - Redirect developer to documentation */}
      <Route path="api/developer" element={<APIDocumentationPage />} />
      <Route path="api/documentation" element={<APIDocumentationPage />} />
      
      {/* Support & Learning */}
      <Route path="support" element={<SupportMainPage />} />
      <Route path="support/live-chat" element={<SupportMainPage />} />
      <Route path="academy" element={<AcademyPage />} />
      <Route path="academy/course/:id" element={<CourseDetailPage />} />
      
      {/* Content */}
      <Route path="content" element={<ContentManagementPage />} />
      
      {/* Multi-Channel */}
      <Route path="multi-channel" element={<MultiChannelPage />} />
      
      {/* Multi-Store Sync */}
      <Route path="multi-store-sync" element={<MultiStoreSyncPage />} />
    </Routes>
  );
}
