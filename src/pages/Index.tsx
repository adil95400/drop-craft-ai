import { useLightAuth } from "@/contexts/LightAuthContext";
import { Helmet } from 'react-helmet-async';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Crown, Zap, Users, Star, ArrowRight, TrendingUp, Shield, Globe, CheckCircle2, Package, ShoppingCart, BarChart3, Sparkles, Clock, MessageSquare, DollarSign, Settings, Rocket, Target } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { SoftwareAppSchema, OrganizationSchema } from "@/components/seo/StructuredData";
import { StickyCtaBar } from "@/components/landing/StickyCtaBar";
import { LiveDemoPreview } from "@/components/landing/LiveDemoPreview";
import { TestimonialsWithPhotos } from "@/components/landing/TestimonialsWithPhotos";
import { InteractiveDemo } from "@/components/landing/InteractiveDemo";
import { TrustedBySection } from "@/components/landing/TrustedBySection";
import { memo, useEffect } from "react";
import logoPng from "@/assets/logo-shopopti.png";

// Hero images in public folder for LCP discovery
const heroImage = "/images/hero-automation.jpg";
const heroImageSm = "/images/hero-automation-sm.jpg";
import featureAI from "@/assets/feature-ai.jpg";
import featureAISm from "@/assets/feature-ai-sm.jpg";
import featureIntegration from "@/assets/feature-integration.jpg";
import featureIntegrationSm from "@/assets/feature-integration-sm.jpg";
import featureAnalytics from "@/assets/feature-analytics.jpg";
import featureAnalyticsSm from "@/assets/feature-analytics-sm.jpg";

