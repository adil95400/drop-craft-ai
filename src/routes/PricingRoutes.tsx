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
const PriceRulesPage = lazy(() => import('@/pages/products/PriceRulesPage'));
const LiveRepricingPage = lazy(() => import('@/pages/pricing/LiveRepricingPage'));

export function PricingRoutes() {
  return (
    <Routes>
      {/* Hub Tarification - Vue d'ensemble */}
      <Route index element={<PriceRulesPage />} />
      
      {/* Règles de Prix - Règles statiques */}
      <Route path="rules" element={<PriceRulesPage />} />
      
      {/* Repricing Auto - Temps réel + Sync boutiques */}
      <Route path="repricing" element={<LiveRepricingPage />} />
      
      {/* Veille Prix - Surveillance concurrence */}
      <Route path="monitoring" element={<LiveRepricingPage />} />
      
      {/* Optimisation IA - Recommandations */}
      <Route path="optimization" element={<PriceRulesPage />} />
      
      {/* Legacy redirects */}
      <Route path="automation" element={<Navigate to="/pricing-manager" replace />} />
      <Route path="dynamic" element={<Navigate to="/pricing-manager/repricing" replace />} />
    </Routes>
  );
}
