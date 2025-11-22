/**
 * Routes Extensions - Hub, Marketplace, CLI, White-Label, SSO
 */
import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

const ExtensionsHub = lazy(() => import('@/pages/extensions/ExtensionsHub'));
const ExtensionsMarketplace = lazy(() => import('@/pages/extensions/ExtensionsMarketplace'));
const ExtensionsCLI = lazy(() => import('@/pages/extensions/ExtensionsCLI'));
const WhiteLabelPage = lazy(() => import('@/pages/extensions/WhiteLabelPage'));
const SSOPage = lazy(() => import('@/pages/extensions/SSOPage'));

export function ExtensionRoutes() {
  return (
    <Routes>
      <Route index element={<ExtensionsHub />} />
      <Route path="marketplace" element={<ExtensionsMarketplace />} />
      <Route path="cli" element={<ExtensionsCLI />} />
      <Route path="white-label" element={<WhiteLabelPage />} />
      <Route path="sso" element={<SSOPage />} />
    </Routes>
  );
}
