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
    <div className="container mx-auto px-4 py-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Marketing Automation</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Automatisez vos campagnes marketing
          </p>
        </div>
        <Button size="sm" className="self-start sm:self-auto sm:size-default">
          <Zap className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="sm:hidden">Nouveau</span>
          <span className="hidden sm:inline">Nouveau workflow</span>
        </Button>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Workflows</CardTitle>
            <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">12</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">+2 ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Conversion</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">24.5%</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">+4.2% vs dernier</p>
          </CardContent>
        </Card>

        <Card className="col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Contacts engagés</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">3,421</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">+12% cette semaine</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Workflows d'automatisation</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Gérez vos séquences marketing</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="space-y-3 sm:space-y-4">
            {automationWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold">{workflow.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        {workflow.triggers} triggers
                      </span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">•</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        {workflow.actions} actions
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 ml-11 sm:ml-0">
                  <div className="text-left sm:text-right">
                    <div className="text-sm font-semibold">{workflow.conversions}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">conversions</div>
                  </div>
                  <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {workflow.status}
                  </Badge>
                  <Button variant="outline" size="sm" className="text-xs">
                    <span className="hidden sm:inline">Modifier</span>
                    <span className="sm:hidden">Edit</span>
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
