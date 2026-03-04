import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { HreflangTags } from "@/components/seo/HreflangTags";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Brain, Sparkles, Target, TrendingUp, Search, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const faqItems = [
  { question: "How does AI optimize my Shopify products?", answer: "Our AI analyzes your product data, competitor listings, and search trends to generate optimized titles, descriptions, meta tags, and alt text. It scores each product on a 0-100 SEO scale and provides actionable recommendations." },
  { question: "Will AI-generated content sound natural?", answer: "Yes, our AI is trained on millions of high-converting product listings. You can choose the tone (professional, friendly, luxury) and language. All content is unique and human-readable." },
  { question: "How much can AI optimization improve my traffic?", answer: "Merchants typically see a 30-50% increase in organic traffic within 3 months of applying AI optimizations. Results vary based on niche competition and implementation." },
  { question: "Can I review AI suggestions before applying?", answer: "Absolutely. Every AI suggestion can be reviewed, edited, and approved before being applied to your store. You maintain full control." },
];

const capabilities = [
  { icon: Brain, title: "AI Content Generation", desc: "Generate SEO-optimized product titles, descriptions, and bullet points that convert. Supports 68+ languages." },
  { icon: Search, title: "SEO Audit & Scoring", desc: "Every product gets a 0-100 SEO score across 5 pillars: Title, Description, Meta, Images, and Structure." },
  { icon: FileText, title: "Meta Tag Optimization", desc: "Auto-generate meta titles, descriptions, and Open Graph tags optimized for search engines and social sharing." },
  { icon: Target, title: "Keyword Research", desc: "AI identifies high-value keywords for your niche and automatically weaves them into your product content." },
  { icon: TrendingUp, title: "Performance Tracking", desc: "Monitor SEO improvements over time with before/after comparisons and organic traffic analytics." },
  { icon: Sparkles, title: "Batch Optimization", desc: "Optimize hundreds of products at once. AI processes your entire catalog with consistent quality." },
];

export default function ShopifyAIOptimizationPage() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="Shopify AI Optimization | ShopOpti+ — AI SEO for E-commerce"
        description="Optimize your Shopify store with AI. Automated SEO audits, AI-generated product descriptions, meta tag optimization, and content scoring. +40% organic traffic."
        path="/shopify-ai-optimization"
        keywords="shopify ai optimization, shopify seo tool, ai product descriptions, shopify seo optimization, ecommerce ai tool"
      />
      <HreflangTags
        entries={[
          { lang: "en", href: "https://shopopti.io/shopify-ai-optimization" },
          { lang: "fr", href: "https://shopopti.io/optimisation-shopify" },
        ]}
        xDefault="https://shopopti.io/shopify-ai-optimization"
      />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://shopopti.io" },
        { name: "Shopify AI Optimization", url: "https://shopopti.io/shopify-ai-optimization" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article>
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <Badge variant="outline" className="mb-6 text-sm px-4 py-1">🧠 AI-Powered SEO Engine</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              AI-Powered Shopify <span className="text-primary">SEO Optimization</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Let AI optimize your product listings, meta tags, and content for maximum search visibility. 
              Score every product and boost organic traffic by 40%+.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/features/ai-optimization')}>
                See AI in Action
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">AI Optimization Capabilities</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {capabilities.map((c) => (
                <Card key={c.title} className="border-none shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <c.icon className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="text-lg">{c.title}</CardTitle>
                  </CardHeader>
                  <CardContent><p className="text-muted-foreground">{c.desc}</p></CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="space-y-8">
              {[
                { step: "1", title: "Connect Your Store", desc: "Link your Shopify store in one click. ShopOpti+ imports your product catalog instantly." },
                { step: "2", title: "AI Analyzes & Scores", desc: "Our AI audits every product across 5 SEO pillars and generates a detailed optimization report." },
                { step: "3", title: "Review & Apply", desc: "Review AI-generated optimizations, edit if needed, then apply to your store with one click." },
                { step: "4", title: "Track Results", desc: "Monitor SEO improvements, organic traffic growth, and conversion rate changes over time." },
              ].map((s) => (
                <div key={s.step} className="flex gap-6 items-start">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0">{s.step}</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{s.title}</h3>
                    <p className="text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
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
            <h2 className="text-3xl font-bold mb-4">Boost Your Shopify SEO with AI</h2>
            <p className="text-lg text-muted-foreground mb-8">Join merchants who increased organic traffic by 40%+ with AI optimization.</p>
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
              <Link to="/shopify-pricing-automation" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Pricing Automation</h3>
                <p className="text-sm text-muted-foreground">Dynamic AI pricing</p>
              </Link>
              <Link to="/shopopti-vs-autods" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">ShopOpti vs AutoDS</h3>
                <p className="text-sm text-muted-foreground">Compare solutions</p>
              </Link>
              <Link to="/shopify-product-import-tool" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Product Import</h3>
                <p className="text-sm text-muted-foreground">Import from 99+ suppliers</p>
              </Link>
            </div>
          </div>
        </section>
      </article>
    </PublicLayout>
  );
}
