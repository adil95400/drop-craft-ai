import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { HreflangTags } from "@/components/seo/HreflangTags";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Zap, Package, Globe, BarChart3, Clock, Shield, Sparkles, Settings, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const faqItems = [
  { question: "How do I automate my Shopify store?", answer: "With ShopOpti+, you can automate your Shopify store in 3 steps: 1) Connect your store, 2) Set your automation rules for pricing, inventory, and orders, 3) Let AI handle the rest. Setup takes under 5 minutes." },
  { question: "What tasks can be automated on Shopify?", answer: "You can automate product imports, inventory syncing, order fulfillment, dynamic pricing, SEO optimization, email notifications, and multi-channel listing — all from one dashboard." },
  { question: "Is Shopify automation safe for my store?", answer: "Absolutely. ShopOpti+ uses read/write permissions only where needed, with real-time monitoring and rollback capabilities. Your store data is encrypted and protected." },
  { question: "How much does Shopify automation cost?", answer: "ShopOpti+ starts at $29/month with a 14-day free trial. Compare that to hiring a VA at $500+/month or spending 20+ hours/week on manual tasks." },
  { question: "Can I automate Shopify without coding?", answer: "Yes! ShopOpti+ is 100% no-code. Our visual automation builder lets you create complex workflows with simple drag-and-drop rules." },
];

const steps = [
  { step: "1", title: "Connect Your Store", desc: "One-click Shopify integration. No coding, no complex setup. Your store is connected in under 60 seconds.", icon: Settings },
  { step: "2", title: "Set Automation Rules", desc: "Configure pricing rules, inventory thresholds, auto-fulfillment, and SEO settings using our visual builder.", icon: Zap },
  { step: "3", title: "Let AI Work 24/7", desc: "ShopOpti+ monitors your store, updates prices, syncs inventory, and fulfills orders automatically.", icon: Sparkles },
  { step: "4", title: "Scale & Optimize", desc: "Review AI insights and analytics. Optimize your automation rules as your business grows.", icon: TrendingUp },
];

const automationTypes = [
  { title: "Product Import Automation", desc: "Import products from AliExpress, CJ, BigBuy & 99+ suppliers. AI rewrites titles and descriptions for SEO.", icon: Package },
  { title: "Dynamic Pricing", desc: "AI monitors competitor prices and adjusts yours in real-time to maximize margins and stay competitive.", icon: BarChart3 },
  { title: "Order Auto-Fulfillment", desc: "When a customer buys, the order is automatically placed with your supplier. Tracking synced to Shopify.", icon: Clock },
  { title: "Inventory Sync", desc: "Real-time stock monitoring across all suppliers. Auto-pause listings when stock runs low.", icon: Shield },
  { title: "SEO Automation", desc: "AI generates optimized meta titles, descriptions, alt tags, and structured data for every product.", icon: Globe },
  { title: "Multi-Channel Sync", desc: "List on Amazon, eBay, Etsy simultaneously. Inventory and prices sync across all channels.", icon: Globe },
];

export default function HowToAutomateShopifyPage() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="How to Automate Your Shopify Store in 2026 | Complete Guide"
        description="Learn how to automate your Shopify store with AI. Step-by-step guide to automating product imports, pricing, orders & SEO. Save 20+ hours/week with ShopOpti+."
        path="/how-to-automate-shopify-store"
        keywords="how to automate shopify store, shopify automation, automate shopify, shopify automation guide, shopify store automation"
      />
      <HreflangTags
        entries={[
          { lang: "en", href: "https://shopopti.io/how-to-automate-shopify-store" },
          { lang: "fr", href: "https://shopopti.io/automatisation-shopify" },
        ]}
        xDefault="https://shopopti.io/how-to-automate-shopify-store"
      />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://shopopti.io" },
        { name: "How to Automate Shopify Store", url: "https://shopopti.io/how-to-automate-shopify-store" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <Badge variant="outline" className="mb-6 text-sm px-4 py-1">📘 Complete 2026 Guide</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              How to <span className="text-primary">Automate</span> Your Shopify Store
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The definitive guide to Shopify automation. Learn how to save 20+ hours per week by automating 
              product imports, pricing, orders, and SEO with AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
                Start Automating Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/shopify-automation-tool')}>
                See All Features
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">14-day free trial • No credit card required</p>
          </div>
        </section>

        {/* Step by Step */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-4">4 Steps to Fully Automate Your Shopify Store</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Most merchants set up full automation in under 10 minutes. Here's exactly how it works.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              {steps.map((s) => (
                <Card key={s.step} className="border-none shadow-md relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-6xl font-bold text-primary/10">{s.step}</div>
                  <CardHeader>
                    <s.icon className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="text-xl">{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{s.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* What You Can Automate */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-4">What Can You Automate on Shopify?</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              ShopOpti+ automates every repetitive task in your Shopify workflow.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {automationTypes.map((a) => (
                <Card key={a.title} className="border-none shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <a.icon className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="text-lg">{a.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{a.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ROI Section */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">The ROI of Shopify Automation</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="p-6 bg-card rounded-xl shadow-sm">
                <p className="text-4xl font-bold text-primary mb-2">20h+</p>
                <p className="text-muted-foreground">Hours saved per week</p>
                <p className="text-sm text-muted-foreground mt-2">That's $1,000+ in VA costs saved monthly</p>
              </div>
              <div className="p-6 bg-card rounded-xl shadow-sm">
                <p className="text-4xl font-bold text-primary mb-2">3x</p>
                <p className="text-muted-foreground">Faster product listing</p>
                <p className="text-sm text-muted-foreground mt-2">Import & optimize 100+ products in minutes</p>
              </div>
              <div className="p-6 bg-card rounded-xl shadow-sm">
                <p className="text-4xl font-bold text-primary mb-2">40%</p>
                <p className="text-muted-foreground">More organic traffic</p>
                <p className="text-sm text-muted-foreground mt-2">AI SEO optimization boosts rankings</p>
              </div>
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
        <section className="py-20">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl font-bold mb-4">Ready to Automate Your Shopify Store?</h2>
            <p className="text-lg text-muted-foreground mb-8">Join thousands of merchants saving 20+ hours per week.</p>
            <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        {/* Internal links */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Related Guides</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/how-to-optimize-shopify-store" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Optimize Shopify</h3>
                <p className="text-sm text-muted-foreground">Complete optimization guide</p>
              </Link>
              <Link to="/shopify-automation-tool" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Automation Tool</h3>
                <p className="text-sm text-muted-foreground">All automation features</p>
              </Link>
              <Link to="/shopify-dropshipping-automation" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Dropshipping Automation</h3>
                <p className="text-sm text-muted-foreground">Automate dropshipping</p>
              </Link>
              <Link to="/shopopti-vs-autods" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">ShopOpti vs AutoDS</h3>
                <p className="text-sm text-muted-foreground">Feature comparison</p>
              </Link>
            </div>
          </div>
        </section>
      </article>
    </PublicLayout>
  );
}
