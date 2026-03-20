import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { HreflangTags } from "@/components/seo/HreflangTags";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const faqItems = [
  { question: "Why choose ShopOpti+ over DSers?", answer: "DSers is primarily an AliExpress order tool. ShopOpti+ is a full e-commerce automation platform with AI SEO, dynamic pricing, multi-marketplace support, and 99+ suppliers beyond just AliExpress." },
  { question: "Can I import my DSers products?", answer: "Yes, export your products from DSers and import them into ShopOpti+ via CSV. AI will optimize all listings automatically during the import process." },
  { question: "Does ShopOpti+ work with AliExpress like DSers?", answer: "Yes, and much more. ShopOpti+ supports AliExpress plus 98 additional suppliers including CJ Dropshipping, BigBuy, Spocket, Printful, and European suppliers." },
  { question: "Is DSers going to be discontinued?", answer: "DSers has been evolving since replacing Oberlo. Regardless, ShopOpti+ offers a more comprehensive solution with AI capabilities that DSers doesn't provide." },
];

const comparison = [
  { feature: "AI SEO Optimization", shopopti: true, competitor: false },
  { feature: "99+ Supplier Integrations", shopopti: true, competitor: false },
  { feature: "AliExpress Integration", shopopti: true, competitor: true },
  { feature: "Multi-Marketplace (20+ channels)", shopopti: true, competitor: false },
  { feature: "AI Dynamic Pricing", shopopti: true, competitor: false },
  { feature: "Bulk Order Processing", shopopti: true, competitor: true },
  { feature: "Predictive Analytics", shopopti: true, competitor: false },
  { feature: "AI Content Generation", shopopti: true, competitor: false },
  { feature: "Inventory Sync", shopopti: true, competitor: true },
  { feature: "Free Plan Available", shopopti: true, competitor: true },
];

export default function ShopoptiVsDsersPage() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="ShopOpti+ vs DSers — Best DSers Alternative 2026"
        description="Compare ShopOpti+ vs DSers: AI-powered automation vs basic AliExpress orders. 99+ suppliers, multi-marketplace, dynamic pricing. Free 14-day trial."
        path="/shopopti-vs-dsers"
        keywords="shopopti vs dsers, dsers alternative, best dsers alternative, dsers competitor, oberlo replacement"
      />
      <HreflangTags
        entries={[
          { lang: "en", href: "https://shopopti.io/shopopti-vs-dsers" },
          { lang: "fr", href: "https://shopopti.io/alternative-dsers" },
        ]}
        xDefault="https://shopopti.io/shopopti-vs-dsers"
      />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://shopopti.io" },
        { name: "ShopOpti+ vs DSers", url: "https://shopopti.io/shopopti-vs-dsers" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article>
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <Badge variant="outline" className="mb-6 text-sm px-4 py-1">⚔️ Honest Comparison</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              ShopOpti+ vs <span className="text-primary">DSers</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              DSers handles AliExpress orders. ShopOpti+ automates your entire e-commerce business with AI. 
              See the full comparison below.
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
                <span className="text-center">DSers</span>
              </div>
              {comparison.map((row) => (
                <div key={row.feature} className="grid grid-cols-3 p-4 border-t items-center">
                  <span className="text-sm">{row.feature}</span>
                  <span className="text-center">{row.shopopti ? <CheckCircle className="h-5 w-5 text-success mx-auto" /> : <X className="h-5 w-5 text-muted-foreground mx-auto" />}</span>
                  <span className="text-center">{row.competitor ? <CheckCircle className="h-5 w-5 text-success mx-auto" /> : <X className="h-5 w-5 text-muted-foreground mx-auto" />}</span>
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
            <h2 className="text-3xl font-bold mb-4">Upgrade from DSers to ShopOpti+</h2>
            <p className="text-lg text-muted-foreground mb-8">Go beyond AliExpress orders. Get full AI automation for your store.</p>
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
              <Link to="/shopopti-vs-zendrop" className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <h3 className="font-semibold mb-1">ShopOpti vs Zendrop</h3>
                <p className="text-sm text-muted-foreground">Compare with Zendrop</p>
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
