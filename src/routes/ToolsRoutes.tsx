/**
 * Routes Tools - Outils et calculateurs
 * Consolidé - Utilise pages existantes
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Tools pages
const ProfitCalculatorPage = lazy(() => import('@/pages/ProfitCalculatorPage'));
const BulkContentCreationPage = lazy(() => import('@/pages/BulkContentCreationPage'));
const SchemaGenerator = lazy(() => import('@/pages/SchemaGenerator'));
const PredictiveAnalyticsPage = lazy(() => import('@/pages/PredictiveAnalyticsPage'));
const CanvaOAuthCallback = lazy(() => import('@/pages/CanvaOAuthCallback'));

export function ToolsRoutes() {
  return (
    <Routes>
      {/* Tools Overview - redirect to profit calculator */}
      <Route index element={<ProfitCalculatorPage />} />
      
      {/* Tool Modules */}
      <Route path="profit-calculator" element={<ProfitCalculatorPage />} />
      <Route path="bulk-content" element={<BulkContentCreationPage />} />
      <Route path="schema-generator" element={<SchemaGenerator />} />
      <Route path="intelligence" element={<PredictiveAnalyticsPage />} />
      
      {/* Canva OAuth Callback */}
      <Route path="canva-callback" element={<CanvaOAuthCallback />} />
      
      {/* Legacy redirects */}
      <Route path="calculator" element={<Navigate to="/tools/profit-calculator" replace />} />
      <Route path="inventory-predictor" element={<Navigate to="/tools/intelligence" replace />} />
      <Route path="inventory-predictor/*" element={<Navigate to="/tools/intelligence" replace />} />
    </Routes>
  );
}
