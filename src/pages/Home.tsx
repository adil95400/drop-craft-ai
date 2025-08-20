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
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { UserAccountDropdown } from "@/components/common/UserAccountDropdown";

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleGetStarted = () => {
    navigate("/auth");
    toast({
      title: "Bienvenue !",
      description: "Commencez votre aventure e-commerce",
    });
  };

  const features = [
    {
      icon: Zap,
      title: "Intelligence Artificielle",
      description: "Automatisation complète de votre dropshipping avec IA avancée",
      badge: "Nouveau",
      badgeVariant: "secondary" as const
    },
    {
      icon: TrendingUp,
      title: "Analyse Prédictive",
      description: "Identifiez les produits gagnants avant vos concurrents",
      badge: "Pro",
      badgeVariant: "default" as const
    },
    {
      icon: Shield,
      title: "Sécurité Maximale",
      description: "Protection avancée et conformité RGPD garantie",
      badge: "Sécurisé",
      badgeVariant: "default" as const
    },
    {
      icon: Rocket,
      title: "Performance Ultra",
      description: "Vitesse d'exécution 10x plus rapide que la concurrence",
      badge: "Ultra",
      badgeVariant: "secondary" as const
    }
  ];

  const stats = [
    { icon: Users, value: "10K+", label: "Utilisateurs Actifs" },
    { icon: Package, value: "500K+", label: "Produits Analysés" },
    { icon: BarChart3, value: "€2.5M+", label: "CA Généré" },
    { icon: Star, value: "4.9/5", label: "Satisfaction Client" }
  ];

  const testimonials = [
    {
      name: "Marie Dubois",
      role: "E-commerçante",
      rating: 5,
      comment: "Shopopti Pro a révolutionné mon business. +300% de CA en 6 mois !",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b332c2cc?w=64&h=64&fit=crop&crop=face"
    },
    {
      name: "Thomas Martin",
      role: "Dropshipper",
      rating: 5,
      comment: "L'IA de Shopopti trouve les produits gagnants automatiquement. Incroyable !",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face"
    },
    {
      name: "Sophie Laurent",
      role: "Marketplace Seller",
      rating: 5,
      comment: "Interface intuitive et résultats exceptionnels. Je recommande !",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation - Only for authenticated users */}
      {user && (
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Shopopti Pro
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <UserAccountDropdown />
            </div>
          </div>
        </header>
      )}

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="mb-6">
            <Badge variant="secondary" className="mb-4 px-4 py-2">
              <Crown className="w-4 h-4 mr-2" />
              Plateforme N°1 en France
            </Badge>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Shopopti Pro
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
            La première plateforme de <span className="text-primary font-semibold">dropshipping intelligent</span>
          </p>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Automatisez votre e-commerce avec l'intelligence artificielle. 
            Trouvez les produits gagnants, optimisez vos ventes et maximisez vos profits.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-primary to-primary-glow text-lg px-8 py-6 h-auto shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <Rocket className="mr-2 h-5 w-5" />
              Commencer Gratuitement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/demo")}
              className="text-lg px-8 py-6 h-auto border-2 hover:bg-primary/10"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Voir la Démo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Fonctionnalités <span className="text-primary">Révolutionnaires</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Découvrez les outils qui propulsent votre business e-commerce vers de nouveaux sommets
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-border bg-card shadow-card hover:shadow-lg transition-all duration-300 group">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant={feature.badgeVariant}>{feature.badge}</Badge>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Ce que disent nos <span className="text-primary">clients</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Plus de 10 000 entrepreneurs nous font confiance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border bg-card shadow-card">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground italic">"{testimonial.comment}"</p>
                </CardContent>
              </Card>
            ))}
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
  );
};

export default Home;