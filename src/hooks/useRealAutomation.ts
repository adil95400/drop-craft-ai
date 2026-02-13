/**
 * useRealAutomation — Unified automation hook migrated to API V1
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { automationApi } from '@/services/api/client'

export interface AutomationWorkflow {
  id: string
  name: string
  description?: string
  trigger_type: string
  trigger_config: any
  steps: any[]
  status: 'draft' | 'active' | 'paused'
  execution_count: number
  success_count: number
  failure_count: number
  last_executed_at?: string
  user_id: string
  created_at: string
  updated_at: string
  is_active?: boolean
  run_count?: number
}

export interface AutomationExecution {
  id: string
  workflow_id: string
  status: 'running' | 'success' | 'error' | 'cancelled' | 'completed'
  started_at: string
  completed_at?: string
  input_data?: any
  output_data?: any
  step_results?: any[]
  error_message?: string
  execution_time_ms?: number
  user_id: string
  created_at?: string
}

export const useRealAutomation = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: workflows = [], isLoading: isLoadingWorkflows } = useQuery({
    queryKey: ['automation-workflows'],
    queryFn: async () => {
      const res = await automationApi.listWorkflows()
      return (res.items || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        trigger_type: row.workflow_data?.trigger_type || 'manual',
        trigger_config: row.workflow_data?.trigger_config || {},
        steps: row.steps || [],
        status: (row.status || 'draft') as 'draft' | 'active' | 'paused',
        execution_count: row.execution_count || 0,
        success_count: row.run_count || 0,
        failure_count: 0,
        last_executed_at: row.last_run_at,
        user_id: row.user_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        is_active: row.is_active,
        run_count: row.run_count,
      })) as AutomationWorkflow[]
    },
  })

  const { data: executions = [], isLoading: isLoadingExecutions } = useQuery({
    queryKey: ['automation-executions'],
    queryFn: async () => {
      const res = await automationApi.listExecutions({ limit: 50 })
      return (res.items || []).map((row: any) => ({
        id: row.id,
        workflow_id: row.trigger_id || '',
        status: row.status as any,
        started_at: row.executed_at || row.created_at,
        completed_at: row.executed_at || row.created_at,
        input_data: row.input_data,
        output_data: row.output_data,
        error_message: row.error_message,
        execution_time_ms: row.duration_ms,
        user_id: row.user_id,
        created_at: row.created_at,
      })) as AutomationExecution[]
    },
  })

  const createWorkflow = useMutation({
    mutationFn: async (workflow: Partial<AutomationWorkflow>) => {
      return await automationApi.createWorkflow({
        name: workflow.name,
        description: workflow.description,
        steps: workflow.steps || [],
        status: workflow.status || 'draft',
        workflow_data: {
          trigger_type: workflow.trigger_type || 'manual',
          trigger_config: workflow.trigger_config || {}
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] })
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] })
      toast({ title: "Workflow créé" })
    }
  })

  const updateWorkflow = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AutomationWorkflow> }) => {
      const body: any = {}
      if (updates.name) body.name = updates.name
      if (updates.description !== undefined) body.description = updates.description
      if (updates.steps) body.steps = updates.steps
      if (updates.status) body.status = updates.status
      if (updates.is_active !== undefined) body.is_active = updates.is_active
      if (updates.trigger_type || updates.trigger_config) {
        body.workflow_data = { trigger_type: updates.trigger_type, trigger_config: updates.trigger_config }
      }
      return await automationApi.updateWorkflow(id, body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] })
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] })
      toast({ title: "Workflow mis à jour" })
    }
  })

  const toggleWorkflow = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await automationApi.toggleWorkflow(id, isActive)
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] })
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] })
      toast({ title: vars.isActive ? 'Workflow activé' : 'Workflow mis en pause' })
    }
  })

  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      return await automationApi.deleteWorkflow(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] })
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] })
      toast({ title: "Workflow supprimé" })
    }
  })

  const executeWorkflow = useMutation({
    mutationFn: async ({ workflowId }: { workflowId: string; inputData?: any }) => {
      return await automationApi.runWorkflow(workflowId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-executions'] })
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] })
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] })
      toast({ title: "Workflow exécuté" })
    }
  })

  const stats = {
    totalWorkflows: workflows.length,
    activeWorkflows: workflows.filter(w => w.status === 'active' || w.is_active).length,
    active: workflows.filter(w => w.status === 'active' || w.is_active).length,
    totalExecutions: workflows.reduce((sum, w) => sum + w.execution_count, 0),
    successRate: workflows.length > 0
      ? Math.round((workflows.reduce((sum, w) => sum + w.success_count, 0) / Math.max(workflows.reduce((sum, w) => sum + w.execution_count, 0), 1)) * 1000) / 10
      : 0
  }

  return {
    workflows, executions,
    automations: workflows,
    stats,
    isLoading: isLoadingWorkflows || isLoadingExecutions,
    createWorkflow: createWorkflow.mutate,
    updateWorkflow: updateWorkflow.mutate,
    toggleWorkflow: toggleWorkflow.mutate,
    deleteWorkflow: deleteWorkflow.mutate,
    executeWorkflow: executeWorkflow.mutate,
    isCreating: createWorkflow.isPending,
    isUpdating: updateWorkflow.isPending,
    isExecuting: executeWorkflow.isPending,
    isToggling: toggleWorkflow.isPending,
    isDeleting: deleteWorkflow.isPending,
  }
}
