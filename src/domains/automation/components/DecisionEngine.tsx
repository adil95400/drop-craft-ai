/**
 * PHASE 5: Decision Engine — connecté aux triggers et exécutions réels
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Brain, TrendingUp, CheckCircle, AlertTriangle, Target, Zap, Clock } from 'lucide-react'
import { useAutomation } from '@/hooks/useAutomation'
import { useRealAutomation } from '@/hooks/useRealAutomation'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export const DecisionEngine: React.FC = () => {
  const { triggers, stats, isLoading, processTrigger, isProcessing } = useAutomation()
  const { executions, isLoading: execLoading } = useRealAutomation()

  const activeTriggers = triggers.filter(t => t.is_active)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Brain className="h-6 w-6 mr-2 text-primary" />
            Moteur de Décision IA
          </h1>
          <p className="text-muted-foreground">
            Prise de décision automatisée basée sur vos triggers actifs
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Exécutions totales", value: stats.totalExecutions, sub: `${stats.successfulExecutions} réussies`, icon: Brain },
          { title: "Taux de réussite", value: stats.totalExecutions > 0 ? `${Math.round((stats.successfulExecutions / stats.totalExecutions) * 100)}%` : '0%', sub: `${stats.failedExecutions} erreurs`, icon: Target },
          { title: "Triggers actifs", value: stats.activeTriggers, sub: `${stats.totalTriggers} configurés`, icon: TrendingUp },
        ].map(({ title, value, sub, icon: Icon }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-20" /> : (
                <>
                  <div className="text-2xl font-bold">{value}</div>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Triggers actifs — Exécution manuelle</CardTitle>
          <CardDescription>Déclenchez manuellement vos règles d'automatisation</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : activeTriggers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aucun trigger actif. Créez-en un pour commencer.</p>
          ) : (
            <div className="space-y-4">
              {activeTriggers.map((trigger) => (
                <div key={trigger.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-primary" />
                      <Badge variant="outline">{trigger.trigger_type}</Badge>
                      <span className="font-medium">{trigger.name}</span>
                    </div>
                  </div>
                  {trigger.description && <p className="text-sm text-muted-foreground">{trigger.description}</p>}
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => processTrigger({ triggerId: trigger.id })} disabled={isProcessing}>
                      <CheckCircle className="h-4 w-4 mr-2" /> Exécuter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique récent</CardTitle>
          <CardDescription>Dernières exécutions et leurs résultats</CardDescription>
        </CardHeader>
        <CardContent>
          {execLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : executions.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">Aucune exécution récente</p>
          ) : (
            <div className="space-y-3">
              {executions.slice(0, 10).map((exec) => (
                <div key={exec.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {exec.status === 'completed' || exec.status === 'success' ?
                      <CheckCircle className="h-5 w-5 text-primary" /> :
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    }
                    <div>
                      <div className="text-sm font-medium">
                        {exec.input_data?.workflow_name || `Exécution #${exec.id.slice(0, 8)}`}
                      </div>
                      {exec.created_at && (
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(exec.created_at), { addSuffix: true, locale: fr })}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={exec.status === 'completed' || exec.status === 'success' ? 'default' : 'secondary'}>
                    {exec.status === 'completed' || exec.status === 'success' ? 'Réussi' : exec.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
