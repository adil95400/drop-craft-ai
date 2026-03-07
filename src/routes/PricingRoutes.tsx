/**
 * Routes Pricing - Tarification Unifiée
 * 
 * Navigation harmonisée:
 * - /pricing-manager → Hub Tarification (vue d'ensemble)
 * - /pricing-manager/rules → Règles statiques (markup, marge, arrondi)
 * - /pricing-manager/repricing → Repricing auto + sync boutiques
 * - /pricing-manager/monitoring → Veille concurrence + auto-pricing
 * - /pricing-manager/optimization → Optimisation IA + élasticité
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Pricing pages
const PricingManagerHub = lazy(() => import('@/pages/pricing/PricingManagerHub'));
const PriceRulesPage = lazy(() => import('@/pages/products/PriceRulesPage'));
const LiveRepricingPage = lazy(() => import('@/pages/pricing/LiveRepricingPage'));
const PriceMonitoringPage = lazy(() => import('@/pages/products/PriceMonitoringPage'));
const PricingEnginePage = lazy(() => import('@/pages/products/PricingEnginePage'));
const PricingOptimizationPage = lazy(() => import('@/pages/pricing/PricingOptimizationPage'));

export function PricingRoutes() {
  return (
    <Routes>
      {/* Hub Tarification - Vue d'ensemble */}
      <Route index element={<PricingManagerHub />} />
      
      {/* Règles de Prix */}
      <Route path="rules" element={<PriceRulesPage />} />
      
      {/* Repricing Auto */}
      <Route path="repricing" element={<LiveRepricingPage />} />
      
      {/* Veille Prix */}
      <Route path="monitoring" element={<PriceMonitoringPage />} />
      
      {/* Moteur de règles */}
      <Route path="engine" element={<PricingEnginePage />} />
      
      {/* Optimisation IA */}
      <Route path="optimization" element={<PricingOptimizationPage />} />
      
      {/* Legacy redirects */}
      <Route path="automation" element={<Navigate to="/pricing-manager" replace />} />
      <Route path="dynamic" element={<Navigate to="/pricing-manager/repricing" replace />} />
    </Routes>
  );
}
