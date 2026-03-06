import { SEO } from "@/components/SEO";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BarChart3, TrendingUp, DollarSign, Target, PieChart, LineChart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ShopifyAnalyticsPage = () => {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <SEO
        title="Shopify Analytics & AI Insights | Real-Time E-commerce Data"
        description="Advanced Shopify analytics with AI insights. Revenue tracking, profit margins, customer LTV, product performance, and predictive forecasting."
        path="/shopify-analytics"
        keywords="shopify analytics, shopify reporting, ecommerce analytics, shopify insights, revenue tracking shopify, shopify dashboard"
      />

      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl text-center space-y-6">
          <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">Analytics</Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Shopify Analytics <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Powered by AI</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time dashboards, predictive insights, and actionable recommendations. Know exactly what's working and why.
          </p>
          <Button size="lg" className="px-8 py-6 text-lg" onClick={() => navigate('/auth?trial=true')}>Try Analytics Free <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, title: "Real-Time Dashboards", desc: "Live revenue, orders, and conversion data. No more waiting for daily reports." },
              { icon: TrendingUp, title: "Revenue Forecasting", desc: "AI predicts your next month's revenue based on trends, seasonality, and growth patterns." },
              { icon: DollarSign, title: "Profit & Margin Tracking", desc: "Track true profit after COGS, shipping, fees, and ad spend. Per product, per channel." },
              { icon: Target, title: "Customer LTV Analysis", desc: "Understand customer lifetime value, cohort retention, and repeat purchase patterns." },
              { icon: PieChart, title: "Channel Attribution", desc: "See which channels drive the most revenue and optimize your marketing spend accordingly." },
              { icon: LineChart, title: "Product Performance", desc: "Rank products by profit, velocity, and trend. Identify winners and cut losers fast." },
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
          <h2 className="text-3xl font-bold">Make smarter decisions with AI analytics</h2>
          <Button size="lg" variant="secondary" className="px-8 py-6 text-lg" onClick={() => navigate('/auth?trial=true')}>Start Free Trial <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>
      </section>
    </PublicLayout>
  );
};

export default ShopifyAnalyticsPage;
