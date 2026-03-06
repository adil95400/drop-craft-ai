import { SEO } from "@/components/SEO";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Search, Package, Truck, DollarSign, Globe, Zap, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DropshippingAutomationPage = () => {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="Dropshipping Automation Tool | AI-Powered Order & Product Sync"
        description="Automate your dropshipping business end-to-end. AI product sourcing, 1-click import, auto-fulfillment, and real-time supplier sync. 99+ suppliers."
        path="/dropshipping-automation"
        keywords="dropshipping automation, automate dropshipping, dropshipping tool, auto fulfillment, product sourcing AI, aliexpress automation"
      />

      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl text-center space-y-6">
          <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">Dropshipping Automation</Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Dropshipping on <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Complete Autopilot</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            From product research to order fulfillment — automate every step of your dropshipping business with AI.
          </p>
          <Button size="lg" className="px-8 py-6 text-lg" onClick={() => navigate('/auth?trial=true')}>Start Free Trial <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center mb-12">The complete dropshipping automation stack</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Search, title: "AI Product Research", desc: "Find winning products with AI scoring. Analyze trends, margins, and competition in seconds." },
              { icon: Package, title: "1-Click Product Import", desc: "Import from AliExpress, CJ, BigBuy, Spocket and 99+ suppliers with one click." },
              { icon: DollarSign, title: "Smart Pricing Rules", desc: "Set markup rules, competitor-based pricing, and AI-driven margin optimization." },
              { icon: Truck, title: "Auto Order Fulfillment", desc: "Orders auto-route to the best supplier. Tracking numbers sync back to your store." },
              { icon: Globe, title: "Multi-Channel Selling", desc: "Sell on Shopify, eBay, Amazon, Etsy, and TikTok Shop from one dashboard." },
              { icon: Zap, title: "Real-Time Sync", desc: "Stock levels, prices, and product info sync in real-time across all channels." },
            ].map((f, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow border-2 hover:border-primary/30">
                <CardContent className="pt-6 space-y-3">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit"><f.icon className="h-6 w-6 text-primary" /></div>
                  <h3 className="font-semibold text-lg">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-2xl space-y-6">
          <h2 className="text-3xl font-bold">Start automating your dropshipping today</h2>
          <p className="text-lg opacity-90">Free 14-day trial. 99+ suppliers. No credit card.</p>
          <Button size="lg" variant="secondary" className="px-8 py-6 text-lg" onClick={() => navigate('/auth?trial=true')}>Get Started Free <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>
      </section>
    </PublicLayout>
  );
};

export default DropshippingAutomationPage;
