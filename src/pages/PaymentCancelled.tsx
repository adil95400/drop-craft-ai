import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function PaymentCancelled() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Paiement Annulé - ShopOpti+</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-orange-600" />
              </div>
              <CardTitle className="text-3xl text-center text-orange-600">
                Paiement Annulé
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 space-y-3">
              <h3 className="font-semibold text-lg">Aucun paiement n'a été effectué</h3>
              <p className="text-sm text-muted-foreground">
                Vous avez annulé le processus de paiement. Aucun montant n'a été débité de votre compte.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Pourquoi souscrire ?</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Accès aux fonctionnalités IA avancées</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Automatisations illimitées pour gagner du temps</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Analytics prédictifs pour booster vos ventes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Support prioritaire pour vous accompagner</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                💡 <strong>Astuce :</strong> Nos plans sont sans engagement. 
                Vous pouvez annuler à tout moment depuis votre espace client.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={() => navigate('/pricing')}
                className="flex-1 gap-2"
                size="lg"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </Button>
              <Button 
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="flex-1 gap-2"
                size="lg"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour au tableau de bord
              </Button>
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Besoin d'aide ? {' '}
                <a 
                  href="mailto:support@shopopti.com" 
                  className="text-primary hover:underline"
                >
                  Contactez notre support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
