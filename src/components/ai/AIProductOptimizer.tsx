import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, TrendingUp, FileText, Loader2 } from 'lucide-react';
import { useAIServices } from '@/hooks/useAIServices';
import { UnifiedProduct } from '@/hooks/useUnifiedProducts';
import { useToast } from '@/hooks/use-toast';

interface AIProductOptimizerProps {
  product: UnifiedProduct;
  onOptimized?: () => void;
}

export const AIProductOptimizer = ({ product, onOptimized }: AIProductOptimizerProps) => {
  const { toast } = useToast();
  const { generateProductDescription, optimizePricing } = useAIServices();
  const [optimizedData, setOptimizedData] = useState<any>(null);

  const handleDescriptionOptimization = async () => {
    try {
      const result = await generateProductDescription.mutateAsync({
        productName: product.name,
        category: product.category || 'General',
        features: product.description?.split(',') || [],
        tone: 'professional',
        length: 'medium'
      });

      setOptimizedData({ type: 'description', data: result });
      toast({
        title: 'Description optimisée',
        description: 'La description a été générée avec succès'
      });
      onOptimized?.();
    } catch (error) {
      console.error('Description optimization error:', error);
    }
  };

  const handlePricingOptimization = async () => {
    try {
      const result = await optimizePricing.mutateAsync({
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

      setOptimizedData({ type: 'pricing', data: result });
      toast({
        title: 'Prix optimisé',
        description: 'Le prix optimal a été calculé'
      });
      onOptimized?.();
    } catch (error) {
      console.error('Pricing optimization error:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Optimisation IA - {product.name}
        </CardTitle>
        <CardDescription>
          Utilisez l'IA pour optimiser description et prix
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="description" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Prix
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="space-y-4">
            <div className="space-y-3">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Description actuelle:</p>
                <p className="text-sm">{product.description || 'Aucune description'}</p>
              </div>

              <Button
                onClick={handleDescriptionOptimization}
                disabled={generateProductDescription.isPending}
                className="w-full"
              >
                {generateProductDescription.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Générer Description IA
                  </>
                )}
              </Button>

              {optimizedData?.type === 'description' && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Description Optimisée</h4>
                    <Badge>Nouveau</Badge>
                  </div>
                  <p className="text-sm">{optimizedData.data.description}</p>
                  {optimizedData.data.tokensUsed && (
                    <p className="text-xs text-muted-foreground">
                      {optimizedData.data.tokensUsed} tokens utilisés
                    </p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Prix actuel</p>
                  <p className="text-2xl font-bold">{product.price.toFixed(2)}€</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Prix de revient</p>
                  <p className="text-2xl font-bold">
                    {(product.cost_price || product.price * 0.6).toFixed(2)}€
                  </p>
                </div>
              </div>

              <Button
                onClick={handlePricingOptimization}
                disabled={optimizePricing.isPending}
                className="w-full"
              >
                {optimizePricing.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Optimiser Prix avec IA
                  </>
                )}
              </Button>

              {optimizedData?.type === 'pricing' && optimizedData.data.pricing && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Card className="border-primary/20">
                      <CardContent className="pt-4 text-center">
                        <p className="text-xs text-muted-foreground">Min</p>
                        <p className="text-lg font-bold">
                          {optimizedData.data.pricing.minPrice?.toFixed(2)}€
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-primary bg-primary/5">
                      <CardContent className="pt-4 text-center">
                        <p className="text-xs text-primary">Recommandé</p>
                        <p className="text-lg font-bold text-primary">
                          {optimizedData.data.pricing.recommendedPrice?.toFixed(2)}€
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-primary/20">
                      <CardContent className="pt-4 text-center">
                        <p className="text-xs text-muted-foreground">Max</p>
                        <p className="text-lg font-bold">
                          {optimizedData.data.pricing.maxPrice?.toFixed(2)}€
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {optimizedData.data.pricing.reasoning && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs font-medium mb-1">Analyse</p>
                      <p className="text-sm">{optimizedData.data.pricing.reasoning}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
