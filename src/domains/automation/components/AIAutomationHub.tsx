/**
 * PHASE 5: AI Automation Hub — Connecté via useAutomation & useRealAutomation
 */

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Bot, Zap, TrendingUp, Play, Pause, Plus,
  CheckCircle, Clock, AlertTriangle, Trash2
} from 'lucide-react'
import { useAutomation } from '@/hooks/useAutomation'
import { useRealAutomation } from '@/hooks/useRealAutomation'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export const AIAutomationHub: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('workflows')
  const { stats: triggerStats, isLoading: triggerLoading } = useAutomation()
  const { 
    workflows, executions, stats: wfStats, isLoading: wfLoading,
    toggleWorkflow, executeWorkflow, deleteWorkflow,
    isExecuting, isToggling, isDeleting
  } = useRealAutomation()

  const isLoading = triggerLoading || wfLoading

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Bot className="h-8 w-8 mr-3 text-primary" />
            AI Automation Hub
            <Badge variant="secondary" className="ml-3">PHASE 5</Badge>
          </h1>
          <p className="text-muted-foreground">
            Automatisation intelligente pilotée par l'API V1
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Workflows actifs", value: wfStats.activeWorkflows, sub: `${wfStats.totalWorkflows} au total`, icon: Zap },
          { title: "Triggers actifs", value: triggerStats.activeTriggers, sub: `${triggerStats.totalTriggers} configurés`, icon: Bot },
          { title: "Exécutions", value: triggerStats.totalExecutions, sub: `${triggerStats.successfulExecutions} réussies`, icon: TrendingUp },
          { title: "Taux réussite", value: `${wfStats.successRate}%`, sub: `${triggerStats.failedExecutions} échecs`, icon: Clock },
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

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Exécutions</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          {wfLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : workflows.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p>Aucun workflow créé. Utilisez le Workflow Builder pour en créer un.</p>
            </CardContent></Card>
          ) : (
            <div className="grid gap-4">
              {workflows.map((wf) => (
                <Card key={wf.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{wf.name}</h3>
                          <Badge variant={wf.status === 'active' || wf.is_active ? 'default' : 'secondary'}>
                            {wf.status === 'active' || wf.is_active ? 'Actif' : wf.status === 'draft' ? 'Brouillon' : 'En pause'}
                          </Badge>
                        </div>
                        {wf.description && <p className="text-sm text-muted-foreground">{wf.description}</p>}
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            {wf.run_count || wf.execution_count || 0} exécutions
                          </div>
                          <div>{wf.steps?.length || 0} étapes</div>
                          {wf.last_executed_at && (
                            <div>Dernière: {formatDistanceToNow(new Date(wf.last_executed_at), { addSuffix: true, locale: fr })}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => executeWorkflow({ workflowId: wf.id })} disabled={isExecuting}>
                          <Play className="h-4 w-4 mr-1" /> Exécuter
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toggleWorkflow({ id: wf.id, isActive: !(wf.is_active || wf.status === 'active') })} disabled={isToggling}>
                          {wf.is_active || wf.status === 'active' ? <><Pause className="h-4 w-4 mr-1" /> Pause</> : <><Play className="h-4 w-4 mr-1" /> Activer</>}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteWorkflow(wf.id)} disabled={isDeleting}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique d'exécution</CardTitle>
              <CardDescription>Dernières exécutions des workflows et triggers</CardDescription>
            </CardHeader>
            <CardContent>
              {wfLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : executions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucune exécution enregistrée</p>
              ) : (
                <div className="space-y-3">
                  {executions.map((exec) => (
                    <div key={exec.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {exec.status === 'completed' || exec.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        ) : exec.status === 'error' ? (
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        )}
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
                      <Badge variant={exec.status === 'completed' || exec.status === 'success' ? 'default' : exec.status === 'error' ? 'destructive' : 'secondary'}>
                        {exec.status === 'completed' || exec.status === 'success' ? 'Réussi' : exec.status === 'error' ? 'Échoué' : exec.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
