import { ExtensionHealthDashboard } from '@/components/extensions/ExtensionHealthDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';
import { Activity } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function ExtensionHealthPage() {
  return (
    <>
      <Helmet>
        <title>Extension Health - ShopOpti+</title>
        <meta name="description" content="Monitoring de l'extension ShopOpti+ en temps réel" />
      </Helmet>

      <ChannablePageWrapper
        title="Extension Health"
        description="Surveillez les performances et la santé de l'extension en temps réel"
        heroImage="extensions"
        badge={{ label: 'Monitoring', icon: Activity }}
      >
        <ExtensionHealthDashboard />

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">À propos du monitoring</CardTitle>
            <CardDescription>
              Métriques de l'extension ShopOpti+ collectées via le Gateway unifié.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong>Requêtes totales :</strong> Nombre total de requêtes traitées par le gateway.</p>
            <p><strong>Taux de succès :</strong> Pourcentage de requêtes complétées sans erreur.</p>
            <p><strong>Temps de réponse :</strong> Temps moyen de traitement (en ms).</p>
            <p><strong>Erreurs :</strong> Distribution des erreurs par code.</p>
          </CardContent>
        </Card>
      </ChannablePageWrapper>
    </>
  );
}
