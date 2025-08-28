import { SEO } from '@/components/SEO';
import Header from '@/components/layout/Header';
import FooterNavigation from '@/components/navigation/FooterNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Handshake, Star, Users, TrendingUp, Shield, ExternalLink, CheckCircle } from 'lucide-react';

const Partners = () => {
  const partnerTypes = [
    {
      icon: Handshake,
      title: "Partenaires Technologiques",
      description: "Intégrez ShopOpti+ dans votre écosystème",
      count: "25+",
      benefits: ["API complète", "Documentation dédiée", "Support technique", "Commission attractive"]
    },
    {
      icon: Users,
      title: "Partenaires Agences",
      description: "Proposez ShopOpti+ à vos clients e-commerce", 
      count: "50+",
      benefits: ["Formation complète", "Support commercial", "Matériaux marketing", "Margins préférentielles"]
    },
    {
      icon: TrendingUp,
      title: "Partenaires Affiliés",
      description: "Gagnez des commissions en recommandant ShopOpti+",
      count: "200+", 
      benefits: ["Jusqu'à 30% commission", "Dashboard en temps réel", "Liens trackés", "Paiements mensuels"]
    }
  ];

  const currentPartners = [
    {
      name: "Shopify",
      type: "Technologique",
      logo: "🛒",
      description: "Intégration native avec toutes les fonctionnalités Shopify",
      status: "Intégration complète",
      level: "Platinum"
    },
    {
      name: "BigBuy",
      type: "Fournisseur", 
      logo: "📦",
      description: "Accès direct au catalogue de +100,000 produits",
      status: "API partenaire",
      level: "Gold"
    },
    {
      name: "AliExpress",
      type: "Marketplace",
      logo: "🏪", 
      description: "Import automatisé depuis AliExpress",
      status: "Intégration active",
      level: "Silver"
    },
    {
      name: "Google Ads",
      type: "Marketing",
      logo: "🎯",
      description: "Optimisation automatique des campagnes publicitaires", 
      status: "Partenaire certifié",
      level: "Gold"
    },
    {
      name: "PayPal",
      type: "Paiement",
      logo: "💳",
      description: "Intégration de paiement sécurisée",
      status: "Intégration complète", 
      level: "Platinum"
    },
    {
      name: "Stripe", 
      type: "Paiement",
      logo: "💰",
      description: "Traitement de paiement avancé",
      status: "Partenaire privilégié",
      level: "Platinum"
    }
  ];

  const partnershipPrograms = [
    {
      title: "Programme Développeur",
      description: "Créez des intégrations avec notre API RESTful complète",
      features: [
        "Accès API illimité",
        "Documentation complète", 
        "Sandbox de développement",
        "Support technique dédié"
      ],
      cta: "Devenir développeur partenaire"
    },
    {
      title: "Programme Revendeur", 
      description: "Vendez ShopOpti+ et gagnez des commissions récurrentes",
      features: [
        "Commissions jusqu'à 30%", 
        "Formation commerciale",
        "Matériaux marketing",
        "Support avant-vente"
      ],
      cta: "Devenir revendeur"
    },
    {
      title: "Programme Agence",
      description: "Intégrez ShopOpti+ dans vos offres de services digitaux", 
      features: [
        "Tarifs préférentiels",
        "Formation équipe",
        "Co-marketing",
        "Account manager dédié"
      ],
      cta: "Partenariat agence"
    }
  ];

  const benefits = [
    {
      icon: Star,
      title: "Excellence reconnue",
      description: "Partenaires certifiés par les leaders du e-commerce"
    },
    {
      icon: Shield,
      title: "Sécurité garantie", 
      description: "Toutes les intégrations respectent les plus hauts standards de sécurité"
    },
    {
      icon: TrendingUp,
      title: "Croissance mutuelle",
      description: "Nous grandissons ensemble grâce à des partenariats win-win"
    }
  ];

  return (
    <>
      <SEO
        title="Partenaires | ShopOpti+"
        description="Découvrez nos partenaires technologiques, devenir revendeur ShopOpti+ ou intégrer notre API. Partenariats Shopify, BigBuy, PayPal."
        path="/partners"
        keywords="partenaires ShopOpti, API e-commerce, revendeur dropshipping, intégration Shopify, partenariat technologique"
      />
      <Header />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-20 px-4 text-center bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto max-w-4xl">
            <Badge variant="secondary" className="mb-4">
              <Handshake className="h-3 w-3 mr-1" />
              Écosystème de partenaires
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Partenaires 
              <span className="bg-gradient-hero bg-clip-text text-transparent"> ShopOpti+</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Découvrez notre écosystème de partenaires de confiance et rejoignez-nous pour 
              créer ensemble l'avenir du e-commerce.
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg">
                Devenir partenaire
              </Button>
              <Button variant="outline" size="lg">
                Voir nos intégrations
              </Button>
            </div>
          </div>
        </section>

        {/* Partner Types */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Types de partenariats
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {partnerTypes.map((type, index) => {
                const Icon = type.icon;
                return (
                  <Card key={index} className="text-center hover:shadow-premium transition-all duration-300">
                    <CardHeader>
                      <Icon className="h-12 w-12 text-primary mx-auto mb-4" />
                      <CardTitle className="text-xl">{type.title}</CardTitle>
                      <CardDescription>{type.description}</CardDescription>
                      <Badge variant="secondary" className="mx-auto w-fit mt-2">
                        {type.count} partenaires
                      </Badge>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <ul className="space-y-2 text-left">
                        {type.benefits.map((benefit, benefitIndex) => (
                          <li key={benefitIndex} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full" variant="outline">
                        En savoir plus
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Current Partners */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Nos partenaires actuels
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentPartners.map((partner, index) => (
                <Card key={index} className="hover:shadow-card transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-2xl">{partner.logo}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{partner.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {partner.type}
                        </Badge>
                      </div>
                      <Badge 
                        variant={
                          partner.level === 'Platinum' ? 'default' : 
                          partner.level === 'Gold' ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {partner.level}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {partner.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {partner.status}
                      </span>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Partnership Programs */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Programmes de partenariat
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {partnershipPrograms.map((program, index) => (
                <Card key={index} className="hover:shadow-premium transition-all duration-300">
                  <CardHeader>
                    <CardTitle>{program.title}</CardTitle>
                    <CardDescription>{program.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {program.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <Button className="w-full">
                      {program.cta}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Pourquoi devenir partenaire ?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="text-center">
                    <Icon className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-3">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-secondary/10 text-center">
          <div className="container mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold mb-6">
              Prêt à devenir partenaire ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Rejoignez notre écosystème de partenaires et développons ensemble 
              les meilleures solutions e-commerce du marché.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg">
                Candidature partenaire
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg">
                Documentation API
              </Button>
            </div>
          </div>
        </section>
      </div>
      
      <FooterNavigation />
    </>
  );
};

export default Partners;