import { useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useLightAuth } from "@/contexts/LightAuthContext";
import { PublicLayout } from "@/layouts/PublicLayout";
import { SEO } from "@/components/SEO";
import { OrganizationSchema } from "@/components/seo/StructuredData";
import { StickyCtaBar } from "@/components/landing/StickyCtaBar";
import { FAQ_DATA } from "@/config/landingPageConfig";
import { useLandingContent } from "@/hooks/useLandingContent";

import {
  HeroSection,
  SocialProofBar,
  ProblemSection,
  HowItWorksSection,
  SolutionSection,
  WhyShopOptiSection,
  ProofSection,
  IntegrationsSection,
  PricingPreviewSection,
  FAQSection,
  FinalCTASection,
} from "./landing";

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
const Index = () => {
  const { isAuthenticated, isLoading } = useLightAuth();
  const navigate = useNavigate();
  const { testimonials, socialProof, plans } = useLandingContent();

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  const onNavigate = useCallback(
    (path: string) => navigate(path),
    [navigate]
  );

  // JSON-LD computed from dynamic data
  const jsonLdSchemas = useMemo(() => [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "ShopOpti+",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://shopopti.io",
      description:
        "AI-powered Shopify automation platform for product research, dynamic pricing, inventory management, and revenue growth.",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: String(plans[0]?.monthlyPrice ?? 29),
        highPrice: String(plans[plans.length - 1]?.monthlyPrice ?? 199),
        priceCurrency: "USD",
        offerCount: String(plans.length),
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: socialProof.rating.replace("/5", ""),
        reviewCount: String(socialProof.reviewCount),
        bestRating: "5",
        worstRating: "1",
      },
      featureList: [
        "AI Product Research",
        "Dynamic Pricing Automation",
        "Inventory Sync",
        "Order Auto-Fulfillment",
        "SEO Optimization",
        "Multi-Store Management",
        `${socialProof.supplierCount} Supplier Integrations`,
        "Real-Time Analytics",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_DATA.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
  ], [plans, socialProof]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PublicLayout>
      <SEO
        title="ShopOpti+ | AI Shopify Automation – Product Research, Pricing & Inventory"
        description="Run your Shopify store on autopilot with AI. Find winning products across 99+ suppliers, automate dynamic pricing & inventory, and grow revenue 40% faster. Free 14-day trial."
        path="/"
        keywords="shopify automation, AI shopify tool, dropshipping automation, shopify product research, dynamic pricing shopify, shopify inventory management, shopify AI optimization, e-commerce automation platform"
        jsonLd={jsonLdSchemas}
      />
      <OrganizationSchema />

      <main>
        <HeroSection onNavigate={onNavigate} />
        <SocialProofBar socialProof={socialProof} />
        <ProblemSection />
        <HowItWorksSection onNavigate={onNavigate} />
        <SolutionSection socialProof={socialProof} onNavigate={onNavigate} />
        <WhyShopOptiSection socialProof={socialProof} />
        <ProofSection socialProof={socialProof} testimonials={testimonials} />
        <IntegrationsSection onNavigate={onNavigate} />
        <PricingPreviewSection plans={plans} onNavigate={onNavigate} />
        <FAQSection />
        <FinalCTASection socialProof={socialProof} onNavigate={onNavigate} />
      </main>
      <StickyCtaBar />
    </PublicLayout>
  );
};

export default Index;
