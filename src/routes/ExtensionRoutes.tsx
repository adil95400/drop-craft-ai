/**
 * Routes Extensions - Hub, Download, Documentation, Tutorials, FAQ, Reviews, Chrome
 * Consolidé - Pages Marketplace, CLI, Developer supprimées
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Extensions Hub - Pages principales conservées
const ExtensionsHub = lazy(() => import('@/pages/extensions/ExtensionsHub'));
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
      <Route path="download" element={<ExtensionDownloadPage />} />
      <Route path="installation" element={<ExtensionInstallationPage />} />
      <Route path="documentation" element={<ExtensionDocumentationPage />} />
      <Route path="tutorials" element={<ExtensionTutorialsPage />} />
      <Route path="faq" element={<ExtensionFAQPage />} />
      <Route path="reviews" element={<ReviewsImportPage />} />
      <Route path="chrome" element={<ChromeExtensionPage />} />
      <Route path="api" element={<ExtensionAPIPage />} />
      
      {/* Legacy redirects - pages supprimées */}
      <Route path="marketplace" element={<Navigate to="/extensions" replace />} />
      <Route path="cli" element={<Navigate to="/extensions" replace />} />
      <Route path="developer" element={<Navigate to="/extensions" replace />} />
      <Route path="white-label" element={<Navigate to="/extensions" replace />} />
      <Route path="sso" element={<Navigate to="/extensions" replace />} />
    </Routes>
  );
}
