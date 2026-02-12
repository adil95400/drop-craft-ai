/**
 * Routes publiques - Accessibles sans authentification
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Pages critiques lazy loaded pour réduire le bundle initial
const Index = lazy(() => import('@/pages/Index'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const ExtensionAuthPage = lazy(() => import('@/pages/auth/ExtensionAuthPage'));

// Pages publiques lazy loaded
const Pricing = lazy(() => import('@/pages/Pricing'));
const PricingPlans = lazy(() => import('@/pages/PricingPlansPage'));
const Features = lazy(() => import('@/pages/Features'));
// Documentation is now in public folder
const Contact = lazy(() => import('@/pages/Contact'));
const FAQ = lazy(() => import('@/pages/FAQ'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const About = lazy(() => import('@/pages/About'));
const PerformanceMonitoringPage = lazy(() => import('@/pages/PerformanceMonitoringPage'));
const BlogPage = lazy(() => import('@/pages/public/BlogPage'));
const BlogArticlePage = lazy(() => import('@/pages/public/BlogArticlePage'));
const DocumentationPage = lazy(() => import('@/pages/public/DocumentationPage'));
const TestimonialsPage = lazy(() => import('@/pages/public/TestimonialsPage'));
const ChangelogPage = lazy(() => import('@/pages/public/ChangelogPage'));
const StatusPage = lazy(() => import('@/pages/public/StatusPage'));
const Integrations = lazy(() => import('@/pages/integrations/ChannableStyleIntegrationsPage'));

// SEO SaaS pages
const LogicielDropshippingPage = lazy(() => import('@/pages/public/LogicielDropshippingPage'));
const AlternativeAutodsPage = lazy(() => import('@/pages/public/AlternativeAutodsPage'));
const OptimisationShopifyPage = lazy(() => import('@/pages/public/OptimisationShopifyPage'));
const GestionCatalogueEcommercePage = lazy(() => import('@/pages/public/GestionCatalogueEcommercePage'));

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
      <Route path="auth/extension" element={<ExtensionAuthPage />} />
      
      {/* Marketing */}
      <Route path="pricing" element={<Pricing />} />
      <Route path="pricing-plans" element={<PricingPlans />} />
      <Route path="features" element={<Features />} />
      <Route path="features/ai-optimization" element={<AIOptimizationPage />} />
      <Route path="features/multi-marketplace" element={<MultiMarketplacePage />} />
      <Route path="features/analytics" element={<AnalyticsPage />} />
      
      {/* Content */}
      <Route path="documentation" element={<DocumentationPage />} />
      <Route path="docs" element={<DocumentationPage />} />
      <Route path="blog" element={<BlogPage />} />
      <Route path="blog/:slug" element={<BlogArticlePage />} />
      <Route path="changelog" element={<ChangelogPage />} />
      <Route path="status" element={<StatusPage />} />
      <Route path="testimonials" element={<TestimonialsPage />} />
      <Route path="integrations" element={<Integrations />} />
      
      {/* SEO SaaS Pages */}
      <Route path="logiciel-dropshipping" element={<LogicielDropshippingPage />} />
      <Route path="alternative-autods" element={<AlternativeAutodsPage />} />
      <Route path="optimisation-shopify" element={<OptimisationShopifyPage />} />
      <Route path="gestion-catalogue-ecommerce" element={<GestionCatalogueEcommercePage />} />
      
      {/* Support */}
      <Route path="contact" element={<Contact />} />
      <Route path="faq" element={<FAQ />} />
      
      {/* Legal */}
      <Route path="privacy" element={<PrivacyPolicy />} />
      <Route path="privacy-policy" element={<PrivacyPolicy />} />
      <Route path="terms" element={<TermsOfService />} />
      <Route path="terms-of-service" element={<TermsOfService />} />
      <Route path="about" element={<About />} />
      
      {/* Payment */}
      <Route path="payment/success" element={<PaymentSuccess />} />
      <Route path="payment/cancelled" element={<PaymentCancelled />} />
      
      {/* Enterprise */}
      <Route path="enterprise/observability" element={<PerformanceMonitoringPage />} />
      
      {/* Legacy redirects */}
      <Route path="guides" element={<Navigate to="/documentation" replace />} />
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