// Hero Section - Optimized with memo and improved animations
const HeroSection = memo(() => {
  const navigate = useNavigate();
  
  return (
    <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden">
      {/* Enhanced gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-secondary/10" />
      <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,white,transparent_70%)]" />
      
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/15 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Logo + Badge */}
            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4">
              <img 
                src={logoPng} 
                alt="ShopOpti+" 
                className="h-14 w-14 sm:h-16 sm:w-16 object-contain drop-shadow-lg"
                width={64}
                height={64}
                loading="eager"
              />
              <Badge className="px-5 py-2.5 text-sm bg-primary/20 text-foreground border-primary/30 shadow-sm inline-flex items-center gap-2 backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                La plateforme n°1 du dropshipping intelligent
              </Badge>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              Automatisez votre
              <span className="block bg-gradient-to-r from-primary via-primary/70 to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                e-commerce avec l'IA
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
              Importez des produits de <strong className="text-foreground">99+ fournisseurs</strong> internationaux, 
              automatisez votre gestion et développez votre business avec notre plateforme SaaS propulsée par l'IA.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="px-8 py-6 text-lg font-semibold group shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300" 
                onClick={() => {
                  try { localStorage.setItem('pending_trial', 'true'); } catch {}
                  navigate('/auth?trial=true');
                }}
              >
                <Crown className="w-5 h-5 mr-2" />
                Essai gratuit 14 jours
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-6 text-lg border-2 hover:bg-secondary/50 transition-all duration-300" 
                onClick={() => navigate('/features')}
              >
                Voir la démo
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-6">
              {[
                { icon: CheckCircle2, text: "14 jours gratuits" },
                { icon: CheckCircle2, text: "Installation en 2 min" },
                { icon: CheckCircle2, text: "Support 24/7" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="h-5 w-5 text-success flex-shrink-0" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right Image - Enhanced with better shadows and floating elements */}
          <div className="relative order-last">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-border/50 bg-gradient-to-br from-background to-secondary/20">
              <img 
                src={heroImageSm} 
                srcSet={`${heroImageSm} 640w, ${heroImage} 1920w`}
                alt="Dashboard e-commerce automatisé avec gestion produits et analytics" 
                className="w-full h-auto object-cover"
                width={640}
                height={360}
                loading="eager"
                decoding="async"
                {...({ fetchpriority: "high" } as React.ImgHTMLAttributes<HTMLImageElement>)}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />
            </div>
            
            {/* Floating badges with enhanced styling */}
            <div className="absolute -bottom-6 -left-6 bg-background/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-xl hidden sm:block animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Croissance</div>
                  <div className="text-lg font-bold text-success">+127%</div>
                </div>
              </div>
            </div>
            
            <div className="absolute -top-6 -right-6 bg-background/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-xl hidden sm:block animate-fade-in delay-300">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">IA Active</div>
                  <div className="text-lg font-bold">24/7</div>
                </div>
              </div>
            </div>
            
            {/* New floating element - Integration count */}
            <div className="absolute top-1/2 -left-4 bg-background/95 backdrop-blur-sm border border-border rounded-xl p-3 shadow-xl hidden lg:block animate-fade-in delay-500">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <div className="text-sm font-semibold">99+ fournisseurs</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
HeroSection.displayName = 'HeroSection';

// Stats Section - Beta-appropriate metrics
const StatsSection = () => {
  const stats = [
    { value: "24+", label: "Plateformes supportées", icon: Globe },
    { value: "99+", label: "Fournisseurs connectés", icon: Users },
    { value: "IA", label: "Optimisation intelligente", icon: Sparkles },
    { value: "2025", label: "Lancement officiel", icon: Rocket },
  ];
  
  return (
    <section className="py-12 sm:py-16 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center space-y-2">
                <div className="flex justify-center mb-2 sm:mb-3">
                  <div className="p-2 sm:p-3 bg-primary/10 rounded-full">
                    <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// Features Section with Images
const FeaturesSection = () => {
  const navigate = useNavigate()
  
  const features = [
    {
      icon: Sparkles,
      title: "IA d'optimisation",
      description: "Optimisez automatiquement vos prix, descriptions produits et SEO grâce à l'intelligence artificielle avancée.",
      image: featureAISm,
      imageLarge: featureAI,
      color: "from-purple-500 to-pink-500",
      link: "/features/ai-optimization"
    },
    {
      icon: Globe,
      title: "Multi-marketplace",
      description: "Gérez Shopify, WooCommerce, PrestaShop et plus depuis une seule plateforme centralisée.",
      image: featureIntegrationSm,
      imageLarge: featureIntegration,
      color: "from-blue-500 to-cyan-500",
      link: "/features/multi-marketplace"
    },
    {
      icon: BarChart3,
      title: "Analytics avancés",
      description: "Tableaux de bord en temps réel avec insights business et prévisions de ventes powered by AI.",
      image: featureAnalyticsSm,
      imageLarge: featureAnalytics,
      color: "from-green-500 to-emerald-500",
      link: "/features/analytics"
    }
  ];
  
  const otherFeatures = [
    {
      icon: Zap,
      title: "Import automatique",
      description: "Importez des milliers de produits en quelques clics depuis AliExpress, BigBuy, Spocket et plus de 99 fournisseurs.",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: ShoppingCart,
      title: "Gestion commandes",
      description: "Automatisez le traitement des commandes et le tracking avec synchronisation multi-plateformes.",
      color: "from-red-500 to-rose-500"
    },
    {
      icon: Shield,
      title: "Sécurité garantie",
      description: "Protection des données, conformité RGPD et sauvegarde automatique de toutes vos informations.",
      color: "from-indigo-500 to-blue-500"
    }
  ];
  
  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-3 sm:space-y-4 mb-12 sm:mb-16">
          <Badge className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-primary/10 border-primary/20" style={{ color: 'hsl(221 83% 40%)' }}>
            Fonctionnalités
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Tout ce dont vous avez besoin</h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Une suite complète d'outils pour développer votre e-commerce
          </p>
        </div>
        
        {/* Main Features with Images */}
        <div className="space-y-16 sm:space-y-20 mb-12 sm:mb-16">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            const isReversed = index % 2 !== 0;
            return (
              <div key={index} className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${isReversed ? 'lg:grid-flow-dense' : ''}`}>
                <div className={`space-y-4 sm:space-y-6 ${isReversed ? 'lg:col-start-2' : ''}`}>
                  <div className={`p-3 sm:p-4 rounded-xl bg-gradient-to-br ${feature.color} w-fit`}>
                    <IconComponent className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold">{feature.title}</h3>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">{feature.description}</p>
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate(feature.link)}>
                    En savoir plus
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                <div className={`relative ${isReversed ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
                  <div className="relative rounded-xl overflow-hidden shadow-xl border border-border">
                    <img 
                      src={feature.image} 
                      srcSet={`${feature.image} 640w, ${feature.imageLarge} 800w`}
                      alt={`${feature.title} - Interface de ${feature.title.toLowerCase()}`}
                      className="w-full h-auto object-cover"
                      width={640}
                      height={640}
                      loading="lazy"
                      decoding="async"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Other Features */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {otherFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <div className={`p-2.5 sm:p-3 rounded-xl bg-gradient-to-br ${feature.color} w-fit mb-3 sm:mb-4`}>
                    <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm sm:text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// Benefits Section
const BenefitsSection = () => {
  const benefits = [
    {
      icon: Clock,
      title: "Gagnez du temps",
      description: "Automatisez vos tâches répétitives et concentrez-vous sur la croissance de votre business. Économisez jusqu'à 20h par semaine."
    },
    {
      icon: DollarSign,
      title: "Augmentez vos revenus",
      description: "Optimisation des prix par IA, suggestions de produits gagnants et stratégies de pricing dynamiques pour maximiser vos profits."
    },
    {
      icon: Target,
      title: "Réduisez les erreurs",
      description: "Synchronisation automatique des stocks, prix et commandes entre toutes vos plateformes. Zéro erreur manuelle."
    },
    {
      icon: Rocket,
      title: "Scalez rapidement",
      description: "Infrastructure cloud qui s'adapte à votre croissance. De 10 à 10 000 commandes par jour sans limite technique."
    }
  ];
  
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-3 sm:space-y-4 mb-12 sm:mb-16">
          <Badge className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-success/15 text-success border-success/30">
            Avantages
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Pourquoi ShopOpti+ ?</h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Rejoignez les entrepreneurs qui ont transformé leur e-commerce
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div key={index} className="flex gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  <div className="p-2.5 sm:p-3 bg-primary/10 rounded-lg">
                    <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <h3 className="text-lg sm:text-xl font-semibold">{benefit.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// Use Cases Section
const UseCasesSection = () => {
  const useCases = [
    {
      title: "Débutant en dropshipping",
      description: "Lancez votre boutique en ligne en quelques heures avec nos templates et guides étape par étape.",
      features: ["Templates prêts à l'emploi", "Formation incluse", "Support dédié"]
    },
    {
      title: "E-commerçant confirmé",
      description: "Automatisez votre gestion et connectez toutes vos plateformes pour gérer efficacement votre croissance.",
      features: ["Automatisation avancée", "Multi-plateformes", "Analytics pro"]
    },
    {
      title: "Agence e-commerce",
      description: "Gérez plusieurs clients depuis un seul dashboard avec notre solution multi-tenant professionnelle.",
      features: ["Multi-tenant", "White label", "API complète"]
    }
  ];
  
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Pour tous les profils</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Que vous débutiez ou soyez expert, nous avons la solution adaptée
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <Card key={index} className="border-2">
              <CardHeader>
                <CardTitle className="text-xl">{useCase.title}</CardTitle>
                <CardDescription className="text-base">{useCase.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {useCase.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// Pricing Preview Section
const PricingPreviewSection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-4 mb-16">
          <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
            Tarifs
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold">Plans adaptés à votre croissance</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Commencez gratuitement et évoluez selon vos besoins
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Starter</CardTitle>
              <CardDescription>Pour débuter</CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold">0€</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>100 produits</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>1 boutique connectée</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Support email</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
                Commencer gratuitement
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-primary border-2 relative">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
              Populaire
            </Badge>
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>Pour scale votre business</CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold">49€</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>10 000 produits</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Boutiques illimitées</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>IA avancée + Analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Support prioritaire 24/7</span>
                </li>
              </ul>
              <Button className="w-full" onClick={() => navigate('/auth')}>
                Essayer 14 jours gratuits
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
              <CardDescription>Solution sur mesure</CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold">Sur devis</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Produits illimités</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Multi-tenant</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>API dédiée</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Account manager dédié</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={() => navigate('/contact')}>
                Nous contacter
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center mt-8">
          <Button variant="link" onClick={() => navigate('/pricing')}>
            Voir tous les détails des tarifs
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

// Testimonials Section
const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "ShopOpti+ a complètement transformé ma façon de gérer mes imports. Je gagne facilement 15h par semaine et mes ventes ont augmenté de 40% !",
      author: "Marie Dupont",
      role: "E-commerçante",
      avatar: "M"
    },
    {
      quote: "L'automatisation des commandes et la synchronisation multi-plateformes sont juste incroyables. Plus d'erreurs, plus de stress. Je recommande à 200% !",
      author: "Thomas Martin",
      role: "Dropshipper Pro",
      avatar: "T"
    },
    {
      quote: "En tant qu'agence, nous gérons 30+ clients sur ShopOpti+. Le multi-tenant et l'API sont parfaits. Support réactif. Excellent investissement.",
      author: "Sophie Laurent",
      role: "CEO - Digital Agency",
      avatar: "S"
    }
  ];
  
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-4 mb-16">
          <Badge className="px-4 py-2 bg-warning/15 text-warning border-warning/30">
            Témoignages
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold">Ils nous font confiance</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez ce que nos utilisateurs disent de ShopOpti+
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
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

// Final CTA Section
const FinalCTASection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-20 bg-gradient-to-br from-primary to-primary-dark text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold">
            Prêt à transformer votre e-commerce ?
          </h2>
          <p className="text-lg md:text-xl opacity-90">
            Rejoignez plus de 15 000 entrepreneurs qui font confiance à ShopOpti+ 
            pour automatiser et développer leur business en ligne.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              variant="secondary"
              className="px-8 py-6 text-lg"
              onClick={() => navigate('/auth')}
            >
              <Crown className="w-5 h-5 mr-2" />
              Commencer gratuitement
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="px-8 py-6 text-lg bg-transparent border-white text-white hover:bg-white/10"
              onClick={() => navigate('/contact')}
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Parler à un expert
            </Button>
          </div>
          <p className="text-sm opacity-75">
            ✓ Essai gratuit 14 jours • ✓ Sans engagement • ✓ Annulation en 1 clic
          </p>
        </div>
      </div>
    </section>
  );
};

// Main Index Component
const Index = () => {
  const { isAuthenticated, isLoading } = useLightAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading while auth is being determined (very fast - local storage check)
  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <PublicLayout>
      <SEO
        title="ShopOpti+ | Plateforme E-commerce IA - Dropshipping Automatisé"
        description="Automatisez votre e-commerce avec ShopOpti+. 99+ fournisseurs, IA avancée, gestion multi-plateformes Shopify, Amazon, eBay. Essai gratuit 14 jours."
        path="/"
        keywords="dropshipping, e-commerce IA, automatisation, SaaS, Shopify, AliExpress, BigBuy, gestion produits, analytics, multichannel"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Qu'est-ce que ShopOpti+ ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "ShopOpti+ est une plateforme SaaS d'automatisation e-commerce propulsée par l'IA, connectant 99+ fournisseurs avec gestion multi-marketplaces."
              }
            },
            {
              "@type": "Question",
              "name": "Combien coûte ShopOpti+ ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "ShopOpti+ propose un plan Starter gratuit, un plan Pro à 29€/mois et un plan Enterprise sur mesure. Essai gratuit de 14 jours inclus."
              }
            },
            {
              "@type": "Question",
              "name": "Quelles plateformes sont supportées ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "ShopOpti+ supporte Shopify, WooCommerce, PrestaShop, Amazon, eBay, Etsy, TikTok Shop et plus de 24 plateformes e-commerce."
              }
            }
          ]
        }}
      />
      <OrganizationSchema />
      <SoftwareAppSchema />

      <main>
        <HeroSection />
        <TrustedBySection />
        <StatsSection />
        <InteractiveDemo />
        <LiveDemoPreview />
        <FeaturesSection />
        <BenefitsSection />
        <UseCasesSection />
        <PricingPreviewSection />
        <TestimonialsWithPhotos />
        <FinalCTASection />
      </main>
      <StickyCtaBar />
    </PublicLayout>
  );
};

export default Index;
