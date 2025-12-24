import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, Calculator, Users } from 'lucide-react';
import { usePricingAutomation } from '@/hooks/usePricingAutomation';
import { Skeleton } from '@/components/ui/skeleton';
import { RepricingDashboard } from '@/components/repricing/RepricingDashboard';

export function PricingAutomationHub() {
  const { analytics, isLoadingAnalytics } = usePricingAutomation();

  if (isLoadingAnalytics) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Règles Actives</p>
                <p className="text-2xl font-bold">{analytics?.active_rules || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Marge Moyenne</p>
                <p className="text-2xl font-bold">{analytics?.avg_margin_percent || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calculator className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profit Net</p>
                <p className="text-2xl font-bold">{analytics?.total_net_profit || 0}€</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concurrents</p>
                <p className="text-2xl font-bold">{analytics?.competitors_tracked || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rules">Règles de Prix</TabsTrigger>
          <TabsTrigger value="profit">Calculateur</TabsTrigger>
          <TabsTrigger value="competitors">Concurrents</TabsTrigger>
          <TabsTrigger value="costs">Coûts Fournisseurs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rules">
          <RepricingDashboard />
        </TabsContent>
        
        <TabsContent value="profit">
          <Card>
            <CardHeader>
              <CardTitle>Calculateur de Bénéfices</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analysez la rentabilité de vos produits</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="competitors">
          <Card>
            <CardHeader>
              <CardTitle>Suivi des Prix Concurrents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Surveillez les prix de vos concurrents</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Coûts Fournisseurs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Gérez l'historique des coûts fournisseurs</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}