/**
 * Routes Core - Dashboard, Stores, Orders, Customers
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Dashboard
const DashboardHome = lazy(() => import('@/pages/Dashboard'));
const Profile = lazy(() => import('@/pages/Profile'));
const Settings = lazy(() => import('@/pages/Settings'));

// Stores
const StoreDashboard = lazy(() => import('@/pages/stores/StoreDashboard'));
const ConnectStorePage = lazy(() => import('@/pages/stores/ConnectStorePage'));
const IntegrationsPage = lazy(() => import('@/pages/stores/IntegrationsPage'));
const ManageIntegrationPage = lazy(() => import('@/pages/stores/ManageIntegrationPage'));
const ImportedProductsPage = lazy(() => import('@/pages/stores/ImportedProductsPage'));
const ShopifyDiagnostic = lazy(() => import('@/pages/ShopifyDiagnostic'));
const ShopifyManagementPage = lazy(() => import('@/pages/ShopifyManagementPage'));

// Orders
const OrdersPage = lazy(() => import('@/pages/OrdersPage'));
const OrderDetail = lazy(() => import('@/pages/orders/OrderDetail'));
const OrdersCenterPage = lazy(() => import('@/pages/OrdersCenterPage'));
const ReturnsManagementPage = lazy(() => import('@/pages/orders/ReturnsManagementPage'));
const TrackingDashboardPage = lazy(() => import('@/pages/orders/TrackingDashboardPage'));
const CustomerNotificationsPage = lazy(() => import('@/pages/orders/CustomerNotificationsPage'));

// Customers
const CustomersPage = lazy(() => import('@/pages/CustomersPage'));

// Quick actions
const SyncManagerPage = lazy(() => import('@/pages/SyncManagerPage'));
const MarketplaceSyncDashboard = lazy(() => import('@/pages/MarketplaceSyncDashboard'));
const MultiStoreCentralDashboard = lazy(() => import('@/pages/MultiStoreCentralDashboard'));
const StoreSyncDashboard = lazy(() => import('@/pages/StoreSyncDashboard'));
const StockManagementDashboard = lazy(() => import('@/pages/StockManagementDashboard'));
const AdvancedNotificationCenter = lazy(() => import('@/pages/AdvancedNotificationCenter'));
const MultiStoreAnalyticsDashboard = lazy(() => import('@/pages/MultiStoreAnalyticsDashboard'));

// Order Management
const ReturnManagementPage = lazy(() => import('@/pages/ReturnManagementPage'));
const ShippingManagementPage = lazy(() => import('@/pages/ShippingManagementPage'));
const AIStoreBuilderHub = lazy(() => import('@/pages/store/AIStoreBuilderHub'));
const BrandingInvoicesHub = lazy(() => import('@/pages/invoices/BrandingInvoicesHub'));
const PrintOnDemandHub = lazy(() => import('@/pages/pod/PrintOnDemandHub'));
const CompetitiveIntelligenceHub = lazy(() => import('@/pages/research/CompetitiveIntelligenceHub'));

// Stock & Reports
const StockManagement = lazy(() => import('@/pages/StockManagement'));
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
      
      {/* Stores Management */}
      <Route path="stores" element={<StoreDashboard />} />
      <Route path="stores/connect" element={<ConnectStorePage />} />
      <Route path="stores/integrations" element={<IntegrationsPage />} />
      <Route path="stores/integrations/:id" element={<ManageIntegrationPage />} />
      <Route path="stores/imported-products" element={<ImportedProductsPage />} />
      <Route path="stores/shopify-diagnostic" element={<ShopifyDiagnostic />} />
      <Route path="stores/shopify-management" element={<ShopifyManagementPage />} />
      
      {/* Orders Management */}
      <Route path="orders" element={<OrdersPage />} />
      <Route path="orders/:id" element={<OrderDetail />} />
      <Route path="orders-center" element={<OrdersCenterPage />} />
      <Route path="orders/returns" element={<ReturnsManagementPage />} />
      <Route path="orders/tracking" element={<TrackingDashboardPage />} />
      <Route path="orders/notifications" element={<CustomerNotificationsPage />} />
      <Route path="orders/shipping" element={<ShippingManagementPage />} />
      
      {/* Module E: AI Store Builder */}
      <Route path="store/builder" element={<AIStoreBuilderHub />} />
      
      {/* Module G: Custom Invoices */}
      <Route path="invoices" element={<BrandingInvoicesHub />} />
      
      {/* Module H: Print On Demand */}
      <Route path="pod" element={<PrintOnDemandHub />} />
      
      {/* Module F: Competitive Intelligence */}
      <Route path="research/intelligence" element={<CompetitiveIntelligenceHub />} />
      
      {/* Import */}
      {/* Import routes are now in ImportRoutes module */}
      
      {/* Customers */}
      <Route path="customers" element={<CustomersPage />} />
      
      {/* Quick Actions */}
      <Route path="sync-manager" element={<SyncManagerPage />} />
      <Route path="marketplace-sync" element={<MarketplaceSyncDashboard />} />
      <Route path="multi-store" element={<MultiStoreCentralDashboard />} />
      <Route path="stores/sync" element={<StoreSyncDashboard />} />
      <Route path="stores/stock-intelligence" element={<StockManagementDashboard />} />
      <Route path="stores/analytics" element={<MultiStoreAnalyticsDashboard />} />
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
      
      {/* Settings & Management */}
      <Route path="api" element={<APIManagementPage />} />
      <Route path="billing" element={<BillingPage />} />
      
      {/* Learning & Security */}
      <Route path="academy" element={<AcademyPage />} />
      <Route path="security" element={<SecurityDashboard />} />
      
      {/* Subscription & Notifications */}
      <Route path="subscription" element={<SubscriptionPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      
      {/* Settings (accessible from sidebar) */}
      <Route path="parametres" element={<Settings />} />
    </Routes>
  );
}
