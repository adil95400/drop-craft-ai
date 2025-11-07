/**
 * Routes Analytics - Reports, Intelligence, Insights
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Analytics
const ModernAnalyticsPage = lazy(() => import('@/pages/ModernAnalyticsPage'));
const AdvancedAnalyticsPage = lazy(() => import('@/pages/AdvancedAnalyticsPage'));
const AnalyticsStudio = lazy(() => import('@/pages/AnalyticsStudio'));

// Intelligence
const AIIntelligencePage = lazy(() => import('@/pages/AIIntelligencePage'));
const CustomerIntelligencePage = lazy(() => import('@/pages/CustomerIntelligencePage'));
const GlobalIntelligencePage = lazy(() => import('@/pages/GlobalIntelligencePage'));

// Competitive
const CompetitorAnalysisPage = lazy(() => import('@/pages/CompetitorAnalysisPage'));
const CompetitiveComparisonPage = lazy(() => import('@/pages/competitive/CompetitiveComparisonPage'));
const PriceMonitoringPage = lazy(() => import('@/pages/PriceMonitoringPage'));

// Reports
const Reports = lazy(() => import('@/pages/Reports'));
const ProfitAnalyticsDashboard = lazy(() => import('@/pages/ProfitAnalyticsDashboard'));

export function AnalyticsRoutes() {
  return (
    <Routes>
      {/* Analytics Overview */}
      <Route index element={<ModernAnalyticsPage />} />
      <Route path="advanced" element={<AdvancedAnalyticsPage />} />
      <Route path="studio" element={<AnalyticsStudio />} />
      
      {/* Intelligence */}
      <Route path="ai-intelligence" element={<AIIntelligencePage />} />
      <Route path="customer-intelligence" element={<CustomerIntelligencePage />} />
      <Route path="global-intelligence" element={<GlobalIntelligencePage />} />
      
      {/* Competitive Analysis */}
      <Route path="competitor-analysis" element={<CompetitorAnalysisPage />} />
      <Route path="competitive-comparison" element={<CompetitiveComparisonPage />} />
      <Route path="price-monitoring" element={<PriceMonitoringPage />} />
      
      {/* Reports */}
      <Route path="reports" element={<Reports />} />
      <Route path="profit-analytics" element={<ProfitAnalyticsDashboard />} />
      
      {/* Legacy redirects */}
      <Route path="ultra-pro" element={<Navigate to="/analytics/advanced" replace />} />
    </Routes>
  );
}
