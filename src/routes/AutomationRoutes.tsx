/**
 * Routes Automation - Workflows, AI, Auto-fulfillment
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Automation
const AutomationPage = lazy(() => import('@/pages/AutomationPage'));
const AutomationStudio = lazy(() => import('@/pages/AutomationStudio'));
const AIAutomationHub = lazy(() => import('@/pages/AIAutomationHub'));

// AI Tools
const AIPage = lazy(() => import('@/pages/AIPage'));
const AIStudio = lazy(() => import('@/pages/AIStudio'));

// Fulfillment & Phase 2 Marketplace
const AutoFulfillmentPage = lazy(() => import('@/pages/AutoFulfillmentPage'));
const AutoFulfillmentDashboard = lazy(() => import('@/pages/AutoFulfillmentDashboard'));
const DynamicRepricingPage = lazy(() => import('@/pages/DynamicRepricingPage'));
const PredictiveAnalyticsPage = lazy(() => import('@/pages/PredictiveAnalyticsPage'));
const PromotionsAutomationPage = lazy(() => import('@/pages/PromotionsAutomationPage'));

// Optimization
const OptimizationHub = lazy(() => import('@/pages/OptimizationHub'));
const FeedOptimizationPage = lazy(() => import('@/pages/FeedOptimizationPage'));
const StockSyncDashboard = lazy(() => import('@/pages/StockManagementDashboard'));
const ProductSourcingAssistant = lazy(() => import('@/pages/ProductSourcingAssistant'));

// Advanced Automation
const WorkflowBuilderPage = lazy(() => import('@/pages/WorkflowBuilderPage'));
const WorkflowEditorPage = lazy(() => import('@/pages/WorkflowEditorPage'));
const PriceOptimizationPage = lazy(() => import('@/pages/PriceOptimizationPage'));
const PricingAutomationPage = lazy(() => import('@/pages/PricingAutomationPage'));
const ProductRecommendationsPage = lazy(() => import('@/pages/ProductRecommendationsPage'));
const DynamicPricing = lazy(() => import('@/pages/DynamicPricing'));

export function AutomationRoutes() {
  return (
    <Routes>
      {/* Automation */}
      <Route index element={<AutomationPage />} />
      <Route path="studio" element={<AutomationStudio />} />
      <Route path="ai-hub" element={<AIAutomationHub />} />
      
      {/* AI Tools */}
      <Route path="ai" element={<AIPage />} />
      <Route path="ai-studio" element={<AIStudio />} />
      
      {/* Auto-Fulfillment */}
      <Route path="fulfillment" element={<AutoFulfillmentPage />} />
      <Route path="fulfillment/dashboard" element={<AutoFulfillmentDashboard />} />
      
      {/* Phase 2 - Marketplace Avancée */}
      <Route path="repricing" element={<DynamicRepricingPage />} />
      <Route path="promotions" element={<PromotionsAutomationPage />} />
      
      {/* Optimization */}
      <Route path="optimization" element={<OptimizationHub />} />
      <Route path="feed-optimization" element={<FeedOptimizationPage />} />
      <Route path="stock-sync" element={<StockSyncDashboard />} />
      <Route path="sourcing-assistant" element={<ProductSourcingAssistant />} />
      
      {/* Advanced Automation */}
      <Route path="workflow-builder" element={<WorkflowBuilderPage />} />
      <Route path="workflow-editor" element={<WorkflowEditorPage />} />
      <Route path="price-optimization" element={<PriceOptimizationPage />} />
      <Route path="pricing-automation" element={<PricingAutomationPage />} />
      <Route path="recommendations" element={<ProductRecommendationsPage />} />
      <Route path="dynamic-pricing" element={<DynamicPricing />} />
      
      {/* Legacy redirects */}
      <Route path="ultra-pro" element={<Navigate to="/automation" replace />} />
    </Routes>
  );
}
