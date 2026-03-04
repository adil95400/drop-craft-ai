import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { HreflangTags } from "@/components/seo/HreflangTags";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Search, Image, FileText, BarChart3, Zap, Target, TrendingUp, Globe } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const faqItems = [
  { question: "How do I optimize my Shopify store for SEO?", answer: "Start with keyword research, then optimize product titles, meta descriptions, image alt tags, and URL structures. ShopOpti+ automates all of this with AI, analyzing your catalog and applying best practices in bulk." },
  { question: "What's the fastest way to improve Shopify store performance?", answer: "Focus on 3 areas: 1) Compress images to WebP format, 2) Optimize product titles with keywords, 3) Add structured data. ShopOpti+ handles all three automatically." },
  { question: "How long does Shopify optimization take?", answer: "Manual optimization can take weeks for large catalogs. With ShopOpti+'s AI, you can optimize 1,000+ products in under an hour." },
  { question: "Does optimization really increase sales?", answer: "Yes. Merchants using ShopOpti+ see an average 40% increase in organic traffic and 25% higher conversion rates within 3 months of optimization." },
  { question: "Can I optimize my Shopify store without technical knowledge?", answer: "Absolutely. ShopOpti+ provides one-click optimization with AI. No coding or SEO expertise required." },
];

const optimizationAreas = [
  { title: "SEO Title Optimization", desc: "AI analyzes search intent and rewrites product titles with high-converting keywords. Average 35% CTR improvement.", icon: Search },
  { title: "Meta Description Engine", desc: "Auto-generate compelling meta descriptions that drive clicks from search results. Unique for every product.", icon: FileText },
  { title: "Image Optimization", desc: "Automatic WebP conversion, alt-text generation, and lazy loading. Improve Core Web Vitals by 50%+.", icon: Image },
  { title: "Content Quality Score", desc: "AI rates every product listing 0-100 across 5 pillars. Get actionable recommendations to hit 90+.", icon: BarChart3 },
  { title: "Structured Data", desc: "Auto-inject Product, FAQ, and Review schema markup. Get rich snippets in Google search results.", icon: Target },
  { title: "Speed Optimization", desc: "Reduce page load time with image compression, code minification, and preloading critical resources.", icon: Zap },
];

const results = [
  { metric: "+40%", label: "Organic Traffic", detail: "Average increase within 90 days" },
  { metric: "+25%", label: "Conversion Rate", detail: "Better product pages = more sales" },
  { metric: "90+", label: "SEO Score", detail: "Average optimization score achieved" },
  { metric: "< 2s", label: "Page Load Time", detail: "After image & speed optimization" },
];

export default function HowToOptimizeShopifyPage() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="How to Optimize Your Shopify Store in 2026 | AI Guide"
        description="Complete guide to optimizing your Shopify store. AI-powered SEO, image optimization, speed improvements & conversion rate optimization. Get 40% more traffic."
        path="/how-to-optimize-shopify-store"
        keywords="how to optimize shopify store, shopify optimization, optimize shopify SEO, shopify store optimization, shopify performance"
      />
      <HreflangTags
        entries={[
          { lang: "en", href: "https://shopopti.io/how-to-optimize-shopify-store" },
          { lang: "fr", href: "https://shopopti.io/optimisation-shopify" },
        ]}
        xDefault="https://shopopti.io/how-to-optimize-shopify-store"
      />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://shopopti.io" },
        { name: "How to Optimize Shopify Store", url: "https://shopopti.io/how-to-optimize-shopify-store" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <Badge variant="outline" className="mb-6 text-sm px-4 py-1">📈 2026 Optimization Guide</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              How to <span className="text-primary">Optimize</span> Your Shopify Store
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The complete guide to Shopify optimization. Boost SEO, speed, conversions, and revenue 
              with AI-powered tools that work on autopilot.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
                Optimize My Store <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/shopify-ai-optimization')}>
                See AI Features
              </Button>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {results.map((r) => (
                <div key={r.label}>
                  <p className="text-3xl font-bold text-primary">{r.metric}</p>
                  <p className="font-semibold">{r.label}</p>
                  <p className="text-sm text-muted-foreground">{r.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Optimization Areas */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-4">6 Key Areas to Optimize Your Shopify Store</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              ShopOpti+ optimizes all 6 areas automatically with AI. No manual work required.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {optimizationAreas.map((a) => (
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

        {/* Checklist */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-12">Shopify Optimization Checklist</h2>
            <div className="space-y-4">
              {[
                "Optimize all product titles with target keywords",
                "Write unique meta descriptions for every page",
                "Compress all images to WebP format",
                "Add alt text to every product image",
                "Implement Product schema markup",
                "Set up canonical URLs correctly",
                "Create a logical internal linking structure",
                "Optimize page load speed (LCP < 2.5s)",
                "Add FAQ schema to category pages",
                "Set up Google Search Console & submit sitemap",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 p-4 bg-card border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <p className="text-muted-foreground mb-4">ShopOpti+ automates this entire checklist with one click.</p>
              <Button size="lg" onClick={() => navigate('/auth')}>
                Automate My Optimization <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
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
            <h2 className="text-3xl font-bold mb-4">Ready to Optimize Your Shopify Store?</h2>
            <p className="text-lg text-muted-foreground mb-8">Get your free SEO audit and start optimizing with AI today.</p>
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
              <Link to="/how-to-automate-shopify-store" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Automate Shopify</h3>
                <p className="text-sm text-muted-foreground">Complete automation guide</p>
              </Link>
              <Link to="/shopify-ai-optimization" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">AI Optimization</h3>
                <p className="text-sm text-muted-foreground">AI-powered SEO tools</p>
              </Link>
              <Link to="/ai-tool-for-shopify" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">AI Tool for Shopify</h3>
                <p className="text-sm text-muted-foreground">AI-powered e-commerce</p>
              </Link>
              <Link to="/shopify-analytics-software" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Analytics Software</h3>
                <p className="text-sm text-muted-foreground">Data-driven insights</p>
              </Link>
            </div>
          </div>
        </section>
      </article>
    </PublicLayout>
  );
}
