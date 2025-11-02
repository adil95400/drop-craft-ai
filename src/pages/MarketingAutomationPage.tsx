import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Mail, Users, Target, TrendingUp, Clock } from 'lucide-react';

const MarketingAutomationPage: React.FC = () => {
  const automationWorkflows = [
    {
      id: 1,
      name: 'Welcome Series',
      status: 'active',
      triggers: 3,
      actions: 5,
      conversions: 156,
    },
    {
      id: 2,
      name: 'Cart Abandonment',
      status: 'active',
      triggers: 2,
      actions: 4,
      conversions: 89,
    },
    {
      id: 3,
      name: 'Re-engagement Campaign',
      status: 'paused',
      triggers: 1,
      actions: 3,
      conversions: 45,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Marketing Automation</h1>
          <p className="text-muted-foreground">
            Automatisez vos campagnes marketing et engagez vos clients
          </p>
        </div>
        <Button>
          <Zap className="mr-2 h-4 w-4" />
          Nouveau workflow
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflows actifs</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5%</div>
            <p className="text-xs text-muted-foreground">+4.2% vs mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts engagés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,421</div>
            <p className="text-xs text-muted-foreground">+12% cette semaine</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflows d'automatisation</CardTitle>
          <CardDescription>Gérez vos séquences marketing automatisées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {automationWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{workflow.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {workflow.triggers} triggers
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {workflow.actions} actions
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold">{workflow.conversions}</div>
                    <div className="text-xs text-muted-foreground">conversions</div>
                  </div>
                  <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                    {workflow.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Modifier
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

export default MarketingAutomationPage;
