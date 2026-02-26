import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface PriceHistoryViewProps {
  priceHistory: any[];
}

export function PriceHistoryView({ priceHistory }: PriceHistoryViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique Prix</CardTitle>
        <CardDescription>Derniers changements de prix</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {priceHistory.slice(0, 20).map((change: any) => {
            const priceIncrease = change.new_price > change.previous_price;
            const changePercent = change.price_change_percent || 0;

            return (
              <div key={change.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">Produit #{change.product_id.slice(0, 8)}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {change.change_reason}
                    </Badge>
                    <span>
                      {formatDistanceToNow(new Date(change.created_at), { addSuffix: true, locale: getDateFnsLocale() })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold">
                    {change.previous_price}€ → {change.new_price}€
                  </p>
                  <div className="flex items-center gap-1 justify-end">
                    {priceIncrease ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <Badge variant={priceIncrease ? 'default' : 'secondary'} className="text-xs">
                      {priceIncrease ? '+' : ''}{changePercent}%
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}

          {priceHistory.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucun changement de prix récent</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
