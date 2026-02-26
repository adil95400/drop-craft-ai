/**
 * Price Rule Logs Panel - avec export CSV
 */
import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Eye, RotateCcw, Clock, TrendingUp, TrendingDown, Download, Filter } from 'lucide-react';
import { usePriceRuleLogs } from '@/hooks/usePriceRules';
import { formatDistanceToNow, format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { toast } from 'sonner';

export function PriceRuleLogsPanel({ ruleId }: { ruleId?: string }) {
  const { data: logs = [], isLoading } = usePriceRuleLogs(ruleId, 100);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredLogs = filterStatus === 'all' 
    ? logs 
    : logs.filter(log => log.action === filterStatus);

  const handleExportCSV = useCallback(() => {
    if (filteredLogs.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    const headers = ['Date', 'Action', 'Produits', 'Variation Prix (%)', 'Variation Totale (€)', 'Règle'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.executed_at), 'yyyy-MM-dd HH:mm:ss'),
      log.action,
      log.products_count,
      log.avg_price_change_percent.toFixed(2),
      log.total_price_change.toFixed(2),
      ruleId || 'Toutes'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `price-rules-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV téléchargé');
  }, [filteredLogs, ruleId]);

  if (isLoading) return <Card><CardContent className="py-10 text-center text-muted-foreground">Chargement...</CardContent></Card>;
  if (logs.length === 0) return <Card><CardContent className="py-10 text-center"><Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="font-medium">Aucun historique</h3></CardContent></Card>;

  const actionIcons: Record<string, typeof CheckCircle2> = { applied: CheckCircle2, simulated: Eye, reverted: RotateCcw };
  const actionLabels: Record<string, string> = { applied: 'Appliqué', simulated: 'Simulé', reverted: 'Annulé' };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Historique</CardTitle>
            <CardDescription>{filteredLogs.length} action(s)</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="applied">Appliquées</SelectItem>
                <SelectItem value="simulated">Simulées</SelectItem>
                <SelectItem value="reverted">Annulées</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const Icon = actionIcons[log.action] || CheckCircle2;
              const isPositive = log.avg_price_change_percent >= 0;
              return (
                <div key={log.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${log.action === 'applied' ? 'text-green-500' : log.action === 'simulated' ? 'text-blue-500' : 'text-orange-500'}`} />
                      <Badge variant={log.action === 'applied' ? 'default' : 'secondary'}>{actionLabels[log.action] || log.action}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(log.executed_at), { addSuffix: true, locale: getDateFnsLocale() })}
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
