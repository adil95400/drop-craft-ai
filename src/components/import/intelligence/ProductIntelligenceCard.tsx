import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Globe, 
  Search, 
  DollarSign, 
  Package,
  ArrowRight,
  ExternalLink,
  Sparkles,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SupplierResult {
  id: string;
  platform: string;
  platformName: string;
  searchUrl: string;
  estimatedPrice: number;
  confidence: number;
  potentialMargin?: {
    profit: number;
    marginPercent: number;
    roi: number;
  };
  recommendations: Array<{
    type: string;
    message: string;
  }>;
}

interface MarginSuggestion {
  recommendation: {
    strategy: string;
    suggestedPrice: number;
    profit: number;
    margin: number;
    reasoning: string[];
  };
  strategies: Array<{
    strategyKey: string;
    strategy: string;
    icon: string;
    suggestedPrice: number;
    margin: number;
    viability: string;
  }>;
  profitability: {
    profitPerUnit: number;
    marginPercent: number;
    monthlyTargets: Array<{
      target: number;
      unitsNeeded: number;
    }>;
  };
  warnings: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
}

interface IntelligenceData {
  suppliers: SupplierResult[];
  marginSuggestions: MarginSuggestion | null;
  translated: boolean;
}

interface ProductIntelligenceCardProps {
  intelligence: IntelligenceData;
  productName: string;
  costPrice: number;
  onApplyPrice?: (price: number) => void;
  onOpenSupplier?: (url: string) => void;
}

export function ProductIntelligenceCard({
  intelligence,
  productName,
  costPrice,
  onApplyPrice,
  onOpenSupplier
}: ProductIntelligenceCardProps) {
  const [activeTab, setActiveTab] = useState('suppliers');

  const hasSuppliers = intelligence.suppliers?.length > 0;
  const hasMargin = !!intelligence.marginSuggestions;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Intelligence IA
          </CardTitle>
          {intelligence.translated && (
            <Badge variant="outline" className="gap-1">
              <Globe className="h-3 w-3" />
              Traduit
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {productName}
        </p>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="suppliers" className="gap-1">
              <Search className="h-4 w-4" />
              Fournisseurs
              {hasSuppliers && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {intelligence.suppliers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-1">
              <DollarSign className="h-4 w-4" />
              Prix IA
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="suppliers" className="mt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {hasSuppliers ? (
                  intelligence.suppliers.slice(0, 3).map((supplier, index) => (
                    <SupplierCard 
                      key={supplier.id} 
                      supplier={supplier}
                      rank={index + 1}
                      onOpen={() => onOpenSupplier?.(supplier.searchUrl)}
                    />
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Aucun fournisseur alternatif trouvé</p>
                  </div>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="pricing" className="mt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {hasMargin ? (
                  <PricingSuggestions 
                    suggestions={intelligence.marginSuggestions!}
                    costPrice={costPrice}
                    onApplyPrice={onApplyPrice}
                  />
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Suggestions de prix non disponibles</p>
                  </div>
                )}
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function SupplierCard({ 
  supplier, 
  rank,
  onOpen 
}: { 
  supplier: SupplierResult; 
  rank: number;
  onOpen: () => void;
}) {
  const confidenceColor = supplier.confidence >= 70 ? 'text-green-500' : 
                          supplier.confidence >= 50 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="p-3 rounded-lg border bg-card hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">#{rank}</span>
          <span className="font-medium">{supplier.platformName}</span>
        </div>
        <Badge variant="outline" className={confidenceColor}>
          {supplier.confidence}% match
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-muted-foreground">Prix estimé: </span>
          <span className="font-semibold text-primary">
            ~${supplier.estimatedPrice.toFixed(2)}
          </span>
        </div>
        {supplier.potentialMargin && (
          <div className="flex items-center gap-1 text-green-600">
            <TrendingUp className="h-3 w-3" />
            <span className="font-medium">+{supplier.potentialMargin.marginPercent}%</span>
          </div>
        )}
      </div>

      {supplier.recommendations.length > 0 && (
        <div className="mt-2 pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            {supplier.recommendations[0].message}
          </p>
        </div>
      )}

      <Button 
        variant="ghost" 
        size="sm" 
        className="w-full mt-2 gap-1"
        onClick={onOpen}
      >
        Rechercher
        <ExternalLink className="h-3 w-3" />
      </Button>
    </div>
  );
}

function PricingSuggestions({ 
  suggestions, 
  costPrice,
  onApplyPrice 
}: { 
  suggestions: MarginSuggestion;
  costPrice: number;
  onApplyPrice?: (price: number) => void;
}) {
  const { recommendation, strategies, profitability, warnings } = suggestions;

  return (
    <div className="space-y-4">
      {/* Recommended Price */}
      <div className="p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Prix recommandé
          </span>
          <Badge className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {recommendation.strategy}
          </Badge>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">
            €{recommendation.suggestedPrice.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground">
            ({recommendation.margin.toFixed(1)}% marge)
          </span>
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm">
          <span className="text-green-600 font-medium">
            +€{recommendation.profit.toFixed(2)} / vente
          </span>
          <span className="text-muted-foreground">
            Coût: €{costPrice.toFixed(2)}
          </span>
        </div>
        {onApplyPrice && (
          <Button 
            size="sm" 
            className="w-full mt-3 gap-1"
            onClick={() => onApplyPrice(recommendation.suggestedPrice)}
          >
            Appliquer ce prix
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Strategy alternatives */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Stratégies alternatives
        </p>
        <div className="grid grid-cols-2 gap-2">
          {strategies.slice(0, 4).map((strategy) => (
            <button
              key={strategy.strategyKey}
              onClick={() => onApplyPrice?.(strategy.suggestedPrice)}
              className="p-2 rounded-lg border text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-1 mb-1">
                <span>{strategy.icon}</span>
                <span className="text-xs font-medium">{strategy.strategy}</span>
              </div>
              <p className="text-sm font-semibold">€{strategy.suggestedPrice.toFixed(2)}</p>
              <div className="flex items-center gap-1 mt-1">
                <Progress value={strategy.margin} className="h-1 flex-1" />
                <span className="text-xs text-muted-foreground">{strategy.margin}%</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Monthly targets */}
      {profitability.monthlyTargets && (
        <div className="text-xs text-muted-foreground border-t pt-3">
          <p className="mb-1 font-medium">Objectifs mensuels:</p>
          <div className="flex flex-wrap gap-2">
            {profitability.monthlyTargets.slice(0, 3).map((target) => (
              <span key={target.target} className="px-2 py-0.5 rounded bg-muted">
                €{target.target} → {target.unitsNeeded} ventes
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((warning, idx) => (
            <div 
              key={idx}
              className={`flex items-start gap-2 p-2 rounded text-xs ${
                warning.severity === 'high' ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' :
                warning.severity === 'medium' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400' :
                'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
              }`}
            >
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{warning.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductIntelligenceCard;
