import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Calculator, Users, Loader2, Plus, RefreshCw } from 'lucide-react';
import { usePricingAutomation } from '@/hooks/usePricingAutomation';
import { Skeleton } from '@/components/ui/skeleton';
import { RepricingDashboard } from '@/components/repricing/RepricingDashboard';

export function PricingAutomationHub() {
  const { 
    analytics, 
    profitCalculations,
    competitorPrices,
    supplierCosts,
    isLoadingAnalytics,
    isLoadingProfits,
    isLoadingCompetitors,
    isLoadingSupplierCosts,
  } = usePricingAutomation();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Règles Actives</p>
                {isLoadingAnalytics ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{analytics?.active_rules || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Marge Moyenne</p>
                {isLoadingAnalytics ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{analytics?.avg_margin_percent || 0}%</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Calculator className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profit Net</p>
                {isLoadingAnalytics ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">{(analytics?.total_net_profit || 0).toFixed(0)}€</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concurrents</p>
                {isLoadingAnalytics ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{analytics?.competitors_tracked || 0}</p>
                )}
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Calculateur de Bénéfices</CardTitle>
                <CardDescription>Analysez la rentabilité de vos produits</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau calcul
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingProfits ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : !profitCalculations || profitCalculations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun calcul de profit</p>
                  <p className="text-sm">Analysez la rentabilité de vos produits</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Prix de vente</TableHead>
                      <TableHead>Coût</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead>Marge</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profitCalculations.map((calc: any) => (
                      <TableRow key={calc.id}>
                        <TableCell className="font-medium">{calc.product_name || 'Produit'}</TableCell>
                        <TableCell>{(calc.selling_price || 0).toFixed(2)}€</TableCell>
                        <TableCell>{(calc.cost_price || 0).toFixed(2)}€</TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          {(calc.net_profit || 0).toFixed(2)}€
                        </TableCell>
                        <TableCell>
                          <Badge variant={calc.margin_percent > 20 ? 'default' : 'secondary'}>
                            {(calc.margin_percent || 0).toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="competitors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Suivi des Prix Concurrents</CardTitle>
                <CardDescription>Surveillez les prix de vos concurrents</CardDescription>
              </div>
              <Button size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingCompetitors ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : !competitorPrices || competitorPrices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune donnée concurrentielle</p>
                  <p className="text-sm">Ajoutez des concurrents à surveiller</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Votre prix</TableHead>
                      <TableHead>Prix concurrent</TableHead>
                      <TableHead>Concurrent</TableHead>
                      <TableHead>Écart</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competitorPrices.map((comp: any) => {
                      const diff = ((comp.my_price - comp.competitor_price) / comp.competitor_price) * 100;
                      return (
                        <TableRow key={comp.id}>
                          <TableCell className="font-medium">{comp.product_name || 'Produit'}</TableCell>
                          <TableCell>{(comp.my_price || 0).toFixed(2)}€</TableCell>
                          <TableCell>{(comp.competitor_price || 0).toFixed(2)}€</TableCell>
                          <TableCell>{comp.competitor_name || 'Concurrent'}</TableCell>
                          <TableCell>
                            <Badge variant={diff > 0 ? 'destructive' : 'default'}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="costs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Coûts Fournisseurs</CardTitle>
                <CardDescription>Gérez l'historique des coûts fournisseurs</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un coût
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingSupplierCosts ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : !supplierCosts || supplierCosts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun historique de coûts</p>
                  <p className="text-sm">Suivez l'évolution des coûts fournisseurs</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Coût unitaire</TableHead>
                      <TableHead>Variation</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierCosts.map((cost: any) => (
                      <TableRow key={cost.id}>
                        <TableCell className="font-medium">{cost.supplier_name || 'Fournisseur'}</TableCell>
                        <TableCell>{cost.product_name || 'Produit'}</TableCell>
                        <TableCell>{(cost.unit_cost || 0).toFixed(2)}€</TableCell>
                        <TableCell>
                          <Badge variant={cost.cost_change > 0 ? 'destructive' : cost.cost_change < 0 ? 'default' : 'secondary'}>
                            {cost.cost_change > 0 ? '+' : ''}{(cost.cost_change || 0).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {cost.recorded_at ? new Date(cost.recorded_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
