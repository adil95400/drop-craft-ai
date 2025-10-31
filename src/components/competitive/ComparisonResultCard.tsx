import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';

interface ComparisonResultCardProps {
  comparison: any;
}

export function ComparisonResultCard({ comparison }: ComparisonResultCardProps) {
  if (!comparison) return null;

  const { comparison_summary, comparative_matrix, price_comparison, gap_analysis, strategic_recommendations } = comparison;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Leader du Marché</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <p className="text-xl font-bold">{comparison_summary?.market_leader || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Meilleur Prix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-green-500" />
              <p className="text-xl font-bold">{comparison_summary?.price_leader || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Meilleure Qualité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <p className="text-xl font-bold">{comparison_summary?.quality_leader || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitive Matrix */}
      {comparative_matrix && comparative_matrix.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Matrice Comparative</CardTitle>
            <CardDescription>Analyse des forces et faiblesses de chaque concurrent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comparative_matrix.map((comp: any, idx: number) => (
                <div key={idx} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{comp.competitor}</h4>
                    <div className="flex items-center gap-2">
                      <Badge>{comp.market_position || 'N/A'}</Badge>
                      <Badge variant={
                        comp.threat_level === 'high' ? 'destructive' : 
                        comp.threat_level === 'medium' ? 'secondary' : 
                        'outline'
                      }>
                        {comp.threat_level || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-2">Forces</p>
                      <ul className="space-y-1">
                        {(comp.strengths || []).slice(0, 3).map((strength: string, i: number) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-600 mb-2">Faiblesses</p>
                      <ul className="space-y-1">
                        {(comp.weaknesses || []).slice(0, 3).map((weakness: string, i: number) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-amber-500">⚠</span>
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gap Analysis */}
      {gap_analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Analyse des Écarts Concurrentiels</CardTitle>
            <CardDescription>Vos avantages et axes d'amélioration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-semibold text-green-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Vos Avantages
                </h4>
                <ul className="space-y-2">
                  {(gap_analysis.user_advantages || []).map((adv: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-amber-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Points à Améliorer
                </h4>
                <ul className="space-y-2">
                  {(gap_analysis.user_disadvantages || []).map((dis: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-amber-500">⚠</span>
                      <span>{dis}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strategic Recommendations */}
      {strategic_recommendations && strategic_recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommandations Stratégiques</CardTitle>
            <CardDescription>Actions prioritaires pour améliorer votre position</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strategic_recommendations.map((rec: any, idx: number) => (
                <div key={idx} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{rec.action}</h4>
                        <Badge variant={
                          rec.priority === 'high' ? 'destructive' : 
                          rec.priority === 'medium' ? 'secondary' : 
                          'outline'
                        }>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.expected_impact}</p>
                    </div>
                    <Badge variant="outline">{rec.timeframe}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
