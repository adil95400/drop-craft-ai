import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Play,
  Pause,
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
        .from('automation_executions')
        .select('*')
        .order('started_at', { ascending: false })
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
    (sum, w) => sum + (w.success_count || 0),
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
      failed: XCircle,
      running: Clock,
    }
    const Icon = icons[status] || Clock
    return <Icon className="w-4 h-4" />
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
            <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Workflows
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Automate tasks and optimize operations
          </p>
        </div>
        <Button size="sm" className="self-start sm:self-auto sm:size-default">
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          Create
        </Button>
      </div>

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
              <Play className="w-4 h-4 sm:w-6 sm:h-6 text-green-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Active</p>
              <p className="text-lg sm:text-2xl font-bold">{activeWorkflows.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10">
              <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Runs</p>
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
              <p className="text-xs sm:text-sm text-muted-foreground">Success</p>
              <p className="text-lg sm:text-2xl font-bold">
                {totalExecutions
                  ? ((totalSuccess! / totalExecutions) * 100).toFixed(0)
                  : 0}
                %
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">Active Workflows</h2>
          {workflows?.length === 0 ? (
            <Card className="p-6 sm:p-8 text-center">
              <Zap className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
              <p className="text-sm sm:text-base text-muted-foreground">No workflows created yet</p>
            </Card>
          ) : (
            workflows?.map((workflow) => (
              <Card key={workflow.id} className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-semibold truncate">{workflow.name}</h3>
                        <Badge className={`${getStatusColor(workflow.status || '')} text-xs`}>
                          {workflow.status}
                        </Badge>
                      </div>
                      {workflow.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                          {workflow.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={
                        workflow.status === 'active'
                          ? 'text-yellow-500'
                          : 'text-green-500'
                      }
                    >
                      {workflow.status === 'active' ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t">
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Runs</p>
                      <p className="text-sm sm:text-lg font-semibold">
                        {workflow.execution_count || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Success</p>
                      <p className="text-sm sm:text-lg font-semibold text-green-500">
                        {workflow.success_count || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Failed</p>
                      <p className="text-sm sm:text-lg font-semibold text-red-500">
                        {workflow.failure_count || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 sm:pt-3 border-t gap-2">
                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {workflow.last_executed_at
                        ? `${formatDistanceToNow(
                            new Date(workflow.last_executed_at),
                            { addSuffix: true }
                          )}`
                        : 'Never executed'}
                    </span>
                    <Button variant="outline" size="sm" className="shrink-0">
                      <Settings className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Configure</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">Recent Executions</h2>
          {executions?.length === 0 ? (
            <Card className="p-6 sm:p-8 text-center">
              <Clock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
              <p className="text-sm sm:text-base text-muted-foreground">No executions yet</p>
            </Card>
          ) : (
            executions?.map((execution) => (
              <Card key={execution.id} className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div
                      className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${
                        execution.status === 'completed'
                          ? 'bg-green-500/10 text-green-500'
                          : execution.status === 'failed'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}
                    >
                      {getExecutionStatusIcon(execution.status || '')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">
                        ID: {execution.workflow_id.slice(0, 8)}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {execution.started_at &&
                          formatDistanceToNow(new Date(execution.started_at), {
                            addSuffix: true,
                          })}
                      </p>
                    </div>
                  </div>
                  {execution.execution_time_ms && (
                    <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                      {execution.execution_time_ms}ms
                    </span>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
