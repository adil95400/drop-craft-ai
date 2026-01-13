import { Suspense, lazy } from 'react';
import { lazyWithRetry } from '@/utils/lazyWithRetry';
import { LoadingFallback } from '@/components/common/LoadingFallback';

/**
 * Configuration centralisée du lazy loading des routes
 * Permet de gérer facilement le code splitting
 */

// Helper pour wrapper avec Suspense
export const withSuspense = (Component: React.LazyExoticComponent<any>) => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
};

// Pages principales - Chargées avec priorité
export const LazyDashboardHome = lazyWithRetry(() => import('@/pages/Dashboard'));
export const LazyModernProductsPage = lazyWithRetry(() => import('@/pages/products/ProductsMainPage'));
export const LazyModernOrdersPage = lazyWithRetry(() => import('@/pages/OrdersPage'));
export const LazyModernCustomersPage = lazyWithRetry(() => import('@/pages/CustomersPage'));

// Pages d'analytics - Lazy load car moins critiques
export const LazyAIPredictiveAnalyticsPage = lazyWithRetry(() => import('@/pages/AIPredictiveAnalyticsPage'));
export const LazyAdvancedAnalyticsPage = lazyWithRetry(() => import('@/pages/AdvancedAnalyticsPage'));
export const LazyBusinessIntelligencePage = lazyWithRetry(() => import('@/pages/BusinessIntelligencePage'));
export const LazyAnalyticsStudio = lazyWithRetry(() => import('@/pages/AnalyticsStudio'));

// Pages d'automation - Lazy load
export const LazyAutomationPage = lazyWithRetry(() => import('@/pages/AutomationPage'));
export const LazyAutomationStudio = lazyWithRetry(() => import('@/pages/AutomationStudio'));
export const LazyAIAutomationPage = lazyWithRetry(() => import('@/pages/AIAutomationPage'));
export const LazyMarketingAutomation = lazyWithRetry(() => import('@/pages/MarketingAutomation'));

// Pages d'import - Lazy load
export const LazyImportHub = lazyWithRetry(() => import('@/pages/import/ImportHub'));
export const LazyAdvancedImportPage = lazyWithRetry(() => import('@/pages/import/AdvancedImportPage'));

// Pages de marketing - Lazy load
export const LazyAdsMarketingPage = lazyWithRetry(() => import('@/pages/AdsMarketingPage'));
export const LazyMarketplaceHubPage = lazyWithRetry(() => import('@/pages/MarketplaceHubPage'));

// Pages admin - Lazy load (rarement utilisées)
export const LazyAdminPanel = lazyWithRetry(() => import('@/pages/AdminPanel'));

// Pages de settings - Lazy load
export const LazySettings = lazyWithRetry(() => import('@/pages/Settings'));
export const LazyProfile = lazyWithRetry(() => import('@/pages/Profile'));

// Pages d'intégrations - Lazy load (Channable-style)
export const LazyIntegrationsPage = lazyWithRetry(() => import('@/pages/integrations/ChannableStyleIntegrationsPage'));

// AI Studio - Lazy load (composant lourd)
export const LazyAIStudio = lazyWithRetry(() => import('@/pages/AIStudio'));
export const LazyAIAssistant = lazyWithRetry(() => import('@/pages/AIAssistant'));

// Extensions - Lazy load
export const LazyExtensionsHub = lazyWithRetry(() => import('@/pages/ExtensionsHub'));
export const LazyExtensionMarketplace = lazyWithRetry(() => import('@/pages/ExtensionMarketplace'));

// Pages publiques - Peuvent être lazy loadées
export const LazyFeatures = lazyWithRetry(() => import('@/pages/Features'));
export const LazyPricing = lazyWithRetry(() => import('@/pages/Pricing'));
export const LazyContact = lazyWithRetry(() => import('@/pages/Contact'));

// Auth page - Important, mais peut être lazy
export const LazyAuthPage = lazyWithRetry(() => import('@/pages/AuthPage'));

// Additional pages from App.tsx
export const LazySEO = lazyWithRetry(() => import('@/pages/SEO'));
export const LazyAutomations = lazyWithRetry(() => import('@/pages/AutomationPage'));
export const LazyIntegrations = lazyWithRetry(() => import('@/pages/integrations/ChannableStyleIntegrationsPage'));
export const LazyCatalog = lazyWithRetry(() => import('@/pages/products/EnhancedCatalog'));
export const LazyReports = lazyWithRetry(() => import('@/pages/Reports'));
export const LazyMarketplace = lazyWithRetry(() => import('@/pages/MarketplaceHubPage'));
export const LazyOrders = lazyWithRetry(() => import('@/pages/OrdersPage'));
export const LazyCustomers = lazyWithRetry(() => import('@/pages/CustomersPage'));
