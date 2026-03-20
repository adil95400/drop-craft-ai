import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { HreflangTags } from "@/components/seo/HreflangTags";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  { feature: "AI product scoring", shopopti: true, competitor: true },
  { feature: "1-click Shopify import", shopopti: true, competitor: true },
  { feature: "Dynamic AI pricing", shopopti: true, competitor: false },
  { feature: "Auto order fulfillment", shopopti: true, competitor: false },
  { feature: "Multi-channel selling", shopopti: true, competitor: false },
  { feature: "AI SEO optimization", shopopti: true, competitor: false },
  { feature: "99+ supplier integrations", shopopti: true, competitor: false },
  { feature: "Marketing automation", shopopti: true, competitor: false },
  { feature: "Inventory auto-sync", shopopti: true, competitor: true },
  { feature: "Revenue forecasting AI", shopopti: true, competitor: false },
  { feature: "Facebook Ads spy tool", shopopti: false, competitor: true },
  { feature: "Video ad creator", shopopti: false, competitor: true },
];

const faqItems = [
  { question: "How does ShopOpti+ compare to Sell The Trend?", answer: "Sell The Trend focuses on product research and ad spy tools. ShopOpti+ is a complete automation platform covering research, imports, pricing, fulfillment, SEO, and analytics — an all-in-one solution." },
  { question: "Is ShopOpti+ better for scaling?", answer: "Yes. ShopOpti+ handles the full e-commerce lifecycle (research → import → sell → fulfill → analyze), while Sell The Trend only covers research and ads." },
  { question: "Does ShopOpti+ have product research?", answer: "Yes. ShopOpti+ includes AI product scoring, trend detection, and margin analysis across 99+ suppliers — plus full automation after you find winning products." },
  { question: "Which tool is more affordable?", answer: "ShopOpti+ starts at $29/month with full automation. Sell The Trend charges $39.97/month for research-only features." },
];

const ShopoptiVsSellTheTrendPage = () => {
  const navigate = useNavigate();
  const Icon = ({ ok }: { ok: boolean }) => ok ? <CheckCircle2 className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-muted-foreground/40" />;

  return (
    <PublicLayout>
      <SEO
        title="ShopOpti+ vs Sell The Trend | Feature Comparison 2026"
        description="Compare ShopOpti+ vs Sell The Trend: full automation platform vs research tool. AI pricing, auto-fulfillment, 99+ suppliers. Free 14-day trial."
        path="/shopopti-vs-sellthetrend"
        keywords="shopopti vs sell the trend, sell the trend alternative, best dropshipping tool, product research tool comparison"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "ShopOpti+ vs Sell The Trend Comparison",
          "description": "Detailed feature comparison between ShopOpti+ and Sell The Trend for e-commerce automation.",
          "url": "https://shopopti.io/shopopti-vs-sellthetrend"
        }}
      />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://shopopti.io" },
        { name: "ShopOpti+ vs Sell The Trend", url: "https://shopopti.io/shopopti-vs-sellthetrend" },
      ]} />
      <HreflangTags
        entries={[
          { lang: "en", href: "https://shopopti.io/shopopti-vs-sellthetrend" },
        ]}
        xDefault="https://shopopti.io/shopopti-vs-sellthetrend"
      />
      <FAQSchema questions={faqItems} />

      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl text-center space-y-6">
          <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">Comparison</Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            ShopOpti+ vs <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Sell The Trend</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Full automation platform vs product research tool. See why merchants choose ShopOpti+ for end-to-end e-commerce.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-primary/20">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="p-4 font-semibold text-primary">ShopOpti+</th>
                  <th className="p-4 font-semibold text-muted-foreground">Sell The Trend</th>
                </tr>
              </thead>
              <tbody>
                {features.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-medium">{row.feature}</td>
                    <td className="p-4 text-center"><Icon ok={row.shopopti} /></td>
                    <td className="p-4 text-center"><Icon ok={row.competitor} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqItems.map((faq, i) => (
              <div key={i} className="bg-background rounded-lg p-6 border">
                <h3 className="font-semibold text-lg flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" />{faq.question}</h3>
                <p className="text-muted-foreground mt-2 ml-7">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-2xl space-y-6">
          <h2 className="text-3xl font-bold">Switch to the complete automation platform</h2>
          <p className="text-lg opacity-90">14-day free trial. No credit card required.</p>
          <Button size="lg" variant="secondary" className="px-8 py-6 text-lg" onClick={() => navigate('/auth?trial=true')}>Try ShopOpti+ Free <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>
      </section>
    </PublicLayout>
  );
};

export default ShopoptiVsSellTheTrendPage;
