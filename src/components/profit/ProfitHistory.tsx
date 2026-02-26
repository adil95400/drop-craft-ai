import { useProfitCalculator } from '@/hooks/useProfitCalculator';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

export function ProfitHistory() {
  const { calculations, isLoadingCalculations, deleteCalculation } = useProfitCalculator();

  if (isLoadingCalculations) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!calculations || calculations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Aucun calcul enregistré. Utilisez le calculateur pour commencer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Historique des Calculs</h2>
      
      {calculations.map((calc: any) => (
        <Card key={calc.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">{calc.product_name}</h3>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(calc.created_at), {
                  addSuffix: true,
                  locale: getDateFnsLocale()
                })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteCalculation(calc.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Prix de Vente</p>
              <p className="text-lg font-semibold">{calc.selling_price} €</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profit Net</p>
              <p className={`text-lg font-semibold ${parseFloat(calc.net_profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {calc.net_profit} €
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Marge</p>
              <div className="flex items-center gap-2">
                <Badge variant={parseFloat(calc.profit_margin_percent) > 30 ? 'default' : 'secondary'}>
                  {calc.profit_margin_percent}%
                </Badge>
                {parseFloat(calc.profit_margin_percent) > 30 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-orange-600" />
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ROI</p>
              <p className="text-lg font-semibold">{calc.roi_percent}%</p>
            </div>
          </div>

          {calc.ai_suggestions && calc.ai_suggestions.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Suggestions IA:</p>
              <ul className="space-y-1">
                {calc.ai_suggestions.slice(0, 3).map((suggestion: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span>•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
