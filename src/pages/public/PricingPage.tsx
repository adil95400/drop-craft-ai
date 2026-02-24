import { Helmet } from 'react-helmet-async';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Crown, ArrowRight, MessageSquare, Shield, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ComparisonTable } from '@/components/public/ComparisonTable';
import { TrustBadges } from '@/components/public/TrustBadges';
import { useAuth } from '@/contexts/AuthContext';

const PricingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const plans = [
    {
      id: 'standard',
      name: "Standard",
      price: "29€",
      period: "/mois",
      description: "Pour débuter avec les outils essentiels",
      icon: Shield,
      features: [
        "1 000 produits max",
        "3 intégrations",
        "100 imports/mois",
        "10 commandes auto/jour",
        "50 crédits IA/mois",
        "Support email"
      ],
      cta: "Commencer",
      highlighted: false
    },
    {
      id: 'pro',
      name: "Pro",
      price: "49€",
      period: "/mois",
      description: "Pour les e-commerçants en croissance",
      icon: Crown,
      features: [
        "10 000 produits max",
        "Intégrations illimitées",
        "1 000 imports/mois",
        "100 commandes auto/jour",
        "500 crédits IA/mois",
        "Analytics avancés",
        "IA avancée",
        "Support prioritaire"
      ],
      cta: "Essai gratuit 14 jours",
      highlighted: true,
      badge: "Le plus populaire"
    },
    {
      id: 'ultra_pro',
      name: "Ultra Pro",
      price: "99€",
      period: "/mois",
      description: "Tout illimité pour les pros exigeants",
      icon: Rocket,
      features: [
        "Produits illimités",
        "Tout illimité",
        "White-label",
        "IA premium illimitée",
        "API complète",
        "Support dédié 24/7",
        "Onboarding personnalisé"
      ],
      cta: "Passer Ultra Pro",
      highlighted: false
    }
  ];

  const faq = [
    {
      question: "Puis-je changer de plan à tout moment ?",
      answer: "Oui, vous pouvez upgrader ou downgrader à tout moment. La facturation est ajustée au prorata."
    },
    {
      question: "Y a-t-il des frais cachés ?",
      answer: "Non, aucun frais caché. Le prix affiché est tout inclus."
    },
    {
      question: "Que se passe-t-il si j'annule ?",
      answer: "Vous gardez l'accès jusqu'à la fin de votre période, puis repassez au plan gratuit. Aucune pénalité."
    },
    {
      question: "Comment fonctionne le paiement ?",
      answer: "Le paiement est sécurisé via Stripe. Carte bancaire acceptée. Facturation mensuelle automatique."
    }
  ];

  const handleSelectPlan = () => {
    if (user) {
      navigate('/choose-plan');
    } else {
      navigate('/auth?redirect=/choose-plan');
    }
  };

  return (
    <PublicLayout>
      <Helmet>
        <title>Tarifs - Drop Craft AI</title>
        <meta name="description" content="Plans Standard à 29€, Pro à 49€ et Ultra Pro à 99€/mois. Commencez gratuitement." />
      </Helmet>

      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center space-y-4 mb-16">
              <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
                Tarifs simples et transparents
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                Choisissez le plan parfait
                <span className="block bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  pour votre business
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Commencez gratuitement. Évoluez selon vos besoins. Sans engagement.
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-16">
              {plans.map((plan, index) => {
                const Icon = plan.icon;
                return (
                  <Card 
                    key={index} 
                    className={`relative ${plan.highlighted ? 'border-primary shadow-xl scale-105 z-10' : 'border-2'}`}
                  >
                    {plan.badge && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                        {plan.badge}
                      </Badge>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold">{plan.price}</span>
                          <span className="text-muted-foreground">{plan.period}</span>
                        </div>
                        <CardDescription className="text-base">{plan.description}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        variant={plan.highlighted ? "default" : "outline"}
                        size="lg"
                        onClick={handleSelectPlan}
                      >
                        {plan.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>Plan gratuit disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>Annulation à tout moment</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>Paiement sécurisé Stripe</span>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6">
            <ComparisonTable />
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Une plateforme de confiance</h2>
            </div>
            <TrustBadges />
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Questions fréquentes</h2>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-4">
              {faq.map((item, index) => (
                <Card key={index} className="hover:shadow-lg transition-all">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                      {item.question}
                    </CardTitle>
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
        <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center space-y-6 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold">
                Prêt à transformer votre e-commerce ?
              </h2>
              <p className="text-lg text-muted-foreground">
                Commencez gratuitement, upgradez quand vous êtes prêt.
              </p>
              <Button size="lg" onClick={handleSelectPlan}>
                <Crown className="w-5 h-5 mr-2" />
                Voir les plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default PricingPage;
