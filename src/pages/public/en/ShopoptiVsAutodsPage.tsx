import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { HreflangTags } from "@/components/seo/HreflangTags";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const faqItems = [
  { question: "Why switch from AutoDS to ShopOpti+?", answer: "ShopOpti+ offers advanced AI SEO optimization, 99+ suppliers, multi-marketplace support, and predictive analytics — features that AutoDS lacks. Plus, our pricing is more competitive with no hidden fees." },
  { question: "Can I migrate my products from AutoDS?", answer: "Yes, export your catalog from AutoDS as CSV and import it into ShopOpti+ with one click. Our AI will automatically optimize all listings during import." },
  { question: "Is ShopOpti+ cheaper than AutoDS?", answer: "Yes. ShopOpti+ starts at $29/month with full AI access. AutoDS charges extra for premium features, making it significantly more expensive for comparable functionality." },
  { question: "Does ShopOpti+ support the same suppliers?", answer: "ShopOpti+ supports 99+ suppliers including all major ones (AliExpress, CJ, BigBuy). We also offer exclusive integrations with European suppliers." },
];

const comparison = [
  { feature: "AI SEO Optimization", shopopti: true, competitor: false },
  { feature: "99+ Supplier Integrations", shopopti: true, competitor: true },
  { feature: "Multi-Marketplace (20+ channels)", shopopti: true, competitor: false },
  { feature: "AI Predictive Analytics", shopopti: true, competitor: false },
  { feature: "Dynamic AI Pricing", shopopti: true, competitor: false },
  { feature: "Auto-Fulfillment", shopopti: true, competitor: true },
  { feature: "Product Image AI Enhancement", shopopti: true, competitor: false },
  { feature: "68+ Language Support", shopopti: true, competitor: false },
  { feature: "Open API & Webhooks", shopopti: true, competitor: true },
  { feature: "Free Trial (No Credit Card)", shopopti: true, competitor: false },
];

export default function ShopoptiVsAutodsPage() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="ShopOpti+ vs AutoDS — Best AutoDS Alternative 2026"
        description="Compare ShopOpti+ vs AutoDS: AI SEO, 99+ suppliers, multi-marketplace, dynamic pricing. See why merchants switch from AutoDS to ShopOpti+. Free trial."
        path="/shopopti-vs-autods"
        keywords="shopopti vs autods, autods alternative, best autods alternative, autods competitor, dropshipping tool comparison"
      />
      <HreflangTags
        entries={[
          { lang: "en", href: "https://shopopti.io/shopopti-vs-autods" },
          { lang: "fr", href: "https://shopopti.io/alternative-autods" },
        ]}
        xDefault="https://shopopti.io/shopopti-vs-autods"
      />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://shopopti.io" },
        { name: "ShopOpti+ vs AutoDS", url: "https://shopopti.io/shopopti-vs-autods" },
      ]} />
      <FAQSchema questions={faqItems} />

      <article>
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <Badge variant="outline" className="mb-6 text-sm px-4 py-1">⚔️ Honest Comparison</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              ShopOpti+ vs <span className="text-primary">AutoDS</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Looking for the best dropshipping automation tool? See how ShopOpti+ compares to AutoDS 
              on features, pricing, and AI capabilities.
            </p>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
            <div className="border rounded-xl overflow-hidden">
              <div className="grid grid-cols-3 bg-muted/50 p-4 font-semibold">
                <span>Feature</span>
                <span className="text-center text-primary">ShopOpti+</span>
                <span className="text-center">AutoDS</span>
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

        {/* Pricing comparison */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">Pricing Comparison</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="border-2 border-primary rounded-xl p-8 bg-card">
                <h3 className="text-2xl font-bold text-primary mb-2">ShopOpti+</h3>
                <p className="text-4xl font-bold mb-4">$29<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
                <ul className="space-y-2 text-sm">
                  {["Full AI SEO", "99+ suppliers", "Multi-marketplace", "Dynamic pricing", "Predictive analytics", "14-day free trial"].map(f => (
                    <li key={f} className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success shrink-0" />{f}</li>
                  ))}
                </ul>
              </div>
              <div className="border rounded-xl p-8 bg-card">
                <h3 className="text-2xl font-bold mb-2">AutoDS</h3>
                <p className="text-4xl font-bold mb-4">$47<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
                <ul className="space-y-2 text-sm">
                  {["Basic automation", "Supplier integrations", "Single marketplace", "Manual pricing", "Basic analytics", "7-day trial (CC required)"].map(f => (
                    <li key={f} className="flex items-center gap-2"><span className="h-4 w-4 shrink-0 text-muted-foreground">—</span>{f}</li>
                  ))}
                </ul>
              </div>
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
            <h2 className="text-3xl font-bold mb-4">Ready to Switch to ShopOpti+?</h2>
            <p className="text-lg text-muted-foreground mb-8">Get more features for less. Migrate from AutoDS in minutes.</p>
            <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>
      </article>
    </PublicLayout>
  );
}
