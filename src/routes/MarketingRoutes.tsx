/**
 * Routes Marketing - CRM, SEO, Ads, Campaigns
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Marketing
const MarketingPage = lazy(() => import('@/pages/MarketingAutomation'));
const MarketingAutomationHubPage = lazy(() => import('@/pages/MarketingAutomationHub'));
const PromotionsAutomationPage = lazy(() => import('@/pages/PromotionsAutomationPage'));

// CRM
const CRM = lazy(() => import('@/pages/CRM'));
const CRMLeads = lazy(() => import('@/pages/CRMLeads'));
const CRMActivity = lazy(() => import('@/pages/CRMActivity'));
const CRMEmails = lazy(() => import('@/pages/CRMEmails'));
const CRMCalls = lazy(() => import('@/pages/CRMCalls'));
const CRMCalendar = lazy(() => import('@/pages/CRMCalendar'));

// SEO
const SEOManagerPage = lazy(() => import('@/pages/SEOManager'));
const SEO = lazy(() => import('@/pages/SEO'));

// Ads
const AdsManagerPage = lazy(() => import('@/pages/AdsManagerPage'));

// Advanced Marketing
const ABTestingPage = lazy(() => import('@/pages/ABTestingPage'));
const AbandonedCartPage = lazy(() => import('@/pages/AbandonedCartPage'));
const AffiliateMarketingPage = lazy(() => import('@/pages/AffiliateMarketingPage'));
const EmailMarketingPage = lazy(() => import('@/pages/EmailMarketingPage'));
const FlashSalesPage = lazy(() => import('@/pages/FlashSalesPage'));
const LoyaltyProgramPage = lazy(() => import('@/pages/LoyaltyProgramPage'));
const CouponManagementPage = lazy(() => import('@/pages/CouponManagementPage'));
const MarketingCalendarPage = lazy(() => import('@/pages/MarketingCalendarPage'));
const SocialCommercePage = lazy(() => import('@/pages/SocialCommercePage'));
const CreativeStudioPage = lazy(() => import('@/pages/CreativeStudioPage'));
const ContentGenerationPage = lazy(() => import('@/pages/ContentGenerationPage'));

// SEO Tools
const KeywordResearch = lazy(() => import('@/pages/KeywordResearch'));
const RankTracker = lazy(() => import('@/pages/RankTracker'));
const SchemaGenerator = lazy(() => import('@/pages/SchemaGenerator'));

export function MarketingRoutes() {
  return (
    <Routes>
      {/* Marketing Overview */}
      <Route index element={<MarketingPage />} />
      <Route path="hub" element={<MarketingAutomationHubPage />} />
      <Route path="automation" element={<MarketingAutomationHubPage />} />
      <Route path="promotions" element={<PromotionsAutomationPage />} />
      
      {/* CRM */}
      <Route path="crm" element={<CRM />} />
      <Route path="crm/leads" element={<CRMLeads />} />
      <Route path="crm/activity" element={<CRMActivity />} />
      <Route path="crm/emails" element={<CRMEmails />} />
      <Route path="crm/calls" element={<CRMCalls />} />
      <Route path="crm/calendar" element={<CRMCalendar />} />
      
      {/* SEO */}
      <Route path="seo" element={<SEOManagerPage />} />
      <Route path="seo/tools" element={<SEO />} />
      
      {/* Ads */}
      <Route path="ads" element={<AdsManagerPage />} />
      
      {/* Advanced Marketing */}
      <Route path="ab-testing" element={<ABTestingPage />} />
      <Route path="abandoned-cart" element={<AbandonedCartPage />} />
      <Route path="affiliate" element={<AffiliateMarketingPage />} />
      <Route path="email" element={<EmailMarketingPage />} />
      <Route path="flash-sales" element={<FlashSalesPage />} />
      <Route path="loyalty" element={<LoyaltyProgramPage />} />
      <Route path="coupons" element={<CouponManagementPage />} />
      <Route path="calendar" element={<MarketingCalendarPage />} />
      <Route path="social-commerce" element={<SocialCommercePage />} />
      <Route path="creative-studio" element={<CreativeStudioPage />} />
      <Route path="content-generation" element={<ContentGenerationPage />} />
      
      {/* SEO Tools */}
      <Route path="seo/keywords" element={<KeywordResearch />} />
      <Route path="seo/rank-tracker" element={<RankTracker />} />
      <Route path="seo/schema" element={<SchemaGenerator />} />
      
      {/* Legacy redirects */}
      <Route path="crm-ultra-pro" element={<Navigate to="/marketing/crm" replace />} />
      <Route path="seo-ultra-pro" element={<Navigate to="/marketing/seo" replace />} />
    </Routes>
  );
}
