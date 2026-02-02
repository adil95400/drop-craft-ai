/**
 * Routes AI - Intelligence Artificielle, Génération de contenu
 * Consolidé - Utilise pages existantes uniquement
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// AI pages - Using existing consolidated pages only
const ContentGenerationPage = lazy(() => import('@/pages/ContentGenerationPage'));
const CatalogIntelligencePage = lazy(() => import('@/pages/catalog/CatalogIntelligencePage'));
const AIContentPage = lazy(() => import('@/pages/products/AIContentPage'));
const PredictiveAnalyticsPage = lazy(() => import('@/pages/PredictiveAnalyticsPage'));

export function AIRoutes() {
  return (
    <Routes>
      {/* AI Overview - Content Generation as main page */}
      <Route index element={<ContentGenerationPage />} />
      
      {/* AI Modules */}
      <Route path="optimization" element={<PredictiveAnalyticsPage />} />
      <Route path="content" element={<ContentGenerationPage />} />
      <Route path="assistant" element={<ContentGenerationPage />} />
      <Route path="catalog" element={<CatalogIntelligencePage />} />
      <Route path="rewrite" element={<AIContentPage />} />
      <Route path="studio" element={<ContentGenerationPage />} />
      
      {/* Legacy redirects */}
      <Route path="hub" element={<Navigate to="/ai" replace />} />
    </Routes>
  );
}
