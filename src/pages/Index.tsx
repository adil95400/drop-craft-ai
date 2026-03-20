import { useLightAuth } from "@/contexts/LightAuthContext";
import { PublicLayout } from '@/layouts/PublicLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Crown, Zap, Users, Star, ArrowRight, TrendingUp, Shield, Globe, CheckCircle2, Package, ShoppingCart, BarChart3, Sparkles, Clock, MessageSquare, DollarSign, Rocket, Target, Search, Bot, LineChart, Play, ArrowDown, Award, Layers, RefreshCw, Lock, HeadphonesIcon } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { SoftwareAppSchema, OrganizationSchema } from "@/components/seo/StructuredData";
import { StickyCtaBar } from "@/components/landing/StickyCtaBar";
import { memo, useEffect, useState } from "react";
import logoPng from "@/assets/logo-shopopti.png";
import {
  PLANS,
  SOCIAL_PROOF,
  TESTIMONIALS,
  INTEGRATION_CATEGORIES,
  ALL_PLATFORMS,
  TOTAL_INTEGRATIONS,
  FAQ_DATA,
  type PlanConfig,
} from "@/config/landingPageConfig";

// ─── FAQ SCHEMA ──────────────────────────────────────────────────────────────
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": FAQ_DATA.map(faq => ({
    "@type": "Question",
    "name": faq.q,
    "acceptedAnswer": { "@type": "Answer", "text": faq.a },
  }))
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "ShopOpti+",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "url": "https://shopopti.io",
  "description": "AI-powered Shopify automation platform for product research, dynamic pricing, inventory management, and revenue growth.",
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": String(PLANS[0].monthlyPrice),
    "highPrice": String(PLANS[PLANS.length - 1].monthlyPrice),
    "priceCurrency": "USD",
    "offerCount": String(PLANS.length),
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": SOCIAL_PROOF.rating.replace('/5', ''),
    "reviewCount": String(SOCIAL_PROOF.reviewCount),
    "bestRating": "5",
    "worstRating": "1",
  },
  "featureList": [
    "AI Product Research", "Dynamic Pricing Automation", "Inventory Sync",
    "Order Auto-Fulfillment", "SEO Optimization", "Multi-Store Management",
    `${SOCIAL_PROOF.supplierCount} Supplier Integrations`, "Real-Time Analytics",
  ],
};

