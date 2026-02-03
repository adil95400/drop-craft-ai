/**
 * Extension Health Page
 * 
 * SaaS page for monitoring extension operations and health metrics.
 */

import { ChannableLayout } from '@/components/channable/navigation';
import { ExtensionHealthDashboard } from '@/components/extensions/ExtensionHealthDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';
import { Activity } from 'lucide-react';

export default function ExtensionHealthPage() {
  return (
    <ChannableLayout>
      <Helmet>
        <title>Extension Health - ShopOpti+</title>
        <meta name="description" content="Monitoring de l'extension ShopOpti+ en temps réel" />
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Extension Health</h1>
            <p className="text-muted-foreground">
              Surveillez les performances et la santé de l'extension en temps réel
            </p>
          </div>
        </div>

        {/* Main Dashboard */}
        <ExtensionHealthDashboard />

        {/* Info Card */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">À propos du monitoring</CardTitle>
            <CardDescription>
              Cette page affiche les métriques de l'extension ShopOpti+ collectées via le Gateway unifié.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Requêtes totales :</strong> Nombre total de requêtes traitées par le gateway.
            </p>
            <p>
              <strong>Taux de succès :</strong> Pourcentage de requêtes complétées sans erreur.
            </p>
            <p>
              <strong>Temps de réponse :</strong> Temps moyen de traitement des requêtes (en millisecondes).
            </p>
            <p>
              <strong>Erreurs :</strong> Distribution des erreurs par code pour identifier les problèmes récurrents.
            </p>
          </CardContent>
        </Card>
      </div>
    </ChannableLayout>
  );
}
