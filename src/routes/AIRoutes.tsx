/**
 * Routes AI - Intelligence Artificielle, Génération de contenu
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// AI pages
const AIPage = lazy(() => import('@/pages/AIPage'));
const AIStudio = lazy(() => import('@/pages/AIStudio'));
const AIAutomationHub = lazy(() => import('@/pages/AIAutomationHub'));
const AIAssistantPage = lazy(() => import('@/pages/AIAssistantPage'));
const ContentGenerationPage = lazy(() => import('@/pages/ContentGenerationPage'));
const CatalogIntelligencePage = lazy(() => import('@/pages/catalog/CatalogIntelligencePage'));
const AIContentPage = lazy(() => import('@/pages/products/AIContentPage'));

export function AIRoutes() {
  return (
    <Routes>
      {/* AI Overview */}
      <Route index element={<AIPage />} />
      
      {/* AI Modules */}
      <Route path="optimization" element={<AIAutomationHub />} />
      <Route path="content" element={<ContentGenerationPage />} />
      <Route path="assistant" element={<AIAssistantPage />} />
      <Route path="catalog" element={<CatalogIntelligencePage />} />
      <Route path="rewrite" element={<AIContentPage />} />
      <Route path="studio" element={<AIStudio />} />
      
      {/* Legacy redirects */}
      <Route path="hub" element={<Navigate to="/ai" replace />} />
    </Routes>
  );
}
