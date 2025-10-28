import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAdsManagerNew } from '@/hooks/useAdsManagerNew';
import { FlaskConical, Trophy, TrendingUp } from 'lucide-react';

export function ABTestingDashboard() {
  const { abTests, isLoadingABTests } = useAdsManagerNew();

  if (isLoadingABTests) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-500">En cours</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Terminé</Badge>;
      case 'paused':
        return <Badge variant="secondary">En pause</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-primary" />
          A/B Testing
        </h2>
        <p className="text-muted-foreground mt-1">
          Testez et optimisez vos créatifs automatiquement
        </p>
      </div>

      {(!abTests || abTests.length === 0) ? (
        <Card className="p-12 text-center">
          <FlaskConical className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            Aucun test A/B en cours. Créez votre premier test depuis l'onglet Créatifs.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {abTests.map((test: any) => {
            const variantAWinRate = test.variant_a_results?.conversions || 0;
            const variantBWinRate = test.variant_b_results?.conversions || 0;
            const total = variantAWinRate + variantBWinRate;
            const variantAPercentage = total > 0 ? (variantAWinRate / total) * 100 : 50;
            const variantBPercentage = total > 0 ? (variantBWinRate / total) * 100 : 50;

            return (
              <Card key={test.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{test.test_name}</h3>
                      {getStatusBadge(test.status)}
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      Test de {test.test_type}
                    </p>
                  </div>
                  
                  {test.winner && (
                    <Badge className="bg-yellow-500">
                      <Trophy className="h-3 w-3 mr-1" />
                      Gagnant: {test.winner}
                    </Badge>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Variante A</span>
                      <Badge variant="outline">{variantAPercentage.toFixed(1)}%</Badge>
                    </div>
                    <Progress value={variantAPercentage} className="h-2" />
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Impressions</p>
                        <p className="font-semibold">{test.variant_a_results?.impressions?.toLocaleString() || '0'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Clics</p>
                        <p className="font-semibold">{test.variant_a_results?.clicks || '0'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Conv.</p>
                        <p className="font-semibold">{test.variant_a_results?.conversions || '0'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Variante B</span>
                      <Badge variant="outline">{variantBPercentage.toFixed(1)}%</Badge>
                    </div>
                    <Progress value={variantBPercentage} className="h-2" />
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Impressions</p>
                        <p className="font-semibold">{test.variant_b_results?.impressions?.toLocaleString() || '0'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Clics</p>
                        <p className="font-semibold">{test.variant_b_results?.clicks || '0'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Conv.</p>
                        <p className="font-semibold">{test.variant_b_results?.conversions || '0'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {test.confidence_level && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">Niveau de confiance:</span>
                    <span className="font-semibold">{test.confidence_level}%</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
