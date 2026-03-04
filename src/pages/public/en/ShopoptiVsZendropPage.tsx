import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { HreflangTags } from "@/components/seo/HreflangTags";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const faqItems = [
  { question: "How does ShopOpti+ compare to Zendrop?", answer: "Zendrop focuses on US-based fulfillment with a curated supplier list. ShopOpti+ offers 99+ suppliers globally, AI-powered SEO, dynamic pricing, multi-marketplace support, and predictive analytics — a complete e-commerce automation platform." },
  { question: "Is ShopOpti+ better for international sellers?", answer: "Yes. ShopOpti+ supports 68+ languages, multi-currency, and suppliers from US, EU, and Asia. Zendrop is primarily US-focused." },
  { question: "Does ShopOpti+ offer fast shipping like Zendrop?", answer: "Yes, ShopOpti+ connects to fast-shipping suppliers including US and EU warehouses. Plus, you get access to 99+ suppliers compared to Zendrop's limited catalog." },
  { question: "Can I use both ShopOpti+ and Zendrop?", answer: "You can, but ShopOpti+ already includes everything Zendrop offers plus AI optimization, dynamic pricing, and multi-channel selling. Most users find ShopOpti+ covers all their needs." },
];

const comparison = [
  { feature: "AI SEO Optimization", shopopti: true, competitor: false },
  { feature: "99+ Supplier Integrations", shopopti: true, competitor: false },
  { feature: "US-Based Fulfillment", shopopti: true, competitor: true },
  { feature: "Multi-Marketplace (20+ channels)", shopopti: true, competitor: false },
  { feature: "AI Dynamic Pricing", shopopti: true, competitor: false },
  { feature: "Branded Packaging", shopopti: true, competitor: true },
  { feature: "AI Content Generation", shopopti: true, competitor: false },
  { feature: "Predictive Analytics", shopopti: true, competitor: false },
  { feature: "68+ Languages Support", shopopti: true, competitor: false },
  { feature: "Print-on-Demand", shopopti: true, competitor: true },
];

export default function ShopoptiVsZendropPage() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="ShopOpti+ vs Zendrop — Best Zendrop Alternative 2026"
        description="Compare ShopOpti+ vs Zendrop: AI automation, 99+ suppliers, multi-marketplace vs US-only fulfillment. See why merchants choose ShopOpti+. Free trial."
        path="/shopopti-vs-zendrop"
        keywords="shopopti vs zendrop, zendrop alternative, best zendrop alternative, zendrop competitor, dropshipping platform comparison"
      />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://shopopti.io" },
        { name: "ShopOpti+ vs Zendrop", url: "https://shopopti.io/shopopti-vs-zendrop" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article>
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <Badge variant="outline" className="mb-6 text-sm px-4 py-1">⚔️ Honest Comparison</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              ShopOpti+ vs <span className="text-primary">Zendrop</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Zendrop offers US fulfillment. ShopOpti+ delivers full AI-powered e-commerce automation 
              with 99+ suppliers worldwide. Compare and choose the best for your business.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
            <div className="border rounded-xl overflow-hidden">
              <div className="grid grid-cols-3 bg-muted/50 p-4 font-semibold">
                <span>Feature</span>
                <span className="text-center text-primary">ShopOpti+</span>
                <span className="text-center">Zendrop</span>
              </div>
              {comparison.map((row) => (
                <div key={row.feature} className="grid grid-cols-3 p-4 border-t items-center">
                  <span className="text-sm">{row.feature}</span>
                  <span className="text-center">{row.shopopti ? <CheckCircle className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-muted-foreground mx-auto" />}</span>
                  <span className="text-center">{row.competitor ? <CheckCircle className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-muted-foreground mx-auto" />}</span>
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
            <h2 className="text-3xl font-bold mb-4">Go Beyond Zendrop with ShopOpti+</h2>
            <p className="text-lg text-muted-foreground mb-8">99+ suppliers, AI automation, multi-marketplace. Everything you need in one platform.</p>
            <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Related Resources</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/shopopti-vs-autods" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">ShopOpti vs AutoDS</h3>
                <p className="text-sm text-muted-foreground">Compare with AutoDS</p>
              </Link>
              <Link to="/shopopti-vs-dsers" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">ShopOpti vs DSers</h3>
                <p className="text-sm text-muted-foreground">Compare with DSers</p>
              </Link>
              <Link to="/shopify-automation-tool" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Automation Tool</h3>
                <p className="text-sm text-muted-foreground">Full Shopify automation</p>
              </Link>
              <Link to="/shopify-product-import-tool" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">Product Import</h3>
                <p className="text-sm text-muted-foreground">99+ suppliers</p>
              </Link>
            </div>
          </div>
        </section>
      </article>
    </PublicLayout>
  );
}
