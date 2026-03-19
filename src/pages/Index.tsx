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
import { memo, useEffect } from "react";
import logoPng from "@/assets/logo-shopopti.png";

// ─── FAQ DATA (for SEO schema + UI) ──────────────────────────────────────────
const FAQ_DATA = [
  {
    q: "What is ShopOpti+ and how does it work?",
    a: "ShopOpti+ is an AI-powered Shopify automation platform that helps merchants find winning products, automate pricing, inventory management, and order fulfillment. Connect your store in 2 minutes and let AI handle the heavy lifting while you focus on growth."
  },
  {
    q: "How much time can I save with ShopOpti+?",
    a: "Our merchants save an average of 20+ hours per week by automating repetitive tasks like price updates, inventory syncing, order processing, and SEO optimization. That's over 80 hours per month you can reinvest in growing your business."
  },
  {
    q: "Does ShopOpti+ work with my existing Shopify store?",
    a: "Yes! ShopOpti+ integrates seamlessly with any Shopify store, plus WooCommerce, PrestaShop, and 24+ other platforms. It connects with 99+ suppliers including AliExpress, Amazon, CJ Dropshipping, Spocket, and BigBuy."
  },
  {
    q: "Is there a free trial? Do I need a credit card?",
    a: "Yes, we offer a full-featured 14-day free trial with no credit card required. You get access to all Pro features during your trial so you can experience the full power of ShopOpti+ before committing."
  },
  {
    q: "How does the AI product research work?",
    a: "Our AI analyzes market trends, competitor pricing, supplier reliability, and profit margins across 99+ suppliers to score and rank products. It identifies trending items with high demand and healthy margins, giving you a competitive edge in product selection."
  },
  {
    q: "Can I manage multiple stores with ShopOpti+?",
    a: "Absolutely. Our Pro plan supports unlimited stores, and our Ultra Pro plan includes multi-tenant capabilities perfect for agencies managing 30+ client stores. All stores sync in real-time through a single dashboard."
  },
  {
    q: "What kind of support do you offer?",
    a: "We offer email support on Basic, priority 24/7 support on Pro, and a dedicated account manager on Ultra Pro. All plans include access to our documentation, academy, and help center."
  },
  {
    q: "Is my data secure with ShopOpti+?",
    a: "Yes. We use enterprise-grade encryption (AES-256), GDPR-compliant data handling, and SOC 2-aligned security practices. Your store data and API keys are always encrypted at rest and in transit."
  },
];

// ─── FAQ SCHEMA ──────────────────────────────────────────────────────────────
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": FAQ_DATA.map(faq => ({
    "@type": "Question",
    "name": faq.q,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.a,
    }
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
    "lowPrice": "29",
    "highPrice": "199",
    "priceCurrency": "USD",
    "offerCount": "3"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "247",
    "bestRating": "5",
    "worstRating": "1"
  },
  "featureList": [
    "AI Product Research",
    "Dynamic Pricing Automation",
    "Inventory Sync",
    "Order Auto-Fulfillment",
    "SEO Optimization",
    "Multi-Store Management",
    "99+ Supplier Integrations",
    "Real-Time Analytics"
  ]
};

