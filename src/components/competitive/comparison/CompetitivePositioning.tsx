import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';

interface CompetitivePositioningProps {
  analyses: any[];
}

export function CompetitivePositioning({ analyses }: CompetitivePositioningProps) {
  const getPositionBadge = (position: string) => {
    const variants = {
      leader: { variant: 'default' as const, icon: TrendingUp, label: 'Leader' },
      challenger: { variant: 'secondary' as const, icon: Target, label: 'Challenger' },
      follower: { variant: 'outline' as const, icon: Minus, label: 'Suiveur' },
      niche: { variant: 'secondary' as const, icon: Target, label: 'Niche' }
    };
    
    const config = variants[position as keyof typeof variants] || variants.follower;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  // Extract positioning from real data
  const firstAnalysis = analyses[0];
  const competitiveData = firstAnalysis?.competitive_data || {};
  const priceAnalysis = firstAnalysis?.price_analysis || {};

  const yourPosition = {
    market_position: competitiveData.market_position || 'challenger',
    price_position: competitiveData.price_position || 'competitive',
    quality_score: competitiveData.quality_score || 78,
    strengths: competitiveData.differentiation_factors || [
      'Interface utilisateur moderne',
      'Excellent service client',
      'Fonctionnalités IA avancées',
      'Prix compétitifs'
    ],
    weaknesses: priceAnalysis.pricing_recommendations?.slice(0, 3) || [
      'Optimisation des prix recommandée',
      'Amélioration de la présence en ligne',
      'Expansion du catalogue produits'
    ]
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Votre Positionnement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Position Marché</p>
              {getPositionBadge(yourPosition.market_position)}
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Position Prix</p>
              <Badge variant="secondary">{yourPosition.price_position}</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Score Qualité</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{yourPosition.quality_score}</span>
                <span className="text-muted-foreground">/100</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-semibold text-success flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Forces
              </h4>
              <ul className="space-y-2">
                {yourPosition.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-success">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-warning flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Axes d'amélioration
              </h4>
              <ul className="space-y-2">
                {yourPosition.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-warning">⚠</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {analyses.slice(0, 3).map((analysis) => (
          <Card key={analysis.id}>
            <CardHeader>
              <CardTitle className="text-base">{analysis.competitor_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Position</p>
                {getPositionBadge(analysis.competitive_data?.market_position || 'follower')}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Niveau de menace</p>
                <Badge variant={
                  analysis.threat_level === 'high' ? 'destructive' : 
                  analysis.threat_level === 'medium' ? 'secondary' : 
                  'outline'
                }>
                  {analysis.threat_level}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
