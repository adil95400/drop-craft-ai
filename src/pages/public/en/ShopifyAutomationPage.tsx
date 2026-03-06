import { SEO } from "@/components/SEO";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Bot, Zap, Package, DollarSign, RefreshCw, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ShopifyAutomationPage = () => {
  const navigate = useNavigate();
  const features = [
    { icon: DollarSign, title: "AI Dynamic Pricing", desc: "Automatically adjust prices based on demand, competition, and margins. Maximize profit 24/7." },
    { icon: Package, title: "Inventory Auto-Sync", desc: "Real-time stock sync across all suppliers and sales channels. Never oversell again." },
    { icon: Bot, title: "Order Auto-Fulfillment", desc: "Automatically route and fulfill orders to the best supplier. No manual work." },
    { icon: RefreshCw, title: "Product Auto-Update", desc: "Prices, descriptions, and images update automatically when suppliers change." },
    { icon: Zap, title: "Workflow Builder", desc: "Build custom automation workflows with triggers, conditions, and actions — no code needed." },
    { icon: Shield, title: "Smart Alerts", desc: "Get notified about stock-outs, price drops, and supplier issues before they affect your store." },
  ];

  return (
    <PublicLayout>
      <SEO
        title="Shopify Automation | Automate Your Store with AI"
        description="Automate your entire Shopify store with AI. Dynamic pricing, inventory sync, order fulfillment, and smart workflows. Save 20+ hours/week."
        path="/shopify-automation"
        keywords="shopify automation, automate shopify store, shopify auto fulfillment, shopify dynamic pricing, shopify inventory sync"
      />

      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl text-center space-y-6">
          <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">Shopify Automation</Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Automate Your Shopify Store <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">End-to-End</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            From pricing to fulfillment — let AI handle the repetitive work so you can focus on scaling.
          </p>
          <Button size="lg" className="px-8 py-6 text-lg" onClick={() => navigate('/auth?trial=true')}>Start Free Trial <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
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

      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-8">How merchants use ShopOpti+ automation</h2>
          <div className="space-y-6">
            {[
              { title: "Sarah — Solo dropshipper", result: "Went from 3 hours/day on orders to fully automated. Revenue up 60%." },
              { title: "Mark — Multi-store owner", result: "Manages 5 stores from one dashboard. Inventory syncs across all channels automatically." },
              { title: "Digital Agency — 20+ clients", result: "Automated fulfillment for all clients. Support tickets down 80%." },
            ].map((c, i) => (
              <Card key={i}>
                <CardContent className="pt-6 flex items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                  <div><h3 className="font-semibold">{c.title}</h3><p className="text-sm text-muted-foreground mt-1">{c.result}</p></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-2xl space-y-6">
          <h2 className="text-3xl font-bold">Put your Shopify store on autopilot</h2>
          <Button size="lg" variant="secondary" className="px-8 py-6 text-lg" onClick={() => navigate('/auth?trial=true')}>
            Start Free 14-Day Trial <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
};

export default ShopifyAutomationPage;
