import { Check, Zap, Crown, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStripeSubscription, type PlanType } from '@/hooks/useStripeSubscription';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Standard',
    price: '19',
    type: 'standard' as const,
    icon: Zap,
    description: 'Parfait pour commencer',
    features: [
      '1 000 produits',
      '3 intégrations marketplace',
      'Import basique',
      'Analytics basiques',
      'Support email'
    ],
    popular: false
  },
  {
    name: 'Pro',
    price: '29',
    type: 'pro' as const,
    icon: Rocket,
    description: 'Pour les entrepreneurs sérieux',
    features: [
      '10 000 produits',
      'Intégrations illimitées',
      'Import IA',
      'Analytics avancés',
      'Automatisation',
      'Support prioritaire'
    ],
    popular: true
  },
  {
    name: 'Ultra Pro',
    price: '99',
    type: 'ultra_pro' as const,
    icon: Crown,
    description: 'Solution enterprise complète',
    features: [
      'Produits illimités',
      'Intégrations illimitées',
      'IA premium',
      'White-label',
      'API accès',
      'Support dédié 24/7',
      'Formations personnalisées'
    ],
    popular: false
  }
];

export function SubscriptionPlans() {
  const { subscription, createCheckout, loading } = useStripeSubscription();

  const isCurrentPlan = (planType: Exclude<PlanType, 'free'>) => {
    return subscription?.plan === planType;
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {plans.map((plan) => {
        const Icon = plan.icon;
        const isCurrent = isCurrentPlan(plan.type);
        
        return (
          <Card 
            key={plan.type}
            className={cn(
              "relative",
              plan.popular && "border-primary shadow-lg scale-105",
              isCurrent && "border-green-500 border-2"
            )}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Le plus populaire
              </Badge>
            )}
            
            {isCurrent && (
              <Badge className="absolute -top-3 right-4 bg-green-500">
                Plan actuel
              </Badge>
            )}

            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-6 w-6 text-primary" />
                <CardTitle>{plan.name}</CardTitle>
              </div>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}€</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                onClick={() => createCheckout(plan.type)}
                disabled={loading || isCurrent}
              >
                {isCurrent ? 'Plan actuel' : 'Souscrire'}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
