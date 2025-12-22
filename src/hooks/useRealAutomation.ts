import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

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
}

export interface AutomationExecution {
  id: string
  workflow_id: string
  status: 'running' | 'success' | 'error' | 'cancelled'
  started_at: string
  completed_at?: string
  input_data?: any
  output_data?: any
  step_results?: any[]
  error_message?: string
  execution_time_ms?: number
  user_id: string
}

export const useRealAutomation = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: workflows = [], isLoading: isLoadingWorkflows } = useQuery({
    queryKey: ['automation-workflows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Map to expected interface with defaults
      return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        trigger_type: row.workflow_data?.trigger_type || 'manual',
        trigger_config: row.workflow_data?.trigger_config || {},
        steps: row.steps || [],
        status: row.status as 'draft' | 'active' | 'paused',
        execution_count: row.execution_count || 0,
        success_count: row.run_count || 0,
        failure_count: 0,
        last_executed_at: row.last_run_at,
        user_id: row.user_id,
        created_at: row.created_at,
        updated_at: row.updated_at
      })) as AutomationWorkflow[]
    },
  })

  const { data: executions = [], isLoading: isLoadingExecutions } = useQuery({
    queryKey: ['automation-executions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_execution_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(50)

      if (error) throw error
      
      // Map to expected interface
      return (data || []).map((row: any) => ({
        id: row.id,
        workflow_id: row.trigger_id || '',
        status: row.status as 'running' | 'success' | 'error' | 'cancelled',
        started_at: row.executed_at,
        completed_at: row.executed_at,
        input_data: row.input_data,
        output_data: row.output_data,
        error_message: row.error_message,
        execution_time_ms: row.duration_ms,
        user_id: row.user_id
      })) as AutomationExecution[]
    },
  })

  const createWorkflow = useMutation({
    mutationFn: async (workflow: Omit<AutomationWorkflow, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'execution_count' | 'success_count' | 'failure_count'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('automation_workflows')
        .insert([{ 
          name: workflow.name,
          description: workflow.description,
          steps: workflow.steps,
          status: workflow.status,
          workflow_data: {
            trigger_type: workflow.trigger_type,
            trigger_config: workflow.trigger_config
          },
          user_id: user.id 
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] })
      toast({
        title: "Workflow créé",
        description: "Le workflow d'automatisation a été créé avec succès",
      })
    }
  })

  const updateWorkflow = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AutomationWorkflow> }) => {
      const updateData: any = {}
      if (updates.name) updateData.name = updates.name
      if (updates.description) updateData.description = updates.description
      if (updates.steps) updateData.steps = updates.steps
      if (updates.status) updateData.status = updates.status
      if (updates.trigger_type || updates.trigger_config) {
        updateData.workflow_data = {
          trigger_type: updates.trigger_type,
          trigger_config: updates.trigger_config
        }
      }

      const { data, error } = await supabase
        .from('automation_workflows')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] })
      toast({
        title: "Workflow mis à jour",
        description: "Le workflow a été mis à jour avec succès",
      })
    }
  })

  const executeWorkflow = useMutation({
    mutationFn: async ({ workflowId, inputData }: { workflowId: string; inputData?: any }) => {
      const response = await supabase.functions.invoke('automation-engine', {
        body: {
          action: 'execute_workflow',
          workflow_id: workflowId,
          input_data: inputData
        },
      })

      if (response.error) {
        throw new Error('Erreur lors de l\'exécution du workflow')
      }

      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-executions'] })
      toast({
        title: "Workflow exécuté",
        description: "Le workflow a été lancé avec succès",
      })
    }
  })

  const stats = {
    totalWorkflows: workflows.length,
    activeWorkflows: workflows.filter(w => w.status === 'active').length,
    active: workflows.filter(w => w.status === 'active').length, // backward compatibility
    totalExecutions: workflows.reduce((sum, w) => sum + w.execution_count, 0),
    successRate: workflows.length > 0 
      ? (workflows.reduce((sum, w) => sum + w.success_count, 0) / Math.max(workflows.reduce((sum, w) => sum + w.execution_count, 0), 1)) * 100
      : 0
  }

  return {
    workflows,
    executions,
    automations: workflows, // backward compatibility
    stats,
    isLoading: isLoadingWorkflows || isLoadingExecutions,
    createWorkflow: createWorkflow.mutate,
    updateWorkflow: updateWorkflow.mutate,
    executeWorkflow: executeWorkflow.mutate,
    isCreating: createWorkflow.isPending,
    isUpdating: updateWorkflow.isPending,
    isExecuting: executeWorkflow.isPending
  }
}
