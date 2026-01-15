/**
 * Routes Extensions - Hub, Marketplace, CLI, White-Label, SSO, Download, Documentation
 */
import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

const ExtensionsHub = lazy(() => import('@/pages/extensions/ExtensionsHub'));
const ExtensionsMarketplace = lazy(() => import('@/pages/extensions/ExtensionsMarketplace'));
const ExtensionsCLI = lazy(() => import('@/pages/extensions/ExtensionsCLI'));
const ExtensionDeveloperPage = lazy(() => import('@/pages/extensions/ExtensionDeveloperPage'));
const WhiteLabelPage = lazy(() => import('@/pages/extensions/WhiteLabelPage'));
const SSOPage = lazy(() => import('@/pages/extensions/SSOPage'));
const ExtensionDownloadPage = lazy(() => import('@/pages/extensions/ExtensionDownloadPage'));
const ExtensionInstallationPage = lazy(() => import('@/pages/extensions/ExtensionInstallationPage'));
const ExtensionDocumentationPage = lazy(() => import('@/pages/extensions/ExtensionDocumentationPage'));
const ExtensionTutorialsPage = lazy(() => import('@/pages/extensions/ExtensionTutorialsPage'));
const ExtensionFAQPage = lazy(() => import('@/pages/extensions/ExtensionFAQPage'));

export function ExtensionRoutes() {
  return (
    <Routes>
      <Route index element={<ExtensionsHub />} />
      <Route path="marketplace" element={<ExtensionsMarketplace />} />
      <Route path="cli" element={<ExtensionsCLI />} />
      <Route path="developer" element={<ExtensionDeveloperPage />} />
      <Route path="white-label" element={<WhiteLabelPage />} />
      <Route path="sso" element={<SSOPage />} />
      <Route path="download" element={<ExtensionDownloadPage />} />
      <Route path="installation" element={<ExtensionInstallationPage />} />
      <Route path="documentation" element={<ExtensionDocumentationPage />} />
      <Route path="tutorials" element={<ExtensionTutorialsPage />} />
      <Route path="faq" element={<ExtensionFAQPage />} />
    </Routes>
  );
}