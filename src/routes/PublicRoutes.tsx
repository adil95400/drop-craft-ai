/**
 * Routes publiques - Accessibles sans authentification
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Pages critiques chargées immédiatement
import Index from '@/pages/Index';
import AuthPage from '@/pages/AuthPage';

// Pages publiques lazy loaded
const Pricing = lazy(() => import('@/pages/Pricing'));
const PricingPlans = lazy(() => import('@/pages/PricingPlansPage'));
const Features = lazy(() => import('@/pages/Features'));
const Documentation = lazy(() => import('@/pages/Documentation'));
const Contact = lazy(() => import('@/pages/Contact'));
const FAQ = lazy(() => import('@/pages/FAQ'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const About = lazy(() => import('@/pages/About'));
const EnterpriseObservability = lazy(() => import('@/pages/EnterpriseObservability'));

// Feature pages
const AIOptimizationPage = lazy(() => import('@/pages/features/AIOptimizationPage'));
const MultiMarketplacePage = lazy(() => import('@/pages/features/MultiMarketplacePage'));
const AnalyticsPage = lazy(() => import('@/pages/features/AnalyticsPage'));

// Payment pages
const PaymentSuccess = lazy(() => import('@/pages/PaymentSuccess'));
const PaymentCancelled = lazy(() => import('@/pages/PaymentCancelled'));

export function PublicRoutes() {
  return (
    <Routes>
      {/* Landing & Auth */}
      <Route index element={<Index />} />
      <Route path="auth" element={<AuthPage />} />
      
      {/* Marketing */}
      <Route path="pricing" element={<Pricing />} />
      <Route path="pricing-plans" element={<PricingPlans />} />
      <Route path="features" element={<Features />} />
      <Route path="features/ai-optimization" element={<AIOptimizationPage />} />
      <Route path="features/multi-marketplace" element={<MultiMarketplacePage />} />
      <Route path="features/analytics" element={<AnalyticsPage />} />
      
      {/* Content */}
      <Route path="documentation" element={<Documentation />} />
      <Route path="blog" element={<Documentation />} />
      
      {/* Support */}
      <Route path="contact" element={<Contact />} />
      <Route path="faq" element={<FAQ />} />
      
      {/* Legal */}
      <Route path="privacy" element={<PrivacyPolicy />} />
      <Route path="terms" element={<TermsOfService />} />
      <Route path="about" element={<About />} />
      
      {/* Payment */}
      <Route path="payment/success" element={<PaymentSuccess />} />
      <Route path="payment/cancelled" element={<PaymentCancelled />} />
      
      {/* Enterprise */}
      <Route path="enterprise/observability" element={<EnterpriseObservability />} />
      
      {/* Legacy redirects */}
      <Route path="guides" element={<Navigate to="/documentation" replace />} />
      <Route path="changelog" element={<Navigate to="/blog" replace />} />
      <Route path="community" element={<Navigate to="/blog" replace />} />
      <Route path="webinars" element={<Navigate to="/academy" replace />} />
      <Route path="company" element={<Navigate to="/about" replace />} />
      <Route path="careers" element={<Navigate to="/about" replace />} />
      <Route path="partners" element={<Navigate to="/about" replace />} />
      <Route path="press" element={<Navigate to="/about" replace />} />
      <Route path="legal" element={<Navigate to="/terms" replace />} />
      <Route path="gdpr" element={<Navigate to="/privacy" replace />} />
      <Route path="cookies" element={<Navigate to="/privacy" replace />} />
    </Routes>
  );
}
