import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WinnerProduct } from "@/domains/winners/types";
import { Check, X, TrendingUp, DollarSign, Star, ShoppingCart, GitCompare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface WinnersComparisonProps {
  products: WinnerProduct[];
  selectedIds: string[];
  onCompare: (ids: string[]) => void;
}

export const WinnersComparison = ({ products, selectedIds, onCompare }: WinnersComparisonProps) => {
  const [showComparison, setShowComparison] = useState(false);
  
  const selectedProducts = products.filter(p => selectedIds.includes(p.id));

  if (selectedIds.length === 0) {
    return (
      <Card className="p-6 text-center">
        <GitCompare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">
          Sélectionnez 2-4 produits pour les comparer
        </p>
      </Card>
    );
  }

  const compareMetrics = [
    {
      label: "Score Tendance",
      icon: TrendingUp,
      getValue: (p: WinnerProduct) => p.trending_score,
      format: (v: number) => `${v}/100`,
      color: "text-blue-500"
    },
    {
      label: "Prix",
      icon: DollarSign,
      getValue: (p: WinnerProduct) => p.price,
      format: (v: number) => `€${v.toFixed(2)}`,
      color: "text-green-500",
      inverse: true // Lower is better
    },
    {
      label: "Note",
      icon: Star,
      getValue: (p: WinnerProduct) => p.rating || 0,
      format: (v: number) => `${v.toFixed(1)}/5`,
      color: "text-yellow-500"
    },
    {
      label: "Avis",
      icon: ShoppingCart,
      getValue: (p: WinnerProduct) => p.reviews || 0,
      format: (v: number) => v.toLocaleString(),
      color: "text-purple-500"
    },
    {
      label: "Demande Marché",
      icon: TrendingUp,
      getValue: (p: WinnerProduct) => p.market_demand,
      format: (v: number) => `${v}/100`,
      color: "text-orange-500"
    }
  ];

  const getBestProduct = (metric: typeof compareMetrics[0]) => {
    if (selectedProducts.length === 0) return null;
    
    return selectedProducts.reduce((best, current) => {
      const bestValue = metric.getValue(best);
      const currentValue = metric.getValue(current);
      
      if (metric.inverse) {
        return currentValue < bestValue ? current : best;
      }
      return currentValue > bestValue ? current : best;
    });
  };

  return (
    <>
      <Button 
        onClick={() => setShowComparison(true)}
        className="w-full"
        disabled={selectedIds.length < 2}
      >
        <GitCompare className="h-4 w-4 mr-2" />
        Comparer {selectedIds.length} produits
      </Button>

      <Dialog open={showComparison} onOpenChange={setShowComparison}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comparaison de Produits Winners</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Products Header */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${selectedProducts.length}, 1fr)` }}>
              <div className="font-semibold"></div>
              {selectedProducts.map(product => (
                <Card key={product.id} className="p-4">
                  <img 
                    src={product.image} 
                    alt={product.title}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                  <h4 className="font-semibold text-sm line-clamp-2 mb-2">
                    {product.title}
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {product.source}
                  </Badge>
                </Card>
              ))}
            </div>

            {/* Comparison Metrics */}
            {compareMetrics.map((metric) => {
              const bestProduct = getBestProduct(metric);
              
              return (
                <div 
                  key={metric.label}
                  className="grid gap-4 items-center"
                  style={{ gridTemplateColumns: `200px repeat(${selectedProducts.length}, 1fr)` }}
                >
                  <div className="flex items-center gap-2 font-medium">
                    <metric.icon className={`h-4 w-4 ${metric.color}`} />
                    {metric.label}
                  </div>
                  {selectedProducts.map(product => {
                    const value = metric.getValue(product);
                    const isBest = bestProduct?.id === product.id;
                    
                    return (
                      <Card 
                        key={product.id} 
                        className={`p-4 ${isBest ? 'border-primary border-2' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold">
                            {metric.format(value)}
                          </span>
                          {isBest && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              );
            })}

            {/* AI Recommendation */}
            <Card className="p-4 bg-primary/5 border-primary/20">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Recommandation IA
              </h4>
              {(() => {
                const scores = selectedProducts.map(p => ({
                  product: p,
                  totalScore: (p.trending_score || 0) + (p.market_demand || 0) + ((p.rating || 0) * 20) - (p.price / 2)
                }));
                const best = scores.sort((a, b) => b.totalScore - a.totalScore)[0];
                
                return (
                  <p className="text-sm">
                    <span className="font-semibold">{best.product.title}</span> présente le meilleur potentiel global avec un excellent équilibre entre score de tendance, demande du marché et rapport qualité-prix.
                  </p>
                );
              })()}
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
