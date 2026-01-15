/**
 * Routes Core - Dashboard, Stores, Orders, Customers
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Dashboard
const DashboardHome = lazy(() => import('@/pages/Dashboard'));
const Profile = lazy(() => import('@/pages/Profile'));
const Settings = lazy(() => import('@/pages/Settings'));

// Stores - Now handled by ChannelRoutes, keeping redirects for compatibility

// Orders & Customers - Now handled by OrderRoutes & CustomerRoutes

// Quick actions

// Quick actions
const SyncManagerPage = lazy(() => import('@/pages/sync/SyncManagerPage'));
const MarketplaceSyncDashboard = lazy(() => import('@/pages/MarketplaceSyncDashboard'));
const MultiStoreCentralDashboard = lazy(() => import('@/pages/MultiStoreCentralDashboard'));
const StoreSyncDashboard = lazy(() => import('@/pages/StoreSyncDashboard'));
const StockManagementDashboard = lazy(() => import('@/pages/StockManagementDashboard'));
const AdvancedNotificationCenter = lazy(() => import('@/pages/AdvancedNotificationCenter'));
const MultiStoreAnalyticsDashboard = lazy(() => import('@/pages/MultiStoreAnalyticsDashboard'));

// Order Management
const ReturnManagementPage = lazy(() => import('@/pages/ReturnManagementPage'));
const AIStoreBuilderHub = lazy(() => import('@/pages/store/AIStoreBuilderHub'));
const BrandingInvoicesHub = lazy(() => import('@/pages/invoices/BrandingInvoicesHub'));
const PrintOnDemandHub = lazy(() => import('@/pages/pod/PrintOnDemandHub'));
const CompetitiveIntelligenceHub = lazy(() => import('@/pages/research/CompetitiveIntelligenceHub'));

// Stock & Reports
const StockManagement = lazy(() => import('@/pages/stock/StockManagementPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));

// Analytics & Products
const AnalyticsDashboard = lazy(() => import('@/pages/AnalyticsDashboard'));
const ProductsMainPage = lazy(() => import('@/pages/products/ProductsMainPage'));

// Suppliers - MOVED TO SupplierRoutes.tsx - Redirections only

// AI & Automation
const AIInsightsPage = lazy(() => import('@/pages/AIInsightsPage'));
const WorkflowsPage = lazy(() => import('@/pages/WorkflowsPage'));

// Settings & Management
const APIManagementPage = lazy(() => import('@/pages/APIManagementPage'));
const BillingPage = lazy(() => import('@/pages/BillingPage'));

// Learning & Security
const AcademyPage = lazy(() => import('@/pages/AcademyPage'));
const SecurityDashboard = lazy(() => import('@/pages/SecurityDashboard'));

// Additional Pages
const SubscriptionPage = lazy(() => import('@/pages/SubscriptionPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));

// Onboarding
const OnboardingHubPage = lazy(() => import('@/pages/onboarding/OnboardingHubPage'));

export function CoreRoutes() {
  return (
    <Routes>
      {/* Dashboard */}
      <Route index element={<DashboardHome />} />
      <Route path="profile" element={<Profile />} />
      <Route path="settings" element={<Settings />} />
      
      {/* Legacy dashboard redirects */}
      <Route path="super" element={<Navigate to="/dashboard" replace />} />
      <Route path="classic" element={<Navigate to="/dashboard" replace />} />
      
      {/* Stores Management - Redirect to new unified channel hub */}
      <Route path="stores/*" element={<Navigate to="/stores-channels" replace />} />
      
      {/* Orders & Customers - Now handled by dedicated routes, keeping redirects for compatibility */}
      <Route path="orders/*" element={<Navigate to="/orders" replace />} />
      <Route path="orders-center" element={<Navigate to="/orders/center" replace />} />
      <Route path="customers/*" element={<Navigate to="/customers" replace />} />
      
      {/* Module E: AI Store Builder */}
      <Route path="store/builder" element={<AIStoreBuilderHub />} />
      
      {/* Module G: Custom Invoices */}
      <Route path="invoices" element={<BrandingInvoicesHub />} />
      
      {/* Module H: Print On Demand */}
      <Route path="pod" element={<PrintOnDemandHub />} />
      
      {/* Module F: Competitive Intelligence */}
      <Route path="research/intelligence" element={<CompetitiveIntelligenceHub />} />
      
      {/* Quick Actions */}
      <Route path="sync-manager" element={<SyncManagerPage />} />
      <Route path="marketplace-sync" element={<MarketplaceSyncDashboard />} />
      <Route path="multi-store" element={<MultiStoreCentralDashboard />} />
      <Route path="notifications" element={<AdvancedNotificationCenter />} />
      
      {/* Stock & Reports */}
      <Route path="stock" element={<StockManagement />} />
      <Route path="reports" element={<ReportsPage />} />
      
      {/* Analytics & Products */}
      <Route path="analytics" element={<AnalyticsDashboard />} />
      <Route path="products" element={<ProductsMainPage />} />
      
      {/* Suppliers - Redirect to /suppliers module */}
      <Route path="suppliers/*" element={<Navigate to="/suppliers" replace />} />
      
      {/* AI & Automation */}
      <Route path="ai-insights" element={<AIInsightsPage />} />
      <Route path="workflows" element={<WorkflowsPage />} />
      
      {/* Settings & Management - Now handled by SettingsRoutes, keeping redirects */}
      <Route path="api" element={<APIManagementPage />} />
      <Route path="billing" element={<BillingPage />} />
      
      {/* Learning & Security */}
      <Route path="academy" element={<AcademyPage />} />
      <Route path="security" element={<SecurityDashboard />} />
      
      {/* Onboarding */}
      <Route path="onboarding" element={<OnboardingHubPage />} />
      
      {/* Subscription & Notifications */}
      <Route path="subscription" element={<SubscriptionPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      
      {/* Settings (accessible from sidebar) */}
      <Route path="parametres" element={<Navigate to="/settings" replace />} />
    </Routes>
  );
}
