import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface WorkflowStep {
  id: string
  type: 'email' | 'wait' | 'condition' | 'tag' | 'webhook'
  config: any
  delay?: number
  conditions?: any[]
}

export interface Workflow {
  id: string
  name: string
  description: string
  trigger_type: string
  trigger_config: any
  steps: WorkflowStep[]
  status: 'active' | 'draft' | 'paused'
  execution_count: number
  success_count: number
  failure_count: number
  last_executed_at?: string
  created_at: string
  updated_at: string
}

export function useAutomationWorkflows() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch workflows from automation_workflows table
  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['automation-workflows'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching workflows:', error)
        return []
      }

      return (data || []).map((workflow: any) => ({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description || '',
        trigger_type: workflow.workflow_data?.trigger_type || 'contact_created',
        trigger_config: workflow.workflow_data?.trigger_config || {},
        steps: (workflow.steps as any[]) || [],
        status: workflow.status as 'active' | 'draft' | 'paused',
        execution_count: workflow.execution_count || 0,
        success_count: workflow.run_count || 0,
        failure_count: 0,
        last_executed_at: workflow.last_run_at,
        created_at: workflow.created_at,
        updated_at: workflow.updated_at
      })) as Workflow[]
    },
    refetchInterval: 30000
  })

  // Create workflow
  const createWorkflow = useMutation({
    mutationFn: async (workflow: Partial<Workflow>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('automation_workflows')
        .insert([{
          user_id: user.id,
          name: workflow.name || 'Nouveau workflow',
          description: workflow.description,
          status: 'draft',
          steps: JSON.parse(JSON.stringify(workflow.steps || [])),
          workflow_data: JSON.parse(JSON.stringify({
            trigger_type: workflow.trigger_type,
            trigger_config: workflow.trigger_config || {}
          }))
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
        description: "Le workflow a été créé avec succès"
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le workflow",
        variant: "destructive"
      })
    }
  })

  // Update workflow
  const updateWorkflow = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Workflow> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (updates.name) updateData.name = updates.name
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.status) updateData.status = updates.status
      if (updates.steps) updateData.steps = updates.steps
      if (updates.trigger_type || updates.trigger_config) {
        updateData.workflow_data = {
          trigger_type: updates.trigger_type,
          trigger_config: updates.trigger_config
        }
      }

      const { error } = await supabase
        .from('automation_workflows')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] })
      toast({
        title: "Workflow mis à jour",
        description: "Les modifications ont été enregistrées"
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le workflow",
        variant: "destructive"
      })
    }
  })

  // Delete workflow
  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('automation_workflows')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] })
      toast({
        title: "Workflow supprimé",
        description: "Le workflow a été supprimé"
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le workflow",
        variant: "destructive"
      })
    }
  })

  // Duplicate workflow
  const duplicateWorkflow = useMutation({
    mutationFn: async (workflow: Workflow) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('automation_workflows')
        .insert([{
          user_id: user.id,
          name: `${workflow.name} (Copie)`,
          description: workflow.description,
          status: 'draft',
          steps: JSON.parse(JSON.stringify(workflow.steps)),
          workflow_data: JSON.parse(JSON.stringify({
            trigger_type: workflow.trigger_type,
            trigger_config: workflow.trigger_config
          }))
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] })
      toast({
        title: "Workflow dupliqué",
        description: "Une copie du workflow a été créée"
      })
    }
  })

  // Toggle workflow status
  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'paused' | 'draft' }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('automation_workflows')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] })
      toast({
        title: "Statut mis à jour"
      })
    }
  })

  // Calculate stats
  const stats = {
    totalWorkflows: workflows.length,
    activeWorkflows: workflows.filter(w => w.status === 'active').length,
    totalExecutions: workflows.reduce((sum, w) => sum + w.execution_count, 0),
    successRate: workflows.reduce((sum, w) => sum + w.execution_count, 0) > 0
      ? (workflows.reduce((sum, w) => sum + w.success_count, 0) / 
         workflows.reduce((sum, w) => sum + w.execution_count, 1)) * 100
      : 0
  }

  return {
    workflows,
    stats,
    isLoading,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    duplicateWorkflow,
    toggleStatus
  }
}
