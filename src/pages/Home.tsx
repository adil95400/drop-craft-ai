import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  TrendingUp, 
  Shield, 
  Rocket, 
  BarChart3, 
  Users, 
  Package,
  ArrowRight,
  Star,
  CheckCircle,
  Crown,
  Sparkles,
  Play,
  Menu,
  X,
  Award,
  Target,
  Briefcase,
  Globe
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { UserAccountDropdown } from "@/components/common/UserAccountDropdown";
import { SEO } from "@/components/SEO";
import { useCanvaOptimization } from "@/hooks/useCanvaOptimization";
import { useEffect, useState } from "react";

// Import generated assets
import shopOptimizeLogo from "@/assets/shopopti-logo.png";
import heroBackground from "@/assets/hero-background.jpg";
import dashboardPreview from "@/assets/dashboard-preview.jpg";
import demoVideoThumbnail from "@/assets/demo-video-thumbnail.jpg";
import productsShowcase from "@/assets/products-showcase.jpg";
import aiIntelligenceIcon from "@/assets/ai-intelligence-icon.png";

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { optimizeFullPage, isOptimizing } = useCanvaOptimization();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGetStarted = () => {
    navigate("/auth");
    toast({
      title: "Bienvenue !",
      description: "Commencez votre aventure e-commerce",
    });
  };

  const handleVideoPlay = () => {
    // This would open a video modal or navigate to demo page
    navigate("/demo");
    toast({
      title: "Démo Vidéo",
      description: "Découvrez toutes les fonctionnalités de Shopopti Pro",
    });
  };

  // Optimisation automatique de la page d'accueil avec Canva
  useEffect(() => {
    const optimizeHomePage = async () => {
      const pageData = {
        hero: {
          title: "Transformez votre E-commerce avec l'IA",
          subtitle: "Découvrez, importez et vendez les produits gagnants",
          cta: "Démarrer Gratuitement"
        },
        features: features.map(f => ({
          title: f.title,
          description: f.description,
          icon: f.icon.name
        })),
        testimonials: testimonials,
        stats: stats
      };

      const brandColors = {
        primary: "#3b82f6", // Couleur primaire de notre design
        secondary: "#8b5cf6"
      };

      // Optimiser la page complète avec Canva (en arrière-plan)
      optimizeFullPage(pageData, brandColors);
    };

    // Lancer l'optimisation après un court délai pour ne pas affecter le chargement initial
    const timer = setTimeout(optimizeHomePage, 2000);
    return () => clearTimeout(timer);
  }, [optimizeFullPage]);

  const features = [
    {
      icon: Zap,
      title: "Intelligence Artificielle Avancée",
      description: "Automatisation complète de votre dropshipping avec IA de dernière génération et machine learning",
      badge: "IA",
      badgeVariant: "secondary" as const,
      image: aiIntelligenceIcon
    },
    {
      icon: TrendingUp,
      title: "Analyse Prédictive de Marché",
      description: "Identifiez les produits gagnants avant vos concurrents grâce à notre algorithme propriétaire",
      badge: "Pro",
      badgeVariant: "default" as const,
      image: null
    },
    {
      icon: Shield,
      title: "Sécurité Entreprise",
      description: "Protection maximale avec chiffrement AES-256, conformité RGPD et audits de sécurité réguliers",
      badge: "Sécurisé",
      badgeVariant: "default" as const,
      image: null
    },
    {
      icon: Rocket,
      title: "Performance Quantique",
      description: "Infrastructure cloud premium avec API ultra-rapide et temps de réponse < 100ms",
      badge: "Ultra",
      badgeVariant: "secondary" as const,
      image: null
    },
    {
      icon: Target,
      title: "Optimisation ROI",
      description: "Maximisez vos profits avec des recommandations personnalisées et une analyse en temps réel",
      badge: "ROI+",
      badgeVariant: "default" as const,
      image: null
    },
    {
      icon: Globe,
      title: "Expansion Internationale",
      description: "Vendez dans 50+ pays avec gestion automatique des devises, taxes et réglementations",
      badge: "Mondial",
      badgeVariant: "secondary" as const,
      image: null
    }
  ];

  const stats = [
    { icon: Users, value: "25K+", label: "Entrepreneurs Actifs", growth: "+15%" },
    { icon: Package, value: "2M+", label: "Produits Analysés", growth: "+22%" },
    { icon: BarChart3, value: "€15M+", label: "CA Généré", growth: "+45%" },
    { icon: Star, value: "4.9/5", label: "Satisfaction Client", growth: "Excellent" }
  ];

  const achievements = [
    { icon: Award, value: "Prix SaaS 2024", label: "Meilleure Innovation" },
    { icon: Briefcase, value: "500+ Entreprises", label: "Nous Font Confiance" },
    { icon: Crown, value: "N°1 France", label: "Dropshipping IA" },
    { icon: Rocket, value: "99.9%", label: "Uptime Garanti" }
  ];

  const testimonials = [
    {
      name: "Marie Dubois",
      role: "CEO • E-commerce Premium",
      rating: 5,
      comment: "Shopopti Pro a révolutionné notre business model. ROI de +400% en seulement 8 mois. L'IA prédit parfaitement les tendances !",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b332c2cc?w=64&h=64&fit=crop&crop=face",
      results: "+400% ROI"
    },
    {
      name: "Thomas Martin",
      role: "Dropshipper • Scale-Up Expert",
      rating: 5,
      comment: "L'intelligence artificielle de Shopopti dépasse toutes mes attentes. Automatisation totale et produits gagnants identifiés en temps réel !",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
      results: "10x Automation"
    },
    {
      name: "Sophie Laurent",
      role: "Directrice Marketing • Scale Solutions",
      rating: 5,
      comment: "Interface révolutionnaire et analytics avancées. Notre équipe a multiplié sa productivité par 5 avec Shopopti Pro !",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face",
      results: "5x Productivité"
    }
  ];

  return (
    <>
      <SEO
        title="Shopopti+ | SaaS de Dropshipping Intelligent"
        description="Automatisez votre business e-commerce avec Shopopti+. Intégrations Shopify, AliExpress, BigBuy et IA pour gérer vos produits et commandes."
        path="/"
        keywords="Shopopti, dropshipping, Shopify, AliExpress, BigBuy, IA, import produits"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Shopopti+",
          "url": "https://www.shopopti.io",
          "logo": "https://www.shopopti.io/og-image.png",
          "sameAs": [
            "https://github.com/adil95400",
            "https://www.linkedin.com/"
          ]
        }}
      />
      
      <div className="min-h-screen bg-background">
        {/* Modern Header Navigation */}
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={shopOptimizeLogo} 
                alt="Shopopti Pro Logo" 
                className="w-10 h-10 object-contain"
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Shopopti Pro
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="/features" className="text-muted-foreground hover:text-primary transition-colors">Fonctionnalités</a>
              <a href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">Tarifs</a>
              <a href="/testimonials" className="text-muted-foreground hover:text-primary transition-colors">Témoignages</a>
              <a href="/about" className="text-muted-foreground hover:text-primary transition-colors">À propos</a>
            </nav>
            
            <div className="flex items-center gap-4">
              {user ? (
                <UserAccountDropdown />
              ) : (
                <>
                  <Button 
                    variant="ghost"
                    onClick={() => navigate("/auth")}
                    className="hidden sm:inline-flex"
                  >
                    Connexion
                  </Button>
                  <Button 
                    onClick={handleGetStarted}
                    className="bg-gradient-primary text-white shadow-lg hover:shadow-xl"
                  >
                    Essai Gratuit
                  </Button>
                </>
              )}
              
              {/* Mobile Menu Button */}
              <Button
                variant="ghost" 
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
              <nav className="px-6 py-4 space-y-3">
                <a href="/features" className="block py-2 text-muted-foreground hover:text-primary transition-colors">Fonctionnalités</a>
                <a href="/pricing" className="block py-2 text-muted-foreground hover:text-primary transition-colors">Tarifs</a>
                <a href="/testimonials" className="block py-2 text-muted-foreground hover:text-primary transition-colors">Témoignages</a>
                <a href="/about" className="block py-2 text-muted-foreground hover:text-primary transition-colors">À propos</a>
                <div className="pt-3 border-t border-border">
                  <Button 
                    onClick={handleGetStarted}
                    className="w-full bg-gradient-primary text-white"
                  >
                    Commencer Gratuitement
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </header>

        {/* Enhanced Hero Section with Background */}
        <section 
          className="relative py-32 px-6 overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05)), url(${heroBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background/80 to-accent/20" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          
          <div className="relative max-w-7xl mx-auto text-center">
            <div className="mb-8 animate-slide-up">
              <Badge variant="secondary" className="mb-6 px-6 py-3 text-base shadow-lg">
                <Crown className="w-5 h-5 mr-3" />
                🏆 Plateforme N°1 en France • +25K Utilisateurs
              </Badge>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent animate-slide-up">
              Shopopti Pro
            </h1>
            
            <p className="text-2xl md:text-3xl text-foreground mb-6 max-w-4xl mx-auto font-medium animate-slide-up">
              La première plateforme de <span className="text-primary font-bold">dropshipping intelligent</span>
            </p>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up">
              Révolutionnez votre e-commerce avec l'intelligence artificielle avancée. 
              Automatisation complète, produits gagnants identifiés en temps réel, profits maximisés.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16 animate-slide-up">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-gradient-primary text-white text-xl px-12 py-8 h-auto shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
              >
                <Rocket className="mr-3 h-6 w-6" />
                Démarrer Gratuitement
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleVideoPlay}
                className="text-xl px-12 py-8 h-auto border-2 border-primary/30 bg-background/50 backdrop-blur-sm hover:bg-primary/10 transition-all duration-300"
              >
                <Play className="mr-3 h-6 w-6" />
                Voir la Démo Live
              </Button>
            </div>

            {/* Enhanced Stats with Growth Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto animate-slide-up">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mb-2">{stat.label}</div>
                  <Badge variant="secondary" className="text-xs bg-success/10 text-success border-success/20">
                    {stat.growth}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Video/Demo Section */}
        <section className="py-24 px-6 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-6">
                Découvrez Shopopti Pro <span className="text-primary">en Action</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Regardez comment notre plateforme révolutionne le dropshipping avec l'IA
              </p>
            </div>

            <div className="relative max-w-6xl mx-auto">
              <div 
                className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl cursor-pointer group"
                onClick={handleVideoPlay}
              >
                <img 
                  src={demoVideoThumbnail} 
                  alt="Démonstration Shopopti Pro"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-primary/90 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-10 h-10 text-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-6 left-6">
                  <Badge className="bg-primary text-white px-4 py-2 text-base">
                    ▶ Démonstration Complète • 3:42
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="animate-slide-in">
                <Badge variant="secondary" className="mb-6 px-4 py-2">
                  Interface Révolutionnaire
                </Badge>
                <h2 className="text-5xl font-bold mb-8">
                  Dashboard <span className="text-primary">Ultra-Intuitif</span>
                </h2>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  Gérez votre empire e-commerce depuis une interface moderne et puissante. 
                  Analytics en temps réel, automatisations IA, et contrôle total sur vos opérations.
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                    <span className="text-lg">Analytics avancées avec prédictions IA</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                    <span className="text-lg">Automatisation complète des tâches</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                    <span className="text-lg">Interface responsive multi-plateforme</span>
                  </div>
                </div>
                <Button 
                  size="lg"
                  onClick={() => navigate("/demo")}
                  className="bg-gradient-primary text-white px-8 py-6 text-lg shadow-xl hover:shadow-2xl"
                >
                  Explorer l'Interface
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
              
              <div className="relative">
                <img 
                  src={dashboardPreview} 
                  alt="Aperçu du Dashboard Shopopti Pro"
                  className="w-full rounded-2xl shadow-2xl hover:shadow-3xl transition-shadow duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-2xl" />
              </div>
            </div>
          </div>
        </section>

        {/* Products Showcase Section */}
        <section className="py-24 px-6 bg-muted/20">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                <img 
                  src={productsShowcase} 
                  alt="Catalogue de produits gagnants"
                  className="w-full rounded-2xl shadow-2xl hover:shadow-3xl transition-shadow duration-500"
                />
              </div>
              
              <div className="order-1 lg:order-2 animate-slide-in">
                <Badge variant="secondary" className="mb-6 px-4 py-2">
                  Catalogue Premium
                </Badge>
                <h2 className="text-5xl font-bold mb-8">
                  +2M Produits <span className="text-primary">Gagnants</span>
                </h2>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  Accédez au plus grand catalogue de produits e-commerce analysés par notre IA. 
                  Chaque produit est évalué pour son potentiel de profit et sa viralité.
                </p>
                
                {/* Achievements Grid */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="text-center p-4 bg-background/50 rounded-xl border border-border/50">
                      <achievement.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                      <div className="font-bold text-lg">{achievement.value}</div>
                      <div className="text-sm text-muted-foreground">{achievement.label}</div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  size="lg"
                  onClick={() => navigate("/catalog")}
                  className="bg-gradient-primary text-white px-8 py-6 text-lg shadow-xl hover:shadow-2xl"
                >
                  Explorer le Catalogue
                  <Package className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Features Section */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <Badge variant="secondary" className="mb-6 px-4 py-2">
                Technologie Avancée
              </Badge>
              <h2 className="text-5xl md:text-6xl font-bold mb-8">
                Fonctionnalités <span className="text-primary">Révolutionnaires</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Découvrez l'écosystème complet qui propulse votre business e-commerce 
                vers de nouveaux sommets avec l'intelligence artificielle
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm shadow-card hover:shadow-intense transition-all duration-500 group relative overflow-hidden">
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <CardHeader className="relative pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="relative">
                        {feature.image ? (
                          <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg">
                            <img 
                              src={feature.image} 
                              alt={feature.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-glow group-hover:scale-110 transition-all duration-500">
                            <feature.icon className="h-8 w-8 text-white" />
                          </div>
                        )}
                        <div className="absolute -top-2 -right-2">
                          <Badge variant={feature.badgeVariant} className="text-xs font-bold shadow-md">
                            {feature.badge}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <CardDescription className="text-base leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                      {feature.description}
                    </CardDescription>
                    
                    {/* Hover arrow indicator */}
                    <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ArrowRight className="h-5 w-5 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Testimonials Section */}
        <section className="py-32 px-6 bg-muted/10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <Badge variant="secondary" className="mb-6 px-4 py-2">
                Témoignages Clients
              </Badge>
              <h2 className="text-5xl md:text-6xl font-bold mb-8">
                Success Stories <span className="text-primary">Exceptionnelles</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Plus de 25 000 entrepreneurs font confiance à Shopopti Pro pour transformer leur business
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-border/50 bg-card/80 backdrop-blur-sm shadow-card hover:shadow-intense transition-all duration-500 group relative overflow-hidden">
                  {/* Background gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img 
                            src={testimonial.avatar} 
                            alt={testimonial.name}
                            className="w-16 h-16 rounded-full object-cover shadow-lg ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300"
                          />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full flex items-center justify-center shadow-md">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-lg">{testimonial.name}</div>
                          <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                        </div>
                      </div>
                      
                      <Badge className="bg-success/10 text-success border-success/20 font-bold whitespace-nowrap">
                        {testimonial.results}
                      </Badge>
                    </div>
                    
                    {/* Rating stars */}
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="relative">
                    <blockquote className="text-lg leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors duration-300 italic">
                      "{testimonial.comment}"
                    </blockquote>
                    
                    {/* Quote decoration */}
                    <div className="absolute top-0 left-0 text-6xl text-primary/20 font-serif -translate-x-2 -translate-y-4">
                      "
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Additional trust indicators */}
            <div className="mt-20 text-center">
              <div className="flex flex-wrap justify-center items-center gap-8 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold">4.9/5 sur Trustpilot</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Prix SaaS France 2024</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-success" />
                  <span className="font-semibold">Certifié ISO 27001</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary/10 via-background to-accent/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Prêt à <span className="text-primary">révolutionner</span> votre e-commerce ?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Rejoignez les milliers d'entrepreneurs qui utilisent Shopopti Pro pour automatiser 
            et optimiser leur business en ligne.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-primary to-primary-glow text-lg px-8 py-6 h-auto shadow-xl hover:shadow-2xl"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Démarrer Maintenant
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/contact")}
              className="text-lg px-8 py-6 h-auto border-2"
            >
              Nous Contacter
            </Button>
          </div>

          <div className="mt-8 text-sm text-muted-foreground">
            ✓ Essai gratuit de 14 jours • ✓ Aucun engagement • ✓ Support 24/7
          </div>
        </div>
      </section>
    </div>
    </>
  );
};

export default Home;