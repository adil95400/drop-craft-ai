/**
 * Routes Comparisons - Pages de comparaison marketing
 */
import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const ExtensionComparisonPage = lazy(() => import('@/pages/comparisons/ExtensionComparisonPage'));

export function ComparisonRoutes() {
  return (
    <Routes>
      <Route index element={<ExtensionComparisonPage />} />
      <Route path="extensions" element={<ExtensionComparisonPage />} />
      <Route path="autods" element={<ExtensionComparisonPage />} />
      <Route path="cartifind" element={<ExtensionComparisonPage />} />
    </Routes>
  );
}
