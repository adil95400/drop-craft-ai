import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface FeatureStatus {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'pending';
  path?: string;
  edgeFunctionName?: string;
}

export const FeatureStatusDashboard = () => {
  const navigate = useNavigate();

  const features: FeatureStatus[] = [
    {
      id: 'chrome-extension',
      name: 'Extension Chrome',
      description: 'Import en 1 clic depuis Temu, AliExpress, Amazon',
      status: 'active',
      path: '/integrations/extensions'
    },
    {
      id: 'url-import',
      name: 'Importation de produits basée sur une URL',
      description: 'Edge function product-url-scraper déployée',
      status: 'active',
      edgeFunctionName: 'product-url-scraper'
    },
    {
      id: 'supplier-catalog',
      name: 'Interface utilisateur du catalogue fournisseur',
      description: 'Gestion avancée des fournisseurs',
      status: 'active',
      path: '/products/suppliers'
    },
    {
      id: 'dynamic-pricing',
      name: 'Automatisation de la tarification dynamique',
      description: 'Règles de prix automatiques et optimisation IA',
      status: 'active',
      path: '/automation/pricing'
    },
    {
      id: 'auto-fulfillment',
      name: 'Automatisation de l\'exécution automatique',
      description: 'Workflows d\'automatisation complets',
      status: 'active',
      path: '/automation/workflow-builder'
    },
    {
      id: 'integration-flow',
      name: 'Flux d\'intégration',
      description: 'Système d\'intégration multi-plateforme',
      status: 'active',
      path: '/integrations'
    }
  ];

  const getStatusIcon = (status: FeatureStatus['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'inactive':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: FeatureStatus['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Actif</Badge>;
      case 'inactive':
        return <Badge variant="destructive">Inactif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600">En attente</Badge>;
    }
  };

  const activeCount = features.filter(f => f.status === 'active').length;
  const totalCount = features.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Statut des fonctionnalités</span>
          <Badge variant="outline" className="text-lg">
            {activeCount}/{totalCount}
          </Badge>
        </CardTitle>
        <CardDescription>
          État en temps réel des fonctionnalités principales du système
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1">
                {getStatusIcon(feature.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{feature.name}</h4>
                    {getStatusBadge(feature.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                  {feature.edgeFunctionName && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Edge Function: <code className="bg-muted px-1 py-0.5 rounded">{feature.edgeFunctionName}</code>
                    </p>
                  )}
                </div>
              </div>
              {feature.path && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(feature.path!)}
                >
                  Ouvrir
                </Button>
              )}
              {feature.edgeFunctionName && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(
                    `https://supabase.com/dashboard/project/dtozyrmmekdnvekissuh/functions/${feature.edgeFunctionName}/logs`,
                    '_blank'
                  )}
                >
                  Logs
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
