import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FlaskConical, Plus, Trophy, TrendingUp, TrendingDown, ArrowRight, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ABTest {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'draft';
  variantA: { name: string; impressions: number; clicks: number; conversions: number; ctr: number; spend: number };
  variantB: { name: string; impressions: number; clicks: number; conversions: number; ctr: number; spend: number };
  winner?: 'A' | 'B';
  confidence: number;
  startDate: string;
}

const DEMO_TESTS: ABTest[] = [
  {
    id: '1',
    name: 'Titre accrocheur vs Descriptif',
    status: 'running',
    variantA: { name: 'Titre émotionnel 🔥', impressions: 12400, clicks: 620, conversions: 45, ctr: 5.0, spend: 180 },
    variantB: { name: 'Titre descriptif ℹ️', impressions: 12200, clicks: 488, conversions: 32, ctr: 4.0, spend: 175 },
    confidence: 87,
    startDate: '2026-03-15',
  },
  {
    id: '2',
    name: 'Image lifestyle vs Fond blanc',
    status: 'completed',
    variantA: { name: 'Lifestyle 📸', impressions: 25000, clicks: 1250, conversions: 94, ctr: 5.0, spend: 420 },
    variantB: { name: 'Fond blanc 🏷️', impressions: 24800, clicks: 992, conversions: 68, ctr: 4.0, spend: 415 },
    winner: 'A',
    confidence: 95,
    startDate: '2026-03-01',
  },
];

export function AdsABTesting() {
  const [tests] = useState<ABTest[]>(DEMO_TESTS);
  const [showCreate, setShowCreate] = useState(false);

  const getStatusBadge = (status: string) => {
    if (status === 'running') return <Badge className="bg-success hover:bg-success">En cours</Badge>;
    if (status === 'completed') return <Badge variant="outline">Terminé</Badge>;
    return <Badge variant="secondary">Brouillon</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Tests actifs</p>
          <p className="text-2xl font-bold">{tests.filter(t => t.status === 'running').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Tests terminés</p>
          <p className="text-2xl font-bold">{tests.filter(t => t.status === 'completed').length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Taux de victoire moyen</p>
          <p className="text-2xl font-bold text-success">+24%</p>
        </Card>
      </div>

      {/* Tests list */}
      {tests.map(test => {
        const aWins = test.variantA.conversions > test.variantB.conversions;
        const lift = aWins
          ? ((test.variantA.conversions - test.variantB.conversions) / test.variantB.conversions * 100)
          : ((test.variantB.conversions - test.variantA.conversions) / test.variantA.conversions * 100);

        return (
          <Card key={test.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FlaskConical className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">{test.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Depuis le {new Date(test.startDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(test.status)}
                  {test.confidence >= 95 && <Badge variant="outline" className="text-success border-success/30">Significatif</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Variants comparison */}
              <div className="grid md:grid-cols-2 gap-4">
                {[test.variantA, test.variantB].map((variant, vi) => {
                  const label = vi === 0 ? 'A' : 'B';
                  const isWinner = test.winner === label;
                  const isLeading = (vi === 0 && aWins) || (vi === 1 && !aWins);

                  return (
                    <div key={vi} className={cn(
                      'p-4 rounded-lg border-2 transition-all relative',
                      isWinner ? 'border-success bg-success/5' : isLeading ? 'border-primary/40 bg-primary/5' : 'border-border'
                    )}>
                      {isWinner && (
                        <div className="absolute -top-3 right-3">
                          <Badge className="bg-success hover:bg-success gap-1"><Trophy className="h-3 w-3" />Gagnant</Badge>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="font-mono">{label}</Badge>
                        <span className="font-medium text-sm">{variant.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Impressions</p>
                          <p className="font-semibold">{variant.impressions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Clics</p>
                          <p className="font-semibold">{variant.clicks.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Conversions</p>
                          <p className="font-semibold text-primary">{variant.conversions}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">CTR</p>
                          <p className="font-semibold">{variant.ctr.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Confidence bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Confiance statistique</span>
                  <span className="font-medium">{test.confidence}%</span>
                </div>
                <Progress value={test.confidence} className="h-2" />
                <div className="flex items-center gap-2 text-sm">
                  {aWins ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                  <span>Variante {aWins ? 'A' : 'B'} surperforme de <strong className="text-success">+{lift.toFixed(1)}%</strong></span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* CTA */}
      <Card className="p-6 border-dashed border-2">
        <div className="text-center">
          <FlaskConical className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium mb-1">Créer un nouveau test A/B</p>
          <p className="text-sm text-muted-foreground mb-4">Testez vos titres, visuels, audiences et CTA</p>
          <Button><Plus className="h-4 w-4 mr-2" />Nouveau test</Button>
        </div>
      </Card>
    </div>
  );
}
