import { SEO } from "@/components/SEO";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, FileText, DollarSign, BarChart3, Image, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ShopifyAIToolsPage = () => {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="Shopify AI Tools | AI Optimization for E-commerce"
        description="AI tools for Shopify: product descriptions, SEO optimization, pricing intelligence, image enhancement, and analytics. Boost conversions with AI."
        path="/shopify-ai-tools"
        keywords="shopify AI tools, AI for shopify, shopify AI optimization, AI product descriptions, shopify SEO AI, ecommerce AI"
      />

      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl text-center space-y-6">
          <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">AI Tools</Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">AI-Powered</span> Tools for Shopify
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            From product copy to pricing strategy — let AI optimize every aspect of your Shopify store.
          </p>
          <Button size="lg" className="px-8 py-6 text-lg" onClick={() => navigate('/auth?trial=true')}>Try AI Tools Free <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: FileText, title: "AI Product Descriptions", desc: "Generate SEO-optimized, conversion-focused product descriptions in 15+ languages." },
              { icon: Sparkles, title: "AI SEO Optimization", desc: "Auto-generate meta titles, descriptions, alt tags, and structured data for every product." },
              { icon: DollarSign, title: "AI Pricing Intelligence", desc: "Dynamic pricing that adapts to demand, competition, and your margin targets." },
              { icon: Image, title: "AI Image Enhancement", desc: "Auto-remove backgrounds, enhance quality, and generate lifestyle shots from product photos." },
              { icon: BarChart3, title: "AI Analytics & Predictions", desc: "Revenue forecasting, trend detection, and actionable insights powered by machine learning." },
              { icon: Globe, title: "AI Translation", desc: "Translate your entire catalog into 15+ languages for international expansion." },
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
          <h2 className="text-3xl font-bold">Supercharge your store with AI</h2>
          <Button size="lg" variant="secondary" className="px-8 py-6 text-lg" onClick={() => navigate('/auth?trial=true')}>Start Free Trial <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>
      </section>
    </PublicLayout>
  );
};

export default ShopifyAIToolsPage;
