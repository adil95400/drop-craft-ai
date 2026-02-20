import React from 'react';
import { BreadcrumbSchema } from '@/components/seo/StructuredData';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Crown, X, Shield, Lock, Globe, Headphones } from 'lucide-react';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { STRIPE_CONFIG, StripePlanType } from '@/lib/stripe-config';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { PublicLayout } from '@/layouts/PublicLayout';

const Pricing = () => {
  const { createCheckoutSession, loading } = useStripeCheckout();
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();

  const handleSelectPlan = async (planType: StripePlanType) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (planType === 'standard') {
      await createCheckoutSession(planType);
      return;
    }

    await createCheckoutSession(planType);
  };

  // Feature comparison data
  const comparisonFeatures = [
    { name: 'Produits max', standard: '1 000', pro: '10 000', ultra: 'Illimité' },
    { name: 'Intégrations', standard: '3', pro: 'Illimité', ultra: 'Illimité' },
    { name: 'Imports/mois', standard: '100', pro: '1 000', ultra: 'Illimité' },
    { name: 'Commandes auto/jour', standard: '10', pro: '100', ultra: 'Illimité' },
    { name: 'Crédits IA/mois', standard: '50', pro: '500', ultra: 'Illimité' },
    { name: 'Analytics avancés', standard: false, pro: true, ultra: true },
    { name: 'IA avancée', standard: false, pro: true, ultra: true },
    { name: 'Support prioritaire', standard: false, pro: true, ultra: true },
    { name: 'White-label', standard: false, pro: false, ultra: true },
    { name: 'API complète', standard: false, pro: false, ultra: true },
    { name: 'Support dédié 24/7', standard: false, pro: false, ultra: true },
    { name: 'Onboarding personnalisé', standard: false, pro: false, ultra: true },
  ];

  const trustBadges = [
    { icon: Shield, label: 'RGPD Conforme' },
    { icon: Lock, label: 'SSL 256-bit' },
    { icon: Globe, label: 'Hébergé en UE' },
    { icon: Headphones, label: 'Support FR' },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "ShopOpti+",
    "description": "Plateforme SaaS d'automatisation e-commerce et dropshipping",
    "brand": {
      "@type": "Brand",
      "name": "ShopOpti+"
    },
    "offers": Object.entries(STRIPE_CONFIG.plans).map(([key, plan]) => ({
      "@type": "Offer",
      "name": plan.name,
      "price": plan.price,
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock"
    }))
  };

  return (
    <PublicLayout>
      <Helmet>
        <title>Tarifs ShopOpti+ | Plans Standard, Pro, Ultra Pro - Essai Gratuit 14 Jours</title>
        <meta name="description" content="Découvrez nos plans tarifaires ShopOpti+ : Standard 29€/mois, Pro 49€/mois, Ultra Pro 99€/mois. 14 jours d'essai gratuit, sans engagement. Automatisez votre e-commerce." />
        <meta name="keywords" content="tarifs dropshipping, prix e-commerce, abonnement ShopOpti, plan automatisation, essai gratuit" />
        <link rel="canonical" href="https://shopopti.io/pricing" />
        <meta property="og:title" content="Tarifs ShopOpti+ | Plans E-commerce" />
        <meta property="og:description" content="Plans tarifaires ShopOpti+ à partir de 29€/mois. Essai gratuit 14 jours." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://shopopti.io/pricing" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <BreadcrumbSchema items={[
        { name: "Accueil", url: "https://shopopti.io" },
        { name: "Tarifs", url: "https://shopopti.io/pricing" },
      ]} />

      <div className="bg-background py-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 px-4 py-2 bg-primary/10 text-primary border-primary/20">
              14 jours d'essai gratuit
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Choisissez votre plan</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Automatisez votre e-commerce avec la puissance de l'IA. Sans engagement, annulable à tout moment.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
            {Object.entries(STRIPE_CONFIG.plans).map(([key, plan]) => {
              const isFeatured = key === 'pro';
              return (
                <Card key={key} className={`relative ${isFeatured ? 'border-primary border-2 shadow-xl scale-105 z-10' : 'border-border'}`}>
                  {isFeatured && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-primary to-violet-600 text-white px-4 py-1.5">
                        <Crown className="w-4 h-4 mr-1" />
                        POPULAIRE
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pt-8">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="mt-4">
                      <span className="text-4xl font-bold text-foreground">{plan.price}€</span>
                      <span className="text-muted-foreground">/mois</span>
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      onClick={() => handleSelectPlan(key as StripePlanType)}
                      disabled={loading}
                      className={`w-full py-6 text-base ${isFeatured ? 'bg-gradient-to-r from-primary to-violet-600 hover:opacity-90' : ''}`}
                      variant={isFeatured ? 'default' : 'outline'}
                      size="lg"
                    >
                      {loading ? 'Chargement...' : 'Commencer l\'essai gratuit'}
                    </Button>
                    
                    <p className="text-xs text-center text-muted-foreground">
                      Carte bancaire requise après l'essai • Annulable à tout moment
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Feature Comparison Table */}
          <div className="max-w-5xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">Comparaison détaillée</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 font-medium">Fonctionnalité</th>
                    <th className="text-center py-4 px-4 font-medium">Standard<br/><span className="text-primary font-bold">29€</span></th>
                    <th className="text-center py-4 px-4 font-medium bg-primary/5 border-x border-primary/20">Pro<br/><span className="text-primary font-bold">49€</span></th>
                    <th className="text-center py-4 px-4 font-medium">Ultra Pro<br/><span className="text-primary font-bold">99€</span></th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, idx) => (
                    <tr key={idx} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-4 text-sm">{feature.name}</td>
                      <td className="text-center py-3 px-4">
                        {typeof feature.standard === 'boolean' ? (
                          feature.standard ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm font-medium">{feature.standard}</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-4 bg-primary/5 border-x border-primary/10">
                        {typeof feature.pro === 'boolean' ? (
                          feature.pro ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm font-medium">{feature.pro}</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-4">
                        {typeof feature.ultra === 'boolean' ? (
                          feature.ultra ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm font-medium">{feature.ultra}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-center gap-6 py-8 border-t border-border">
              {trustBadges.map((badge, idx) => {
                const IconComponent = badge.icon;
                return (
                  <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                    <IconComponent className="h-5 w-5" />
                    <span className="text-sm font-medium">{badge.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FAQ CTA */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">Des questions sur nos tarifs ?</p>
            <Button variant="link" onClick={() => navigate('/faq')} className="text-primary">
              Consultez notre FAQ →
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}

export default Pricing
