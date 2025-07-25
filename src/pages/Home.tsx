import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  CheckCircle, 
  Import, 
  TrendingUp, 
  Users,
  Zap,
  Shield,
  Star,
  Play
} from "lucide-react";
import heroImage from "@/assets/hero-dashboard.jpg";

const Home = () => {
  const features = [
    {
      icon: Import,
      title: "Import Intelligent",
      description: "Importez vos produits depuis AliExpress, Amazon et plus avec notre IA avancée"
    },
    {
      icon: TrendingUp,
      title: "Produits Gagnants",
      description: "Découvrez les tendances et les best-sellers grâce à notre analyse IA"
    },
    {
      icon: Zap,
      title: "Automation Complète",
      description: "Automatisez vos processus de dropshipping de A à Z"
    },
    {
      icon: Shield,
      title: "Sécurité Enterprise",
      description: "Sécurité bancaire avec chiffrement end-to-end et conformité RGPD"
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      role: "E-commerce Manager",
      content: "Shopopti Pro a révolutionné notre processus de dropshipping. +300% de ventes en 3 mois !",
      rating: 5
    },
    {
      name: "Alex D.",
      role: "Founder @ TechStore",
      content: "L'IA de détection des produits gagnants est incroyable. Nos conversions ont explosé.",
      rating: 5
    },
    {
      name: "Marie L.",
      role: "Digital Entrepreneur",
      content: "Interface intuitive et fonctionnalités pro. Exactement ce qu'il nous fallait.",
      rating: 5
    }
  ];

  const plans = [
    {
      name: "Starter",
      price: "29",
      period: "mois",
      description: "Parfait pour commencer",
      features: [
        "1000 produits importés",
        "Suivi basique des colis",
        "SEO IA",
        "Support email"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "79",
      period: "mois",
      description: "Notre plan le plus populaire",
      features: [
        "Produits illimités",
        "Automation complète",
        "Produits gagnants IA",
        "CRM avancé",
        "Support prioritaire",
        "Extension Chrome"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "199",
      period: "mois",
      description: "Pour les équipes",
      features: [
        "Tout du Professional",
        "Multi-collaborateurs",
        "White-label",
        "API personnalisée",
        "Support dédié",
        "Formations personnalisées"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Shopopti Pro
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-smooth">
                Fonctionnalités
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-smooth">
                Prix
              </a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-smooth">
                Témoignages
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost">
                Connexion
              </Button>
              <Button variant="hero">
                Essai Gratuit
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-slide-up">
            <div className="space-y-4">
              <Badge variant="secondary" className="px-3 py-1">
                🚀 Nouvelle génération de dropshipping
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                La plateforme{" "}
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  IA
                </span>{" "}
                qui révolutionne le{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  dropshipping
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Importez, optimisez et vendez vos produits avec l'intelligence artificielle. 
                Rejoignez plus de 10 000 e-commerçants qui font confiance à Shopopti Pro.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="premium" size="lg" className="group">
                Commencer Gratuitement
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" className="group">
                <Play className="mr-2 h-5 w-5" />
                Voir la Démo
              </Button>
            </div>

            <div className="flex items-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>14 jours d'essai gratuit</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Pas de carte bancaire</span>
              </div>
            </div>
          </div>

          <div className="relative animate-float">
            <div className="absolute inset-0 bg-gradient-hero rounded-3xl blur-3xl opacity-20"></div>
            <img 
              src={heroImage} 
              alt="Shopopti Pro Dashboard" 
              className="relative rounded-3xl shadow-2xl border border-border"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Fonctionnalités
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">
              Tout ce dont vous avez besoin pour{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                réussir
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Des outils puissants alimentés par l'IA pour automatiser et optimiser 
              votre business de dropshipping
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-border bg-card shadow-card hover:shadow-glow transition-all duration-300 group animate-slide-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 lg:py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Témoignages
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">
              Ce que disent nos{" "}
              <span className="bg-gradient-accent bg-clip-text text-transparent">
                clients
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index} 
                className="border-border bg-card shadow-card hover:shadow-glow transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <CardDescription className="text-base italic">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Tarification
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">
              Choisissez votre{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                plan
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Des prix transparents pour tous les niveaux. Commencez gratuitement, 
              évoluez quand vous voulez.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`border-border bg-card shadow-card hover:shadow-glow transition-all duration-300 relative animate-slide-up ${
                  plan.popular ? 'ring-2 ring-primary shadow-glow' : ''
                }`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {plan.popular && (
                  <Badge 
                    variant="default" 
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                  >
                    Le plus populaire
                  </Badge>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">{plan.price}€</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant={plan.popular ? "premium" : "outline"} 
                    className="w-full mt-6"
                    size="lg"
                  >
                    {plan.popular ? "Commencer maintenant" : "Choisir ce plan"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-5xl font-bold">
              Prêt à transformer votre{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                dropshipping ?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Rejoignez des milliers d'entrepreneurs qui ont déjà fait le choix de l'innovation
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="premium" size="lg" className="group">
                Commencer Gratuitement
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg">
                Contacter l'équipe
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Shopopti Pro
                </span>
              </div>
              <p className="text-muted-foreground">
                La plateforme IA qui révolutionne le dropshipping
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-smooth">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Tarification</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-smooth">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Guides</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-smooth">À propos</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Carrières</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 Shopopti Pro. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;