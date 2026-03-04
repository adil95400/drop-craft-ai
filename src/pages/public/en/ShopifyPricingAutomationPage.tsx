import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { HreflangTags } from "@/components/seo/HreflangTags";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, DollarSign, TrendingUp, Shield, BarChart3, Target, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const faqItems = [
  { question: "How does AI pricing automation work?", answer: "ShopOpti+ monitors competitor prices, market demand, and your margin targets in real-time. The AI engine automatically adjusts your prices to maximize profit while staying competitive." },
  { question: "Can I set minimum and maximum price limits?", answer: "Yes, you define floor and ceiling prices for every product. The AI operates within your boundaries to find the optimal price point." },
  { question: "How often are prices updated?", answer: "Prices can be updated in real-time, hourly, or daily — you choose the frequency. The AI reacts to market changes instantly when set to real-time mode." },
  { question: "Will customers see prices changing constantly?", answer: "No. The AI makes strategic, gradual adjustments. You can set maximum change thresholds (e.g., no more than 5% change per day) to ensure a smooth customer experience." },
];

const features = [
  { icon: DollarSign, title: "Smart Price Optimization", desc: "AI analyzes market data, competitor pricing, and demand patterns to find the optimal price for maximum profit." },
  { icon: TrendingUp, title: "Competitor Monitoring", desc: "Track competitor prices across marketplaces in real-time. Get alerts when competitors change pricing." },
  { icon: Target, title: "Margin Protection", desc: "Set minimum margins and the AI ensures you never sell below your target profitability." },
  { icon: BarChart3, title: "Revenue Analytics", desc: "Track the impact of pricing changes on revenue, conversion rates, and profit margins." },
  { icon: Zap, title: "Bulk Price Rules", desc: "Create pricing rules for entire categories. Apply markup formulas, rounding, and competitive adjustments at scale." },
  { icon: Shield, title: "Price Change Safeguards", desc: "Set maximum daily change limits and manual approval requirements for large price adjustments." },
];

export default function ShopifyPricingAutomationPage() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="Shopify Pricing Automation | ShopOpti+ — AI Dynamic Pricing"
        description="Automate Shopify pricing with AI. Dynamic competitor-based pricing, margin protection, bulk price rules. Maximize profit on autopilot. Free 14-day trial."
        path="/shopify-pricing-automation"
        keywords="shopify pricing automation, dynamic pricing shopify, ai pricing tool, shopify price optimization, automated pricing ecommerce"
      />
      <HreflangTags
        entries={[
          { lang: "en", href: "https://shopopti.io/shopify-pricing-automation" },
          { lang: "fr", href: "https://shopopti.io/outil-pricing-shopify" },
        ]}
        xDefault="https://shopopti.io/shopify-pricing-automation"
      />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://shopopti.io" },
        { name: "Shopify Pricing Automation", url: "https://shopopti.io/shopify-pricing-automation" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article>
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <Badge variant="outline" className="mb-6 text-sm px-4 py-1">💰 AI Dynamic Pricing Engine</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              AI-Powered <span className="text-primary">Pricing Automation</span> for Shopify
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Maximize profit with intelligent pricing that adapts to market conditions in real-time. 
              Monitor competitors, protect margins, and optimize prices automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/pricing')}>View Pricing</Button>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Dynamic Pricing Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {features.map((f) => (
                <Card key={f.title} className="border-none shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <f.icon className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="text-lg">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent><p className="text-muted-foreground">{f.desc}</p></CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

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

        <section className="py-20 bg-primary/5">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl font-bold mb-4">Maximize Your Shopify Profit with AI Pricing</h2>
            <p className="text-lg text-muted-foreground mb-8">Join merchants who increased margins by 25%+ with dynamic pricing.</p>
            <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Related Resources</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/shopify-automation-tool" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Automation Tool</h3>
                <p className="text-sm text-muted-foreground">Full Shopify automation</p>
              </Link>
              <Link to="/shopify-ai-optimization" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">AI Optimization</h3>
                <p className="text-sm text-muted-foreground">Boost SEO with AI</p>
              </Link>
              <Link to="/shopify-product-import-tool" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Product Import</h3>
                <p className="text-sm text-muted-foreground">99+ suppliers</p>
              </Link>
              <Link to="/shopify-analytics-software" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Analytics</h3>
                <p className="text-sm text-muted-foreground">AI-powered insights</p>
              </Link>
            </div>
          </div>
        </section>
      </article>
    </PublicLayout>
  );
}
