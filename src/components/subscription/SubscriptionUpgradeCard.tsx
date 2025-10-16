import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Check } from 'lucide-react';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { useUnifiedPlan } from '@/lib/unified-plan-system';
import { Link } from 'react-router-dom';

export const SubscriptionUpgradeCard = () => {
  const { currentPlan } = useUnifiedPlan();
  const { createCheckout } = useStripeSubscription();

  if (currentPlan === 'ultra_pro') {
    return null; // No upgrade needed
  }

  const upgradeConfig = {
    standard: {
      title: 'Passez au plan Pro',
      description: 'Débloquez l\'IA Analytics et plus d\'automatisations',
      icon: Crown,
      color: 'text-blue-600',
      features: [
        'Import 500 produits/jour',
        'IA Analytics avancée',
        'Automatisations illimitées',
        'Support prioritaire'
      ],
      targetPlan: 'pro' as const,
      price: '29€/mois'
    },
    pro: {
      title: 'Découvrez Ultra Pro',
      description: 'Automatisation illimitée et IA prédictive',
      icon: Zap,
      color: 'text-purple-600',
      features: [
        'Imports illimités',
        'IA prédictive avancée',
        'Automatisations complètes',
        'Support 24/7',
        'Manager dédié'
      ],
      targetPlan: 'ultra_pro' as const,
      price: '99€/mois'
    }
  };

  const config = upgradeConfig[currentPlan];
  if (!config) return null;

  const IconComponent = config.icon;

  return (
    <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-center gap-3">
          <IconComponent className={`w-8 h-8 ${config.color}`} />
          <div>
            <CardTitle>{config.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {config.description}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {config.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <div className="text-2xl font-bold">{config.price}</div>
            <div className="text-xs text-muted-foreground">Annulation à tout moment</div>
          </div>
          <Button 
            onClick={() => createCheckout(config.targetPlan)}
            className="gap-2"
          >
            <Crown className="w-4 h-4" />
            Passer à {config.targetPlan === 'pro' ? 'Pro' : 'Ultra Pro'}
          </Button>
        </div>

        <Link to="/pricing" className="block text-center">
          <Button variant="outline" size="sm" className="w-full">
            Comparer tous les plans
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};
