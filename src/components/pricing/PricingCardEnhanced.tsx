import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Loader2, Crown, Zap } from 'lucide-react';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { useUnifiedPlan } from '@/components/plan/UnifiedPlanProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface PricingCardEnhancedProps {
  planId: 'standard' | 'pro' | 'ultra_pro';
  title: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  variant?: 'default' | 'outline';
}

export const PricingCardEnhanced: React.FC<PricingCardEnhancedProps> = ({
  planId,
  title,
  price,
  description,
  features,
  popular = false,
  variant = 'outline'
}) => {
  const { createCheckout, loading } = useStripeSubscription();
  const { plan: currentPlan } = useUnifiedPlan();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isCurrentPlan = currentPlan === planId;
  const isFree = planId === 'standard';
  const isUpgrade = getPlanLevel(planId) > getPlanLevel(currentPlan);
  const isDowngrade = getPlanLevel(planId) < getPlanLevel(currentPlan);

  function getPlanLevel(plan: string): number {
    switch (plan) {
      case 'standard': return 0;
      case 'pro': return 1;
      case 'ultra_pro': return 2;
      default: return 0;
    }
  }

  const handleSelect = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (isFree) {
      toast({
        title: "Plan gratuit activé",
        description: "Vous utilisez déjà le plan gratuit avec toutes ses fonctionnalités."
      });
      return;
    }

    if (isCurrentPlan) {
      return;
    }

    try {
      await createCheckout(planId);
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  const getButtonText = () => {
    if (loading) return 'Chargement...';
    if (isCurrentPlan) return 'Plan actuel';
    if (isFree) return 'Commencer gratuitement';
    if (isUpgrade) return 'Passer à ce plan';
    if (isDowngrade) return 'Rétrograder';
    return 'Choisir ce plan';
  };

  const getButtonVariant = () => {
    if (isCurrentPlan) return 'secondary' as const;
    if (popular) return 'default' as const;
    return variant;
  };

  const getIcon = () => {
    if (planId === 'pro') return <Crown className="w-5 h-5" />;
    if (planId === 'ultra_pro') return <Zap className="w-5 h-5" />;
    return null;
  };

  return (
    <Card className={`relative h-full transition-all duration-300 hover:shadow-lg ${
      popular ? 'border-primary shadow-premium scale-105' : 'border-border'
    } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-4 py-1">
            <Star className="w-3 h-3 mr-1" />
            Plus populaire
          </Badge>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute top-4 right-4">
          <Badge className="bg-success text-success-foreground">
            <Check className="w-3 h-3 mr-1" />
            Actuel
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-8">
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
          {getIcon()}
          {title}
        </CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold text-primary">{price}</span>
          {!isFree && <span className="text-muted-foreground">/mois</span>}
        </div>
        <CardDescription className="mt-2 text-base">{description}</CardDescription>
        
        {!isFree && (
          <div className="mt-4">
            <Badge variant="secondary" className="text-xs">
              Essai gratuit 14 jours • Sans engagement
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <span className="text-sm leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="pt-4 space-y-3">
          <Button
            onClick={handleSelect}
            disabled={loading || isCurrentPlan}
            className="w-full transition-all duration-300"
            variant={getButtonVariant()}
            size="lg"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {getButtonText()}
          </Button>

                {isCurrentPlan && user && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => navigate('/subscription/dashboard')}
                    >
                      Gérer mon abonnement
                    </Button>
                  )}
        </div>

        {!isFree && !isCurrentPlan && (
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <div>• Annulation à tout moment</div>
            <div>• Support par email inclus</div>
            <div>• Mise à niveau instantanée</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};