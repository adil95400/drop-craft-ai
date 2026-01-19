import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  usePriceOptimizations, 
  useOptimizePrices,
  useApplyOptimization,
  PriceOptimization 
} from '@/hooks/useDropshippingIntelligence';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Sparkles,
  RefreshCw,
  Check,
  X,
  Target,
  Users,
  BarChart3
} from 'lucide-react';

export function PriceOptimizationPanel() {
  const { data: optimizations, isLoading } = usePriceOptimizations();
  const optimizePrices = useOptimizePrices();
  const applyOptimization = useApplyOptimization();

  const pendingOptimizations = optimizations?.filter(o => o.status === 'pending') || [];
  const appliedOptimizations = optimizations?.filter(o => o.status === 'applied') || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Optimisation des Prix
          </CardTitle>
          <CardDescription>
            Suggestions intelligentes basées sur la demande et la concurrence
          </CardDescription>
        </div>
        <Button 
          onClick={() => optimizePrices.mutate(undefined)}
          disabled={optimizePrices.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${optimizePrices.isPending ? 'animate-spin' : ''}`} />
          Analyser
        </Button>
      </CardHeader>
      <CardContent>
        {optimizations?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune suggestion disponible</p>
            <p className="text-sm">Cliquez sur "Analyser" pour obtenir des recommandations</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Suggestions en attente */}
            {pendingOptimizations.length > 0 && (
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-primary" />
                  Suggestions à examiner ({pendingOptimizations.length})
                </h3>
                <div className="space-y-3">
                  {pendingOptimizations.map(opt => (
                    <OptimizationCard 
                      key={opt.id} 
                      optimization={opt}
                      onApply={() => applyOptimization.mutate(opt.id)}
                      applying={applyOptimization.isPending}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Optimisations appliquées */}
            {appliedOptimizations.length > 0 && (
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3 text-green-600">
                  <Check className="h-4 w-4" />
                  Récemment appliquées ({appliedOptimizations.length})
                </h3>
                <div className="space-y-3">
                  {appliedOptimizations.slice(0, 3).map(opt => (
                    <OptimizationCard 
                      key={opt.id} 
                      optimization={opt}
                      readonly
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OptimizationCard({ 
  optimization, 
  onApply,
  applying = false,
  readonly = false
}: { 
  optimization: PriceOptimization;
  onApply?: () => void;
  applying?: boolean;
  readonly?: boolean;
}) {
  const priceDiff = optimization.suggested_price - optimization.original_price;
  const isIncrease = priceDiff > 0;
  const marginDiff = optimization.suggested_margin_percent - optimization.original_margin_percent;

  return (
    <div className={`border rounded-lg p-4 ${optimization.status === 'applied' ? 'bg-green-50/50 dark:bg-green-950/20' : 'hover:bg-muted/50'} transition-colors`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium">{optimization.products?.title || 'Produit'}</h4>
          <p className="text-sm text-muted-foreground">SKU: {optimization.products?.sku || '-'}</p>
        </div>
        {optimization.status === 'applied' ? (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <Check className="h-3 w-3 mr-1" />
            Appliqué
          </Badge>
        ) : (
          <Badge variant="outline">En attente</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Prix actuel</p>
          <p className="font-semibold">{optimization.original_price.toFixed(2)} €</p>
          <p className="text-xs text-muted-foreground">
            Marge: {optimization.original_margin_percent.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Prix suggéré</p>
          <p className={`font-semibold flex items-center gap-1 ${isIncrease ? 'text-green-600' : 'text-orange-600'}`}>
            {optimization.suggested_price.toFixed(2)} €
            {isIncrease ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          </p>
          <p className="text-xs text-muted-foreground">
            Marge: {optimization.suggested_margin_percent.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Variation</p>
          <p className={`font-semibold ${isIncrease ? 'text-green-600' : 'text-orange-600'}`}>
            {isIncrease ? '+' : ''}{priceDiff.toFixed(2)} €
          </p>
          <p className={`text-xs ${marginDiff > 0 ? 'text-green-600' : 'text-orange-600'}`}>
            {marginDiff > 0 ? '+' : ''}{marginDiff.toFixed(1)}% marge
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Confiance</p>
          <p className="font-semibold">{optimization.confidence_score}%</p>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Demande
            </span>
            <span>{optimization.demand_score}/100</span>
          </div>
          <Progress value={optimization.demand_score} className="h-1.5" />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Compétitivité
            </span>
            <span>{optimization.competition_score}/100</span>
          </div>
          <Progress value={optimization.competition_score} className="h-1.5" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground italic">
          💡 {optimization.optimization_reason}
        </p>
        {!readonly && onApply && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <X className="h-4 w-4 mr-1" />
              Ignorer
            </Button>
            <Button size="sm" onClick={onApply} disabled={applying}>
              <Check className="h-4 w-4 mr-1" />
              Appliquer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
