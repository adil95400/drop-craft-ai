import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Lightbulb, AlertCircle } from 'lucide-react';

interface MarketGapsAnalysisProps {
  analyses: any[];
}

export function MarketGapsAnalysis({ analyses }: MarketGapsAnalysisProps) {
  // Extract opportunities from real data
  const opportunities = analyses.flatMap(analysis => {
    if (analysis.market_position && Array.isArray(analysis.market_position)) {
      return analysis.market_position.map((opp: any) => ({
        title: opp.category || opp.opportunity || 'Opportunité de marché',
        description: opp.opportunity || opp.description || '',
        potential: opp.difficulty === 'low' ? 'high' : opp.difficulty === 'high' ? 'low' : 'medium',
        difficulty: opp.difficulty || 'medium',
        estimatedRevenue: opp.potential_revenue || 10000,
        competitors: 0
      }));
    }
    return [];
  }).slice(0, 6);

  // Extract threats from gap_opportunities and competitive data
  const threats = analyses.flatMap(analysis => {
    const threats: any[] = [];
    
    // From gap_opportunities
    if (analysis.gap_opportunities && Array.isArray(analysis.gap_opportunities)) {
      analysis.gap_opportunities.forEach((gap: any) => {
        if (gap.competitor_advantage) {
          threats.push({
            title: gap.missing_feature || 'Écart concurrentiel',
            description: gap.competitor_advantage,
            severity: gap.implementation_priority === 'high' ? 'high' : 'medium',
            impact: `Priorité d'implémentation: ${gap.implementation_priority || 'medium'}`
          });
        }
      });
    }
    
    // Add general threat level
    if (analysis.threat_level && (analysis.threat_level === 'high' || analysis.threat_level === 'critical')) {
      threats.push({
        title: `Menace de ${analysis.competitor_name}`,
        description: `Concurrent identifié comme menace ${analysis.threat_level}`,
        severity: analysis.threat_level,
        impact: 'Surveillance et action requises'
      });
    }
    
    return threats;
  }).slice(0, 5);

  // Fallback if no data
  if (opportunities.length === 0 && threats.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Aucune donnée d'opportunité ou de menace disponible. Lancez des analyses concurrentielles pour voir les résultats.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
