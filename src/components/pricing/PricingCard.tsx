import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap } from 'lucide-react';
import { useStripeIntegration } from '@/hooks/useStripeIntegration';
import { usePlan } from '@/contexts/PlanContext';

interface PricingCardProps {
  plan: 'standard' | 'pro' | 'ultra_pro';
  title: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText?: string;
  onSelect?: () => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  title,
  price,
  description,
  features,
  popular = false,
  buttonText,
  onSelect
}) => {
  const { createCheckout, isCreatingCheckout } = useStripeIntegration();
  const { currentPlan } = usePlan();

  const handleSelect = () => {
    if (onSelect) {
      onSelect();
    } else {
      createCheckout(plan);
    }
  };

  const isCurrentPlan = currentPlan === plan;
  const isFree = plan === 'standard';

  return (
    <Card className={`relative h-full ${popular ? 'border-primary shadow-lg scale-105' : ''}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1">
            <Star className="w-3 h-3 mr-1" />
            Plus populaire
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-8">
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
          {plan === 'ultra_pro' && <Zap className="w-6 h-6 text-yellow-500" />}
          {title}
        </CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold">{price}</span>
          {!isFree && <span className="text-muted-foreground">/mois</span>}
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="pt-4">
          <Button
            onClick={handleSelect}
            disabled={isCreatingCheckout || isCurrentPlan}
            className={`w-full ${popular ? 'bg-primary hover:bg-primary/90' : ''}`}
            variant={popular ? 'default' : 'outline'}
          >
            {isCreatingCheckout ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Chargement...
              </div>
            ) : isCurrentPlan ? (
              'Plan actuel'
            ) : (
              buttonText || (isFree ? 'Commencer gratuitement' : 'Choisir ce plan')
            )}
          </Button>
        </div>

        {isCurrentPlan && (
          <div className="text-center">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Check className="w-3 h-3 mr-1" />
              Plan actif
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};