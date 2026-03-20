import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, ArrowRight, CreditCard } from 'lucide-react';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSubscription } = useStripeSubscription();
  const { refetchProfile } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Wait a bit for Stripe webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify subscription status
        await checkSubscription();
        
        // Refetch user profile to update plan
        await refetchProfile();
        
        setVerified(true);
      } catch (error) {
        console.error('Error verifying payment:', error);
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [checkSubscription, refetchProfile]);

  const sessionId = searchParams.get('session_id');

  return (
    <>
      <Helmet>
        <title>Paiement Réussi - ShopOpti+</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <ChannablePageWrapper
        title="Paiement Réussi"
        description="Votre abonnement a été activé avec succès"
        heroImage="settings"
        badge={{ label: 'Abonnement', icon: CreditCard }}
      >
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex flex-col items-center space-y-4">
              {verifying ? (
                <>
                  <Loader2 className="w-16 h-16 text-primary animate-spin" />
                  <CardTitle className="text-2xl text-center">
                    Vérification de votre paiement...
                  </CardTitle>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-success" />
                  </div>
                  <CardTitle className="text-3xl text-center text-success">
                    Paiement Réussi !
                  </CardTitle>
                </>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {verifying ? (
              <div className="text-center text-muted-foreground">
                <p>Nous vérifions votre paiement...</p>
                <p className="text-sm mt-2">Cela ne prendra que quelques secondes.</p>
              </div>
            ) : (
              <>
                <div className="bg-success/5 border border-success/20 rounded-lg p-6 space-y-3">
                  <h3 className="font-semibold text-lg">🎉 Bienvenue dans votre nouveau plan !</h3>
                  <p className="text-sm text-muted-foreground">
                    Votre abonnement a été activé avec succès. Vous avez maintenant accès à toutes les fonctionnalités premium.
                  </p>
                  {sessionId && (
                    <p className="text-xs text-muted-foreground font-mono bg-white p-2 rounded border">
                      Session: {sessionId.substring(0, 20)}...
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Prochaines étapes :</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Explorez vos nouvelles fonctionnalités depuis le tableau de bord</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Gérez votre abonnement depuis la page Mon Abonnement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>Un email de confirmation vous a été envoyé</span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={() => navigate('/dashboard')}
                    className="flex-1 gap-2"
                    size="lg"
                  >
                    Aller au tableau de bord
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button 
                    onClick={() => navigate('/subscription')}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    Voir mon abonnement
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </ChannablePageWrapper>
    </>
  );
}
