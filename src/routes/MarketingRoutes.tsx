/**
 * Routes Marketing - CRM, SEO, Ads, Campaigns
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Marketing
const ModernMarketingPage = lazy(() => import('@/pages/ModernMarketingPage'));

// CRM
const CRM = lazy(() => import('@/pages/CRM'));
const CRMLeads = lazy(() => import('@/pages/CRMLeads'));
const CRMActivity = lazy(() => import('@/pages/CRMActivity'));
const CRMEmails = lazy(() => import('@/pages/CRMEmails'));
const CRMCalls = lazy(() => import('@/pages/CRMCalls'));
const CRMCalendar = lazy(() => import('@/pages/CRMCalendar'));

// SEO
const SEOManagerPage = lazy(() => import('@/pages/SEOManagerPage'));
const SEO = lazy(() => import('@/pages/SEO'));

// Ads
const AdsManagerPage = lazy(() => import('@/pages/AdsManagerPage'));

export function MarketingRoutes() {
  return (
    <Routes>
      {/* Marketing Overview */}
      <Route index element={<ModernMarketingPage />} />
      
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
      
      {/* Legacy redirects */}
      <Route path="crm-ultra-pro" element={<Navigate to="/marketing/crm" replace />} />
      <Route path="seo-ultra-pro" element={<Navigate to="/marketing/seo" replace />} />
    </Routes>
  );
}
