import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Bot, 
  TrendingUp, 
  Zap, 
  BarChart3, 
  Shield, 
  Globe,
  Search,
  Package,
  ShoppingCart,
  Truck,
  MessageSquare,
  Settings,
  CreditCard,
  Users,
  Target,
  Sparkles,
  CheckCircle,
  Star,
  Crown,
  Rocket,
  Brain,
  Eye,
  RefreshCw,
  Lock,
  Smartphone,
  Cloud
} from "lucide-react";

const Features = () => {
  const featureCategories = [
    {
      title: "Intelligence Artificielle",
      description: "Notre IA avancée analyse des millions de données pour vous",
      icon: <Brain className="w-8 h-8" />,
      color: "bg-gradient-primary",
      features: [
        {
          icon: <Bot className="w-6 h-6" />,
          title: "Détection Produits Gagnants",
          description: "Analyse automatique de 100M+ de produits pour identifier les opportunités"
        },
        {
          icon: <TrendingUp className="w-6 h-6" />,
          title: "Prédiction de Tendances",
          description: "Anticipez les tendances avant vos concurrents grâce à l'IA prédictive"
        },
        {
          icon: <Target className="w-6 h-6" />,
          title: "Optimisation Automatique",
          description: "Ajustement automatique des prix, descriptions et mots-clés"
        },
        {
          icon: <Eye className="w-6 h-6" />,
          title: "Analyse de Concurrence",
          description: "Surveillance automatique des stratégies de vos concurrents"
        }
      ]
    },
    {
      title: "Import & Sourcing",
      description: "Importez et sourcez vos produits en quelques clics",
      icon: <Package className="w-8 h-8" />,
      color: "bg-gradient-success",
      features: [
        {
          icon: <Zap className="w-6 h-6" />,
          title: "Import 1-Clic",
          description: "Importez des produits depuis 50+ fournisseurs en un seul clic"
        },
        {
          icon: <Search className="w-6 h-6" />,
          title: "Recherche Intelligente",
          description: "Trouvez les meilleurs produits avec notre moteur de recherche IA"
        },
        {
          icon: <RefreshCw className="w-6 h-6" />,
          title: "Synchronisation Auto",
          description: "Mise à jour automatique des stocks, prix et descriptions"
        },
        {
          icon: <Crown className="w-6 h-6" />,
          title: "Fournisseurs Premium",
          description: "Accès exclusif à notre réseau de fournisseurs vérifiés"
        }
      ]
    },
    {
      title: "Analytics & Reporting",
      description: "Tableaux de bord avancés pour optimiser vos performances",
      icon: <BarChart3 className="w-8 h-8" />,
      color: "bg-gradient-accent",
      features: [
        {
          icon: <BarChart3 className="w-6 h-6" />,
          title: "Dashboards Temps Réel",
          description: "Visualisez vos KPIs en temps réel avec des graphiques avancés"
        },
        {
          icon: <TrendingUp className="w-6 h-6" />,
          title: "Analyses Prédictives",
          description: "Prédictions de ventes et recommendations basées sur l'IA"
        },
        {
          icon: <Target className="w-6 h-6" />,
          title: "ROI par Produit",
          description: "Calculez précisément la rentabilité de chaque produit"
        },
        {
          icon: <Star className="w-6 h-6" />,
          title: "Rapports Personnalisés",
          description: "Créez des rapports sur mesure pour votre business"
        }
      ]
    },
    {
      title: "Intégrations",
      description: "Connectez toutes vos plateformes e-commerce",
      icon: <Globe className="w-8 h-8" />,
      color: "bg-gradient-hero",
      features: [
        {
          icon: <ShoppingCart className="w-6 h-6" />,
          title: "Multi-Plateformes",
          description: "Shopify, WooCommerce, PrestaShop, Magento et plus"
        },
        {
          icon: <Truck className="w-6 h-6" />,
          title: "Suivi Automatique",
          description: "Synchronisation automatique des commandes et livraisons"
        },
        {
          icon: <CreditCard className="w-6 h-6" />,
          title: "Paiements Intégrés",
          description: "Stripe, PayPal, et tous les moyens de paiement populaires"
        },
        {
          icon: <MessageSquare className="w-6 h-6" />,
          title: "Chat & Support",
          description: "Zendesk, Intercom, LiveChat et outils de communication"
        }
      ]
    },
    {
      title: "Automatisation",
      description: "Automatisez vos tâches répétitives et gagnez du temps",
      icon: <Settings className="w-8 h-8" />,
      color: "bg-gradient-soft",
      features: [
        {
          icon: <Bot className="w-6 h-6" />,
          title: "Workflows Intelligents",
          description: "Créez des automatisations complexes sans code"
        },
        {
          icon: <RefreshCw className="w-6 h-6" />,
          title: "Mise à Jour Auto",
          description: "Synchronisation automatique des inventaires et prix"
        },
        {
          icon: <MessageSquare className="w-6 h-6" />,
          title: "Réponses Automatiques",
          description: "Chatbot IA pour répondre à vos clients 24/7"
        },
        {
          icon: <Truck className="w-6 h-6" />,
          title: "Fulfillment Auto",
          description: "Traitement automatique des commandes et expéditions"
        }
      ]
    },
    {
      title: "Sécurité & Performance",
      description: "Protection maximale et performances optimales",
      icon: <Shield className="w-8 h-8" />,
      color: "bg-gradient-primary",
      features: [
        {
          icon: <Shield className="w-6 h-6" />,
          title: "Sécurité Enterprise",
          description: "Chiffrement AES-256 et conformité RGPD"
        },
        {
          icon: <Lock className="w-6 h-6" />,
          title: "Authentification 2FA",
          description: "Double authentification et accès sécurisés"
        },
        {
          icon: <Cloud className="w-6 h-6" />,
          title: "Infrastructure Cloud",
          description: "Hébergement AWS avec 99.9% d'uptime garanti"
        },
        {
          icon: <Smartphone className="w-6 h-6" />,
          title: "Applications Mobile",
          description: "Apps iOS et Android pour gérer votre business partout"
        }
      ]
    }
  ];

  const advantages = [
    {
      icon: <Rocket className="w-8 h-8" />,
      title: "Gain de Temps",
      description: "Économisez 20h/semaine grâce à l'automatisation",
      metric: "20h/semaine"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Augmentation des Ventes",
      description: "Nos clients voient en moyenne +300% de CA",
      metric: "+300%"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Taux de Conversion",
      description: "Optimisation IA pour maximiser vos conversions",
      metric: "+150%"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Support Dédié",
      description: "Équipe d'experts disponible 24/7",
      metric: "24/7"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <ArrowLeft className="w-5 h-5" />
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                ShopOpti
              </span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link to="/auth">
                <Button variant="ghost">Connexion</Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-primary hover:bg-primary-hover">
                  Commencer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-4 bg-gradient-hero/5">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-4 h-4 mr-2" />
            Fonctionnalités Complètes
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-8">
            Tous les outils pour{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              dominer
            </span>{" "}
            votre marché
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Découvrez comment ShopOpti révolutionne le dropshipping avec des fonctionnalités 
            avancées alimentées par l'intelligence artificielle.
          </p>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {advantages.map((advantage, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                  {advantage.icon}
                </div>
                <div className="text-3xl font-bold text-primary mb-2">{advantage.metric}</div>
                <h3 className="font-semibold mb-2">{advantage.title}</h3>
                <p className="text-sm text-muted-foreground">{advantage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Categories */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="space-y-24">
            {featureCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="relative">
                <div className="text-center mb-16">
                  <div className={`w-20 h-20 ${category.color} rounded-3xl flex items-center justify-center text-white mx-auto mb-6`}>
                    {category.icon}
                  </div>
                  <h2 className="text-4xl font-bold mb-4">{category.title}</h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    {category.description}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {category.features.map((feature, featureIndex) => (
                    <Card key={featureIndex} className="group hover:shadow-glow transition-all duration-300 border-border/50 hover:border-primary/20">
                      <CardHeader>
                        <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          {feature.icon}
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                          {feature.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Showcase */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Plus de{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              100 intégrations
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Connectez ShopOpti avec tous vos outils préférés en quelques clics
          </p>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 opacity-60">
            {[
              "Shopify", "WooCommerce", "AliExpress", "BigBuy", "Spocket", "Oberlo",
              "Facebook", "Google Ads", "TikTok", "Instagram", "Stripe", "PayPal"
            ].map((integration, index) => (
              <div key={index} className="bg-background rounded-lg p-6 border border-border">
                <div className="h-8 flex items-center justify-center font-semibold text-sm">
                  {integration}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Prêt à utiliser ces{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                fonctionnalités
              </span>{" "}
              ?
            </h2>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Commencez votre essai gratuit de 14 jours et découvrez comment ShopOpti 
              peut transformer votre e-commerce.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover shadow-glow text-lg px-12 py-4">
                  <Rocket className="w-5 h-5 mr-2" />
                  Essai Gratuit 14 Jours
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-12 py-4">
                Planifier une Démo
              </Button>
            </div>

            <div className="flex items-center justify-center space-x-6 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Aucune carte requise</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Support inclus</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Annulation facile</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;