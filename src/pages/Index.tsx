import { useLightAuth } from "@/contexts/LightAuthContext";
import { PublicLayout } from '@/layouts/PublicLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Crown, Zap, Users, Star, ArrowRight, TrendingUp, Shield, Globe, CheckCircle2, Package, ShoppingCart, BarChart3, Sparkles, Clock, MessageSquare, DollarSign, Rocket, Target, Search, Bot, LineChart } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { SoftwareAppSchema, OrganizationSchema } from "@/components/seo/StructuredData";
import { StickyCtaBar } from "@/components/landing/StickyCtaBar";
import { memo, useEffect } from "react";
import logoPng from "@/assets/logo-shopopti.png";

const heroImage = "/images/hero-automation.jpg";
const heroImageSm = "/images/hero-automation-sm.jpg";

// ─── HERO ────────────────────────────────────────────────────────────────────
const HeroSection = memo(() => {
  const navigate = useNavigate();
  return (
    <section className="relative py-20 md:py-28 lg:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-secondary/10" />
      <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,white,transparent_70%)]" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/15 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge className="px-5 py-2.5 text-sm bg-primary/20 text-foreground border-primary/30 shadow-sm inline-flex items-center gap-2 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            AI-Powered Shopify Automation
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]">
            Run Your Shopify Store
            <span className="block bg-gradient-to-r from-primary via-primary/70 to-primary bg-clip-text text-transparent">
              on Autopilot with AI
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Find winning products, automate pricing &amp; inventory, and grow revenue — all from one platform. 
            Save <strong className="text-foreground">20+ hours/week</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8 py-6 text-lg font-semibold group shadow-lg shadow-primary/25 hover:shadow-xl transition-all" onClick={() => { try { localStorage.setItem('pending_trial','true'); } catch {} navigate('/auth?trial=true'); }}>
              <Crown className="w-5 h-5 mr-2" />
              Start Free 14-Day Trial
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-6 text-lg border-2" onClick={() => navigate('/features')}>
              See Live Demo
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
            {[
              { icon: CheckCircle2, text: "No credit card required" },
              { icon: CheckCircle2, text: "Setup in 2 min" },
              { icon: CheckCircle2, text: "Cancel anytime" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <item.icon className="h-5 w-5 text-success flex-shrink-0" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});
HeroSection.displayName = "HeroSection";

// ─── SOCIAL PROOF BAR ────────────────────────────────────────────────────────
const SocialProofBar = () => (
  <section className="py-10 bg-secondary/30 border-y border-border/40">
    <div className="container mx-auto px-4 sm:px-6">
      <p className="text-center text-sm text-muted-foreground mb-6 font-medium uppercase tracking-wider">Trusted by 2,000+ Shopify merchants worldwide</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
        {[
          { value: "2,000+", label: "Active merchants" },
          { value: "20h+", label: "Saved per week" },
          { value: "99+", label: "Suppliers connected" },
          { value: "4.8/5", label: "Average rating" },
        ].map((s, i) => (
          <div key={i} className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── PROBLEM ─────────────────────────────────────────────────────────────────
const ProblemSection = () => (
  <section className="py-16 lg:py-20">
    <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
      <div className="text-center space-y-4 mb-12">
        <Badge className="px-4 py-2 text-sm bg-destructive/10 text-destructive border-destructive/20">The Problem</Badge>
        <h2 className="text-3xl md:text-4xl font-bold">Running a Shopify store shouldn't feel like a full-time job</h2>
      </div>
      <div className="grid sm:grid-cols-3 gap-6">
        {[
          { icon: Clock, title: "Time-consuming tasks", desc: "Hours spent updating prices, managing inventory, and fulfilling orders manually." },
          { icon: Target, title: "Missed opportunities", desc: "No way to spot winning products or optimize pricing before your competitors do." },
          { icon: BarChart3, title: "Data overwhelm", desc: "Too many spreadsheets, too little insight. No clear path to scale." },
        ].map((p, i) => (
          <Card key={i} className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="p-3 rounded-full bg-destructive/10 w-fit mx-auto"><p.icon className="h-6 w-6 text-destructive" /></div>
              <h3 className="font-semibold text-lg">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

// ─── SOLUTION / 3 PILLARS ────────────────────────────────────────────────────
const SolutionSection = () => {
  const navigate = useNavigate();
  const pillars = [
    {
      icon: Search,
      badge: "Find",
      title: "Find Winning Products",
      desc: "AI-powered product research across 99+ suppliers. Instantly identify trending products, reliable suppliers, and high-margin opportunities.",
      features: ["AI product scoring", "Supplier intelligence", "Trend detection", "Margin calculator"],
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Bot,
      badge: "Automate",
      title: "Automate Your Store",
      desc: "Set your store on autopilot. Dynamic pricing, inventory sync, order fulfillment, and SEO optimization — all automated with AI.",
      features: ["Dynamic pricing AI", "Auto inventory sync", "Order auto-fulfillment", "SEO auto-optimization"],
      color: "from-primary to-primary/60",
    },
    {
      icon: LineChart,
      badge: "Grow",
      title: "Grow Your Revenue",
      desc: "Real-time analytics and AI insights to scale faster. Track performance, predict trends, and make data-driven decisions.",
      features: ["Real-time dashboards", "Revenue predictions", "Marketing automation", "Competitor tracking"],
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <section className="py-16 lg:py-24 bg-secondary/20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-4 mb-16">
          <Badge className="px-4 py-2 text-sm bg-primary/10 text-primary border-primary/20">The Solution</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">One platform. Three superpowers.</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">ShopOpti+ is the AI copilot that handles the heavy lifting so you can focus on growing.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {pillars.map((p, i) => (
            <Card key={i} className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group">
              <CardHeader className="space-y-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${p.color} w-fit`}>
                  <p.icon className="h-7 w-7 text-white" />
                </div>
                <Badge variant="outline" className="w-fit">{p.badge}</Badge>
                <CardTitle className="text-2xl">{p.title}</CardTitle>
                <CardDescription className="text-base">{p.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" className="px-8 py-6 text-lg" onClick={() => navigate('/features')}>
            Explore All Features <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

// ─── PROOF / TESTIMONIALS ────────────────────────────────────────────────────
const ProofSection = () => {
  const testimonials = [
    {
      quote: "ShopOpti+ saved me 20 hours a week. My revenue went up 40% in just 2 months — I wish I'd started sooner.",
      author: "Marie D.",
      role: "Shopify merchant, €50K/mo",
      avatar: "M",
      metric: "+40% revenue",
    },
    {
      quote: "The AI pricing alone paid for itself in the first week. It automatically adjusts my margins based on demand. Game changer.",
      author: "Thomas M.",
      role: "Dropshipping pro, 3 stores",
      avatar: "T",
      metric: "3x ROI in 7 days",
    },
    {
      quote: "We manage 30+ client stores through ShopOpti+. The multi-tenant setup and API are enterprise-grade. Best tool in our stack.",
      author: "Sophie L.",
      role: "CEO, E-commerce Agency",
      avatar: "S",
      metric: "30+ stores managed",
    },
  ];

  return (
    <section className="py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-4 mb-12">
          <Badge className="px-4 py-2 bg-warning/15 text-warning border-warning/30">Social Proof</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">Merchants love ShopOpti+</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-4">
                <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">{t.metric}</Badge>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-warning text-warning" />)}
                </div>
                <p className="text-muted-foreground italic">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">{t.avatar}</div>
                  <div>
                    <div className="font-semibold text-sm">{t.author}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── INTEGRATIONS ────────────────────────────────────────────────────────────
const IntegrationsSection = () => {
  const navigate = useNavigate();
  const platforms = [
    "Shopify", "WooCommerce", "AliExpress", "Amazon", "eBay",
    "BigBuy", "Spocket", "CJ Dropshipping", "TikTok Shop", "Etsy",
    "PrestaShop", "Google Shopping",
  ];
  return (
    <section className="py-16 lg:py-20 bg-secondary/20">
      <div className="container mx-auto px-4 sm:px-6 text-center">
        <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20 mb-4">Integrations</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Connects with your entire stack</h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">99+ suppliers and 24+ platforms, synced in real time.</p>
        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {platforms.map((p) => (
            <Badge key={p} variant="outline" className="px-4 py-2 text-sm bg-background">{p}</Badge>
          ))}
          <Badge variant="outline" className="px-4 py-2 text-sm bg-primary/5 border-primary/30 text-primary">+87 more</Badge>
        </div>
        <Button variant="outline" className="mt-8" onClick={() => navigate('/integrations')}>
          View All Integrations <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </section>
  );
};

// ─── PRICING PREVIEW ─────────────────────────────────────────────────────────
const PricingPreviewSection = () => {
  const navigate = useNavigate();
  const plans = [
    { name: "Basic", price: "$29", period: "/mo", desc: "For starters", features: ["500 products", "1 store", "AI optimization", "Email support"], cta: "Start Free Trial", popular: false },
    { name: "Pro", price: "$79", period: "/mo", desc: "For growing stores", features: ["10,000 products", "Unlimited stores", "Advanced AI + Analytics", "Priority support 24/7", "Marketing automation"], cta: "Start Free Trial", popular: true },
    { name: "Ultra Pro", price: "$199", period: "/mo", desc: "For power sellers", features: ["Unlimited products", "Multi-tenant", "Dedicated API", "Account manager", "Custom integrations"], cta: "Contact Sales", popular: false },
  ];

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-4 mb-12">
          <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">Pricing</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">Simple, transparent pricing</h2>
          <p className="text-lg text-muted-foreground">Start free. Scale as you grow.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p, i) => (
            <Card key={i} className={`relative ${p.popular ? 'border-primary border-2 shadow-xl' : 'border-2'}`}>
              {p.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">Most Popular</Badge>}
              <CardHeader>
                <CardTitle>{p.name}</CardTitle>
                <CardDescription>{p.desc}</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className="text-muted-foreground">{p.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button className={`w-full ${p.popular ? '' : ''}`} variant={p.popular ? 'default' : 'outline'} onClick={() => navigate(p.name === 'Ultra Pro' ? '/contact' : '/auth')}>
                  {p.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button variant="link" onClick={() => navigate('/pricing')}>Compare all plans <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>
      </div>
    </section>
  );
};

// ─── FINAL CTA ───────────────────────────────────────────────────────────────
const FinalCTASection = () => {
  const navigate = useNavigate();
  return (
    <section className="py-20 bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 text-center max-w-3xl space-y-8">
        <h2 className="text-3xl md:text-5xl font-bold">Ready to put your store on autopilot?</h2>
        <p className="text-lg md:text-xl opacity-90">Join 2,000+ merchants saving 20+ hours/week with ShopOpti+.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button size="lg" variant="secondary" className="px-8 py-6 text-lg" onClick={() => navigate('/auth')}>
            <Crown className="w-5 h-5 mr-2" /> Start Free Trial
          </Button>
          <Button size="lg" variant="outline" className="px-8 py-6 text-lg bg-transparent border-white text-white hover:bg-white/10" onClick={() => navigate('/contact')}>
            <MessageSquare className="w-5 h-5 mr-2" /> Talk to Sales
          </Button>
        </div>
        <p className="text-sm opacity-75">✓ 14-day free trial • ✓ No credit card • ✓ Cancel anytime</p>
      </div>
    </section>
  );
};

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
const Index = () => {
  const { isAuthenticated, isLoading } = useLightAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PublicLayout>
      <SEO
        title="ShopOpti+ | AI-Powered Shopify Automation Platform"
        description="Run your Shopify store on autopilot with AI. Find winning products, automate pricing & inventory, grow revenue. 99+ suppliers. Free 14-day trial."
        path="/"
        keywords="shopify automation, shopify AI tool, dropshipping automation, shopify optimization, product research AI, shopify analytics"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "ShopOpti+",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": "29", "priceCurrency": "USD" },
          "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "127" }
        }}
      />
      <OrganizationSchema />
      <SoftwareAppSchema />

      <main>
        <HeroSection />
        <SocialProofBar />
        <ProblemSection />
        <SolutionSection />
        <ProofSection />
        <IntegrationsSection />
        <PricingPreviewSection />
        <FinalCTASection />
      </main>
      <StickyCtaBar />
    </PublicLayout>
  );
};

export default Index;
