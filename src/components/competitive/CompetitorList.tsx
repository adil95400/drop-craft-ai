import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCompetitiveAnalysis } from '@/hooks/useCompetitiveAnalysis';
import { Trash2, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

export function CompetitorList() {
  const { analyses, isLoading, deleteAnalysis } = useCompetitiveAnalysis();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Chargement des analyses...
        </CardContent>
      </Card>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Aucune analyse de concurrent. Ajoutez-en une pour commencer.
        </CardContent>
      </Card>
    );
  }

  const getThreatBadge = (level?: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      high: { variant: 'destructive', label: 'Menace élevée', icon: TrendingUp },
      medium: { variant: 'default', label: 'Menace moyenne', icon: Minus },
      low: { variant: 'secondary', label: 'Menace faible', icon: TrendingDown },
    };
    
    const threat = variants[level || 'low'];
    const Icon = threat.icon;
    
    return (
      <Badge variant={threat.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {threat.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {analyses.map((analysis) => (
        <Card key={analysis.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">
                  {analysis.competitor_name}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    Analysé le {format(new Date(analysis.created_at), 'PPp', { locale: getDateFnsLocale() })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getThreatBadge(analysis.threat_level)}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteAnalysis.mutate(analysis.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {analysis.competitive_data && (
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {analysis.competitive_data.productCount !== undefined && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Produits</p>
                    <p className="text-2xl font-bold">{analysis.competitive_data.productCount}</p>
                  </div>
                )}
                
                {analysis.price_analysis?.averagePrice !== undefined && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Prix moyen</p>
                    <p className="text-2xl font-bold">{analysis.price_analysis.averagePrice}€</p>
                  </div>
                )}
                
                {analysis.competitive_data.seoScore !== undefined && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Score SEO</p>
                    <p className="text-2xl font-bold">{analysis.competitive_data.seoScore}/100</p>
                  </div>
                )}
                
                {analysis.market_position?.competitiveness !== undefined && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Compétitivité</p>
                    <p className="text-2xl font-bold">{Math.round(analysis.market_position.competitiveness)}%</p>
                  </div>
                )}
              </div>

              {analysis.gap_opportunities && 
               Array.isArray(analysis.gap_opportunities) && 
               analysis.gap_opportunities.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold text-sm">Opportunités identifiées</h4>
                  <ul className="space-y-1">
                    {analysis.gap_opportunities.slice(0, 3).map((gap: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
