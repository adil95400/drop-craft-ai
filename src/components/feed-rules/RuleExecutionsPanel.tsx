/**
 * Rule Executions Panel
 * Historique des exécutions de règles
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, AlertCircle, Clock, Zap, Package } from 'lucide-react';
import { useFeedRuleExecutions } from '@/hooks/useFeedRules';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

interface RuleExecutionsPanelProps {
  ruleId?: string;
}

export function RuleExecutionsPanel({ ruleId }: RuleExecutionsPanelProps) {
  const { data: executions = [], isLoading } = useFeedRuleExecutions(ruleId, 50);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Chargement de l'historique...
        </CardContent>
      </Card>
    );
  }

  if (executions.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">Aucune exécution</h3>
          <p className="text-muted-foreground">
            Les exécutions de règles apparaîtront ici
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historique des exécutions</CardTitle>
        <CardDescription>
          {executions.length} exécution(s) enregistrée(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {executions.map((execution) => (
              <div
                key={execution.id}
                className="p-4 border rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {execution.status === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : execution.status === 'partial' ? (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                    <Badge
                      variant={
                        execution.status === 'success'
                          ? 'default'
                          : execution.status === 'partial'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {execution.status === 'success'
                        ? 'Succès'
                        : execution.status === 'partial'
                        ? 'Partiel'
                        : 'Échec'}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(execution.executed_at), {
                      addSuffix: true,
                      locale: getDateFnsLocale(),
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>
                      <strong>{execution.products_matched}</strong> produits matchés
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span>
                      <strong>{execution.products_modified}</strong> modifiés
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{execution.execution_time_ms}ms</span>
                  </div>
                </div>

                {execution.changes_summary && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    {Object.entries(execution.changes_summary as Record<string, number>).map(
                      ([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key}: {value}
                        </Badge>
                      )
                    )}
                  </div>
                )}

                {execution.error_message && (
                  <p className="text-sm text-destructive mt-2">
                    Erreur: {execution.error_message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
