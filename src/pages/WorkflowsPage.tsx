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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="w-8 h-8 text-primary" />
            Automation Workflows
          </h1>
          <p className="text-muted-foreground">
            Automate repetitive tasks and optimize operations
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Workflows</p>
              <p className="text-2xl font-bold">{workflows?.length || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <Play className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{activeWorkflows.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <CheckCircle2 className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Executions</p>
              <p className="text-2xl font-bold">{totalExecutions || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <CheckCircle2 className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold">
                {totalExecutions
                  ? ((totalSuccess! / totalExecutions) * 100).toFixed(0)
                  : 0}
                %
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Active Workflows</h2>
          {workflows?.length === 0 ? (
            <Card className="p-8 text-center">
              <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No workflows created yet</p>
            </Card>
          ) : (
            workflows?.map((workflow) => (
              <Card key={workflow.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{workflow.name}</h3>
                        <Badge className={getStatusColor(workflow.status || '')}>
                          {workflow.status}
                        </Badge>
                      </div>
                      {workflow.description && (
                        <p className="text-sm text-muted-foreground">
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

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Executions</p>
                      <p className="text-lg font-semibold">
                        {workflow.execution_count || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Success</p>
                      <p className="text-lg font-semibold text-green-500">
                        {workflow.success_count || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Failed</p>
                      <p className="text-lg font-semibold text-red-500">
                        {workflow.failure_count || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-xs text-muted-foreground">
                      {workflow.last_executed_at
                        ? `Last run ${formatDistanceToNow(
                            new Date(workflow.last_executed_at),
                            { addSuffix: true }
                          )}`
                        : 'Never executed'}
                    </span>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-1" />
                      Configure
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Executions</h2>
          {executions?.length === 0 ? (
            <Card className="p-8 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No executions yet</p>
            </Card>
          ) : (
            executions?.map((execution) => (
              <Card key={execution.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        execution.status === 'completed'
                          ? 'bg-green-500/10 text-green-500'
                          : execution.status === 'failed'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}
                    >
                      {getExecutionStatusIcon(execution.status || '')}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Workflow: {execution.workflow_id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {execution.started_at &&
                          formatDistanceToNow(new Date(execution.started_at), {
                            addSuffix: true,
                          })}
                      </p>
                    </div>
                  </div>
                  {execution.execution_time_ms && (
                    <span className="text-xs text-muted-foreground">
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
