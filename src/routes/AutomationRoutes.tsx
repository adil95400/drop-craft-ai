/**
 * Routes Automation - Workflows, AI, Auto-fulfillment
 * Consolidé - Imports orphelins supprimés
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Automation
const AutomationPage = lazy(() => import('@/pages/AutomationPage'));
const AutomationStudio = lazy(() => import('@/pages/AutomationStudio'));

// Fulfillment & Phase 2 Marketplace - Using FulfillmentDashboardPage as main
const FulfillmentDashboardPage = lazy(() => import('@/pages/FulfillmentDashboardPage'));
const DynamicRepricingPage = lazy(() => import('@/pages/DynamicRepricingPage'));
const PredictiveAnalyticsPage = lazy(() => import('@/pages/PredictiveAnalyticsPage'));
const PromotionsAutomationPage = lazy(() => import('@/pages/PromotionsAutomationPage'));

// Optimization
const OptimizationHub = lazy(() => import('@/pages/OptimizationHub'));
const FeedOptimizationPage = lazy(() => import('@/pages/FeedOptimizationPage'));
const StockSyncDashboard = lazy(() => import('@/pages/StockManagementDashboard'));
const ProductSourcingAssistant = lazy(() => import('@/pages/ProductSourcingAssistant'));

// Unified Sync
const UnifiedSyncDashboard = lazy(() => import('@/components/sync/UnifiedSyncDashboard'));

// Advanced Automation - Using WorkflowBuilderPage as main workflow editor
const WorkflowBuilderPage = lazy(() => import('@/pages/WorkflowBuilderPage'));
const PriceOptimizationPage = lazy(() => import('@/pages/PriceOptimizationPage'));
const PricingAutomationPage = lazy(() => import('@/pages/PricingAutomationPage'));
const ProductRecommendationsPage = lazy(() => import('@/pages/ProductRecommendationsPage'));
const WorkflowBuilderAdvanced = lazy(() => import('@/pages/automation/WorkflowBuilderPage'));

// Content Generation (replaces AI Studio references)
const ContentGenerationPage = lazy(() => import('@/pages/ContentGenerationPage'));

export function AutomationRoutes() {
  return (
    <Routes>
      {/* Automation */}
      <Route index element={<AutomationPage />} />
      <Route path="studio" element={<AutomationStudio />} />
      <Route path="ai-hub" element={<AutomationPage />} />
      
      {/* AI Tools - Redirect to content generation */}
      <Route path="ai" element={<ContentGenerationPage />} />
      <Route path="ai-studio" element={<ContentGenerationPage />} />
      
      {/* Auto-Fulfillment */}
      <Route path="fulfillment" element={<FulfillmentDashboardPage />} />
      <Route path="fulfillment/dashboard" element={<FulfillmentDashboardPage />} />
      
      {/* Phase 2 - Marketplace Avancée */}
      <Route path="repricing" element={<DynamicRepricingPage />} />
      <Route path="dynamic-pricing" element={<DynamicRepricingPage />} />
      <Route path="promotions" element={<PromotionsAutomationPage />} />
      
      {/* Optimization */}
      <Route path="optimization" element={<OptimizationHub />} />
      <Route path="feed-optimization" element={<FeedOptimizationPage />} />
      <Route path="stock-sync" element={<StockSyncDashboard />} />
      <Route path="unified-sync" element={<UnifiedSyncDashboard />} />
      <Route path="sourcing-assistant" element={<ProductSourcingAssistant />} />
      
      {/* Advanced Automation */}
      <Route path="workflow-builder" element={<WorkflowBuilderPage />} />
      <Route path="workflow-editor" element={<WorkflowBuilderPage />} />
      <Route path="price-optimization" element={<PriceOptimizationPage />} />
      <Route path="pricing-automation" element={<PricingAutomationPage />} />
      <Route path="recommendations" element={<ProductRecommendationsPage />} />
      <Route path="workflows" element={<WorkflowBuilderAdvanced />} />
      
      {/* Legacy redirects */}
      <Route path="ultra-pro" element={<Navigate to="/automation" replace />} />
    </Routes>
  );
}
