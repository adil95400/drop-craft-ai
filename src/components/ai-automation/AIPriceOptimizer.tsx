import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, TrendingUp, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';
import { useAIAutomation } from '@/hooks/useAIAutomation';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

export function AIPriceOptimizer() {
  const [productName, setProductName] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [category, setCategory] = useState('');
  const [competitorPrices, setCompetitorPrices] = useState('');

  const { optimizePriceAsync, isOptimizingPrice, priceData } = useAIAutomation();

  const handleOptimize = async () => {
    if (!productName || !currentPrice || !costPrice) return;

    await optimizePriceAsync({
      productName,
      currentPrice: parseFloat(currentPrice),
      costPrice: parseFloat(costPrice),
      category,
      competitorPrices: competitorPrices.split(',').map(p => parseFloat(p.trim())).filter(Boolean),
      marketConditions: 'Normal',
    });
  };

  const analysis = priceData?.analysis;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Optimiseur de Prix IA
          </CardTitle>
          <CardDescription>
            Analysez et optimisez vos prix pour maximiser les profits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nom du produit *</Label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ex: Montre connectée Sport"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prix actuel ($) *</Label>
              <Input
                type="number"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                placeholder="299.99"
              />
            </div>

            <div className="space-y-2">
              <Label>Prix de revient ($) *</Label>
              <Input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="150.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Électronique"
            />
          </div>

          <div className="space-y-2">
            <Label>Prix concurrents (séparés par des virgules)</Label>
            <Input
              value={competitorPrices}
              onChange={(e) => setCompetitorPrices(e.target.value)}
              placeholder="Ex: 279.99, 319.99, 289.99"
            />
          </div>

          <Button
            onClick={handleOptimize}
            disabled={!productName || !currentPrice || !costPrice || isOptimizingPrice}
            className="w-full"
          >
            {isOptimizingPrice ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Analyser et optimiser
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analyse et recommandations</CardTitle>
          <CardDescription>
            Stratégie de prix optimisée par l'IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!analysis ? (
            <div className="text-center py-12 text-muted-foreground">
              Remplissez le formulaire pour obtenir une analyse de prix
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-primary/5 border-primary">
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">Prix recommandé</div>
                    <div className="text-3xl font-bold text-primary">
                      ${analysis.recommendedPrice?.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Marge: {analysis.profitMargin?.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">Confiance</div>
                    <div className="space-y-2">
                      <Progress value={analysis.confidence || 0} className="h-2" />
                      <div className="text-2xl font-bold">
                        {analysis.confidence || 0}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <Label>Stratégie recommandée</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <Badge variant="outline" className="mb-2">{analysis.strategy}</Badge>
                  <p className="text-sm">{analysis.reasoning}</p>
                </div>
              </div>

              {analysis.discountRecommendation && (
                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Promotion suggérée:</strong> {analysis.discountRecommendation.suggested}% 
                    {' '}{analysis.discountRecommendation.timing}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      Impact: {analysis.discountRecommendation.expectedImpact}
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {analysis.opportunities && analysis.opportunities.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Opportunités
                  </Label>
                  <ul className="space-y-1 text-sm">
                    {analysis.opportunities.map((opp: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span>{opp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.risks && analysis.risks.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    Risques à considérer
                  </Label>
                  <ul className="space-y-1 text-sm">
                    {analysis.risks.map((risk: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
