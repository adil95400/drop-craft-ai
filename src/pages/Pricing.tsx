import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft,
  CheckCircle, 
  CreditCard, 
  Sparkles,
  Crown,
  Rocket,
  Star,
  Zap,
  Users,
  Bot,
  BarChart3,
  Shield,
  Headphones,
  X,
  ArrowRight
} from "lucide-react";

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Starter",
      description: "Parfait pour débuter dans le dropshipping",
      monthlyPrice: 29,
      yearlyPrice: 24,
      badge: "POPULAIRE",
      badgeColor: "bg-blue-500",
      icon: <Rocket className="w-6 h-6" />,
      features: [
        "100 produits analysés/mois",
        "Import depuis 10 fournisseurs",
        "Analytics de base",
        "Support par email",
        "1 boutique connectée",
        "Formation vidéo"
      ],
      limitations: [
        "IA avancée",
        "Intégrations premium",
        "Support prioritaire"
      ],
      cta: "Commencer",
      popular: false
    },
    {
      name: "Pro",
      description: "Pour les e-commerçants sérieux qui veulent scaler",
      monthlyPrice: 79,
      yearlyPrice: 65,
      badge: "RECOMMANDÉ",
      badgeColor: "bg-primary",
      icon: <Crown className="w-6 h-6" />,
      features: [
        "Produits illimités",
        "Import depuis 50+ fournisseurs",
        "IA avancée de détection",
        "Analytics temps réel",
        "Support prioritaire",
        "5 boutiques connectées",
        "Automatisation complète",
        "API complète",
        "Formation 1-on-1"
      ],
      limitations: [],
      cta: "Choisir Pro",
      popular: true,
      featured: true
    },
    {
      name: "Ultra Pro",
      description: "Solution enterprise avec support dédié",
      monthlyPrice: 199,
      yearlyPrice: 165,
      badge: "PREMIUM",
      badgeColor: "bg-gradient-to-r from-purple-500 to-pink-500",
      icon: <Star className="w-6 h-6" />,
      features: [
        "Tout du plan Pro",
        "IA personnalisée",
        "Account manager dédié",
        "Boutiques illimitées",
        "White label disponible",
        "Intégrations sur mesure",
        "SLA 99.9% uptime",
        "Formation équipe",
        "Consultation stratégique"
      ],
      limitations: [],
      cta: "Contactez-nous",
      popular: false
    }
  ];

  const comparisonFeatures = [
    {
      category: "Analyse de Produits",
      features: [
        { name: "Produits analysés/mois", starter: "100", pro: "Illimité", ultra: "Illimité" },
        { name: "IA de détection", starter: false, pro: true, ultra: true },
        { name: "Prédictions tendances", starter: false, pro: true, ultra: true },
        { name: "Analyse concurrence", starter: false, pro: true, ultra: true }
      ]
    },
    {
      category: "Import & Sourcing",
      features: [
        { name: "Fournisseurs disponibles", starter: "10", pro: "50+", ultra: "Illimité" },
        { name: "Import 1-clic", starter: true, pro: true, ultra: true },
        { name: "Sync automatique", starter: false, pro: true, ultra: true },
        { name: "Fournisseurs premium", starter: false, pro: true, ultra: true }
      ]
    },
    {
      category: "Boutiques & Intégrations",
      features: [
        { name: "Boutiques connectées", starter: "1", pro: "5", ultra: "Illimité" },
        { name: "Intégrations e-commerce", starter: "Base", pro: "Toutes", ultra: "Toutes + Custom" },
        { name: "API accès", starter: false, pro: true, ultra: true },
        { name: "White label", starter: false, pro: false, ultra: true }
      ]
    },
    {
      category: "Support & Formation",
      features: [
        { name: "Type de support", starter: "Email", pro: "Prioritaire", ultra: "Account Manager" },
        { name: "Formation", starter: "Vidéos", pro: "1-on-1", ultra: "Équipe" },
        { name: "Temps de réponse", starter: "48h", pro: "4h", ultra: "1h" },
        { name: "Consultation stratégique", starter: false, pro: false, ultra: true }
      ]
    }
  ];

  const faq = [
    {
      question: "Puis-je changer de plan à tout moment ?",
      answer: "Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment. Les changements prennent effet immédiatement."
    },
    {
      question: "Y a-t-il des frais cachés ?",
      answer: "Non, nos prix sont transparents. Aucun frais de setup, d'activation ou coûts cachés. Ce que vous voyez, c'est ce que vous payez."
    },
    {
      question: "Que se passe-t-il si je dépasse mes limites ?",
      answer: "Nous vous préviendrons avant d'atteindre vos limites. Vous pourrez alors upgrader votre plan ou acheter des crédits supplémentaires."
    },
    {
      question: "Proposez-vous des remises pour les associations/étudiants ?",
      answer: "Oui, nous offrons des remises spéciales pour les étudiants, associations et startups. Contactez-nous pour plus d'informations."
    },
    {
      question: "Puis-je annuler mon abonnement ?",
      answer: "Oui, vous pouvez annuler votre abonnement à tout moment. Votre accès reste actif jusqu'à la fin de votre période de facturation."
    }
  ];

  const calculateSavings = (monthly: number, yearly: number) => {
    const monthlyCost = monthly * 12;
    const yearlyCost = yearly * 12;
    return Math.round(((monthlyCost - yearlyCost) / monthlyCost) * 100);
  };

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
            <CreditCard className="w-4 h-4 mr-2" />
            Tarifs Transparents
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-8">
            Choisissez le plan{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              parfait
            </span>{" "}
            pour vous
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Des solutions adaptées à tous les niveaux, du débutant à l'expert. 
            Commencez gratuitement et évoluez selon vos besoins.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            <span className={`text-sm ${!isAnnual ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Mensuel
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-sm ${isAnnual ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Annuel
            </span>
            <Badge className="bg-success/10 text-success border-success/20">
              Économisez jusqu'à 20%
            </Badge>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 pb-24">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.featured ? 'border-primary shadow-glow scale-105 lg:scale-110' : 'border-border'} hover:shadow-intense transition-all duration-300`}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className={`${plan.badgeColor} text-white border-0`}>
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                    {plan.icon}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                  
                  <div className="flex items-baseline justify-center mt-6">
                    <span className="text-4xl font-bold">
                      {isAnnual ? plan.yearlyPrice : plan.monthlyPrice}€
                    </span>
                    <span className="text-muted-foreground ml-1">/mois</span>
                  </div>
                  
                  {isAnnual && (
                    <div className="text-sm text-success mt-2">
                      Économisez {calculateSavings(plan.monthlyPrice, plan.yearlyPrice)}% par an
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.limitations.map((limitation, limitIndex) => (
                      <div key={limitIndex} className="flex items-center space-x-3 opacity-50">
                        <X className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{limitation}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className={`w-full ${plan.featured ? 'bg-gradient-primary hover:bg-primary-hover shadow-glow' : ''}`}
                    variant={plan.featured ? 'default' : 'outline'}
                    size="lg"
                  >
                    {plan.cta}
                    {plan.name !== "Ultra Pro" && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Essai gratuit de 14 jours • Aucune carte requise
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Comparaison{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                détaillée
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Découvrez en détail ce qui est inclus dans chaque plan
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {comparisonFeatures.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-12">
                <h3 className="text-xl font-semibold mb-6 pb-2 border-b border-border">
                  {category.category}
                </h3>
                
                <div className="space-y-4">
                  {category.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="grid grid-cols-4 gap-4 py-3 px-4 rounded-lg hover:bg-background transition-colors">
                      <div className="font-medium">{feature.name}</div>
                      <div className="text-center">
                        {typeof feature.starter === 'boolean' ? (
                          feature.starter ? (
                            <CheckCircle className="w-5 h-5 text-success mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          <span className="text-sm">{feature.starter}</span>
                        )}
                      </div>
                      <div className="text-center">
                        {typeof feature.pro === 'boolean' ? (
                          feature.pro ? (
                            <CheckCircle className="w-5 h-5 text-success mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          <span className="text-sm font-medium text-primary">{feature.pro}</span>
                        )}
                      </div>
                      <div className="text-center">
                        {typeof feature.ultra === 'boolean' ? (
                          feature.ultra ? (
                            <CheckCircle className="w-5 h-5 text-success mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground mx-auto" />
                          )
                        ) : (
                          <span className="text-sm font-medium">{feature.ultra}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Questions{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                fréquentes
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Trouvez rapidement les réponses à vos questions
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {faq.map((item, index) => (
              <Card key={index} className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">{item.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-hero/5">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Prêt à{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                commencer
              </span>{" "}
              ?
            </h2>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Rejoignez des milliers d'entrepreneurs qui font déjà confiance à ShopOpti 
              pour développer leur e-commerce.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary hover:bg-primary-hover shadow-glow text-lg px-12 py-4">
                  <Rocket className="w-5 h-5 mr-2" />
                  Essai Gratuit 14 Jours
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-12 py-4">
                <Headphones className="w-5 h-5 mr-2" />
                Parler à un Expert
              </Button>
            </div>

            <div className="flex items-center justify-center space-x-6 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Pas de carte de crédit</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Configuration en 5 minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Support inclus</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;