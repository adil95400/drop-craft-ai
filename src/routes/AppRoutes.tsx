import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import ConnectStorePage from '@/pages/stores/ConnectStorePage'
import { IntegrationsPage } from '@/pages/stores/IntegrationsPage'
import { ManageIntegrationPage } from '@/pages/stores/ManageIntegrationPage'
import { StoreDashboard } from '@/pages/stores/StoreDashboard'
import MarketplaceHubPage from '@/pages/MarketplaceHubPage'
import MultiTenantPage from '@/pages/MultiTenantPage'
import AdvancedMonitoringPage from '@/pages/AdvancedMonitoringPage'
import ImportSourcesPage from '@/pages/ImportSourcesPage'
import ModulesOverview from '@/pages/ModulesOverview'
import Dashboard from '@/pages/Dashboard'
import OrdersPage from '@/pages/OrdersPage'
import CustomersPage from '@/pages/CustomersPage'
import ProductsPage from '@/pages/ProductsPage'
import ImportAdvancedPage from '@/pages/ImportAdvancedPage'
import SyncManagerPage from '@/pages/SyncManagerPage'
import OrdersCenterPage from '@/pages/OrdersCenterPage'
import MarketingPage from '@/pages/MarketingPage'
import AIOptimizationPage from '@/pages/features/AIOptimizationPage'
import MultiMarketplacePage from '@/pages/features/MultiMarketplacePage'
import AnalyticsPage from '@/pages/features/AnalyticsPage'
import MarketingAutomationPage from '@/pages/MarketingAutomationPage'
import AIAssistantPage from '@/pages/AIAssistantPage'
import WorkflowBuilderPage from '@/pages/WorkflowBuilderPage'
import BusinessIntelligencePage from '@/pages/BusinessIntelligencePage'
import EmailMarketingPage from '@/pages/EmailMarketingPage'
import InventoryManagementPage from '@/pages/InventoryManagementPage'
import PriceOptimizationPage from '@/pages/PriceOptimizationPage'
import CustomerSegmentationPage from '@/pages/CustomerSegmentationPage'
import SocialCommercePage from '@/pages/SocialCommercePage'
import LiveChatSupportPage from '@/pages/LiveChatSupportPage'
import ReturnManagementPage from '@/pages/ReturnManagementPage'
import LoyaltyProgramPage from '@/pages/LoyaltyProgramPage'
import AffiliateMarketingPage from '@/pages/AffiliateMarketingPage'
import ProductRecommendationsPage from '@/pages/ProductRecommendationsPage'
import DropshippingCenterPage from '@/pages/DropshippingCenterPage'
import ContentManagementPage from '@/pages/ContentManagementPage'
import ShippingManagementPage from '@/pages/ShippingManagementPage'
import ReviewsManagementPage from '@/pages/ReviewsManagementPage'
import TaxManagementPage from '@/pages/TaxManagementPage'
import CouponManagementPage from '@/pages/CouponManagementPage'
import MultiChannelManagementPage from '@/pages/MultiChannelManagementPage'
import SubscriptionManagementPage from '@/pages/SubscriptionManagementPage'
import AbandonedCartPage from '@/pages/AbandonedCartPage'
import FlashSalesPage from '@/pages/FlashSalesPage'
import VendorManagementPage from '@/pages/VendorManagementPage'
import AdsManagerPage from '@/pages/AdsManagerPage'
import CRMPage from '@/pages/CRMPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Main Pages */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="products" element={<ProductsPage />} />
        
        {/* Import & Sync */}
        <Route path="import" element={<ImportSourcesPage />} />
        <Route path="import/advanced" element={<ImportAdvancedPage />} />
        <Route path="import/sources" element={<ImportSourcesPage />} />
        <Route path="sync-manager" element={<SyncManagerPage />} />
        <Route path="orders-center" element={<OrdersCenterPage />} />
        
        {/* Stores & Modules */}
        <Route path="modules" element={<ModulesOverview />} />
        <Route path="stores" element={<StoreDashboard />} />
        <Route path="stores/connect" element={<ConnectStorePage />} />
        <Route path="stores/integrations" element={<IntegrationsPage />} />
        <Route path="stores/integrations/:id" element={<ManageIntegrationPage />} />
        
        {/* Advanced Features */}
        <Route path="marketing" element={<MarketingPage />} />
        <Route path="marketing-automation" element={<MarketingAutomationPage />} />
        <Route path="email-marketing" element={<EmailMarketingPage />} />
        <Route path="ai-assistant" element={<AIAssistantPage />} />
        <Route path="workflow-builder" element={<WorkflowBuilderPage />} />
        <Route path="business-intelligence" element={<BusinessIntelligencePage />} />
        <Route path="inventory-management" element={<InventoryManagementPage />} />
        <Route path="price-optimization" element={<PriceOptimizationPage />} />
        <Route path="customer-segmentation" element={<CustomerSegmentationPage />} />
        <Route path="social-commerce" element={<SocialCommercePage />} />
        <Route path="live-chat-support" element={<LiveChatSupportPage />} />
        <Route path="return-management" element={<ReturnManagementPage />} />
        <Route path="loyalty-program" element={<LoyaltyProgramPage />} />
        <Route path="affiliate-marketing" element={<AffiliateMarketingPage />} />
        <Route path="product-recommendations" element={<ProductRecommendationsPage />} />
        <Route path="dropshipping-center" element={<DropshippingCenterPage />} />
        <Route path="content-management" element={<ContentManagementPage />} />
        <Route path="shipping-management" element={<ShippingManagementPage />} />
        <Route path="reviews-management" element={<ReviewsManagementPage />} />
        <Route path="tax-management" element={<TaxManagementPage />} />
        <Route path="coupon-management" element={<CouponManagementPage />} />
        <Route path="multi-channel-management" element={<MultiChannelManagementPage />} />
        <Route path="subscription-management" element={<SubscriptionManagementPage />} />
        <Route path="abandoned-cart" element={<AbandonedCartPage />} />
        <Route path="flash-sales" element={<FlashSalesPage />} />
        <Route path="vendor-management" element={<VendorManagementPage />} />
        <Route path="marketplace-hub" element={<MarketplaceHubPage />} />
        <Route path="multi-tenant" element={<MultiTenantPage />} />
        <Route path="observability" element={<AdvancedMonitoringPage />} />
        <Route path="ads-manager" element={<AdsManagerPage />} />
        <Route path="crm" element={<CRMPage />} />
      </Route>
    </Routes>
  )
}