import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlan } from '@/hooks/usePlan';
import { toast } from 'sonner';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

const plans = [
  {
    id: 'standard',
    name: 'Standard',
    price: 'Gratuit',
    description: 'Parfait pour démarrer',
    icon: Sparkles,
    color: 'from-blue-500 to-cyan-500',
    features: [
      '1000 produits',
      'Import basique',
      'Boutiques limitées',
      'Support email',
      'Analytics basiques',
      'Catalogue standard'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€29',
    priceDetail: '/mois',
    description: 'Pour les entrepreneurs sérieux',
    icon: Zap,
    color: 'from-purple-500 to-pink-500',
    popular: true,
    features: [
      'Produits illimités',
      'Import avancé + IA',
      '10 boutiques',
      'Support prioritaire',
      'Analytics Pro',
      'CRM & SEO Manager',
      'Automatisations',
      'Product Research'
    ]
  },
  {
    id: 'ultra_pro',
    name: 'Ultra Pro',
    price: '€99',
    priceDetail: '/mois',
    description: 'La puissance maximale',
    icon: Crown,
    color: 'from-yellow-500 to-orange-500',
    features: [
      'Tout du Pro',
      'Boutiques illimitées',
      'IA avancée',
      'Multi-tenant',
      'White-label',
      'Admin Panel',
      'API Premium',
      'Support dédié 24/7',
      'Formations exclusives'
    ]
  }
];

export default function PricingPlansPage() {
  const navigate = useNavigate();
  const { plan, updatePlan } = usePlan();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const handleSelectPlan = async (planId: string) => {
    if (planId === plan) {
      toast.info('Vous êtes déjà sur ce plan');
      return;
    }

    if (planId === 'standard') {
      toast.info('Plan gratuit - Aucun paiement requis');
      return;
    }

    try {
      await updatePlan(planId);
      toast.success(`Mise à niveau vers le plan ${planId} réussie !`);
      navigate('/dashboard');
    } catch (error) {
      toast.error('Erreur lors de la mise à niveau');
    }
  };

  return (
    <ChannablePageWrapper
      title="Choisissez votre plan idéal"
      description="Évoluez à votre rythme avec des plans flexibles adaptés à vos besoins"
      heroImage="settings"
      badge={{ label: 'Plans & Tarifs', icon: Crown }}
    >

        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-3">
          <Button
            variant={billingPeriod === 'monthly' ? 'default' : 'outline'}
            onClick={() => setBillingPeriod('monthly')}
          >
            Mensuel
          </Button>
          <Button
            variant={billingPeriod === 'yearly' ? 'default' : 'outline'}
            onClick={() => setBillingPeriod('yearly')}
          >
            Annuel
            <Badge variant="secondary" className="ml-2">-20%</Badge>
          </Button>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = plan.id === plan.id;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''} ${isCurrentPlan ? 'border-green-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      Le plus populaire
                    </Badge>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <Badge variant="secondary">Plan actuel</Badge>
                  </div>
                )}

                <CardHeader className="space-y-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {plan.description}
                    </CardDescription>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.priceDetail && (
                      <span className="text-muted-foreground">{plan.priceDetail}</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full" 
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? (
                      'Plan Actuel'
                    ) : plan.id === 'standard' ? (
                      'Plan Gratuit'
                    ) : (
                      <>
                        Choisir {plan.name}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto space-y-6 mt-16">
          <h2 className="text-3xl font-bold text-center">Questions Fréquentes</h2>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Puis-je changer de plan à tout moment ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment. 
                  Les changements sont effectifs immédiatement.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Y a-t-il une période d'essai ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Tous les plans payants incluent une garantie satisfait ou remboursé de 14 jours.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quels moyens de paiement acceptez-vous ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Nous acceptons toutes les cartes bancaires (Visa, Mastercard, Amex) 
                  ainsi que les virements bancaires pour les entreprises.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="text-center space-y-4 pt-12">
          <h3 className="text-2xl font-bold">Besoin d'aide pour choisir ?</h3>
          <p className="text-muted-foreground">
            Notre équipe est là pour vous conseiller
          </p>
          <Button size="lg" onClick={() => navigate('/contact')}>
            Contactez-nous
          </Button>
        </div>
    </ChannablePageWrapper>
  );
}
