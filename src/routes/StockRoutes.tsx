import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

const StockRepricingHub = lazy(() => import('@/pages/stock/StockRepricingHub'));

export function StockRoutes() {
  return (
    <Routes>
      <Route index element={<StockRepricingHub />} />
    </Routes>
  );
}
