import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Settings,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Crown,
  Zap
} from 'lucide-react';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { useUnifiedPlan } from '@/components/plan/UnifiedPlanProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const SubscriptionManager: React.FC = () => {
  const { subscription, loading, checkSubscription, openCustomerPortal } = useStripeSubscription();
  const { plan } = useUnifiedPlan();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user, checkSubscription]);

  const handleRefresh = async () => {
    try {
      await checkSubscription();
      toast({
        title: "Abonnement actualisé",
        description: "Votre statut d'abonnement a été mis à jour."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser l'abonnement.",
        variant: "destructive"
      });
    }
  };

  const getPlanDetails = (planType: string) => {
    switch (planType) {
      case 'pro':
        return {
          name: 'Pro',
          icon: <Crown className="w-5 h-5 text-blue-600" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 border-blue-200',
          price: '49€/mois'
        };
      case 'ultra_pro':
        return {
          name: 'Ultra Pro',
          icon: <Zap className="w-5 h-5 text-purple-600" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50 border-purple-200',
          price: '149€/mois'
        };
      default:
        return {
          name: 'Standard',
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200',
          price: 'Gratuit'
        };
    }
  };

  const planDetails = getPlanDetails(plan);
  const isSubscribed = subscription?.subscribed || false;
  const hasSubscriptionEnd = subscription?.subscription_end;

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card className={`${planDetails.bgColor}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {planDetails.icon}
              <div>
                <CardTitle className="flex items-center gap-2">
                  Plan {planDetails.name}
                  {isSubscribed && (
                    <Badge className="bg-success text-success-foreground">
                      Actif
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className={planDetails.color}>
                  {planDetails.price}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>

        {hasSubscriptionEnd && (
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                Renouvellement dans {formatDistanceToNow(new Date(subscription.subscription_end), { 
                  addSuffix: true, 
                  locale: fr 
                })}
              </span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Subscription Management */}
      {isSubscribed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Gestion de l'abonnement
            </CardTitle>
            <CardDescription>
              Gérez votre facturation, moyens de paiement et abonnement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={openCustomerPortal}
              disabled={loading}
              className="w-full"
            >
              <Settings className="w-4 h-4 mr-2" />
              Ouvrir le portail client
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
            
            <div className="text-xs text-muted-foreground text-center">
              Le portail client vous permet de mettre à jour vos informations de facturation,
              télécharger vos factures et gérer votre abonnement.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage & Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Utilisation du plan
          </CardTitle>
          <CardDescription>
            Votre utilisation des fonctionnalités du plan {planDetails.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsageIndicator
            label="Imports produits"
            current={12}
            limit={plan === 'standard' ? 10 : plan === 'pro' ? 100 : -1}
            unit="/jour"
          />
          <UsageIndicator
            label="Catalogue produits"
            current={89}
            limit={plan === 'standard' ? 100 : -1}
            unit=" produits"
          />
          <UsageIndicator
            label="Automatisations"
            current={2}
            limit={plan === 'standard' ? 0 : plan === 'pro' ? 5 : -1}
            unit="/mois"
          />
        </CardContent>
      </Card>

      {/* Upgrade Suggestion */}
      {plan === 'standard' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-5 h-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold text-primary mb-2">
                  Débloquez plus de fonctionnalités
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Passez au plan Pro pour obtenir plus d'imports, l'IA Analytics et l'automatisation.
                </p>
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  <Crown className="w-4 h-4 mr-2" />
                  Découvrir le plan Pro
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface UsageIndicatorProps {
  label: string;
  current: number;
  limit: number;
  unit: string;
}

const UsageIndicator: React.FC<UsageIndicatorProps> = ({ label, current, limit, unit }) => {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = percentage > 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={`${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-warning' : 'text-muted-foreground'}`}>
          {isUnlimited ? `${current}${unit} (illimité)` : `${current}/${limit}${unit}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isAtLimit ? 'bg-destructive' : isNearLimit ? 'bg-warning' : 'bg-primary'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
};