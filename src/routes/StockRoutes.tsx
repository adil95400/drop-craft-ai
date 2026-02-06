import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

const StockRepricingHub = lazy(() => import('@/pages/stock/StockRepricingHub'));
const StockManagementPage = lazy(() => import('@/pages/stock/StockManagementPage'));
const PriceMonitorPage = lazy(() => import('@/pages/stock/PriceMonitorPage'));

export function StockRoutes() {
  return (
    <Routes>
      <Route index element={<StockManagementPage />} />
      <Route path="repricing" element={<StockRepricingHub />} />
      <Route path="predictions" element={<StockManagementPage />} />
      <Route path="management" element={<StockManagementPage />} />
      <Route path="price-monitor" element={<PriceMonitorPage />} />
    </Routes>
  );
}
