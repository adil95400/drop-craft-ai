import { Suspense, lazy, ComponentType } from 'react';
import { LoadingFallback } from '@/components/common/LoadingFallback';

// Lazy loader with retry logic (consolidated)
function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3
) {
  return lazy(async () => {
    let lastError: Error | null = null;
    for (let i = 0; i < retries; i++) {
      try {
        return await componentImport();
      } catch (error) {
        lastError = error as Error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw lastError;
  });
}

export const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<LoadingFallback />}><Component /></Suspense>
);

export const LazyDashboardHome = lazyWithRetry(() => import('@/pages/Dashboard'));
export const LazyModernProductsPage = lazyWithRetry(() => import('@/pages/products/CatalogProductsPage'));
export const LazyModernOrdersPage = lazyWithRetry(() => import('@/pages/orders/OrdersCenterPage'));
export const LazyModernCustomersPage = lazyWithRetry(() => import('@/pages/CustomersPage'));
export const LazyAdvancedAnalyticsPage = lazyWithRetry(() => import('@/pages/AdvancedAnalyticsPage'));
export const LazyBusinessIntelligencePage = lazyWithRetry(() => import('@/pages/AdvancedAnalyticsPage'));
export const LazyAnalyticsStudio = lazyWithRetry(() => import('@/pages/AdvancedAnalyticsPage'));
export const LazyAutomationPage = lazyWithRetry(() => import('@/pages/AutomationPage'));
export const LazyAutomationStudio = lazyWithRetry(() => import('@/pages/AutomationPage'));
export const LazyCrmPage = lazyWithRetry(() => import('@/pages/CrmPage'));
export const LazyImportHub = lazyWithRetry(() => import('@/pages/import/ImportHub'));
export const LazyAdvancedImportPage = lazyWithRetry(() => import('@/pages/import/AdvancedImportPage'));
export const LazyAdsMarketingPage = lazyWithRetry(() => import('@/pages/AdsMarketingPage'));
export const LazyMarketplaceHubPage = lazyWithRetry(() => import('@/pages/MarketplaceHubPage'));
export const LazyAdminPanel = lazyWithRetry(() => import('@/pages/AdminPanel'));
export const LazySettings = lazyWithRetry(() => import('@/pages/stores/StoreDashboard'));
export const LazyProfile = lazyWithRetry(() => import('@/pages/stores/StoreDashboard'));
export const LazyIntegrationsPage = lazyWithRetry(() => import('@/pages/integrations/ChannableStyleIntegrationsPage'));
export const LazyContentGenerationPage = lazyWithRetry(() => import('@/pages/ContentGenerationPage'));
export const LazyExtensionsHub = lazyWithRetry(() => import('@/pages/extensions/ExtensionsHub'));
export const LazyExtensionMarketplace = lazyWithRetry(() => import('@/pages/extensions/ExtensionsMarketplace'));
export const LazyFeatures = lazyWithRetry(() => import('@/pages/Features'));
export const LazyPricing = lazyWithRetry(() => import('@/pages/Pricing'));
export const LazyContact = lazyWithRetry(() => import('@/pages/Contact'));
export const LazyAuthPage = lazyWithRetry(() => import('@/pages/AuthPage'));
export const LazySEOManagerPage = lazyWithRetry(() => import('@/pages/SEOManagerPage'));
export const LazyAutomations = lazyWithRetry(() => import('@/pages/AutomationPage'));
export const LazyIntegrations = lazyWithRetry(() => import('@/pages/integrations/ChannableStyleIntegrationsPage'));
export const LazyCatalog = lazyWithRetry(() => import('@/pages/products/CatalogProductsPage'));
export const LazyReports = lazyWithRetry(() => import('@/pages/Reports'));
export const LazyMarketplace = lazyWithRetry(() => import('@/pages/MarketplaceHubPage'));
export const LazyOrders = lazyWithRetry(() => import('@/pages/orders/OrdersCenterPage'));
export const LazyCustomers = lazyWithRetry(() => import('@/pages/CustomersPage'));
