import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProductResearch } from '@/hooks/useProductResearch';
import { Award, TrendingUp, DollarSign, Users, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export function WinningScoreCard() {
  const { savedProducts } = useProductResearch();

  if (!savedProducts || savedProducts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Aucun produit analysé</p>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Utilisez les onglets ci-dessus pour scanner des tendances ou analyser des produits viraux
          </p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: '🏆 GAGNANT', variant: 'default' as const };
    if (score >= 60) return { label: '⭐ POTENTIEL', variant: 'secondary' as const };
    return { label: '⚠️ RISQUÉ', variant: 'outline' as const };
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Produits Analysés - Score "Winning"
          </CardTitle>
          <CardDescription>
            Classement des produits par potentiel de succès
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {savedProducts
          .sort((a, b) => (b.winning_score || 0) - (a.winning_score || 0))
          .map((product) => {
            const scoreBadge = getScoreBadge(product.winning_score || 0);
            return (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-xl">{product.product_name}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{product.category}</Badge>
                        {product.source_platform && (
                          <Badge variant="secondary">{product.source_platform}</Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant={scoreBadge.variant} className="ml-2">
                      {scoreBadge.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Score "Winning"</span>
                      <span className={`text-2xl font-bold ${getScoreColor(product.winning_score || 0)}`}>
                        {product.winning_score}%
                      </span>
                    </div>
                    <Progress value={product.winning_score || 0} className="h-3" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tendance</p>
                        <p className="font-semibold">{product.trend_score}%</p>
                      </div>
                    </div>
                    
                    {product.viral_score && (
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-orange-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Viral</p>
                          <p className="font-semibold">{product.viral_score}%</p>
                        </div>
                      </div>
                    )}
                    
                    {product.profit_margin && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Marge</p>
                          <p className="font-semibold">{product.profit_margin}%</p>
                        </div>
                      </div>
                    )}
                    
                    {product.search_volume && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Recherches</p>
                          <p className="font-semibold">{product.search_volume.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {product.saturation_level && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Saturation Marché</span>
                      <Badge variant={
                        product.saturation_level === 'low' ? 'default' :
                        product.saturation_level === 'medium' ? 'secondary' : 
                        'destructive'
                      }>
                        {product.saturation_level.toUpperCase()}
                      </Badge>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" size="sm">
                      Ajouter au Catalogue
                    </Button>
                    <Button variant="default" className="flex-1" size="sm">
                      Analyser Plus en Détail
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
