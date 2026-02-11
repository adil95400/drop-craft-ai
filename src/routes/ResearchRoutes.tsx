/**
 * Routes Research - Veille, Produits gagnants, Concurrence
 * Hub centralisé avec design Channable
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Research Hub - Page principale
const ResearchHub = lazy(() => import('@/pages/research/ResearchHub'));
const WinningProductsPage = lazy(() => import('@/pages/research/WinningProductsPage'));
const AIWinningProductScanner = lazy(() => import('@/pages/research/AIWinningProductScanner'));

// Research pages
const CompetitorAnalysisPage = lazy(() => import('@/pages/CompetitorAnalysisPage'));
const ProductSourcingPage = lazy(() => import('@/pages/products/ProductSourcingPage'));
const CompetitiveIntelligenceHub = lazy(() => import('@/pages/research/CompetitiveIntelligenceHub'));
const ProductResearchPage = lazy(() => import('@/pages/products/ProductResearchPage'));

export function ResearchRoutes() {
  return (
    <Routes>
      {/* Research Hub - Page principale Channable-style */}
      <Route index element={<ResearchHub />} />
      
      {/* Research Modules */}
      <Route path="winning" element={<WinningProductsPage />} />
      <Route path="competitors" element={<CompetitorAnalysisPage />} />
      <Route path="ads" element={<ResearchHub />} />
      <Route path="trends" element={<ProductResearchPage />} />
      <Route path="sourcing" element={<ProductSourcingPage />} />
      <Route path="intelligence" element={<CompetitiveIntelligenceHub />} />
      
      {/* AI Winning Product Scanner - TikTok Ads */}
      <Route path="ai-scanner" element={<AIWinningProductScanner />} />
      
      {/* Backward compatibility - scanner redirect */}
      <Route path="scanner" element={<Navigate to="/research/ai-scanner" replace />} />
      
      {/* Legacy redirects */}
      <Route path="products" element={<Navigate to="/research/winning" replace />} />
    </Routes>
  );
}
