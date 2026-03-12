/**
 * AutomationExecutionLog — Journal des exécutions des règles d'automatisation
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle, XCircle, Clock, AlertTriangle,
  RefreshCw, History, Package, Truck, ChevronDown
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useDateFnsLocale } from '@/hooks/useDateFnsLocale';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExecutionEntry {
  id: string;
  rule_name: string;
  order_number: string;
  status: 'success' | 'failed' | 'skipped' | 'pending';
  carrier_selected?: string;
  actions_performed: string[];
  error_message?: string;
  executed_at: string;
  duration_ms?: number;
}

const statusConfig = {
  success: { label: 'Succès', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  failed: { label: 'Échoué', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  skipped: { label: 'Ignoré', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  pending: { label: 'En attente', icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
};

export function AutomationExecutionLog() {
  const locale = useDateFnsLocale();
  const [showAll, setShowAll] = useState(false);

  const { data: executions = [], isLoading, refetch } = useQuery({
    queryKey: ['fulfillment-automation-log'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Use activity_logs filtered for fulfillment automation
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('entity_type', 'fulfillment_automation')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((log: any): ExecutionEntry => ({
        id: log.id,
        rule_name: log.details?.rule_name || log.description || 'Règle',
        order_number: log.entity_id || '',
        status: log.details?.status || (log.severity === 'error' ? 'failed' : 'success'),
        carrier_selected: log.details?.carrier,
        actions_performed: log.details?.actions || [],
        error_message: log.details?.error,
        executed_at: log.created_at,
        duration_ms: log.details?.duration_ms,
      }));
    },
    staleTime: 30_000,
  });

  const displayed = showAll ? executions : executions.slice(0, 10);
  const successCount = executions.filter(e => e.status === 'success').length;
  const failedCount = executions.filter(e => e.status === 'failed').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Journal d'exécution</CardTitle>
              <CardDescription>
                {executions.length} exécutions •{' '}
                <span className="text-emerald-500">{successCount} succès</span>
                {failedCount > 0 && (
                  <span className="text-destructive"> • {failedCount} échecs</span>
                )}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            Chargement...
          </div>
        ) : executions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <History className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Aucune exécution enregistrée</p>
            <p className="text-xs mt-1">Les exécutions apparaîtront ici lorsque des règles seront déclenchées</p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                <AnimatePresence>
                  {displayed.map((entry, idx) => {
                    const config = statusConfig[entry.status] || statusConfig.pending;
                    const StatusIcon = config.icon;

                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className={`p-1.5 rounded-md ${config.bg}`}>
                          <StatusIcon className={`h-4 w-4 ${config.color}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{entry.rule_name}</span>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {config.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                            {entry.order_number && (
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {entry.order_number.substring(0, 12)}
                              </span>
                            )}
                            {entry.carrier_selected && (
                              <span className="flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                {entry.carrier_selected}
                              </span>
                            )}
                            {entry.duration_ms && (
                              <span>{entry.duration_ms}ms</span>
                            )}
                          </div>
                          {entry.error_message && (
                            <p className="text-xs text-destructive mt-1 truncate">
                              {entry.error_message}
                            </p>
                          )}
                        </div>

                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(entry.executed_at), { addSuffix: true, locale })}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {executions.length > 10 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3"
                onClick={() => setShowAll(!showAll)}
              >
                <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                {showAll ? 'Réduire' : `Voir les ${executions.length - 10} restantes`}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
