import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { HreflangTags } from "@/components/seo/HreflangTags";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Bot, Zap, Package, DollarSign, RefreshCw, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const faqItems = [
  { question: "What does Shopify automation mean?", answer: "Shopify automation uses AI and software to handle repetitive tasks like product imports, pricing updates, order fulfillment, and inventory sync — saving you 20+ hours per week." },
  { question: "How does ShopOpti+ automate Shopify stores?", answer: "ShopOpti+ connects to 99+ suppliers and automates the entire workflow: product imports, AI-optimized listings, dynamic pricing, auto-fulfillment, and real-time inventory sync." },
  { question: "Is there a free trial for Shopify automation?", answer: "Yes, ShopOpti+ offers a 14-day free trial with full access to all automation features. No credit card required." },
  { question: "Can I automate pricing on Shopify?", answer: "Yes, ShopOpti+ includes AI dynamic pricing that adjusts your prices based on demand, competition, and your margin targets — automatically and in real-time." },
];

const ShopifyAutomationPage = () => {
  const navigate = useNavigate();
  const features = [
    { icon: DollarSign, title: "AI Dynamic Pricing", desc: "Automatically adjust prices based on demand, competition, and margins. Maximize profit 24/7." },
    { icon: Package, title: "Inventory Auto-Sync", desc: "Real-time stock sync across all suppliers and sales channels. Never oversell again." },
    { icon: Bot, title: "Order Auto-Fulfillment", desc: "Automatically route and fulfill orders to the best supplier. No manual work." },
    { icon: RefreshCw, title: "Product Auto-Update", desc: "Prices, descriptions, and images update automatically when suppliers change." },
    { icon: Zap, title: "Workflow Builder", desc: "Build custom automation workflows with triggers, conditions, and actions — no code needed." },
    { icon: Shield, title: "Smart Alerts", desc: "Get notified about stock-outs, price drops, and supplier issues before they affect your store." },
  ];

  return (
    <PublicLayout>
      <SEO
        title="Shopify Automation | AI-Powered Store Management"
        description="Automate your Shopify store with AI. Dynamic pricing, inventory sync, order fulfillment, product updates. Save 20+ hours/week. Free 14-day trial."
        path="/shopify-automation"
        keywords="shopify automation, automate shopify, shopify auto fulfillment, shopify AI automation, shopify inventory sync"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "ShopOpti+ Shopify Automation",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "description": "AI-powered Shopify automation platform for dynamic pricing, inventory sync, and order fulfillment.",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "priceValidUntil": "2026-12-31" },
          "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "1247", "bestRating": "5" }
        }}
      />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://shopopti.io" },
        { name: "Shopify Automation", url: "https://shopopti.io/shopify-automation" },
      ]} />
      <HreflangTags
        entries={[
          { lang: "en", href: "https://shopopti.io/shopify-automation" },
          { lang: "fr", href: "https://shopopti.io/automatisation-shopify" },
        ]}
        xDefault="https://shopopti.io/shopify-automation"
      />
      <FAQSchema questions={faqItems} />

      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl text-center space-y-6">
          <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">Shopify Automation</Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Run Your Shopify Store on <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Complete Autopilot</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered automation for pricing, inventory, orders, and product updates. Save 20+ hours/week and scale faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="px-8 py-6 text-lg" onClick={() => navigate('/auth?trial=true')}>Start Free Trial <ArrowRight className="w-4 h-4 ml-2" /></Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg" onClick={() => navigate('/features')}>See All Features</Button>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Automate every part of your Shopify store</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow border-2 hover:border-primary/30">
                <CardContent className="pt-6 space-y-3">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit"><f.icon className="h-6 w-6 text-primary" /></div>
                  <h3 className="font-semibold text-lg">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqItems.map((faq, i) => (
              <div key={i} className="bg-background rounded-lg p-6 border">
                <h3 className="font-semibold text-lg flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" />{faq.question}</h3>
                <p className="text-muted-foreground mt-2 ml-7">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-2xl space-y-6">
          <h2 className="text-3xl font-bold">Ready to automate your Shopify store?</h2>
          <p className="text-lg opacity-90">14-day free trial. No credit card required.</p>
          <Button size="lg" variant="secondary" className="px-8 py-6 text-lg" onClick={() => navigate('/auth?trial=true')}>Get Started Free <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>
      </section>
    </PublicLayout>
  );
};

export default ShopifyAutomationPage;
