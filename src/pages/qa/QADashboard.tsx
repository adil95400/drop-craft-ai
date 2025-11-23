import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Package, ShoppingCart, Users, Workflow, 
  BarChart3, Plug, CheckCircle2, XCircle 
} from 'lucide-react';

interface QADomain {
  id: string;
  name: string;
  description: string;
  icon: any;
  route: string;
  status: 'ready' | 'in-progress' | 'pending';
  testsCount: number;
}

export default function QADashboard() {
  const navigate = useNavigate();

  const domains: QADomain[] = [
    {
      id: 'products',
      name: 'Produits',
      description: 'Tests CRUD, bulk operations, import/export, optimisation AI',
      icon: Package,
      route: '/qa/products',
      status: 'ready',
      testsCount: 7
    },
    {
      id: 'orders',
      name: 'Commandes',
      description: 'Tests gestion commandes, clients, statuts, export',
      icon: ShoppingCart,
      route: '/qa/orders',
      status: 'ready',
      testsCount: 8
    },
    {
      id: 'crm',
      name: 'CRM',
      description: 'Tests contacts, lead scoring, campagnes, analytics',
      icon: Users,
      route: '/qa/crm',
      status: 'pending',
      testsCount: 6
    },
    {
      id: 'workflows',
      name: 'Workflows',
      description: 'Tests automation, triggers, actions, conditions',
      icon: Workflow,
      route: '/qa/workflows',
      status: 'pending',
      testsCount: 5
    },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'Tests rapports, insights, prédictions, KPIs',
      icon: BarChart3,
      route: '/qa/analytics',
      status: 'pending',
      testsCount: 7
    },
    {
      id: 'integrations',
      name: 'Intégrations',
      description: 'Tests marketplaces, suppliers, sync, webhooks',
      icon: Plug,
      route: '/qa/integrations',
      status: 'pending',
      testsCount: 9
    }
  ];

  const readyCount = domains.filter(d => d.status === 'ready').length;
  const totalTests = domains.reduce((sum, d) => sum + d.testsCount, 0);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Centre de QA</h1>
        <p className="text-muted-foreground">
          Tests de validation pour tous les domaines de l'application
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Domaines prêts</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readyCount}/{domains.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((readyCount / domains.length) * 100)}% complétés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests totaux</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Répartis sur {domains.length} domaines
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut global</CardTitle>
            <XCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">En cours</div>
            <p className="text-xs text-muted-foreground mt-1">
              Phase 4 en progression
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {domains.map((domain) => {
          const Icon = domain.icon;
          
          return (
            <Card key={domain.id} className="hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{domain.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {domain.testsCount} tests
                      </CardDescription>
                    </div>
                  </div>
                  <div>
                    {domain.status === 'ready' && (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Prêt
                      </span>
                    )}
                    {domain.status === 'in-progress' && (
                      <span className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium">
                        En cours
                      </span>
                    )}
                    {domain.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground text-sm">
                        À faire
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {domain.description}
                </p>
                <Button
                  onClick={() => navigate(domain.route)}
                  className="w-full"
                  disabled={domain.status === 'pending'}
                >
                  {domain.status === 'ready' ? 'Lancer les tests' : 'Bientôt disponible'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Progression globale</CardTitle>
          <CardDescription>Avancement de la Phase 4 - QA par domaine</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Domaines testés</span>
                <span className="text-sm text-muted-foreground">{readyCount}/{domains.length}</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${(readyCount / domains.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <h4 className="text-sm font-semibold">Prochaines étapes:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Créer pages QA pour CRM, Workflows, Analytics</li>
                <li>Implémenter tests d'intégration E2E</li>
                <li>Documenter les résultats de tests</li>
                <li>Corriger les bugs identifiés</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
