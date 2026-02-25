/**
 * Routes AI - Intelligence Artificielle, Génération de contenu
 * Consolidé - Utilise pages existantes uniquement
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// AI pages
const ContentGenerationPage = lazy(() => import('@/pages/ContentGenerationPage'));
const CatalogIntelligencePage = lazy(() => import('@/pages/catalog/CatalogIntelligencePage'));
const AIContentPage = lazy(() => import('@/pages/products/AIContentPage'));
const PredictiveAnalyticsPage = lazy(() => import('@/pages/PredictiveAnalyticsPage'));
const EnrichmentSnapshotsPage = lazy(() => import('@/pages/ai/EnrichmentSnapshotsPage'));
const AIAutoActions = lazy(() => import('@/pages/AIAutoActions'));
const AIAssistantPage = lazy(() => import('@/pages/ai/AIAssistantPage'));

export function AIRoutes() {
  return (
    <Routes>
      {/* AI Overview - Content Generation as main page */}
      <Route index element={<ContentGenerationPage />} />
      
      {/* AI Modules */}
      <Route path="optimization" element={<PredictiveAnalyticsPage />} />
      <Route path="content" element={<ContentGenerationPage />} />
      <Route path="assistant" element={<AIAssistantPage />} />
      <Route path="catalog" element={<CatalogIntelligencePage />} />
      <Route path="rewrite" element={<AIContentPage />} />
      <Route path="studio" element={<ContentGenerationPage />} />
      <Route path="snapshots" element={<EnrichmentSnapshotsPage />} />
      <Route path="enrichment-history" element={<EnrichmentSnapshotsPage />} />
      <Route path="auto-actions" element={<AIAutoActions />} />
      
      {/* Legacy redirects */}
      <Route path="hub" element={<Navigate to="/ai" replace />} />
    </Routes>
  );
}