// ─── HERO ────────────────────────────────────────────────────────────────────
const HeroSection = memo(() => {
  const navigate = useNavigate();
  return (
    <section className="relative py-20 md:py-28 lg:py-36 overflow-hidden" aria-label="Hero">
      {/* Background layers */}
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
        Trusted by 2,000+ Shopify &amp; e-commerce merchants worldwide
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
        {[
          { value: "2,000+", label: "Active merchants", icon: Users },
          { value: "20h+", label: "Saved per week", icon: Clock },
          { value: "99+", label: "Suppliers connected", icon: Globe },
          { value: "4.8/5", label: "Average rating", icon: Star },
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
          {/* Connecting line (desktop) */}
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
      icon: Search,
      badge: "Find",
      title: "AI Product Research",
      desc: "Discover winning products across 99+ suppliers with AI-powered scoring. Instantly identify trending items, reliable suppliers, and high-margin opportunities before your competitors.",
      features: ["AI product scoring & ranking", "Supplier reliability analysis", "Real-time trend detection", "Profit margin calculator"],
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Bot,
      badge: "Automate",
      title: "Full-Store Automation",
      desc: "Put your entire Shopify store on autopilot. Dynamic pricing, inventory sync across suppliers, one-click order fulfillment, and SEO auto-optimization — all powered by AI.",
      features: ["Dynamic pricing AI engine", "Real-time inventory sync", "One-click order fulfillment", "Automated SEO optimization"],
      color: "from-primary to-primary/60",
    },
    {
      icon: LineChart,
      badge: "Grow",
      title: "Revenue Growth Engine",
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
          { icon: Layers, title: "99+ Integrations", desc: "AliExpress, Amazon, CJ, Spocket, BigBuy, and 94 more suppliers connected." },
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
    <section className="py-16 lg:py-24" aria-label="Customer testimonials">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-4 mb-12">
          <Badge className="px-4 py-2 bg-warning/15 text-warning border-warning/30">Social Proof</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">Merchants love ShopOpti+</h2>
          <p className="text-lg text-muted-foreground">Join 2,000+ sellers who scaled their stores with AI automation.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-4">
                <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">{t.metric}</Badge>
                <div className="flex gap-1" aria-label={`5 out of 5 stars`}>
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
    <section className="py-16 lg:py-24 bg-secondary/20" aria-label="Integrations">
      <div className="container mx-auto px-4 sm:px-6 text-center">
        <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20 mb-4">Integrations</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Connects with your entire e-commerce stack</h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
          99+ suppliers and 24+ selling platforms, all synced in real time. One dashboard to rule them all.
        </p>
        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {platforms.map((p) => (
            <Badge key={p} variant="outline" className="px-4 py-2.5 text-sm bg-background hover:bg-primary/5 transition-colors">{p}</Badge>
          ))}
          <Badge variant="outline" className="px-4 py-2.5 text-sm bg-primary/5 border-primary/30 text-primary font-semibold">+87 more</Badge>
        </div>
        <Button variant="outline" className="mt-10" onClick={() => navigate('/integrations')}>
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
    { name: "Basic", price: "$29", period: "/mo", desc: "For new merchants getting started", features: ["500 products", "1 store", "AI optimization", "Email support", "Basic analytics"], cta: "Start Free Trial", popular: false },
    { name: "Pro", price: "$79", period: "/mo", desc: "For growing stores ready to scale", features: ["10,000 products", "Unlimited stores", "Advanced AI + Predictive Analytics", "Priority support 24/7", "Marketing automation", "Competitor tracking"], cta: "Start Free Trial", popular: true },
    { name: "Ultra Pro", price: "$199", period: "/mo", desc: "For power sellers & agencies", features: ["Unlimited products", "Multi-tenant dashboard", "Dedicated REST API", "Account manager", "Custom integrations", "White-label options"], cta: "Contact Sales", popular: false },
  ];

  return (
    <section className="py-16 lg:py-24" aria-label="Pricing plans">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-4 mb-14">
          <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">Pricing</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">Simple, transparent pricing</h2>
          <p className="text-lg text-muted-foreground">Start free for 14 days. No credit card required. Scale as you grow.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p, i) => (
            <Card key={i} className={`relative ${p.popular ? 'border-primary border-2 shadow-xl scale-[1.02]' : 'border-2'}`}>
              {p.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground shadow-md">Most Popular</Badge>}
              <CardHeader>
                <CardTitle className="text-xl">{p.name}</CardTitle>
                <CardDescription>{p.desc}</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className="text-muted-foreground">{p.period}</span>
                </div>
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
                  onClick={() => navigate(p.name === 'Ultra Pro' ? '/contact' : '/auth?trial=true')}
                >
                  {p.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
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
          Join 2,000+ merchants saving 20+ hours/week and growing revenue 40% faster with ShopOpti+.
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

      {/* FAQ Schema for rich snippets */}
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
