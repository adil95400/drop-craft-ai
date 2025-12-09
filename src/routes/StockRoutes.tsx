import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

const StockRepricingHub = lazy(() => import('@/pages/stock/StockRepricingHub'));
const StockManagementPage = lazy(() => import('@/pages/stock/StockManagementPage'));
const StockManagementDashboard = lazy(() => import('@/pages/StockManagementDashboard'));

export function StockRoutes() {
  return (
    <Routes>
      <Route index element={<StockManagementPage />} />
      <Route path="repricing" element={<StockRepricingHub />} />
      <Route path="predictions" element={<StockManagementDashboard />} />
      <Route path="management" element={<StockManagementPage />} />
    </Routes>
  );
}
