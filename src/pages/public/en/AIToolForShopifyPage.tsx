import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { HreflangTags } from "@/components/seo/HreflangTags";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, Sparkles, Target, BarChart3, Globe, Shield, TrendingUp, Zap, FileText, Image } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const faqItems = [
  { question: "What can AI do for my Shopify store?", answer: "AI can automate SEO optimization, write product descriptions, optimize pricing, generate ad copy, analyze competitors, predict trends, and manage inventory — all automatically and at scale." },
  { question: "How is ShopOpti+ different from other AI tools?", answer: "ShopOpti+ is built specifically for Shopify e-commerce. Unlike generic AI tools, it understands product catalogs, SEO best practices, pricing dynamics, and supplier relationships." },
  { question: "Does AI optimization really work for e-commerce?", answer: "Yes. Our merchants see an average 40% increase in organic traffic and 25% higher conversion rates. AI processes data faster and more accurately than manual optimization." },
  { question: "Is my store data safe with AI?", answer: "Absolutely. ShopOpti+ uses enterprise-grade encryption. Your data is never shared or used to train external models. Full GDPR compliance." },
  { question: "Can AI replace my e-commerce team?", answer: "AI augments your team, not replaces it. It handles repetitive tasks (SEO, pricing, descriptions) so your team can focus on strategy, branding, and customer relationships." },
];

const aiCapabilities = [
  { title: "AI SEO Writer", desc: "Generates keyword-optimized titles, descriptions, and meta tags for every product. Understands search intent and buyer psychology.", icon: FileText },
  { title: "Smart Pricing Engine", desc: "Analyzes competition, demand, seasonality, and margins to set optimal prices. Updates in real-time.", icon: TrendingUp },
  { title: "Image Optimization AI", desc: "Auto-compresses images, generates descriptive alt text, removes backgrounds, and enhances product photos.", icon: Image },
  { title: "Competitor Intelligence", desc: "Monitors competitor pricing, new products, and market trends. Provides actionable recommendations.", icon: Target },
  { title: "Content Quality Scoring", desc: "Rates every listing 0-100 across 5 pillars. Identifies exactly what needs improvement for maximum impact.", icon: BarChart3 },
  { title: "Multi-Language AI", desc: "Translates and localizes product content for 68+ languages. Maintains SEO optimization across all markets.", icon: Globe },
];

export default function AIToolForShopifyPage() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="AI Tool for Shopify | Smart E-commerce Automation — ShopOpti+"
        description="The most powerful AI tool for Shopify stores. Automate SEO, pricing, content & analytics with artificial intelligence. Boost traffic 40% and save 20h/week."
        path="/ai-tool-for-shopify"
        keywords="AI tool for shopify, shopify AI, artificial intelligence shopify, AI ecommerce tool, shopify AI optimization, AI shopify app"
      />
      <HreflangTags
        entries={[
          { lang: "en", href: "https://shopopti.io/ai-tool-for-shopify" },
          { lang: "fr", href: "https://shopopti.io/optimisation-shopify" },
        ]}
        xDefault="https://shopopti.io/ai-tool-for-shopify"
      />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://shopopti.io" },
        { name: "AI Tool for Shopify", url: "https://shopopti.io/ai-tool-for-shopify" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article>
        {/* Hero */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <Badge variant="outline" className="mb-6 text-sm px-4 py-1">🧠 AI-Powered E-commerce</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              The Smartest <span className="text-primary">AI Tool</span> for Shopify
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Harness artificial intelligence to optimize every aspect of your Shopify store. 
              From SEO to pricing, content to analytics — AI does the heavy lifting.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
                Try AI Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/shopify-ai-optimization')}>
                See AI in Action
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">No credit card required • 14-day free trial</p>
          </div>
        </section>

        {/* AI Impact */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
              {[
                { value: "40%", label: "More Traffic" },
                { value: "25%", label: "Higher Conversions" },
                { value: "20h", label: "Saved Per Week" },
                { value: "10x", label: "Faster Optimization" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-3xl font-bold text-primary">{s.value}</p>
                  <p className="text-muted-foreground text-sm">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Capabilities */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-4">What Our AI Can Do for Your Store</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Purpose-built AI for Shopify e-commerce. Not generic — specialized.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiCapabilities.map((c) => (
                <Card key={c.title} className="border-none shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <c.icon className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="text-lg">{c.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{c.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why AI for Shopify */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">Why AI is Essential for Shopify in 2026</h2>
            <div className="space-y-6">
              {[
                { title: "Competition is Brutal", desc: "There are 4.4M+ Shopify stores. Without AI optimization, you're invisible in search results and losing to competitors who automate." },
                { title: "Manual Work Doesn't Scale", desc: "Optimizing 100 products manually takes weeks. AI does it in minutes. As you grow, the gap between manual and AI-powered stores widens." },
                { title: "Data-Driven Decisions Win", desc: "AI processes thousands of data points (competitor prices, search trends, customer behavior) to make better decisions than gut feelings." },
              ].map((item) => (
                <div key={item.title} className="p-6 bg-card border rounded-xl">
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
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
        <section className="py-20">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl font-bold mb-4">Ready to Supercharge Your Shopify Store with AI?</h2>
            <p className="text-lg text-muted-foreground mb-8">Join thousands of merchants using AI to grow faster.</p>
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
                <p className="text-sm text-muted-foreground">Deep dive into AI SEO</p>
              </Link>
              <Link to="/how-to-automate-shopify-store" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Automate Shopify</h3>
                <p className="text-sm text-muted-foreground">Step-by-step guide</p>
              </Link>
              <Link to="/shopify-automation-tool" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Automation Tool</h3>
                <p className="text-sm text-muted-foreground">All features overview</p>
              </Link>
              <Link to="/shopopti-vs-autods" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">vs AutoDS</h3>
                <p className="text-sm text-muted-foreground">See the difference</p>
              </Link>
            </div>
          </div>
        </section>
      </article>
    </PublicLayout>
  );
}
