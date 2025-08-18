import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Sparkles,
  Crown,
  Star,
  Zap,
  Check,
  TrendingUp,
  Shield,
  Rocket,
  Users,
  BarChart3,
  Bot,
  Settings,
  HeadphonesIcon,
  ArrowRight,
  X
} from "lucide-react";

const PricingPlansFull = () => {
  const plans = [
    {
      name: "Standard",
      price: "Gratuit",
      priceDetail: "Pour toujours",
      description: "Parfait pour débuter en dropshipping et tester la plateforme",
      features: [
        "10 imports produits/jour",
        "100 produits dans le catalogue",
        "Support par email",
        "Intégrations de base",
        "Analytics basiques",
        "Accès aux tutoriels",
        "Communauté Discord"
      ],
      limitations: [
        "Pas d'IA avancée",
        "Pas d'automatisation",
        "Support standard uniquement",
        "Pas d'API",
        "Watermark ShopOpti"
      ],
      color: "border-border",
      buttonVariant: "outline" as const,
      popular: false,
      users: "50,000+ utilisateurs"
    },
    {
      name: "Pro",
      price: "49€",
      priceDetail: "/mois",
      description: "Pour les entrepreneurs sérieux qui veulent passer au niveau supérieur",
      features: [
        "100 imports produits/jour",
        "Catalogue illimité",
        "IA Analytics avancée",
        "5 automatisations/mois",
        "Support prioritaire",
        "API accès basique",
        "Rapports détaillés",
        "Intégrations avancées",
        "Formation live mensuelle",
        "Suppression du watermark"
      ],
      limitations: [
        "Automatisations limitées",
        "Support non 24/7"
      ],
      color: "border-primary shadow-glow",
      buttonVariant: "default" as const,
      popular: true,
      users: "15,000+ utilisateurs"
    },
    {
      name: "Ultra Pro",
      price: "149€",
      priceDetail: "/mois",
      description: "La puissance maximale pour les experts et agences",
      features: [
        "Imports illimités",
        "Catalogue illimité",
        "IA prédictive avancée",
        "Automatisations illimitées",
        "Support 24/7",
        "API complète",
        "Intégrations personnalisées",
        "Manager dédié",
        "Formation privée",
        "White-label disponible",
        "Accès prioritaire nouvelles features",
        "Consultation business mensuelle"
      ],
      limitations: [],
      color: "border-gradient-to-r from-primary to-accent",
      buttonVariant: "default" as const,
      popular: false,
      users: "2,000+ utilisateurs"
    }
  ];

  const comparisonFeatures = [
    {
      category: "Imports & Catalogue",
      features: [
        { name: "Imports produits/jour", standard: "10", pro: "100", ultra: "Illimité" },
        { name: "Produits en catalogue", standard: "100", pro: "Illimité", ultra: "Illimité" },
        { name: "Import en masse", standard: "❌", pro: "✅", ultra: "✅" },
        { name: "Import automatique", standard: "❌", pro: "5/mois", ultra: "Illimité" }
      ]
    },
    {
      category: "Intelligence Artificielle",
      features: [
        { name: "Détection produits gagnants", standard: "Basique", pro: "Avancée", ultra: "Prédictive" },
        { name: "Analyse des tendances", standard: "❌", pro: "✅", ultra: "✅ + Prédictions" },
        { name: "Optimisation automatique", standard: "❌", pro: "✅", ultra: "✅ + Personnalisée" },
        { name: "Recommandations IA", standard: "❌", pro: "✅", ultra: "✅ + Coaching IA" }
      ]
    },
    {
      category: "Automatisation",
      features: [
        { name: "Règles d'automatisation", standard: "❌", pro: "5", ultra: "Illimitées" },
        { name: "Mise à jour prix/stock", standard: "❌", pro: "✅", ultra: "✅ + Temps réel" },
        { name: "Synchronisation multi-boutiques", standard: "❌", pro: "2 boutiques", ultra: "Illimitées" },
        { name: "Workflows personnalisés", standard: "❌", pro: "❌", ultra: "✅" }
      ]
    },
    {
      category: "Analytics & Rapports",
      features: [
        { name: "Tableaux de bord", standard: "Basique", pro: "Avancé", ultra: "Personnalisable" },
        { name: "Rapports détaillés", standard: "❌", pro: "✅", ultra: "✅ + Temps réel" },
        { name: "Suivi ROI", standard: "❌", pro: "✅", ultra: "✅ + Prédictions" },
        { name: "Export des données", standard: "❌", pro: "CSV", ultra: "CSV, Excel, API" }
      ]
    },
    {
      category: "Support & Formation",
      features: [
        { name: "Support", standard: "Email", pro: "Prioritaire", ultra: "24/7 + Manager" },
        { name: "Formation", standard: "Tutoriels", pro: "Live mensuel", ultra: "Privée + Coaching" },
        { name: "Temps de réponse", standard: "48h", pro: "12h", ultra: "2h" },
        { name: "Accès communauté", standard: "Discord", pro: "Discord VIP", ultra: "Groupe privé" }
      ]
    }
  ];

  const testimonials = [
    {
      name: "Marie Dubois",
      plan: "Pro",
      comment: "Le plan Pro m'a permis de passer de 5k€ à 50k€/mois en 6 mois !",
      results: "1000% de croissance"
    },
    {
      name: "Julien Bernard",
      plan: "Ultra Pro", 
      comment: "Avec Ultra Pro, je gère 5 boutiques et 200k€/mois de CA.",
      results: "5 boutiques automatisées"
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
      <section className="py-24 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            <Crown className="w-4 h-4 mr-2" />
            Plans Détaillés
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-8">
            Comparez tous nos{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              plans
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Trouvez le plan parfait pour votre niveau et vos ambitions e-commerce. 
            Plus de 67,000 entrepreneurs nous font confiance.
          </p>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.color} ${plan.popular ? 'scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      Plus populaire
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-primary mb-2">
                    {plan.price}
                    <span className="text-lg text-muted-foreground font-normal">{plan.priceDetail}</span>
                  </div>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                  <div className="text-sm text-muted-foreground">{plan.users}</div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-success">✅ Inclus :</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-2 text-sm">
                          <Check className="w-4 h-4 text-success flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {plan.limitations.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 text-muted-foreground">❌ Limitations :</h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, limitIndex) => (
                          <li key={limitIndex} className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <X className="w-4 h-4 flex-shrink-0" />
                            <span>{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <Button 
                    variant={plan.buttonVariant} 
                    className="w-full"
                    size="lg"
                  >
                    {plan.price === "Gratuit" ? "Commencer Gratuitement" : "Choisir ce Plan"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Comparison */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Comparaison{" "}
              <span className="bg-gradient-accent bg-clip-text text-transparent">
                détaillée
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Toutes les fonctionnalités en détail
            </p>
          </div>

          <div className="space-y-12">
            {comparisonFeatures.map((category, categoryIndex) => (
              <Card key={categoryIndex}>
                <CardHeader>
                  <CardTitle className="text-xl">{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Fonctionnalité</th>
                          <th className="text-center p-3 font-medium">Standard</th>
                          <th className="text-center p-3 font-medium">Pro</th>
                          <th className="text-center p-3 font-medium">Ultra Pro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.features.map((feature, featureIndex) => (
                          <tr key={featureIndex} className="border-b">
                            <td className="p-3 font-medium">{feature.name}</td>
                            <td className="text-center p-3">{feature.standard}</td>
                            <td className="text-center p-3">{feature.pro}</td>
                            <td className="text-center p-3">{feature.ultra}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Témoignages par{" "}
              <span className="bg-gradient-success bg-clip-text text-transparent">
                plan
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <Badge className="w-fit mx-auto mb-4">{testimonial.plan}</Badge>
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <blockquote className="text-muted-foreground mb-4">"{testimonial.comment}"</blockquote>
                  <div className="text-sm font-semibold text-primary">{testimonial.results}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Questions Fréquentes</h2>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Puis-je changer de plan à tout moment ?</h3>
                <p className="text-muted-foreground">
                  Oui, vous pouvez passer à un plan supérieur ou rétrograder à tout moment. 
                  Les changements prennent effet immédiatement et la facturation est ajustée au prorata.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Y a-t-il des frais cachés ?</h3>
                <p className="text-muted-foreground">
                  Aucun frais caché. Tous nos tarifs sont transparents et incluent toutes les fonctionnalités mentionnées. 
                  Pas de frais d'installation ou de configuration.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Comment fonctionne la garantie ?</h3>
                <p className="text-muted-foreground">
                  Nous offrons une garantie satisfait ou remboursé de 14 jours sur tous nos plans payants. 
                  Si vous n'êtes pas satisfait, nous vous remboursons intégralement.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Prêt à{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              commencer
            </span>{" "}
            ?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Rejoignez plus de 67,000 entrepreneurs qui utilisent ShopOpti pour développer leur e-commerce.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover shadow-glow">
                <Rocket className="w-5 h-5 mr-2" />
                Commencer Gratuitement
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg">
                Parler à un Expert
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPlansFull;