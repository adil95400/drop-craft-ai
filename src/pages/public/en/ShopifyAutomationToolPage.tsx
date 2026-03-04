import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { HreflangTags } from "@/components/seo/HreflangTags";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Zap, Package, Globe, BarChart3, Clock, Shield, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const faqItems = [
  { question: "What is ShopOpti+ automation?", answer: "ShopOpti+ automates your entire Shopify workflow: product imports from 99+ suppliers, inventory sync, order fulfillment, dynamic pricing, and AI-powered SEO optimization — all running 24/7." },
  { question: "How much time can I save with ShopOpti+?", answer: "Most merchants save 20+ hours per week by automating repetitive tasks like product listing, price updates, order processing, and inventory management." },
  { question: "Does ShopOpti+ work with my existing Shopify store?", answer: "Yes, ShopOpti+ integrates seamlessly with any Shopify store. Simply connect your store via our one-click integration and start automating within minutes." },
  { question: "Is there a free trial?", answer: "Yes, we offer a 14-day free trial with full access to all features. No credit card required." },
  { question: "Can I automate orders to suppliers?", answer: "Absolutely. ShopOpti+ supports auto-fulfillment with AliExpress, CJ Dropshipping, BigBuy, and 90+ other suppliers. Orders are placed automatically when a customer buys." },
];

const features = [
  { icon: Package, title: "Auto Product Import", desc: "Import from 99+ suppliers in one click. AI optimizes titles, descriptions, and images automatically." },
  { icon: Zap, title: "Order Auto-Fulfillment", desc: "Orders are automatically placed with your suppliers. Tracking numbers synced back to Shopify." },
  { icon: BarChart3, title: "Dynamic Pricing Engine", desc: "AI adjusts prices based on competition, demand, and margins. Maximize profit on autopilot." },
  { icon: Globe, title: "Multi-Marketplace Sync", desc: "Sell on Shopify, Amazon, eBay, Etsy simultaneously. Inventory syncs across all channels." },
  { icon: Sparkles, title: "AI SEO Optimization", desc: "Automated meta tags, product descriptions, and structured data. Boost organic traffic by 40%+." },
  { icon: Shield, title: "Inventory Protection", desc: "Real-time stock monitoring prevents overselling. Auto-pause listings when stock runs low." },
];

export default function ShopifyAutomationToolPage() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="Shopify Automation Tool | ShopOpti+ — AI E-commerce Automation"
        description="Automate your Shopify store with ShopOpti+. AI-powered product imports, dynamic pricing, auto-fulfillment, and SEO optimization. Save 20+ hours/week. Free 14-day trial."
        path="/shopify-automation-tool"
        keywords="shopify automation tool, shopify automation, automate shopify store, shopify dropshipping automation, ecommerce automation"
      />
      <HreflangTags
        entries={[
          { lang: "en", href: "https://shopopti.io/shopify-automation-tool" },
          { lang: "fr", href: "https://shopopti.io/automatisation-shopify" },
        ]}
        xDefault="https://shopopti.io/shopify-automation-tool"
      />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://shopopti.io" },
        { name: "Shopify Automation Tool", url: "https://shopopti.io/shopify-automation-tool" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <Badge variant="outline" className="mb-6 text-sm px-4 py-1">🚀 #1 Shopify Automation Platform</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              AI-Powered Shopify <span className="text-primary">Automation</span> & Growth
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Automate product imports, order fulfillment, dynamic pricing, and SEO optimization. 
              Save 20+ hours per week and scale your e-commerce business on autopilot.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/pricing')}>
                View Pricing
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">14-day free trial • No credit card required</p>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Automate Shopify</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {features.map((f) => (
                <Card key={f.title} className="border-none shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <f.icon className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="text-lg">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
              {[
                { value: "99+", label: "Suppliers Connected" },
                { value: "20h+", label: "Saved Per Week" },
                { value: "40%", label: "More Organic Traffic" },
                { value: "24/7", label: "Automation Running" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-3xl font-bold text-primary">{s.value}</p>
                  <p className="text-muted-foreground text-sm">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqItems.map((item) => (
                <div key={item.question} className="border rounded-lg p-6 bg-card">
                  <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                  <p className="text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-primary/5">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl font-bold mb-4">Ready to Automate Your Shopify Store?</h2>
            <p className="text-lg text-muted-foreground mb-8">Join thousands of merchants who save 20+ hours per week with ShopOpti+.</p>
            <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        {/* Internal links */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Related Resources</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/shopify-ai-optimization" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">AI Optimization</h3>
                <p className="text-sm text-muted-foreground">Boost your SEO with AI</p>
              </Link>
              <Link to="/shopify-pricing-automation" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Pricing Automation</h3>
                <p className="text-sm text-muted-foreground">Dynamic AI pricing</p>
              </Link>
              <Link to="/shopify-product-import-tool" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Product Import</h3>
                <p className="text-sm text-muted-foreground">Import from 99+ suppliers</p>
              </Link>
              <Link to="/shopify-analytics-software" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Analytics Software</h3>
                <p className="text-sm text-muted-foreground">AI-powered insights</p>
              </Link>
            </div>
          </div>
        </section>
      </article>
    </PublicLayout>
  );
}
