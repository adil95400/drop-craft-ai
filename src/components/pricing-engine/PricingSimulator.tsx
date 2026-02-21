/**
 * Simulateur de prix - Visualise l'impact des règles sur un prix d'achat donné
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Calculator, ShieldCheck, AlertTriangle } from 'lucide-react';
import { pricingRulesEngine } from '@/services/PricingRulesEngine';
import type { PricingRule } from '@/services/PricingRulesEngine';

interface Props {
  rules: any[];
}

export function PricingSimulator({ rules }: Props) {
  const [costPrice, setCostPrice] = useState(10);

  const result = useMemo(() => {
    if (costPrice <= 0 || !rules.length) return null;
    // Map DB rules to engine format
    const engineRules: PricingRule[] = rules.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      rule_type: r.rule_type,
      conditions: r.conditions || {},
      actions: r.actions || {},
      calculation: r.calculation,
      min_price: r.min_price,
      max_price: r.max_price,
      target_margin: r.target_margin,
      margin_protection: r.margin_protection ?? 15,
      rounding_strategy: r.rounding_strategy ?? 'nearest_99',
      competitor_strategy: r.competitor_strategy,
      competitor_offset: r.competitor_offset,
      apply_to: r.apply_to ?? 'all',
      apply_filter: r.apply_filter,
      is_active: r.is_active,
      priority: r.priority,
      products_affected: r.products_affected ?? 0,
      execution_count: r.execution_count ?? 0,
      last_executed_at: r.last_executed_at,
    }));
    return pricingRulesEngine.calculatePrice(costPrice, engineRules);
  }, [costPrice, rules]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Simulateur de prix
        </CardTitle>
        <CardDescription>
          Testez l'impact de vos règles actives sur un prix d'achat
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Prix d'achat (coût fournisseur)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={costPrice}
            onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
            className="max-w-[200px]"
          />
        </div>

        {result && (
          <div className="space-y-4">
            {/* Visual flow */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Coût</p>
                <p className="text-xl font-mono font-bold">{result.originalPrice.toFixed(2)}€</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Calculé</p>
                <p className="text-xl font-mono">{result.calculatedPrice.toFixed(2)}€</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Prix final</p>
                <p className="text-2xl font-mono font-bold text-primary">{result.roundedPrice.toFixed(2)}€</p>
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1">
                Marge: {result.margin.toFixed(1)}%
              </Badge>
              <Badge variant="outline" className="gap-1">
                Règle: {result.ruleApplied}
              </Badge>
              {result.marginProtected && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Protection de marge activée
                </Badge>
              )}
              {!result.marginProtected && result.margin > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Marge OK
                </Badge>
              )}
            </div>

            {/* Profit */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Bénéfice unitaire</p>
                  <p className="font-bold text-primary">
                    +{(result.roundedPrice - result.originalPrice).toFixed(2)}€
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Marge nette</p>
                  <p className="font-bold">{result.margin.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Multiplicateur</p>
                  <p className="font-bold">
                    x{(result.roundedPrice / result.originalPrice).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!rules.length && (
          <div className="text-center py-8 text-muted-foreground">
            Créez des règles pour utiliser le simulateur
          </div>
        )}
      </CardContent>
    </Card>
  );
}
