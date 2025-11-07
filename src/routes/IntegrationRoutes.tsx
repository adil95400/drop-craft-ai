/**
 * Routes Integrations - APIs, Marketplace, Extensions
 */
import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

// Integrations
const ModernIntegrationsHub = lazy(() => import('@/pages/ModernIntegrationsHub'));
const Integrations = lazy(() => import('@/pages/Integrations'));
const IntegrationsPage = lazy(() => import('@/pages/IntegrationsPage'));

// Marketplace
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const MarketplaceHubPage = lazy(() => import('@/pages/MarketplaceHubPage'));
const MarketplaceIntegrationsPage = lazy(() => import('@/pages/MarketplaceIntegrationsPage'));
const FeedManagerPage = lazy(() => import('@/pages/FeedManagerPage'));
const MultiStoreCentralDashboard = lazy(() => import('@/pages/MultiStoreCentralDashboard'));

// Extensions
const Extension = lazy(() => import('@/pages/Extension'));
const ExtensionsHub = lazy(() => import('@/pages/ExtensionsHub'));
const ExtensionAPIPage = lazy(() => import('@/pages/ExtensionAPIPage'));

// API
const APIDeveloperPage = lazy(() => import('@/pages/APIDeveloperPage'));
const APIDocumentationPage = lazy(() => import('@/pages/APIDocumentationPage'));

// Support & Learning
const Support = lazy(() => import('@/pages/Support'));
const AcademyPage = lazy(() => import('@/pages/AcademyPage'));
const CourseDetailPage = lazy(() => import('@/pages/CourseDetailPage'));
const LiveChatSupportPage = lazy(() => import('@/pages/LiveChatSupportPage'));
const QAPage = lazy(() => import('@/pages/QAPage'));

// Content Management
const ContentManagementPage = lazy(() => import('@/pages/ContentManagementPage'));

export function IntegrationRoutes() {
  return (
    <Routes>
      {/* Integrations Hub */}
      <Route index element={<ModernIntegrationsHub />} />
      <Route path="hub" element={<Integrations />} />
      <Route path="settings" element={<IntegrationsPage />} />
      
      {/* Marketplace */}
      <Route path="marketplace" element={<Marketplace />} />
      <Route path="marketplace/hub" element={<MarketplaceHubPage />} />
      <Route path="marketplace/integrations" element={<MarketplaceIntegrationsPage />} />
      <Route path="marketplace/feed-manager" element={<FeedManagerPage />} />
      <Route path="marketplace/multi-store" element={<MultiStoreCentralDashboard />} />
      
      {/* Extensions */}
      <Route path="extensions" element={<Extension />} />
      <Route path="extensions/hub" element={<ExtensionsHub />} />
      <Route path="extensions/api" element={<ExtensionAPIPage />} />
      
      {/* API */}
      <Route path="api/developer" element={<APIDeveloperPage />} />
      <Route path="api/documentation" element={<APIDocumentationPage />} />
      
      {/* Support & Learning */}
      <Route path="support" element={<Support />} />
      <Route path="support/live-chat" element={<LiveChatSupportPage />} />
      <Route path="support/qa" element={<QAPage />} />
      <Route path="academy" element={<AcademyPage />} />
      <Route path="academy/course/:id" element={<CourseDetailPage />} />
      
      {/* Content */}
      <Route path="content" element={<ContentManagementPage />} />
    </Routes>
  );
}
