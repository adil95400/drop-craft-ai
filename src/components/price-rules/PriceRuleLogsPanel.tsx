/**
 * Price Rule Logs Panel
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Eye, RotateCcw, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { usePriceRuleLogs } from '@/hooks/usePriceRules';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function PriceRuleLogsPanel({ ruleId }: { ruleId?: string }) {
  const { data: logs = [], isLoading } = usePriceRuleLogs(ruleId, 50);

  if (isLoading) return <Card><CardContent className="py-10 text-center text-muted-foreground">Chargement...</CardContent></Card>;
  if (logs.length === 0) return <Card><CardContent className="py-10 text-center"><Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="font-medium">Aucun historique</h3></CardContent></Card>;

  const actionIcons = { applied: CheckCircle2, simulated: Eye, reverted: RotateCcw };
  const actionLabels = { applied: 'Appliqué', simulated: 'Simulé', reverted: 'Annulé' };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historique</CardTitle>
        <CardDescription>{logs.length} action(s)</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {logs.map((log) => {
              const Icon = actionIcons[log.action];
              const isPositive = log.avg_price_change_percent >= 0;
              return (
                <div key={log.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${log.action === 'applied' ? 'text-green-500' : log.action === 'simulated' ? 'text-blue-500' : 'text-orange-500'}`} />
                      <Badge variant={log.action === 'applied' ? 'default' : 'secondary'}>{actionLabels[log.action]}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(log.executed_at), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><strong>{log.products_count}</strong> produits</div>
                    <div className={isPositive ? 'text-green-600' : 'text-red-600'}>
                      {isPositive ? <TrendingUp className="h-4 w-4 inline mr-1" /> : <TrendingDown className="h-4 w-4 inline mr-1" />}
                      {isPositive ? '+' : ''}{log.avg_price_change_percent.toFixed(2)}%
                    </div>
                    <div>{log.total_price_change >= 0 ? '+' : ''}{log.total_price_change.toFixed(2)}€</div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
