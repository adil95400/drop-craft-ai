import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
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
      path: '/integrations/extensions/hub'
    },
    {
      id: 'url-import',
      name: 'Import URL',
      description: 'Edge function product-url-scraper déployée',
      status: 'active',
      edgeFunctionName: 'product-url-scraper',
      path: '/products/import/url'
    },
    {
      id: 'supplier-catalog',
      name: 'Catalogue fournisseur',
      description: 'Gestion avancée des fournisseurs',
      status: 'active',
      path: '/products/suppliers'
    },
    {
      id: 'dynamic-pricing',
      name: 'Tarification dynamique',
      description: 'Règles de prix automatiques et optimisation IA',
      status: 'active',
      path: '/automation/pricing-automation'
    },
    {
      id: 'auto-fulfillment',
      name: 'Auto-exécution',
      description: 'Workflows d\'automatisation complets',
      status: 'active',
      path: '/automation/workflow-builder'
    },
    {
      id: 'integration-flow',
      name: 'Intégrations',
      description: 'Système d\'intégration multi-plateforme',
      status: 'active',
      path: '/integrations'
    }
  ];

  const getStatusIcon = (status: FeatureStatus['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0" />;
    }
  };

  const getStatusBadge = (status: FeatureStatus['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600 text-[10px] sm:text-xs px-1.5 py-0">Actif</Badge>;
      case 'inactive':
        return <Badge variant="destructive" className="text-[10px] sm:text-xs px-1.5 py-0">Inactif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600 text-[10px] sm:text-xs px-1.5 py-0">En attente</Badge>;
    }
  };

  const activeCount = features.filter(f => f.status === 'active').length;
  const totalCount = features.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base sm:text-lg">
          <span>Fonctionnalités</span>
          <Badge variant="outline" className="text-sm sm:text-lg">
            {activeCount}/{totalCount}
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          État en temps réel des fonctionnalités
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="space-y-2 sm:space-y-3">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => feature.path && navigate(feature.path)}
            >
              {getStatusIcon(feature.status)}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                  <h4 className="font-medium text-xs sm:text-sm truncate">{feature.name}</h4>
                  {getStatusBadge(feature.status)}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{feature.description}</p>
              </div>
              
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};