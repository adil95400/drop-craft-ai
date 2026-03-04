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
const CGV = lazy(() => import('@/pages/CGV'));
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
const AlternativeDsersPage = lazy(() => import('@/pages/public/AlternativeDsersPage'));
const OptimisationShopifyPage = lazy(() => import('@/pages/public/OptimisationShopifyPage'));
const GestionCatalogueEcommercePage = lazy(() => import('@/pages/public/GestionCatalogueEcommercePage'));
const ImportProduitsAliexpressPage = lazy(() => import('@/pages/public/ImportProduitsAliexpressPage'));
const AutomatisationEcommercePage = lazy(() => import('@/pages/public/AutomatisationEcommercePage'));
const AutomatisationShopifyPage = lazy(() => import('@/pages/public/AutomatisationShopifyPage'));
const OutilPricingShopifyPage = lazy(() => import('@/pages/public/OutilPricingShopifyPage'));
const ImportProduitShopifyPage = lazy(() => import('@/pages/public/ImportProduitShopifyPage'));
const AnalyseBoutiqueShopifyPage = lazy(() => import('@/pages/public/AnalyseBoutiqueShopifyPage'));

// EN SEO pages
const ShopifyAutomationToolPage = lazy(() => import('@/pages/public/en/ShopifyAutomationToolPage'));
const ShopifyAIOptimizationPage = lazy(() => import('@/pages/public/en/ShopifyAIOptimizationPage'));
const ShopifyPricingAutomationPage = lazy(() => import('@/pages/public/en/ShopifyPricingAutomationPage'));
const ShopifyProductImportToolPage = lazy(() => import('@/pages/public/en/ShopifyProductImportToolPage'));
const ShopifyAnalyticsSoftwarePage = lazy(() => import('@/pages/public/en/ShopifyAnalyticsSoftwarePage'));
const ShopoptiVsAutodsPage = lazy(() => import('@/pages/public/en/ShopoptiVsAutodsPage'));
const ShopoptiVsDsersPage = lazy(() => import('@/pages/public/en/ShopoptiVsDsersPage'));
const ShopoptiVsZendropPage = lazy(() => import('@/pages/public/en/ShopoptiVsZendropPage'));

// EN Mid-tail SEO pages
const HowToAutomateShopifyPage = lazy(() => import('@/pages/public/en/HowToAutomateShopifyPage'));
const HowToOptimizeShopifyPage = lazy(() => import('@/pages/public/en/HowToOptimizeShopifyPage'));
const ShopifyDropshippingAutomationPage = lazy(() => import('@/pages/public/en/ShopifyDropshippingAutomationPage'));
const AIToolForShopifyPage = lazy(() => import('@/pages/public/en/AIToolForShopifyPage'));
const ShopifyAutoProductUpdaterPage = lazy(() => import('@/pages/public/en/ShopifyAutoProductUpdaterPage'));

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
      
      {/* SEO SaaS Pages (FR) */}
      <Route path="logiciel-dropshipping" element={<LogicielDropshippingPage />} />
      <Route path="alternative-autods" element={<AlternativeAutodsPage />} />
      <Route path="alternative-dsers" element={<AlternativeDsersPage />} />
      <Route path="optimisation-shopify" element={<OptimisationShopifyPage />} />
      <Route path="gestion-catalogue-ecommerce" element={<GestionCatalogueEcommercePage />} />
      <Route path="import-produits-aliexpress" element={<ImportProduitsAliexpressPage />} />
      <Route path="automatisation-ecommerce" element={<AutomatisationEcommercePage />} />
      <Route path="automatisation-shopify" element={<AutomatisationShopifyPage />} />
      <Route path="outil-pricing-shopify" element={<OutilPricingShopifyPage />} />
      <Route path="import-produit-shopify" element={<ImportProduitShopifyPage />} />
      <Route path="analyse-boutique-shopify" element={<AnalyseBoutiqueShopifyPage />} />
      
      {/* SEO SaaS Pages (EN — International) */}
      <Route path="shopify-automation-tool" element={<ShopifyAutomationToolPage />} />
      <Route path="shopify-ai-optimization" element={<ShopifyAIOptimizationPage />} />
      <Route path="shopify-pricing-automation" element={<ShopifyPricingAutomationPage />} />
      <Route path="shopify-product-import-tool" element={<ShopifyProductImportToolPage />} />
      <Route path="shopify-analytics-software" element={<ShopifyAnalyticsSoftwarePage />} />
      
      {/* Comparison Pages (EN) */}
      <Route path="shopopti-vs-autods" element={<ShopoptiVsAutodsPage />} />
      <Route path="shopopti-vs-dsers" element={<ShopoptiVsDsersPage />} />
      <Route path="shopopti-vs-zendrop" element={<ShopoptiVsZendropPage />} />
      
      {/* Mid-tail SEO Pages (EN) */}
      <Route path="how-to-automate-shopify-store" element={<HowToAutomateShopifyPage />} />
      <Route path="how-to-optimize-shopify-store" element={<HowToOptimizeShopifyPage />} />
      <Route path="shopify-dropshipping-automation" element={<ShopifyDropshippingAutomationPage />} />
      <Route path="ai-tool-for-shopify" element={<AIToolForShopifyPage />} />
      <Route path="shopify-auto-product-updater" element={<ShopifyAutoProductUpdaterPage />} />
      
      {/* Support */}
      <Route path="contact" element={<Contact />} />
      <Route path="faq" element={<FAQ />} />
      
      {/* Legal */}
      <Route path="privacy" element={<PrivacyPolicy />} />
      <Route path="privacy-policy" element={<PrivacyPolicy />} />
      <Route path="terms" element={<TermsOfService />} />
      <Route path="terms-of-service" element={<TermsOfService />} />
      <Route path="cgu" element={<TermsOfService />} />
      <Route path="cgv" element={<CGV />} />
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
