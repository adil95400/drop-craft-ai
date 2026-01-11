/**
 * Routes Pricing - Tarification, Repricing, Prix dynamiques
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Pricing pages
const PricingAutomationPage = lazy(() => import('@/pages/PricingAutomationPage'));
const DynamicRepricingPage = lazy(() => import('@/pages/DynamicRepricingPage'));
const RepricingPage = lazy(() => import('@/pages/RepricingPage'));
const PriceMonitoringPage = lazy(() => import('@/pages/PriceMonitoringPage'));
const PriceOptimizationPage = lazy(() => import('@/pages/PriceOptimizationPage'));
const PriceRulesPage = lazy(() => import('@/pages/products/PriceRulesPage'));

export function PricingRoutes() {
  return (
    <Routes>
      {/* Pricing Overview */}
      <Route index element={<PricingAutomationPage />} />
      
      {/* Pricing Modules */}
      <Route path="rules" element={<PriceRulesPage />} />
      <Route path="dynamic" element={<DynamicRepricingPage />} />
      <Route path="repricing" element={<RepricingPage />} />
      <Route path="monitoring" element={<PriceMonitoringPage />} />
      <Route path="optimization" element={<PriceOptimizationPage />} />
      
      {/* Legacy redirects */}
      <Route path="automation" element={<Navigate to="/pricing" replace />} />
    </Routes>
  );
}
