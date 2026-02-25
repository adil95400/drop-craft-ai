/**
 * Routes Marketing - CRM, SEO, Ads, Campaigns
 * Consolidé - Utilise pages existantes uniquement
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Marketing - Using consolidated CrmPage as main marketing page
const CrmPage = lazy(() => import('@/pages/CrmPage'));
const PromotionsAutomationPage = lazy(() => import('@/pages/PromotionsAutomationPage'));
const MarketingAutomationPage = lazy(() => import('@/pages/marketing/MarketingAutomationPage'));

// SEO - Use SEOManagerPage only
const SEOManagerPage = lazy(() => import('@/pages/SEOManagerPage'));
const SeoDashboardPage = lazy(() => import('@/pages/seo/SeoDashboardPage'));

// Ads
const AdsManagerPage = lazy(() => import('@/pages/AdsManagerPage'));

// Advanced Marketing
const ABTestingPage = lazy(() => import('@/pages/ABTestingPage'));
const AbandonedCartPage = lazy(() => import('@/pages/AbandonedCartPage'));
const AffiliateMarketingPage = lazy(() => import('@/pages/AffiliateMarketingPage'));
const EmailMarketingPage = lazy(() => import('@/pages/EmailMarketingPage'));
const FlashSalesPage = lazy(() => import('@/pages/FlashSalesPage'));
const LoyaltyProgramPage = lazy(() => import('@/pages/LoyaltyProgramPage'));
const CouponsManagementPage = lazy(() => import('@/pages/CouponsManagementPage'));
const MarketingCalendarPage = lazy(() => import('@/pages/MarketingCalendarPage'));
const SocialCommercePage = lazy(() => import('@/pages/SocialCommercePage'));
const CreativeStudioPage = lazy(() => import('@/pages/ContentGenerationPage'));
const ContentGenerationPage = lazy(() => import('@/pages/ContentGenerationPage'));

// SEO Tools
const KeywordResearch = lazy(() => import('@/pages/KeywordResearch'));
const RankTracker = lazy(() => import('@/pages/RankTracker'));
const SchemaGenerator = lazy(() => import('@/pages/SchemaGenerator'));

export function MarketingRoutes() {
  return (
    <Routes>
      {/* Marketing Overview - CrmPage consolidé */}
      <Route index element={<CrmPage />} />
      <Route path="promotions" element={<PromotionsAutomationPage />} />
      
      {/* CRM - Toutes les routes CRM */}
      <Route path="crm" element={<CrmPage />} />
      <Route path="crm/leads" element={<CrmPage />} />
      <Route path="crm/activity" element={<CrmPage />} />
      <Route path="crm/emails" element={<CrmPage />} />
      <Route path="crm/calls" element={<CrmPage />} />
      <Route path="crm/calendar" element={<CrmPage />} />
      <Route path="crm/pipeline" element={<CrmPage />} />
      <Route path="crm/scoring" element={<CrmPage />} />
      
      {/* SEO */}
      <Route path="seo" element={<SEOManagerPage />} />
      <Route path="seo/dashboard" element={<SeoDashboardPage />} />
      <Route path="seo/tools" element={<SEOManagerPage />} />
      
      {/* Ads */}
      <Route path="ads" element={<AdsManagerPage />} />
      
      {/* Advanced Marketing */}
      <Route path="ab-testing" element={<ABTestingPage />} />
      <Route path="abandoned-cart" element={<AbandonedCartPage />} />
      <Route path="affiliate" element={<AffiliateMarketingPage />} />
      <Route path="email" element={<EmailMarketingPage />} />
      <Route path="flash-sales" element={<FlashSalesPage />} />
      <Route path="loyalty" element={<LoyaltyProgramPage />} />
      <Route path="coupons" element={<CouponsManagementPage />} />
      <Route path="calendar" element={<MarketingCalendarPage />} />
      <Route path="social-commerce" element={<SocialCommercePage />} />
      <Route path="creative-studio" element={<CreativeStudioPage />} />
      <Route path="content-generation" element={<ContentGenerationPage />} />
      <Route path="automation" element={<MarketingAutomationPage />} />
      
      {/* SEO Tools */}
      <Route path="seo/keywords" element={<KeywordResearch />} />
      <Route path="seo/rank-tracker" element={<RankTracker />} />
      <Route path="seo/schema" element={<SchemaGenerator />} />
      
      {/* Creative Studio */}
      <Route path="creative-studio" element={<CreativeStudioPage />} />
      
      {/* Legacy redirects */}
      <Route path="crm-ultra-pro" element={<Navigate to="/crm" replace />} />
      <Route path="seo-ultra-pro" element={<Navigate to="/marketing/seo" replace />} />
    </Routes>
  );
}
