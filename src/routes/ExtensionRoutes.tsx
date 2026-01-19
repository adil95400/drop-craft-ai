/**
 * Routes Extensions - Hub, Marketplace, CLI, White-Label, SSO, Download, Documentation, Reviews, Chrome
 * Consolidé - Suppression des pages dupliquées
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Extensions Hub - Pages principales conservées
const ExtensionsHub = lazy(() => import('@/pages/extensions/ExtensionsHub'));
const ExtensionsMarketplace = lazy(() => import('@/pages/extensions/ExtensionsMarketplace'));
const ExtensionsCLI = lazy(() => import('@/pages/extensions/ExtensionsCLI'));
const ExtensionDeveloperPage = lazy(() => import('@/pages/extensions/ExtensionDeveloperPage'));
const ExtensionDownloadPage = lazy(() => import('@/pages/extensions/ExtensionDownloadPage'));
const ExtensionInstallationPage = lazy(() => import('@/pages/extensions/ExtensionInstallationPage'));
const ExtensionDocumentationPage = lazy(() => import('@/pages/extensions/ExtensionDocumentationPage'));
const ExtensionTutorialsPage = lazy(() => import('@/pages/extensions/ExtensionTutorialsPage'));
const ExtensionFAQPage = lazy(() => import('@/pages/extensions/ExtensionFAQPage'));
const ReviewsImportPage = lazy(() => import('@/pages/extensions/ReviewsImportPage'));
const ChromeExtensionPage = lazy(() => import('@/pages/extensions/ChromeExtensionPage'));
const ExtensionAPIPage = lazy(() => import('@/pages/ExtensionAPIPage'));

export function ExtensionRoutes() {
  return (
    <Routes>
      <Route index element={<ExtensionsHub />} />
      <Route path="marketplace" element={<ExtensionsMarketplace />} />
      <Route path="cli" element={<ExtensionsCLI />} />
      <Route path="developer" element={<ExtensionDeveloperPage />} />
      <Route path="download" element={<ExtensionDownloadPage />} />
      <Route path="installation" element={<ExtensionInstallationPage />} />
      <Route path="documentation" element={<ExtensionDocumentationPage />} />
      <Route path="tutorials" element={<ExtensionTutorialsPage />} />
      <Route path="faq" element={<ExtensionFAQPage />} />
      <Route path="reviews" element={<ReviewsImportPage />} />
      <Route path="chrome" element={<ChromeExtensionPage />} />
      <Route path="api" element={<ExtensionAPIPage />} />
      
      {/* Legacy redirects - pages supprimées */}
      <Route path="white-label" element={<Navigate to="/extensions/developer" replace />} />
      <Route path="sso" element={<Navigate to="/extensions/developer" replace />} />
    </Routes>
  );
}
