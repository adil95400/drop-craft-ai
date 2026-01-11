/**
 * Routes Research - Veille, Produits gagnants, Concurrence
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Research pages
const ProductResearchPage = lazy(() => import('@/pages/ProductResearchPage'));
const WinnersPage = lazy(() => import('@/pages/WinnersPage'));
const CompetitorAnalysisPage = lazy(() => import('@/pages/CompetitorAnalysisPage'));
const AdsSpyPage = lazy(() => import('@/pages/AdsSpyPage'));
const ProductSourcingPage = lazy(() => import('@/pages/products/ProductSourcingPage'));
const CompetitiveIntelligenceHub = lazy(() => import('@/pages/research/CompetitiveIntelligenceHub'));

export function ResearchRoutes() {
  return (
    <Routes>
      {/* Research Overview */}
      <Route index element={<ProductResearchPage />} />
      
      {/* Research Modules */}
      <Route path="winning" element={<WinnersPage />} />
      <Route path="competitors" element={<CompetitorAnalysisPage />} />
      <Route path="ads" element={<AdsSpyPage />} />
      <Route path="trends" element={<ProductResearchPage />} />
      <Route path="sourcing" element={<ProductSourcingPage />} />
      <Route path="intelligence" element={<CompetitiveIntelligenceHub />} />
      
      {/* Legacy redirects */}
      <Route path="products" element={<Navigate to="/research/winning" replace />} />
    </Routes>
  );
}
