/**
 * Routes Analytics - Reports, Intelligence, Insights
 * Module complet avec données réelles et BI avancée
 * Consolidé v6.0 - Nettoyage fichiers orphelins
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Analytics
const AdvancedAnalyticsPage = lazy(() => import('@/pages/AdvancedAnalyticsPage'));
const PredictiveAnalyticsPage = lazy(() => import('@/pages/PredictiveAnalyticsPage'));

// Competitive
const CompetitorAnalysisPage = lazy(() => import('@/pages/CompetitorAnalysisPage'));

// Reports
const Reports = lazy(() => import('@/pages/Reports'));
const ProfitDashboard = lazy(() => import('@/pages/analytics/ProfitDashboard'));

// Advanced Analytics
const CustomerSegmentationPage = lazy(() => import('@/pages/CustomerSegmentationPage'));
const AdvancedAnalyticsDashboardPage = lazy(() => import('@/pages/analytics/AdvancedAnalyticsPage'));

// Real Data Analytics
const RealDataAnalyticsPage = lazy(() => import('@/pages/analytics/RealDataAnalyticsPage'));

// Revenue Forecasting
const RevenueForecastingPage = lazy(() => import('@/pages/analytics/RevenueForecastingPage'));

// Interactive Analytics (Sprint 10)
const InteractiveAnalyticsPage = lazy(() => import('@/pages/analytics/InteractiveAnalyticsPage'));

// BI Advanced (Sprint 17)
const BIAdvancedDashboardPage = lazy(() => import('@/pages/analytics/BIAdvancedDashboardPage'));

// Performance (Sprint 18)
const PerformanceDashboardPage = lazy(() => import('@/pages/analytics/PerformanceDashboardPage'));

export function AnalyticsRoutes() {
  return (
    <Routes>
      {/* Analytics Overview */}
      <Route index element={<AdvancedAnalyticsPage />} />
      <Route path="unified" element={<AdvancedAnalyticsPage />} />
      <Route path="studio" element={<AdvancedAnalyticsPage />} />
      <Route path="predictive" element={<PredictiveAnalyticsPage />} />
      
      {/* Real Data Analytics */}
      <Route path="real-data" element={<RealDataAnalyticsPage />} />
      <Route path="bi" element={<AdvancedAnalyticsPage />} />
      
      {/* Intelligence - Redirect to predictive */}
      <Route path="ai-intelligence" element={<PredictiveAnalyticsPage />} />
      <Route path="customer-intelligence" element={<PredictiveAnalyticsPage />} />
      <Route path="global-intelligence" element={<PredictiveAnalyticsPage />} />
      
      {/* Competitive Analysis */}
      <Route path="competitive" element={<CompetitorAnalysisPage />} />
      <Route path="competitor-analysis" element={<CompetitorAnalysisPage />} />
      <Route path="competitive-comparison" element={<CompetitorAnalysisPage />} />
      <Route path="price-monitoring" element={<Navigate to="/pricing-manager/monitoring" replace />} />
      
      {/* Reports */}
      <Route path="reports" element={<Reports />} />
      <Route path="profit-analytics" element={<ProfitDashboard />} />
      
      {/* Advanced Analytics */}
      <Route path="advanced" element={<AdvancedAnalyticsDashboardPage />} />
      <Route path="business-intelligence" element={<AdvancedAnalyticsPage />} />
      <Route path="customer-segmentation" element={<CustomerSegmentationPage />} />
      <Route path="product-intelligence" element={<PredictiveAnalyticsPage />} />
      <Route path="advanced-dashboard" element={<AdvancedAnalyticsDashboardPage />} />
      
      {/* Revenue Forecasting */}
      <Route path="forecasting" element={<RevenueForecastingPage />} />
      <Route path="revenue-forecast" element={<RevenueForecastingPage />} />
      <Route path="projections" element={<RevenueForecastingPage />} />
      
      {/* Interactive Analytics (Sprint 10) */}
      <Route path="interactive" element={<InteractiveAnalyticsPage />} />
      
      {/* BI Advanced (Sprint 17) */}
      <Route path="bi-advanced" element={<BIAdvancedDashboardPage />} />
      <Route path="cohorts" element={<BIAdvancedDashboardPage />} />
      <Route path="smart-alerts" element={<BIAdvancedDashboardPage />} />
      
      {/* Performance (Sprint 18) */}
      <Route path="performance" element={<PerformanceDashboardPage />} />
      <Route path="monitoring-perf" element={<PerformanceDashboardPage />} />

      {/* Legacy redirects */}
      <Route path="ultra-pro" element={<Navigate to="/analytics/advanced" replace />} />
    </Routes>
  );
}