// ─── HERO ────────────────────────────────────────────────────────────────────
const HeroSection = memo(() => {
  const navigate = useNavigate();
  return (
    <section className="relative py-20 md:py-28 lg:py-36 overflow-hidden" aria-label="Hero">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/10" />
      <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,white,transparent_70%)]" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" aria-hidden="true" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-pulse delay-1000" aria-hidden="true" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge className="px-5 py-2.5 text-sm bg-primary/20 text-foreground border-primary/30 shadow-sm inline-flex items-center gap-2 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            AI-Powered Shopify Automation
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]">
            Run Your Shopify Store
            <span className="block bg-gradient-to-r from-primary via-primary/70 to-primary bg-clip-text text-transparent">
              on Autopilot with AI
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Find winning products, automate pricing &amp; inventory, and grow revenue — all from one
            AI-powered platform. Save <strong className="text-foreground">20+ hours/week</strong> and
            increase margins by up to <strong className="text-foreground">40%</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="px-8 py-6 text-lg font-semibold group shadow-lg shadow-primary/25 hover:shadow-xl transition-all"
              onClick={() => { try { localStorage.setItem('pending_trial','true'); } catch {} navigate('/auth?trial=true'); }}
            >
              <Crown className="w-5 h-5 mr-2" aria-hidden="true" />
              Start Free 14-Day Trial
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-6 text-lg border-2" onClick={() => navigate('/features')}>
              <Play className="w-5 h-5 mr-2" aria-hidden="true" />
              See How It Works
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
            {[
              { icon: CheckCircle2, text: "No credit card required" },
              { icon: CheckCircle2, text: "Setup in 2 minutes" },
              { icon: CheckCircle2, text: "Cancel anytime" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <item.icon className="h-5 w-5 text-success flex-shrink-0" aria-hidden="true" />
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
  <section className="py-12 bg-secondary/30 border-y border-border/40" aria-label="Key metrics">
    <div className="container mx-auto px-4 sm:px-6">
      <p className="text-center text-sm text-muted-foreground mb-8 font-medium uppercase tracking-wider">
        Trusted by {SOCIAL_PROOF.merchantCount} Shopify &amp; e-commerce merchants worldwide
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
        {[
          { value: SOCIAL_PROOF.merchantCount, label: "Active merchants", icon: Users },
          { value: SOCIAL_PROOF.timeSaved, label: "Saved per week", icon: Clock },
          { value: SOCIAL_PROOF.supplierCount, label: "Suppliers connected", icon: Globe },
          { value: SOCIAL_PROOF.rating, label: "Average rating", icon: Star },
        ].map((s, i) => (
          <div key={i} className="text-center space-y-2">
            <s.icon className="h-5 w-5 mx-auto text-primary/60" aria-hidden="true" />
            <div className="text-2xl sm:text-3xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── PROBLEM ─────────────────────────────────────────────────────────────────
const ProblemSection = () => (
  <section className="py-16 lg:py-24" aria-label="The problem we solve">
    <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
      <div className="text-center space-y-4 mb-14">
        <Badge className="px-4 py-2 text-sm bg-destructive/10 text-destructive border-destructive/20">The Problem</Badge>
        <h2 className="text-3xl md:text-4xl font-bold">Running a Shopify store shouldn't feel like a full-time job</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Most Shopify merchants spend 60% of their time on tasks that AI can automate.
        </p>
      </div>
      <div className="grid sm:grid-cols-3 gap-6">
        {[
          { icon: Clock, title: "Time-consuming manual tasks", desc: "Hours spent updating prices, managing inventory across suppliers, and fulfilling orders one by one. That's 20+ hours/week wasted." },
          { icon: Target, title: "Missed revenue opportunities", desc: "No way to spot winning products or optimize pricing before competitors. Trends pass you by while you're stuck in spreadsheets." },
          { icon: BarChart3, title: "Data overwhelm, zero insight", desc: "Too many dashboards, too many numbers, too little actionable intelligence. No clear path to scale profitably." },
        ].map((p, i) => (
          <Card key={i} className="border-destructive/20 bg-destructive/5 hover:shadow-md transition-shadow">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="p-3 rounded-full bg-destructive/10 w-fit mx-auto">
                <p.icon className="h-6 w-6 text-destructive" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-lg">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

// ─── HOW IT WORKS ────────────────────────────────────────────────────────────
const HowItWorksSection = () => {
  const navigate = useNavigate();
  const steps = [
    { num: "01", icon: Zap, title: "Connect Your Store", desc: "Link your Shopify, WooCommerce, or any of 24+ platforms in under 2 minutes. No coding required.", color: "bg-primary" },
    { num: "02", icon: Bot, title: "AI Analyzes & Optimizes", desc: "Our AI scans your catalog, identifies opportunities, and sets up automated pricing, inventory sync, and SEO rules.", color: "bg-accent" },
    { num: "03", icon: TrendingUp, title: "Watch Your Store Grow", desc: "Sit back as AI finds winning products, adjusts prices for maximum margin, and fulfills orders automatically.", color: "bg-success" },
  ];

  return (
    <section className="py-16 lg:py-24 bg-secondary/20" aria-label="How ShopOpti works">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <div className="text-center space-y-4 mb-14">
          <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">How It Works</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">Get started in 3 simple steps</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            From sign-up to autopilot in under 5 minutes. No technical skills needed.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-primary via-accent to-success" aria-hidden="true" />
          {steps.map((step, i) => (
            <div key={i} className="relative text-center space-y-4">
              <div className={`w-14 h-14 rounded-2xl ${step.color} text-primary-foreground flex items-center justify-center mx-auto shadow-lg relative z-10`}>
                <step.icon className="h-7 w-7" aria-hidden="true" />
              </div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Step {step.num}</span>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" className="px-8 py-6 text-lg" onClick={() => navigate('/auth?trial=true')}>
            Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

// ─── SOLUTION / 3 PILLARS ────────────────────────────────────────────────────
const SolutionSection = () => {
  const navigate = useNavigate();
  const pillars = [
    {
      icon: Search, badge: "Find", title: "AI Product Research",
      desc: `Discover winning products across ${SOCIAL_PROOF.supplierCount} suppliers with AI-powered scoring. Instantly identify trending items, reliable suppliers, and high-margin opportunities before your competitors.`,
      features: ["AI product scoring & ranking", "Supplier reliability analysis", "Real-time trend detection", "Profit margin calculator"],
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Bot, badge: "Automate", title: "Full-Store Automation",
      desc: "Put your entire Shopify store on autopilot. Dynamic pricing, inventory sync across suppliers, one-click order fulfillment, and SEO auto-optimization — all powered by AI.",
      features: ["Dynamic pricing AI engine", "Real-time inventory sync", "One-click order fulfillment", "Automated SEO optimization"],
      color: "from-primary to-primary/60",
    },
    {
      icon: LineChart, badge: "Grow", title: "Revenue Growth Engine",
      desc: "Real-time analytics and predictive AI insights to scale faster. Track every metric, forecast trends, automate marketing, and outpace competitors with data-driven decisions.",
      features: ["Real-time revenue dashboards", "AI-powered predictions", "Marketing automation suite", "Competitor price tracking"],
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <section className="py-16 lg:py-24" aria-label="ShopOpti features">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-4 mb-16">
          <Badge className="px-4 py-2 text-sm bg-primary/10 text-primary border-primary/20">The Solution</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">One AI platform. Three superpowers.</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ShopOpti+ is the AI copilot that handles the heavy lifting so you can focus on scaling your Shopify business.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {pillars.map((p, i) => (
            <Card key={i} className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group">
              <CardHeader className="space-y-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${p.color} w-fit`}>
                  <p.icon className="h-7 w-7 text-white" aria-hidden="true" />
                </div>
                <Badge variant="outline" className="w-fit">{p.badge}</Badge>
                <CardTitle className="text-2xl">{p.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">{p.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" aria-hidden="true" />
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

// ─── WHY SHOPOPTI (Trust signals) ────────────────────────────────────────────
const WhyShopOptiSection = () => (
  <section className="py-16 lg:py-24 bg-secondary/20" aria-label="Why choose ShopOpti">
    <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
      <div className="text-center space-y-4 mb-14">
        <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">Why ShopOpti+</Badge>
        <h2 className="text-3xl md:text-4xl font-bold">Built for serious Shopify sellers</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Enterprise-grade technology made accessible to every merchant.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Shield, title: "Enterprise Security", desc: "AES-256 encryption, GDPR compliant, SOC 2 aligned. Your data is always safe." },
          { icon: RefreshCw, title: "Real-Time Sync", desc: "Prices, inventory, and orders sync across all channels in real-time. Never oversell." },
          { icon: Layers, title: `${SOCIAL_PROOF.supplierCount} Integrations`, desc: "AliExpress, Amazon, CJ, Spocket, BigBuy, and 94 more suppliers connected." },
          { icon: HeadphonesIcon, title: "24/7 Priority Support", desc: "Expert e-commerce support team available around the clock on Pro and Ultra plans." },
        ].map((item, i) => (
          <Card key={i} className="text-center hover:shadow-md transition-shadow">
            <CardContent className="pt-6 space-y-3">
              <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto">
                <item.icon className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

// ─── PROOF / TESTIMONIALS ────────────────────────────────────────────────────
const ProofSection = () => (
  <section className="py-16 lg:py-24" aria-label="Customer testimonials">
    <div className="container mx-auto px-4 sm:px-6">
      <div className="text-center space-y-4 mb-12">
        <Badge className="px-4 py-2 bg-warning/15 text-warning border-warning/30">Social Proof</Badge>
        <h2 className="text-3xl md:text-4xl font-bold">Merchants love ShopOpti+</h2>
        <p className="text-lg text-muted-foreground">Join {SOCIAL_PROOF.merchantCount} sellers who scaled their stores with AI automation.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {TESTIMONIALS.map((t, i) => (
          <Card key={i} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 space-y-4">
              <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">{t.metric}</Badge>
              <div className="flex gap-1" aria-label="5 out of 5 stars">
                {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-warning text-warning" aria-hidden="true" />)}
              </div>
              <blockquote className="text-muted-foreground italic leading-relaxed">"{t.quote}"</blockquote>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm" aria-hidden="true">{t.avatar}</div>
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

// ─── INTEGRATIONS ────────────────────────────────────────────────────────────
const IntegrationsSection = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const visiblePlatforms = activeCategory
    ? INTEGRATION_CATEGORIES.find(c => c.label === activeCategory)?.platforms ?? []
    : ALL_PLATFORMS;

  const remaining = TOTAL_INTEGRATIONS - ALL_PLATFORMS.length;

  return (
    <section className="py-16 lg:py-24 bg-secondary/20" aria-label="Integrations">
      <div className="container mx-auto px-4 sm:px-6 text-center">
        <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20 mb-4">Integrations</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Connects with your entire e-commerce stack</h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          {TOTAL_INTEGRATIONS}+ suppliers and 24+ selling platforms, all synced in real time.
        </p>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <Button
            variant={activeCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(null)}
          >
            All
          </Button>
          {INTEGRATION_CATEGORIES.map(cat => (
            <Button
              key={cat.label}
              variant={activeCategory === cat.label ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat.label)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {visiblePlatforms.map((p) => (
            <Badge key={p} variant="outline" className="px-4 py-2.5 text-sm bg-background hover:bg-primary/5 transition-colors">{p}</Badge>
          ))}
          {!activeCategory && (
            <Badge variant="outline" className="px-4 py-2.5 text-sm bg-primary/5 border-primary/30 text-primary font-semibold">
              +{remaining} more
            </Badge>
          )}
        </div>
        <Button variant="outline" className="mt-10" onClick={() => navigate('/integrations')}>
          View All Integrations <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </section>
  );
};

// ─── PRICING PREVIEW (with monthly/annual toggle) ────────────────────────────
const PricingPreviewSection = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);

  const annualSavings = (plan: PlanConfig) => {
    const diff = plan.monthlyPrice - plan.annualPrice;
    return Math.round((diff / plan.monthlyPrice) * 100);
  };

  return (
    <section className="py-16 lg:py-24" aria-label="Pricing plans">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-4 mb-10">
          <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">Pricing</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">Simple, transparent pricing</h2>
          <p className="text-lg text-muted-foreground">Start free for 14 days. No credit card required. Scale as you grow.</p>
        </div>

        {/* Monthly / Annual toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${isAnnual ? 'bg-primary' : 'bg-muted'}`}
            aria-label="Toggle annual billing"
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-background shadow-sm transition-transform ${isAnnual ? 'translate-x-8' : 'translate-x-1'}`} />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
            Annual
            <Badge className="ml-2 bg-success/15 text-success border-success/30 text-xs">Save 20%</Badge>
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((p, i) => {
            const price = isAnnual ? p.annualPrice : p.monthlyPrice;
            return (
              <Card key={i} className={`relative ${p.popular ? 'border-primary border-2 shadow-xl scale-[1.02]' : 'border-2'}`}>
                {p.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground shadow-md">Most Popular</Badge>}
                <CardHeader>
                  <CardTitle className="text-xl">{p.name}</CardTitle>
                  <CardDescription>{p.desc}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">${price}</span>
                    <span className="text-muted-foreground">/mo</span>
                    {isAnnual && (
                      <Badge variant="outline" className="ml-3 text-xs bg-success/10 text-success border-success/30">
                        -{annualSavings(p)}%
                      </Badge>
                    )}
                  </div>
                  {isAnnual && (
                    <p className="text-xs text-muted-foreground">Billed ${price * 12}/year</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2.5 text-sm">
                    {p.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" aria-hidden="true" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={p.popular ? 'default' : 'outline'}
                    onClick={() => navigate(p.contactSales ? '/contact' : '/auth?trial=true')}
                  >
                    {p.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="text-center mt-8">
          <Button variant="link" onClick={() => navigate('/pricing')}>
            Compare all plans in detail <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQSection = () => (
  <section className="py-16 lg:py-24 bg-secondary/20" aria-label="Frequently asked questions">
    <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
      <div className="text-center space-y-4 mb-12">
        <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">FAQ</Badge>
        <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
        <p className="text-lg text-muted-foreground">Everything you need to know about ShopOpti+.</p>
      </div>

      <Accordion type="single" collapsible className="space-y-3">
        {FAQ_DATA.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="bg-background rounded-lg border px-6">
            <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

// ─── FINAL CTA ───────────────────────────────────────────────────────────────
const FinalCTASection = () => {
  const navigate = useNavigate();
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-primary to-primary-dark text-primary-foreground" aria-label="Call to action">
      <div className="container mx-auto px-4 sm:px-6 text-center max-w-3xl space-y-8">
        <h2 className="text-3xl md:text-5xl font-bold leading-tight">Ready to put your Shopify store on autopilot?</h2>
        <p className="text-lg md:text-xl opacity-90">
          Join {SOCIAL_PROOF.merchantCount} merchants saving {SOCIAL_PROOF.timeSaved}/week and growing revenue 40% faster with ShopOpti+.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button size="lg" variant="secondary" className="px-8 py-6 text-lg font-semibold" onClick={() => navigate('/auth?trial=true')}>
            <Crown className="w-5 h-5 mr-2" aria-hidden="true" /> Start Free 14-Day Trial
          </Button>
          <Button size="lg" variant="outline" className="px-8 py-6 text-lg bg-transparent border-white text-white hover:bg-white/10" onClick={() => navigate('/contact')}>
            <MessageSquare className="w-5 h-5 mr-2" aria-hidden="true" /> Talk to Sales
          </Button>
        </div>
        <p className="text-sm opacity-75">✓ 14-day free trial • ✓ No credit card required • ✓ Cancel anytime</p>
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
        title="ShopOpti+ | AI Shopify Automation – Product Research, Pricing & Inventory"
        description="Run your Shopify store on autopilot with AI. Find winning products across 99+ suppliers, automate dynamic pricing & inventory, and grow revenue 40% faster. Free 14-day trial."
        path="/"
        keywords="shopify automation, AI shopify tool, dropshipping automation, shopify product research, dynamic pricing shopify, shopify inventory management, shopify AI optimization, e-commerce automation platform"
        jsonLd={softwareSchema}
      />
      <OrganizationSchema />
      <SEO title="" description="" jsonLd={faqSchema} />

      <main>
        <HeroSection />
        <SocialProofBar />
        <ProblemSection />
        <HowItWorksSection />
        <SolutionSection />
        <WhyShopOptiSection />
        <ProofSection />
        <IntegrationsSection />
        <PricingPreviewSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <StickyCtaBar />
    </PublicLayout>
  );
};

export default Index;
