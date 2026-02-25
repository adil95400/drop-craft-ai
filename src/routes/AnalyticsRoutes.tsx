/**
 * Routes Analytics - Consolidé S2
 * Pages redondantes fusionnées, obsolètes redirigées
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Core Analytics (tabbed hub)
const AdvancedAnalyticsPage = lazy(() => import('@/pages/AdvancedAnalyticsPage'));

// Predictive
const AnalyticsPredictivePage = lazy(() => import('@/pages/analytics/AnalyticsPredictivePage'));

// Competitive
const CompetitorAnalysisPage = lazy(() => import('@/pages/CompetitorAnalysisPage'));

// Reports
const Reports = lazy(() => import('@/pages/Reports'));
const ProfitDashboard = lazy(() => import('@/pages/analytics/ProfitDashboard'));
const ScheduledReportsPage = lazy(() => import('@/pages/analytics/ScheduledReportsPage'));

// Segmentation
const CustomerSegmentationPage = lazy(() => import('@/pages/CustomerSegmentationPage'));

// Real Data & Forecasting
const RealDataAnalyticsPage = lazy(() => import('@/pages/analytics/RealDataAnalyticsPage'));
const RevenueForecastingPage = lazy(() => import('@/pages/analytics/RevenueForecastingPage'));

// Interactive (Sprint 10)
const InteractiveAnalyticsPage = lazy(() => import('@/pages/analytics/InteractiveAnalyticsPage'));

// BI Advanced (Sprint 17)
const BIAdvancedDashboardPage = lazy(() => import('@/pages/analytics/BIAdvancedDashboardPage'));

// Performance (Sprint 18)
const PerformanceDashboardPage = lazy(() => import('@/pages/analytics/PerformanceDashboardPage'));

export function AnalyticsRoutes() {
  return (
    <Routes>
      {/* Main hub */}
      <Route index element={<AdvancedAnalyticsPage />} />
      <Route path="predictive" element={<AnalyticsPredictivePage />} />
      <Route path="real-data" element={<RealDataAnalyticsPage />} />
      <Route path="bi" element={<BIAdvancedDashboardPage />} />

      {/* Competitive */}
      <Route path="competitive" element={<CompetitorAnalysisPage />} />

      {/* Reports */}
      <Route path="reports" element={<Reports />} />
      <Route path="scheduled-reports" element={<ScheduledReportsPage />} />
      <Route path="profit-analytics" element={<ProfitDashboard />} />

      {/* Segmentation & Forecasting */}
      <Route path="customer-segmentation" element={<CustomerSegmentationPage />} />
      <Route path="forecasting" element={<RevenueForecastingPage />} />

      {/* Interactive & BI */}
      <Route path="interactive" element={<InteractiveAnalyticsPage />} />
      <Route path="bi-advanced" element={<BIAdvancedDashboardPage />} />

      {/* Performance */}
      <Route path="performance" element={<PerformanceDashboardPage />} />

      {/* === Redirects: merged/obsolete routes === */}
      <Route path="unified" element={<Navigate to="/analytics" replace />} />
      <Route path="studio" element={<Navigate to="/analytics" replace />} />
      <Route path="advanced" element={<Navigate to="/analytics" replace />} />
      <Route path="advanced-dashboard" element={<Navigate to="/analytics" replace />} />
      <Route path="business-intelligence" element={<Navigate to="/analytics" replace />} />
      <Route path="ultra-pro" element={<Navigate to="/analytics" replace />} />
      <Route path="ai-intelligence" element={<Navigate to="/analytics/predictive" replace />} />
      <Route path="customer-intelligence" element={<Navigate to="/analytics/predictive" replace />} />
      <Route path="global-intelligence" element={<Navigate to="/analytics/predictive" replace />} />
      <Route path="product-intelligence" element={<Navigate to="/analytics/predictive" replace />} />
      <Route path="competitor-analysis" element={<Navigate to="/analytics/competitive" replace />} />
      <Route path="competitive-comparison" element={<Navigate to="/analytics/competitive" replace />} />
      <Route path="price-monitoring" element={<Navigate to="/pricing-manager/monitoring" replace />} />
      <Route path="revenue-forecast" element={<Navigate to="/analytics/forecasting" replace />} />
      <Route path="projections" element={<Navigate to="/analytics/forecasting" replace />} />
      <Route path="cohorts" element={<Navigate to="/analytics/bi-advanced" replace />} />
      <Route path="smart-alerts" element={<Navigate to="/analytics/bi-advanced" replace />} />
      <Route path="monitoring-perf" element={<Navigate to="/analytics/performance" replace />} />
    </Routes>
  );
}
