import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { HreflangTags } from "@/components/seo/HreflangTags";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BarChart3, TrendingUp, Eye, Target, Brain, PieChart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const faqItems = [
  { question: "What analytics does ShopOpti+ provide?", answer: "ShopOpti+ offers real-time sales analytics, profit tracking, conversion funnels, customer lifetime value, product performance scoring, and AI-powered predictive insights." },
  { question: "Can I track multi-channel performance?", answer: "Yes, track performance across Shopify, Amazon, eBay, Etsy, and 20+ channels in a single unified dashboard." },
  { question: "Does ShopOpti+ offer predictive analytics?", answer: "Yes, our AI analyzes historical data to predict sales trends, identify winning products, and recommend inventory adjustments before stock issues occur." },
  { question: "Can I export analytics reports?", answer: "Yes, export reports in CSV, PDF, or Excel format. Schedule automated reports to be emailed daily, weekly, or monthly." },
];

const features = [
  { icon: BarChart3, title: "Real-Time Dashboard", desc: "Live sales, revenue, and profit tracking across all your channels in one unified view." },
  { icon: Brain, title: "AI Predictive Insights", desc: "Machine learning models predict sales trends, identify winning products, and forecast revenue." },
  { icon: TrendingUp, title: "Conversion Tracking", desc: "Track your entire funnel from visitor to customer. Identify drop-off points and optimize." },
  { icon: Target, title: "Product Performance", desc: "Score every product by profitability, velocity, and SEO performance. Find your winners instantly." },
  { icon: Eye, title: "Competitor Intelligence", desc: "Monitor competitor pricing, product launches, and market positioning in real-time." },
  { icon: PieChart, title: "Custom Reports", desc: "Build custom dashboards with drag-and-drop widgets. Schedule automated reports." },
];

export default function ShopifyAnalyticsSoftwarePage() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="Shopify Analytics Software | ShopOpti+ — AI E-commerce Analytics"
        description="AI-powered Shopify analytics: real-time dashboards, predictive insights, conversion tracking, multi-channel performance. Make data-driven decisions. Free trial."
        path="/shopify-analytics-software"
        keywords="shopify analytics software, shopify analytics tool, ecommerce analytics, shopify reporting, ai analytics shopify"
      />
      <HreflangTags
        entries={[
          { lang: "en", href: "https://shopopti.io/shopify-analytics-software" },
          { lang: "fr", href: "https://shopopti.io/analyse-boutique-shopify" },
        ]}
        xDefault="https://shopopti.io/shopify-analytics-software"
      />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://shopopti.io" },
        { name: "Shopify Analytics Software", url: "https://shopopti.io/shopify-analytics-software" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article>
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <Badge variant="outline" className="mb-6 text-sm px-4 py-1">📊 AI-Powered Analytics</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              AI-Powered <span className="text-primary">Analytics</span> for Shopify Stores
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Real-time dashboards, predictive insights, and multi-channel performance tracking. 
              Make data-driven decisions that grow your e-commerce business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/features/analytics')}>See Analytics Demo</Button>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Analytics Features</h2>
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
            <h2 className="text-3xl font-bold mb-4">Unlock AI-Powered Analytics</h2>
            <p className="text-lg text-muted-foreground mb-8">Stop guessing, start growing. Data-driven decisions for your Shopify store.</p>
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
              <Link to="/shopify-pricing-automation" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Dynamic Pricing</h3>
                <p className="text-sm text-muted-foreground">AI pricing engine</p>
              </Link>
              <Link to="/shopopti-vs-zendrop" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">ShopOpti vs Zendrop</h3>
                <p className="text-sm text-muted-foreground">Compare solutions</p>
              </Link>
            </div>
          </div>
        </section>
      </article>
    </PublicLayout>
  );
}
