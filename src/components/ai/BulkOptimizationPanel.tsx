import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Sparkles, Zap, TrendingUp, FileText, Loader2 } from 'lucide-react';
import { UnifiedProduct } from '@/hooks/useUnifiedProducts';
import { useAIServices } from '@/hooks/useAIServices';
import { useToast } from '@/hooks/use-toast';

interface BulkOptimizationPanelProps {
  products: UnifiedProduct[];
  onComplete?: () => void;
}

export const BulkOptimizationPanel = ({ products, onComplete }: BulkOptimizationPanelProps) => {
  const { toast } = useToast();
  const { generateProductDescription, optimizePricing } = useAIServices();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [optimizeDescriptions, setOptimizeDescriptions] = useState(true);
  const [optimizePrices, setOptimizePrices] = useState(true);
  const [results, setResults] = useState<any[]>([]);

  const handleBulkOptimization = async () => {
    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    const totalProducts = products.length;
    const newResults: any[] = [];

    for (let i = 0; i < totalProducts; i++) {
      const product = products[i];
      const productResult: any = { productId: product.id, name: product.name };

      try {
        // Optimize description
        if (optimizeDescriptions) {
          const descResult = await generateProductDescription.mutateAsync({
            productName: product.name,
            category: product.category || 'General',
            features: product.description?.split(',') || [],
            tone: 'professional',
            length: 'medium'
          });
          productResult.description = descResult.description;
        }

        // Optimize pricing
        if (optimizePrices) {
          const priceResult = await optimizePricing.mutateAsync({
            productId: product.id,
            currentPrice: product.price,
            costPrice: product.cost_price || product.price * 0.6,
            competitorPrices: [
              { price: product.price * 0.95, competitor: 'Competitor A' },
              { price: product.price * 1.05, competitor: 'Competitor B' }
            ],
            salesHistory: [],
            marketData: { demand: 'high' }
          });
          productResult.pricing = priceResult.pricing;
        }

        productResult.success = true;
      } catch (error) {
        console.error(`Error optimizing product ${product.id}:`, error);
        productResult.success = false;
        productResult.error = error instanceof Error ? error.message : 'Unknown error';
      }

      newResults.push(productResult);
      setResults([...newResults]);
      setProgress(((i + 1) / totalProducts) * 100);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsProcessing(false);
    toast({
      title: 'Optimisation terminée',
      description: `${newResults.filter(r => r.success).length}/${totalProducts} produits optimisés`,
    });
    onComplete?.();
  };

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Optimisation en Masse
        </CardTitle>
        <CardDescription>
          Optimisez plusieurs produits simultanément avec l'IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-semibold">{products.length} produits sélectionnés</p>
              <p className="text-sm text-muted-foreground">
                Prêts pour l'optimisation IA
              </p>
            </div>
            <Badge variant="secondary" className="text-lg">
              {products.length}
            </Badge>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Options d'optimisation</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="optimize-descriptions"
                checked={optimizeDescriptions}
                onCheckedChange={(checked) => setOptimizeDescriptions(checked as boolean)}
                disabled={isProcessing}
              />
              <Label
                htmlFor="optimize-descriptions"
                className="flex items-center gap-2 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-primary" />
                Optimiser les descriptions
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="optimize-prices"
                checked={optimizePrices}
                onCheckedChange={(checked) => setOptimizePrices(checked as boolean)}
                disabled={isProcessing}
              />
              <Label
                htmlFor="optimize-prices"
                className="flex items-center gap-2 cursor-pointer"
              >
                <TrendingUp className="h-4 w-4 text-primary" />
                Optimiser les prix
              </Label>
            </div>
          </div>

          <Button
            onClick={handleBulkOptimization}
            disabled={isProcessing || (!optimizeDescriptions && !optimizePrices)}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Optimisation en cours... {Math.round(progress)}%
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Lancer l'Optimisation IA
              </>
            )}
          </Button>

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                {Math.round(progress)}% complété
              </p>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Résultats</h4>
              <div className="flex gap-2">
                <Badge variant="default" className="bg-green-500">
                  ✓ {successCount}
                </Badge>
                {failureCount > 0 && (
                  <Badge variant="destructive">✗ {failureCount}</Badge>
                )}
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.success
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{result.name}</p>
                    <Badge variant={result.success ? 'default' : 'destructive'}>
                      {result.success ? 'Optimisé' : 'Échec'}
                    </Badge>
                  </div>
                  {result.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {result.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
