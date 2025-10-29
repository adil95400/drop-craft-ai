import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, Target } from 'lucide-react';
import { useCRMDeals } from '@/hooks/useCRMDeals';

export function SalesPipeline() {
  const { deals, stats, isLoading } = useCRMDeals();

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  const stages = [
    { key: 'prospecting', label: 'Prospection', color: 'bg-blue-500' },
    { key: 'qualification', label: 'Qualification', color: 'bg-purple-500' },
    { key: 'proposal', label: 'Proposition', color: 'bg-yellow-500' },
    { key: 'negotiation', label: 'Négociation', color: 'bg-orange-500' },
    { key: 'closed_won', label: 'Gagné', color: 'bg-green-500' },
    { key: 'closed_lost', label: 'Perdu', color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR',
                    maximumFractionDigits: 0 
                  }).format(stats.totalValue)}
                </div>
                <div className="text-sm text-muted-foreground">Valeur totale</div>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR',
                    maximumFractionDigits: 0 
                  }).format(stats.weightedValue)}
                </div>
                <div className="text-sm text-muted-foreground">Valeur pondérée</div>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR',
                    maximumFractionDigits: 0 
                  }).format(stats.avgDealSize)}
                </div>
                <div className="text-sm text-muted-foreground">Taille moy. deal</div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline de Ventes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {stages.map((stage) => {
            const stageDeals = deals.filter(d => d.stage === stage.key);
            const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
            const percentage = stats.totalValue > 0 
              ? (stageValue / stats.totalValue) * 100 
              : 0;

            return (
              <div key={stage.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={stage.color}>{stage.label}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {stageDeals.length} deal(s)
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {new Intl.NumberFormat('fr-FR', { 
                        style: 'currency', 
                        currency: 'EUR',
                        maximumFractionDigits: 0 
                      }).format(stageValue)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
                
                {stageDeals.length > 0 && (
                  <div className="ml-4 space-y-2 mt-2">
                    {stageDeals.slice(0, 3).map((deal) => (
                      <div key={deal.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                        <span className="font-medium">{deal.name}</span>
                        <span className="text-muted-foreground">
                          {new Intl.NumberFormat('fr-FR', { 
                            style: 'currency', 
                            currency: 'EUR' 
                          }).format(deal.value)}
                        </span>
                      </div>
                    ))}
                    {stageDeals.length > 3 && (
                      <div className="text-xs text-muted-foreground ml-2">
                        +{stageDeals.length - 3} autre(s) deal(s)
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
