import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Play, Pause, Plus, Settings, Workflow } from 'lucide-react';

const WorkflowBuilderPage: React.FC = () => {
  const workflows = [
    {
      id: 1,
      name: 'Order Processing',
      description: 'Automatise le traitement des commandes',
      status: 'active',
      triggers: 2,
      steps: 5,
      executions: 1234,
    },
    {
      id: 2,
      name: 'Inventory Sync',
      description: 'Synchronise l\'inventaire multi-plateformes',
      status: 'active',
      triggers: 1,
      steps: 3,
      executions: 892,
    },
    {
      id: 3,
      name: 'Customer Onboarding',
      description: 'Workflow d\'accueil des nouveaux clients',
      status: 'draft',
      triggers: 1,
      steps: 4,
      executions: 0,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Workflow Builder</h1>
          <p className="text-muted-foreground">
            Créez et gérez vos workflows d'automatisation
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau workflow
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflows actifs</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">2 en brouillon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exécutions aujourd'hui</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,456</div>
            <p className="text-xs text-muted-foreground">+18% vs hier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de succès</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">37 échecs</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vos workflows</CardTitle>
          <CardDescription>Gérez et surveillez vos automatisations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <GitBranch className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{workflow.name}</h3>
                    <p className="text-sm text-muted-foreground">{workflow.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {workflow.triggers} trigger{workflow.triggers > 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {workflow.steps} étapes
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {workflow.executions.toLocaleString()} exécutions
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={workflow.status === 'active' ? 'default' : 'secondary'}
                  >
                    {workflow.status}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    {workflow.status === 'active' ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowBuilderPage;
