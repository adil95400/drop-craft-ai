import { Helmet } from 'react-helmet-async';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Crown, Zap, Rocket, ArrowRight, Users, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROICalculator } from '@/components/public/ROICalculator';
import { ComparisonTable } from '@/components/public/ComparisonTable';
import { TestimonialCard } from '@/components/public/TestimonialCard';
import { TrustBadges } from '@/components/public/TrustBadges';

const PricingPage = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Starter",
      price: "0€",
      period: "/mois",
      description: "Pour débuter votre activité e-commerce",
      icon: Zap,
      features: [
        "Jusqu'à 100 produits",
        "1 boutique connectée",
        "Import produits basique",
        "Support communautaire",
        "Mises à jour gratuites"
      ],
      cta: "Commencer gratuitement",
      highlighted: false
    },
    {
      name: "Pro",
      price: "49€",
      period: "/mois",
      description: "Pour les e-commerçants en croissance",
      icon: Crown,
      features: [
        "Produits illimités",
        "5 boutiques connectées",
        "Import automatisé multi-fournisseurs",
        "Optimisation IA des prix",
        "Analytics avancés",
        "Support prioritaire 24/7",
        "Automatisation des commandes",
        "API complète"
      ],
      cta: "Essai gratuit 14 jours",
      highlighted: true,
      badge: "Le plus populaire"
    },
    {
      name: "Enterprise",
      price: "Sur mesure",
      period: "",
      description: "Pour les grandes entreprises et agences",
      icon: Rocket,
      features: [
        "Tout du plan Pro",
        "Boutiques illimitées",
        "Multi-tenant (gestion clients)",
        "White label complet",
        "Compte manager dédié",
        "SLA garanti 99.9%",
        "Développements sur mesure",
        "Formation équipe incluse"
      ],
      cta: "Contactez-nous",
      highlighted: false
    }
  ];

  const faq = [
    {
      question: "Puis-je changer de plan à tout moment ?",
      answer: "Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements sont effectifs immédiatement et la facturation est ajustée au prorata."
    },
    {
      question: "Y a-t-il des frais cachés ?",
      answer: "Non, aucun frais caché. Le prix affiché est tout inclus : hébergement, mises à jour, support. Seuls les frais de transaction des plateformes de paiement s'appliquent."
    },
    {
      question: "Que se passe-t-il après la période d'essai ?",
      answer: "Après les 14 jours d'essai gratuit, vous pouvez choisir de continuer avec un abonnement payant ou rester sur le plan gratuit. Aucune carte bancaire requise pour l'essai."
    },
    {
      question: "Puis-je annuler mon abonnement ?",
      answer: "Oui, vous pouvez annuler votre abonnement à tout moment depuis votre tableau de bord. Aucun engagement, aucune pénalité d'annulation."
    }
  ];

  return (
    <PublicLayout>
      <Helmet>
        <title>Tarifs - ShopOpti</title>
        <meta name="description" content="Découvrez nos plans tarifaires adaptés à tous les besoins. Essai gratuit 14 jours sans carte bancaire." />
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
                            <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
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
                        onClick={() => navigate('/auth')}
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
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Sans carte bancaire pour l'essai</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Annulation à tout moment</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Garantie satisfait ou remboursé 30 jours</span>
              </div>
            </div>
          </div>
        </section>

        {/* ROI Calculator */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Calculez votre retour sur investissement</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Découvrez combien vous pourriez économiser avec ShopOpti
              </p>
            </div>
            <div className="max-w-5xl mx-auto">
              <ROICalculator />
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center space-y-4 mb-12">
              <Badge className="px-4 py-2 bg-success/10 text-success border-success/20">
                <Users className="h-4 w-4 mr-2" />
                +15 000 e-commerçants satisfaits
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold">Ce que disent nos clients</h2>
              <p className="text-lg text-muted-foreground">
                Des résultats concrets et mesurables
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <TestimonialCard
                name="Sophie Martin"
                role="Fondatrice"
                company="BelleMode.fr"
                rating={5}
                text="ShopOpti a transformé ma boutique. En 3 mois, j'ai doublé mon chiffre d'affaires tout en divisant mon temps de gestion par 3. L'automatisation IA est bluffante."
                metrics={{ label: "CA en 3 mois", value: "+142%" }}
              />
              <TestimonialCard
                name="Marc Dubois"
                role="CEO"
                company="TechDrop"
                rating={5}
                text="Le meilleur investissement pour mon dropshipping. L'import automatique depuis 15+ fournisseurs et l'optimisation des prix m'ont permis de passer à l'échelle rapidement."
                metrics={{ label: "Temps économisé", value: "25h/sem" }}
              />
              <TestimonialCard
                name="Julie Chen"
                role="Manager"
                company="MultiStores Pro"
                rating={5}
                text="Je gère 8 boutiques avec ShopOpti. La centralisation et l'IA prédictive m'ont permis d'augmenter mes marges de 38% sans effort supplémentaire."
                metrics={{ label: "Marge nette", value: "+38%" }}
              />
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
              <p className="text-lg text-muted-foreground">
                Tout ce que vous devez savoir sur nos tarifs
              </p>
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
                Rejoignez des milliers d'entrepreneurs qui ont déjà fait le choix de ShopOpti
              </p>
              <Button size="lg" onClick={() => navigate('/auth')}>
                <Crown className="w-5 h-5 mr-2" />
                Commencer gratuitement
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
