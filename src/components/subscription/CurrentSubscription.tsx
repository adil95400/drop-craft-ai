import { Calendar, CreditCard, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

export function CurrentSubscription() {
  const { subscription, loading, checkSubscription, openCustomerPortal } = useStripeSubscription();

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription?.subscribed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aucun abonnement actif</CardTitle>
          <CardDescription>
            Choisissez un plan ci-dessous pour débloquer toutes les fonctionnalités
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const planNames = {
    free: 'Gratuit',
    standard: 'Standard',
    pro: 'Pro',
    ultra_pro: 'Ultra Pro'
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Abonnement actif</CardTitle>
            <CardDescription>Gérez votre abonnement</CardDescription>
          </div>
          <Badge variant="default" className="text-lg px-4 py-2">
            {planNames[subscription.plan]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription.subscription_end && (
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Renouvellement</p>
              <p className="text-muted-foreground">
                {format(new Date(subscription.subscription_end), "d MMMM yyyy", { locale: getDateFnsLocale() })}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={openCustomerPortal}
            className="flex-1"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Gérer l'abonnement
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={checkSubscription}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
