import { SEO } from "@/components/SEO";
import { FAQSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { HreflangTags } from "@/components/seo/HreflangTags";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Mail, Target, TrendingUp, Zap, BarChart3, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";

const faqItems = [
  { question: "What is Shopify marketing automation?", answer: "Marketing automation uses AI to create, schedule, and optimize campaigns (email, SMS, social) based on customer behavior — abandoned carts, post-purchase flows, win-back sequences — without manual effort." },
  { question: "Can ShopOpti+ automate email campaigns?", answer: "Yes. ShopOpti+ generates AI-powered email and SMS campaigns triggered by customer actions. It handles segmentation, content creation, A/B testing, and performance tracking automatically." },
  { question: "How does AI improve marketing ROI?", answer: "AI optimizes send times, personalizes content, tests variations, and allocates budget to the highest-performing channels — typically improving ROI by 30-50% compared to manual campaigns." },
  { question: "Do I need a separate email marketing tool?", answer: "No. ShopOpti+ includes built-in email and SMS automation. You don't need Klaviyo, Mailchimp, or other tools — everything is integrated in one platform." },
];

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
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "ShopOpti+ Marketing Automation",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "description": "AI-powered marketing automation for Shopify: email, SMS, segmentation, A/B testing, and campaign analytics.",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "priceValidUntil": "2026-12-31" },
          "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "1247", "bestRating": "5" }
        }}
      />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://shopopti.io" },
        { name: "Marketing Automation", url: "https://shopopti.io/shopify-marketing-automation" },
      ]} />
      <HreflangTags
        entries={[
          { lang: "en", href: "https://shopopti.io/shopify-marketing-automation" },
          { lang: "fr", href: "https://shopopti.io/automatisation-ecommerce" },
        ]}
        xDefault="https://shopopti.io/shopify-marketing-automation"
      />
      <FAQSchema questions={faqItems} />

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
