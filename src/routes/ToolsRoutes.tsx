/**
 * Routes Tools - Outils et calculateurs
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Tools pages
const ProfitCalculatorPage = lazy(() => import('@/pages/ProfitCalculatorPage'));
const BulkContentCreationPage = lazy(() => import('@/pages/BulkContentCreationPage'));
const SchemaGenerator = lazy(() => import('@/pages/SchemaGenerator'));
const IntelligencePage = lazy(() => import('@/pages/Intelligence'));

export function ToolsRoutes() {
  return (
    <Routes>
      {/* Tools Overview - redirect to profit calculator */}
      <Route index element={<ProfitCalculatorPage />} />
      
      {/* Tool Modules */}
      <Route path="profit-calculator" element={<ProfitCalculatorPage />} />
      <Route path="bulk-content" element={<BulkContentCreationPage />} />
      <Route path="schema-generator" element={<SchemaGenerator />} />
      <Route path="intelligence" element={<IntelligencePage />} />
      
      {/* Legacy redirects */}
      <Route path="calculator" element={<Navigate to="/tools/profit-calculator" replace />} />
      <Route path="inventory-predictor" element={<Navigate to="/tools/intelligence" replace />} />
      <Route path="inventory-predictor/*" element={<Navigate to="/tools/intelligence" replace />} />
    </Routes>
  );
}
