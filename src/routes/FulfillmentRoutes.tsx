import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

const FulfillmentPage = lazy(() => import('@/pages/fulfillment/FulfillmentPage'));
const FulfillmentDashboardPage = lazy(() => import('@/pages/FulfillmentDashboardPage'));
const FulfillmentRulesPage = lazy(() => import('@/pages/FulfillmentRulesPage'));
const CarriersManagementPage = lazy(() => import('@/pages/CarriersManagementPage'));
const AutoFulfillmentPage = lazy(() => import('@/pages/AutoFulfillmentPage'));

export function FulfillmentRoutes() {
  return (
    <Routes>
      <Route index element={<FulfillmentPage />} />
      <Route path="dashboard" element={<FulfillmentDashboardPage />} />
      <Route path="auto" element={<AutoFulfillmentPage />} />
      <Route path="rules" element={<FulfillmentRulesPage />} />
      <Route path="carriers" element={<CarriersManagementPage />} />
    </Routes>
  );
}
