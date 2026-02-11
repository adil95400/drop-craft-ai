/**
 * Routes Automation - Workflows, AI, Auto-fulfillment
 * Consolidé - Imports orphelins supprimés
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Fulfillment & Tracking
const AutoFulfillmentPage = lazy(() => import('@/pages/AutoFulfillmentPage'));
const AutoTrackingPage = lazy(() => import('@/pages/AutoTrackingPage'));

// Automation
const AutomationPage = lazy(() => import('@/pages/AutomationPage'));
const PredictiveAnalyticsPage = lazy(() => import('@/pages/PredictiveAnalyticsPage'));
const PromotionsAutomationPage = lazy(() => import('@/pages/PromotionsAutomationPage'));

// Optimization
const OptimizationHub = lazy(() => import('@/pages/OptimizationHub'));
const ProductSourcingAssistant = lazy(() => import('@/pages/ProductSourcingAssistant'));

// Unified Sync
const UnifiedSyncDashboard = lazy(() => import('@/components/sync/UnifiedSyncDashboard'));

// Advanced Automation - Using AutomationPage for workflows
const ProductRecommendationsPage = lazy(() => import('@/pages/ProductRecommendationsPage'));

// Content Generation (replaces AI Studio references)
const ContentGenerationPage = lazy(() => import('@/pages/ContentGenerationPage'));

// Price Rules - centralized pricing
const PriceRulesPage = lazy(() => import('@/pages/products/PriceRulesPage'));

export function AutomationRoutes() {
  return (
    <Routes>
      {/* Automation */}
      <Route index element={<AutomationPage />} />
      <Route path="studio" element={<AutomationPage />} />
      <Route path="ai-hub" element={<AutomationPage />} />
      <Route path="triggers" element={<AutomationPage />} />
      
      {/* AI Tools - Redirect to content generation */}
      <Route path="ai" element={<ContentGenerationPage />} />
      <Route path="ai-studio" element={<ContentGenerationPage />} />
      
      {/* Auto-Fulfillment */}
      <Route path="fulfillment" element={<AutoFulfillmentPage />} />
      <Route path="fulfillment/dashboard" element={<AutoFulfillmentPage />} />
      <Route path="tracking" element={<AutoTrackingPage />} />
      
      {/* Phase 2 - Marketplace Avancée - Redirect to pricing-manager */}
      <Route path="repricing" element={<Navigate to="/pricing-manager/repricing" replace />} />
      <Route path="dynamic-pricing" element={<Navigate to="/pricing-manager/repricing" replace />} />
      <Route path="promotions" element={<PromotionsAutomationPage />} />
      
      {/* Optimization */}
      <Route path="optimization" element={<OptimizationHub />} />
      <Route path="feed-optimization" element={<Navigate to="/feeds/optimization" replace />} />
      <Route path="stock-sync" element={<Navigate to="/stock" replace />} />
      <Route path="unified-sync" element={<UnifiedSyncDashboard />} />
      <Route path="sourcing-assistant" element={<ProductSourcingAssistant />} />
      
      {/* Advanced Automation */}
      <Route path="workflow-builder" element={<AutomationPage />} />
      <Route path="workflow-editor" element={<AutomationPage />} />
      <Route path="price-optimization" element={<Navigate to="/pricing-manager/optimization" replace />} />
      <Route path="pricing-automation" element={<Navigate to="/pricing-manager" replace />} />
      <Route path="recommendations" element={<ProductRecommendationsPage />} />
      <Route path="workflows" element={<AutomationPage />} />
      
      {/* Legacy redirects */}
      <Route path="ultra-pro" element={<Navigate to="/automation" replace />} />
    </Routes>
  );
}
