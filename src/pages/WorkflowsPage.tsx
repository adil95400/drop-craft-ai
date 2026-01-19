import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import {
  Play,
  Plus,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function WorkflowsPage() {
  const { data: workflows } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const { data: executions } = useQuery({
    queryKey: ['workflow-executions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_execution_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return data
    },
  })

  const activeWorkflows = workflows?.filter((w) => w.status === 'active') || []
  const totalExecutions = workflows?.reduce(
    (sum, w) => sum + (w.execution_count || 0),
    0
  )
  const totalSuccess = workflows?.reduce(
    (sum, w) => sum + (w.run_count || 0),
    0
  )

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/10 text-green-500',
      paused: 'bg-yellow-500/10 text-yellow-500',
      inactive: 'bg-gray-500/10 text-gray-500',
    }
    return colors[status] || 'bg-muted text-muted-foreground'
  }

  const getExecutionStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      completed: CheckCircle2,
      success: CheckCircle2,
      failed: XCircle,
      error: XCircle,
      running: Clock,
      pending: Clock,
    }
    const Icon = icons[status] || Clock
    return <Icon className="w-4 h-4" />
  }

  return (
    <ChannablePageWrapper
      title="Workflows"
      subtitle="Automatisation"
      description="Automatisez vos tâches et optimisez vos opérations avec des workflows intelligents."
      heroImage="automation"
      badge={{ label: `${workflows?.length || 0} workflows`, icon: Zap }}
      actions={
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Créer
        </Button>
      }
    >
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
              <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
              <p className="text-lg sm:text-2xl font-bold">{workflows?.length || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-green-500/10">
              <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-green-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Actifs</p>
              <p className="text-lg sm:text-2xl font-bold">{activeWorkflows.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10">
              <Play className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Exécutions</p>
              <p className="text-lg sm:text-2xl font-bold">{totalExecutions || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-purple-500/10">
              <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Réussites</p>
              <p className="text-lg sm:text-2xl font-bold">{totalSuccess || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">Workflows</h2>
          {workflows?.length === 0 ? (
            <Card className="p-6 sm:p-8 text-center">
              <Zap className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
              <p className="text-sm sm:text-base text-muted-foreground">Aucun workflow</p>
              <Button className="mt-3 sm:mt-4" size="sm">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Créer le premier
              </Button>
            </Card>
          ) : (
            workflows?.map((workflow) => (
              <Card key={workflow.id} className="p-3 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base truncate">{workflow.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {workflow.description || 'Aucune description'}
                      </p>
                    </div>
                    <Badge className={`shrink-0 ${getStatusColor(workflow.status || '')}`}>
                      {workflow.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t">
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Exécutions</p>
                      <p className="text-sm sm:text-lg font-semibold">
                        {workflow.execution_count || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Réussites</p>
                      <p className="text-sm sm:text-lg font-semibold text-green-500">
                        {workflow.run_count || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Statut</p>
                      <p className="text-sm sm:text-lg font-semibold">
                        {workflow.is_active ? 'Actif' : 'Inactif'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 sm:pt-3 border-t gap-2">
                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {workflow.last_run_at
                        ? `${formatDistanceToNow(
                            new Date(workflow.last_run_at),
                            { addSuffix: true }
                          )}`
                        : 'Jamais exécuté'}
                    </span>
                    <Button variant="outline" size="sm" className="shrink-0">
                      <Settings className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Configurer</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">Exécutions récentes</h2>
          {executions?.length === 0 ? (
            <Card className="p-6 sm:p-8 text-center">
              <Clock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
              <p className="text-sm sm:text-base text-muted-foreground">Aucune exécution</p>
            </Card>
          ) : (
            executions?.map((execution) => (
              <Card key={execution.id} className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div
                      className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${
                        execution.status === 'success'
                          ? 'bg-green-500/10 text-green-500'
                          : execution.status === 'error'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}
                    >
                      {getExecutionStatusIcon(execution.status || '')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">
                        ID: {execution.id.slice(0, 8)}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {execution.executed_at &&
                          formatDistanceToNow(new Date(execution.executed_at), {
                            addSuffix: true,
                          })}
                      </p>
                    </div>
                  </div>
                  {execution.duration_ms && (
                    <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                      {execution.duration_ms}ms
                    </span>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </ChannablePageWrapper>
  )
}
