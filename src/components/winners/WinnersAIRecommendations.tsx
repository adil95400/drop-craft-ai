import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Target, Zap } from "lucide-react";
import { WinnerProduct } from "@/domains/winners/types";

interface WinnersAIRecommendationsProps {
  products: WinnerProduct[];
  onSelectProduct: (product: WinnerProduct) => void;
}

export const WinnersAIRecommendations = ({ products, onSelectProduct }: WinnersAIRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Array<{
    product: WinnerProduct;
    reason: string;
    confidence: number;
  }>>([]);

  useEffect(() => {
    if (products.length === 0) return;

    // AI-based recommendation algorithm
    const scored = products.map(product => {
      let confidence = 0;
      let reasons = [];

      // High score
      if ((product.final_score || 0) > 85) {
        confidence += 30;
        reasons.push("Score exceptionnel");
      }

      // Good price point
      if (product.price < 50 && product.price > 10) {
        confidence += 20;
        reasons.push("Prix optimal");
      }

      // Strong social proof
      if ((product.reviews || 0) > 100) {
        confidence += 25;
        reasons.push("Forte preuve sociale");
      }

      // High demand
      if (product.market_demand > 75) {
        confidence += 25;
        reasons.push("Demande élevée");
      }

      return {
        product,
        reason: reasons.join(" • "),
        confidence
      };
    });

    // Sort by confidence and take top 5
    const top = scored
      .filter(s => s.confidence > 40)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    setRecommendations(top);
  }, [products]);

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Recommandations IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Lancez une recherche pour obtenir des recommandations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Recommandations IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec, idx) => (
          <div 
            key={rec.product.id}
            className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => onSelectProduct(rec.product)}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{['🥇', '🥈', '🥉', '🏅', '⭐'][idx]}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">
                  {rec.product.title}
                </p>
              </div>
              <Badge 
                variant={rec.confidence > 70 ? "default" : "secondary"}
                className="text-xs"
              >
                {rec.confidence}%
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              <span className="line-clamp-1">{rec.reason}</span>
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-semibold text-primary">
                €{rec.product.price.toFixed(2)}
              </span>
              <Button size="sm" variant="ghost" onClick={(e) => {
                e.stopPropagation();
                onSelectProduct(rec.product);
              }}>
                <Zap className="h-3 w-3 mr-1" />
                Importer
              </Button>
            </div>
          </div>
        ))}

        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground text-center">
            💡 Basé sur vos critères et l'analyse de marché
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
