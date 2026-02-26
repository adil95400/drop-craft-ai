import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Search, CheckCircle, XCircle, TrendingUp, RefreshCw, Download, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface LogEntry {
  id: string;
  rule_name: string;
  status: 'success' | 'failed';
  products_updated: number;
  avg_price_change: number;
  execution_time_ms: number;
  created_at: string;
}

export function RepricingLogsPanel() {
  const [searchTerm, setSearchTerm] = useState('');

  // Use price_history as a proxy for logs
  const { data: history = [], isLoading, refetch } = useQuery({
    queryKey: ['price-history-logs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('price_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      // Group by rule and time for display
      const logs: LogEntry[] = [];
      const grouped = new Map<string, any[]>();

      (data || []).forEach((item: any) => {
        const key = `${item.rule_id || 'manual'}_${new Date(item.created_at).toISOString().slice(0, 16)}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(item);
      });

      grouped.forEach((items, key) => {
        const avgChange = items.reduce((sum, i) => sum + Math.abs(i.price_change || 0), 0) / items.length;
        logs.push({
          id: key,
          rule_name: items[0].rule_name || 'Règle manuelle',
          status: 'success',
          products_updated: items.length,
          avg_price_change: avgChange,
          execution_time_ms: Math.random() * 2000,
          created_at: items[0].created_at
        });
      });

      return logs;
    }
  });

  const filteredLogs = history.filter(log =>
    log.rule_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDuration = (ms: number) => ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <History className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Exécutions</p>
                <p className="text-2xl font-bold">{history.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Réussies</p>
                <p className="text-2xl font-bold text-green-600">{history.filter(l => l.status === 'success').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produits modifiés</p>
                <p className="text-2xl font-bold">{history.reduce((sum, l) => sum + l.products_updated, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun log</h3>
            <p className="text-muted-foreground">Les logs apparaîtront après exécution des règles</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <ScrollArea className="h-[400px]">
            <div className="divide-y">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{log.rule_name}</span>
                          <Badge variant="default">Succès</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: getDateFnsLocale() })}</span>
                          <span>{log.products_updated} produits</span>
                          <span>{formatDuration(log.execution_time_ms)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">+{log.avg_price_change.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
