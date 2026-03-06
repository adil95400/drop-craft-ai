import { SEO } from "@/components/SEO";
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

const ShopoptiVsSellTheTrendPage = () => {
  const navigate = useNavigate();
  const Icon = ({ ok }: { ok: boolean }) => ok ? <CheckCircle2 className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-muted-foreground/40" />;

  return (
    <PublicLayout>
      <SEO
        title="ShopOpti+ vs Sell The Trend | Feature Comparison 2026"
        description="Compare ShopOpti+ and Sell The Trend. See which tool offers better AI automation, pricing, product research, and multi-channel selling for Shopify."
        path="/shopopti-vs-sellthetrend"
        keywords="shopopti vs sell the trend, sell the trend alternative, best dropshipping tool, product research tool comparison"
      />

      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl text-center space-y-6">
          <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">Comparison</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">ShopOpti+ vs Sell The Trend</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sell The Trend is great for product research. ShopOpti+ goes further with end-to-end automation, AI pricing, and multi-channel selling.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <div className="rounded-xl border overflow-hidden">
            <div className="grid grid-cols-3 bg-secondary/50 font-semibold text-sm p-4">
              <div>Feature</div>
              <div className="text-center">ShopOpti+</div>
              <div className="text-center">Sell The Trend</div>
            </div>
            {features.map((f, i) => (
              <div key={i} className={`grid grid-cols-3 p-4 text-sm ${i % 2 ? 'bg-secondary/20' : ''}`}>
                <div>{f.feature}</div>
                <div className="flex justify-center"><Icon ok={f.shopopti} /></div>
                <div className="flex justify-center"><Icon ok={f.competitor} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl space-y-8">
          <h2 className="text-3xl font-bold text-center">Why merchants switch to ShopOpti+</h2>
          <div className="space-y-4 text-muted-foreground">
            <p><strong className="text-foreground">Sell The Trend</strong> excels at product research and trend spotting with tools like the NEXUS product explorer and Facebook ads spy. It's a solid choice if product research is your only need.</p>
            <p><strong className="text-foreground">ShopOpti+</strong> goes beyond research. It's a full automation platform that handles everything from product import to dynamic pricing, inventory sync, order fulfillment, marketing, and analytics — all powered by AI.</p>
            <p>If you want a single platform that replaces 5+ tools and saves you 20+ hours per week, ShopOpti+ is the better choice.</p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-2xl space-y-6">
          <h2 className="text-3xl font-bold">Ready to go beyond product research?</h2>
          <p className="text-lg opacity-90">Try ShopOpti+ free for 14 days. No credit card required.</p>
          <Button size="lg" variant="secondary" className="px-8 py-6 text-lg" onClick={() => navigate('/auth?trial=true')}>
            Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
};

export default ShopoptiVsSellTheTrendPage;
