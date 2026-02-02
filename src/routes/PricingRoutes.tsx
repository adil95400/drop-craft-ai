/**
 * Routes Pricing - Tarification Unifiée
 * 
 * Navigation harmonisée:
 * - /pricing → Hub Tarification (vue d'ensemble)
 * - /pricing/rules → Règles statiques (markup, marge, arrondi)
 * - /pricing/repricing → Repricing auto + sync boutiques
 * - /pricing/monitoring → Veille concurrence + auto-pricing
 * - /pricing/optimization → Optimisation IA + élasticité
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Pricing pages
const PricingAutomationPage = lazy(() => import('@/pages/PricingAutomationPage'));
const RepricingPage = lazy(() => import('@/pages/RepricingPage'));
const PriceMonitoringPage = lazy(() => import('@/pages/PriceMonitoringPage'));
const PriceOptimizationPage = lazy(() => import('@/pages/PriceOptimizationPage'));
const PriceRulesPage = lazy(() => import('@/pages/products/PriceRulesPage'));

export function PricingRoutes() {
  return (
    <Routes>
      {/* Hub Tarification - Vue d'ensemble */}
      <Route index element={<PricingAutomationPage />} />
      
      {/* Règles de Prix - Règles statiques */}
      <Route path="rules" element={<PriceRulesPage />} />
      
      {/* Repricing Auto - Temps réel + Sync boutiques */}
      <Route path="repricing" element={<RepricingPage />} />
      
      {/* Veille Prix - Surveillance concurrence */}
      <Route path="monitoring" element={<PriceMonitoringPage />} />
      
      {/* Optimisation IA - Recommandations */}
      <Route path="optimization" element={<PriceOptimizationPage />} />
      
      {/* Legacy redirects */}
      <Route path="automation" element={<Navigate to="/pricing-manager" replace />} />
      <Route path="dynamic" element={<Navigate to="/pricing-manager/repricing" replace />} />
    </Routes>
  );
}
