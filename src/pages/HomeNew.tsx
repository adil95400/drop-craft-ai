import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, ShoppingCart, BarChart3, Zap, Shield, Globe, Star, CheckCircle, Play, Users, Target, Rocket, Crown, Sparkles, Bot, LineChart, Package, Truck, MessageSquare, Settings, CreditCard, Search } from "lucide-react";
import heroImage from "/lovable-uploads/aa11c615-9c0c-4dbf-b691-586cf4f9c53a.png";
const HomeNew = () => {
  const features = [{
    icon: <Bot className="w-8 h-8" />,
    title: "IA Avancée",
    description: "Intelligence artificielle pour optimiser vos produits gagnants automatiquement",
    badge: "NOUVEAU",
    color: "bg-gradient-primary"
  }, {
    icon: <TrendingUp className="w-8 h-8" />,
    title: "Produits Gagnants",
    description: "Découvrez les produits tendances avec notre algorithme exclusif",
    badge: "POPULAIRE",
    color: "bg-gradient-accent"
  }, {
    icon: <Zap className="w-8 h-8" />,
    title: "Import Ultra-Rapide",
    description: "Importez vos produits en 1 clic depuis 50+ fournisseurs",
    badge: "ULTRA PRO",
    color: "bg-gradient-success"
  }, {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "Analytics Temps Réel",
    description: "Tableaux de bord avancés pour maximiser vos profits",
    badge: "PRO",
    color: "bg-gradient-hero"
  }, {
    icon: <Shield className="w-8 h-8" />,
    title: "Sécurité Renforcée",
    description: "Protection avancée de vos données et transactions",
    badge: "SÉCURISÉ",
    color: "bg-gradient-soft"
  }, {
    icon: <Globe className="w-8 h-8" />,
    title: "Multi-Marketplace",
    description: "Synchronisation avec Shopify, WooCommerce, Ebay et plus",
    badge: "INTÉGRÉ",
    color: "bg-gradient-primary"
  }];
  const stats = [{
    icon: <Users className="w-6 h-6" />,
    value: "50,000+",
    label: "Utilisateurs Actifs"
  }, {
    icon: <Package className="w-6 h-6" />,
    value: "2M+",
    label: "Produits Analysés"
  }, {
    icon: <TrendingUp className="w-6 h-6" />,
    value: "95%",
    label: "Taux de Réussite"
  }, {
    icon: <Target className="w-6 h-6" />,
    value: "24/7",
    label: "Support Premium"
  }];
  const testimonials = [{
    name: "Marie Dubois",
    role: "E-commercante",
    rating: 5,
    comment: "ShopOpti a révolutionné mon business ! J'ai augmenté mes ventes de 300% en 3 mois.",
    avatar: "MD"
  }, {
    name: "Alex Martin",
    role: "Dropshipper Pro",
    rating: 5,
    comment: "L'IA de ShopOpti trouve les produits gagnants que mes concurrents ratent. Incroyable !",
    avatar: "AM"
  }, {
    name: "Sophie Leroy",
    role: "Entrepreneur",
    rating: 5,
    comment: "Interface intuitive, outils puissants. Exactement ce dont j'avais besoin !",
    avatar: "SL"
  }];
  const plans = [{
    name: "Starter",
    price: "29€",
    period: "/mois",
    description: "Parfait pour débuter",
    features: ["100 produits analysés/mois", "Support par email", "Intégrations de base", "Analytics basiques"],
    badge: "POPULAIRE",
    buttonText: "Commencer",
    buttonVariant: "outline" as const
  }, {
    name: "Pro",
    price: "79€",
    period: "/mois",
    description: "Pour les e-commerçants sérieux",
    features: ["Produits illimités", "IA avancée", "Support prioritaire", "Analytics Pro", "Toutes les intégrations", "Formation incluse"],
    badge: "RECOMMANDÉ",
    buttonText: "Choisir Pro",
    buttonVariant: "default" as const,
    featured: true
  }, {
    name: "Ultra Pro",
    price: "199€",
    period: "/mois",
    description: "Solution enterprise complète",
    features: ["Tout du plan Pro", "IA personnalisée", "Account manager dédié", "API complète", "White label", "Formations VIP"],
    badge: "PREMIUM",
    buttonText: "Contactez-nous",
    buttonVariant: "outline" as const
  }];
  const tools = [{
    icon: <Search className="w-5 h-5" />,
    name: "Recherche Produits",
    path: "/catalogue"
  }, {
    icon: <Package className="w-5 h-5" />,
    name: "Import Produits",
    path: "/import"
  }, {
    icon: <ShoppingCart className="w-5 h-5" />,
    name: "Gestion Commandes",
    path: "/orders"
  }, {
    icon: <BarChart3 className="w-5 h-5" />,
    name: "Analytics",
    path: "/analytics"
  }, {
    icon: <Truck className="w-5 h-5" />,
    name: "Suivi Livraisons",
    path: "/tracking"
  }, {
    icon: <MessageSquare className="w-5 h-5" />,
    name: "Avis Clients",
    path: "/reviews"
  }, {
    icon: <Settings className="w-5 h-5" />,
    name: "Automatisation",
    path: "/automation"
  }, {
    icon: <CreditCard className="w-5 h-5" />,
    name: "Paiements",
    path: "/payments"
  }];
  return <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-slate-50">
                ShopOpti
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">
                Fonctionnalités
              </Link>
              <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Tarifs
              </Link>
              <Link to="/testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
                Témoignages
              </Link>
              <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/auth">
                <Button variant="ghost">Connexion</Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-primary hover:bg-primary-hover">
                  Commencer
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 animate-pulse-glow">
              <Crown className="w-4 h-4 mr-2" />
              Plateforme #1 du Dropshipping en France
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              Transformez votre{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                E-commerce
              </span>{" "}
              avec l'IA
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Découvrez, importez et vendez les produits gagnants grâce à notre intelligence artificielle avancée. 
              Rejoignez 50,000+ e-commerçants qui font confiance à ShopOpti.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover shadow-glow text-lg px-8 py-4">
                  <Rocket className="w-5 h-5 mr-2" />
                  Démarrer Gratuitement
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                <Play className="w-5 h-5 mr-2" />
                Voir la Démo
              </Button>
            </div>

            {/* Hero Image */}
            <div className="relative max-w-5xl mx-auto">
              <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-3xl" />
              <img src={heroImage} alt="Dashboard ShopOpti" className="relative z-10 w-full rounded-3xl shadow-floating border border-border/50" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => <div key={index} className="text-center">
                <div className="flex justify-center mb-4 text-primary">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
              <Sparkles className="w-4 h-4 mr-2" />
              Fonctionnalités Avancées
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Tout ce dont vous avez besoin pour{" "}
              <span className="bg-gradient-accent bg-clip-text text-transparent">réussir</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Des outils puissants conçus pour les e-commerçants modernes qui veulent dominer leur marché
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => <Card key={index} className="group hover:shadow-glow transition-all duration-300 border-border/50 hover:border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-16 h-16 rounded-xl ${feature.color} flex items-center justify-center text-white`}>
                      {feature.icon}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Quick Tools Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Outils Rapides</h3>
            <p className="text-muted-foreground">Accédez rapidement à vos outils essentiels</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {tools.map((tool, index) => <Link key={index} to={tool.path}>
                <Card className="hover:shadow-card transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-6 text-center">
                    <div className="text-primary mb-3 group-hover:scale-110 transition-transform">
                      {tool.icon}
                    </div>
                    <p className="text-sm font-medium">{tool.name}</p>
                  </CardContent>
                </Card>
              </Link>)}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-success/10 text-success border-success/20">
              <Star className="w-4 h-4 mr-2" />
              Témoignages Clients
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ils ont transformé leur{" "}
              <span className="bg-gradient-success bg-clip-text text-transparent">business</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Découvrez comment nos clients utilisent ShopOpti pour développer leur e-commerce
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => <Card key={index} className="relative overflow-hidden group hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground italic">"{testimonial.comment}"</p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <CreditCard className="w-4 h-4 mr-2" />
              Tarifs Transparents
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Choisissez votre{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">plan</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Des solutions adaptées à tous les niveaux, du débutant à l'expert
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => <Card key={index} className={`relative ${plan.featured ? 'border-primary shadow-glow scale-105' : 'border-border'} hover:shadow-intense transition-all duration-300`}>
                {plan.featured && <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      {plan.badge}
                    </Badge>
                  </div>}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                  <div className="flex items-baseline justify-center mt-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-1">{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {plan.features.map((feature, featureIndex) => <div key={featureIndex} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <span className="text-sm">{feature}</span>
                    </div>)}
                  
                  <Button variant={plan.buttonVariant} className={`w-full mt-8 ${plan.featured ? 'bg-gradient-primary hover:bg-primary-hover' : ''}`} size="lg">
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Prêt à{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                révolutionner
              </span>{" "}
              votre e-commerce ?
            </h2>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Rejoignez des milliers d'entrepreneurs qui utilisent déjà ShopOpti pour développer leur business en ligne.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover shadow-glow text-lg px-12 py-4">
                  <Rocket className="w-5 h-5 mr-2" />
                  Commencer Maintenant
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-12 py-4">
                Planifier une Démo
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              Essai gratuit de 14 jours • Aucune carte de crédit requise • Support inclus
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  ShopOpti
                </span>
              </div>
              <p className="text-muted-foreground mb-4">
                La plateforme IA qui révolutionne le dropshipping et l'e-commerce.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm">Twitter</Button>
                <Button variant="ghost" size="sm">LinkedIn</Button>
                <Button variant="ghost" size="sm">YouTube</Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <Link to="/features" className="block hover:text-foreground transition-colors">Fonctionnalités</Link>
                <Link to="/pricing" className="block hover:text-foreground transition-colors">Tarifs</Link>
                <Link to="/changelog" className="block hover:text-foreground transition-colors">Nouveautés</Link>
                <Link to="/roadmap" className="block hover:text-foreground transition-colors">Roadmap</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Ressources</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <Link to="/blog" className="block hover:text-foreground transition-colors">Blog</Link>
                <Link to="/guides" className="block hover:text-foreground transition-colors">Guides</Link>
                <Link to="/help" className="block hover:text-foreground transition-colors">Centre d'aide</Link>
                <Link to="/api" className="block hover:text-foreground transition-colors">API</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Entreprise</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <Link to="/about" className="block hover:text-foreground transition-colors">À propos</Link>
                <Link to="/contact" className="block hover:text-foreground transition-colors">Contact</Link>
                <Link to="/privacy" className="block hover:text-foreground transition-colors">Confidentialité</Link>
                <Link to="/terms" className="block hover:text-foreground transition-colors">Conditions</Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 ShopOpti. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default HomeNew;