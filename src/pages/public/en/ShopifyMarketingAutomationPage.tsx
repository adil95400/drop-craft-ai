import { SEO } from "@/components/SEO";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Mail, Target, TrendingUp, Zap, BarChart3, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ShopifyMarketingAutomationPage = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Mail, title: "Email & SMS Campaigns", desc: "AI-generated campaigns triggered by customer behavior — abandoned carts, post-purchase, win-back sequences." },
    { icon: Target, title: "Audience Segmentation", desc: "Auto-segment customers by purchase history, LTV, and engagement. Target the right people at the right time." },
    { icon: TrendingUp, title: "Performance Tracking", desc: "Real-time ROI dashboards for every campaign. Know exactly what's working and scale it." },
    { icon: Bot, title: "AI Content Generation", desc: "Generate ad copy, product descriptions, and social posts optimized for conversion in seconds." },
    { icon: Zap, title: "Workflow Automation", desc: "Build multi-step automation workflows — from lead capture to repeat purchase — without code." },
    { icon: BarChart3, title: "A/B Testing", desc: "Test subject lines, creatives, and offers automatically. AI picks the winner and scales it." },
  ];

  return (
    <PublicLayout>
      <SEO
        title="Shopify Marketing Automation | AI Campaigns & Growth"
        description="Automate your Shopify marketing with AI. Email, SMS, audience segmentation, A/B testing, and campaign analytics. Grow revenue on autopilot."
        path="/shopify-marketing-automation"
        keywords="shopify marketing automation, shopify email automation, shopify SMS marketing, AI marketing shopify, ecommerce marketing tool"
      />

      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl text-center space-y-6">
          <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">Marketing Automation</Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Shopify Marketing on <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Autopilot</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered campaigns, smart segmentation, and real-time analytics. Grow your store without growing your workload.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="px-8 py-6 text-lg" onClick={() => navigate('/auth?trial=true')}>Start Free Trial <ArrowRight className="w-4 h-4 ml-2" /></Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg" onClick={() => navigate('/features')}>See All Features</Button>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need to automate marketing</h2>
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

      <section className="py-16 bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-2xl space-y-6">
          <h2 className="text-3xl font-bold">Start automating your marketing today</h2>
          <p className="text-lg opacity-90">14-day free trial. No credit card required.</p>
          <Button size="lg" variant="secondary" className="px-8 py-6 text-lg" onClick={() => navigate('/auth?trial=true')}>
            Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
};

export default ShopifyMarketingAutomationPage;
