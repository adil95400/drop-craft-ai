import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Lightbulb, AlertCircle } from 'lucide-react';

interface MarketGapsAnalysisProps {
  analyses: any[];
}

export function MarketGapsAnalysis({ analyses }: MarketGapsAnalysisProps) {
  const opportunities = [
    {
      title: 'Produits éco-responsables',
      description: 'Segment en forte croissance, faible concurrence actuellement',
      potential: 'high',
      difficulty: 'medium',
      estimatedRevenue: 15000,
      competitors: 2
    },
    {
      title: 'Livraison express 24h',
      description: 'Forte demande client, peu de concurrents proposent ce service',
      potential: 'high',
      difficulty: 'high',
      estimatedRevenue: 25000,
      competitors: 3
    },
    {
      title: 'Programme de fidélité innovant',
      description: 'Aucun concurrent n\'a de système de points gamifié',
      potential: 'medium',
      difficulty: 'low',
      estimatedRevenue: 8000,
      competitors: 0
    },
    {
      title: 'Collections capsules limitées',
      description: 'Créer du FOMO et augmenter l\'engagement',
      potential: 'medium',
      difficulty: 'medium',
      estimatedRevenue: 12000,
      competitors: 4
    }
  ];

  const threats = [
    {
      title: 'Guerre des prix agressive',
      description: '3 concurrents ont baissé leurs prix de 20% ce mois',
      severity: 'high',
      impact: 'Perte de parts de marché estimée à 15%'
    },
    {
      title: 'Nouveaux entrants marketplace',
      description: '2 nouvelles plateformes avec levées de fonds importantes',
      severity: 'medium',
      impact: 'Concurrence accrue sur l\'acquisition client'
    }
  ];

  const getPotentialBadge = (potential: string) => {
    const variants = {
      high: 'default',
      medium: 'secondary',
      low: 'outline'
    } as const;
    return <Badge variant={variants[potential as keyof typeof variants]}>{potential}</Badge>;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-amber-600',
      high: 'text-red-600'
    };
    return colors[difficulty as keyof typeof colors] || colors.medium;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Opportunités de Marché
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {opportunities.map((opp, idx) => (
              <div key={idx} className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <h4 className="font-semibold">{opp.title}</h4>
                      {getPotentialBadge(opp.potential)}
                    </div>
                    <p className="text-sm text-muted-foreground">{opp.description}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Explorer
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue potentiel</p>
                    <p className="font-semibold text-green-600">+{opp.estimatedRevenue}€/mois</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Difficulté</p>
                    <p className={`font-semibold ${getDifficultyColor(opp.difficulty)}`}>
                      {opp.difficulty}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Concurrents</p>
                    <p className="font-semibold">{opp.competitors}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Menaces Identifiées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {threats.map((threat, idx) => (
              <div key={idx} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{threat.title}</h4>
                      <Badge variant={threat.severity === 'high' ? 'destructive' : 'secondary'}>
                        {threat.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{threat.description}</p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm">
                    <span className="font-medium">Impact: </span>
                    <span className="text-muted-foreground">{threat.impact}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
