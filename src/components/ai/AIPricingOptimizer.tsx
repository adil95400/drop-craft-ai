import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAIServices } from '@/hooks/useAIServices';
import { Loader2, TrendingUp, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const AIPricingOptimizer = () => {
  const [currentPrice, setCurrentPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [pricingData, setPricingData] = useState<any>(null);

  const { optimizePricing } = useAIServices();

  const handleOptimize = async () => {
    const result = await optimizePricing.mutateAsync({
      productId: 'demo-product',
      currentPrice: parseFloat(currentPrice),
      costPrice: parseFloat(costPrice),
      competitorPrices: [
        { price: parseFloat(currentPrice) * 0.95, competitor: 'Concurrent A' },
        { price: parseFloat(currentPrice) * 1.05, competitor: 'Concurrent B' }
      ],
      salesHistory: [],
      marketData: { demand: 'high' }
    });

    setPricingData(result.pricing);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Optimisateur de Prix IA
        </CardTitle>
        <CardDescription>
          Trouvez le prix optimal pour maximiser vos profits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currentPrice">Prix Actuel (€)</Label>
            <Input
              id="currentPrice"
              type="number"
              step="0.01"
              placeholder="99.99"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="costPrice">Prix de Revient (€)</Label>
            <Input
              id="costPrice"
              type="number"
              step="0.01"
              placeholder="50.00"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />
          </div>
        </div>

        <Button 
          onClick={handleOptimize} 
          disabled={optimizePricing.isPending || !currentPrice || !costPrice}
          className="w-full"
        >
          {optimizePricing.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Optimisation en cours...
            </>
          ) : (
            <>
              <DollarSign className="mr-2 h-4 w-4" />
              Optimiser le Prix
            </>
          )}
        </Button>

        {pricingData && (
          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recommandations IA</h3>
              <Badge variant="secondary">Optimisé</Badge>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Prix Minimum
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    €{pricingData.minPrice?.toFixed(2) || '0.00'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-primary">
                    Prix Recommandé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    €{pricingData.recommendedPrice?.toFixed(2) || '0.00'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Prix Maximum
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    €{pricingData.maxPrice?.toFixed(2) || '0.00'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {pricingData.reasoning && (
              <div className="space-y-2">
                <Label>Analyse et Recommandations</Label>
                <div className="p-4 bg-muted rounded-lg text-sm">
                  {pricingData.reasoning}
                </div>
              </div>
            )}

            {pricingData.margin && (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <span className="text-sm font-medium">Marge Estimée</span>
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                  {pricingData.margin}%
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
