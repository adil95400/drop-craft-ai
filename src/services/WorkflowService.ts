/**
 * WorkflowService — Unified workflow service
 * All operations target the canonical `automation_workflows` table
 */
import { supabase } from '@/integrations/supabase/client';

export interface WorkflowTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: 'general' | 'order' | 'stock' | 'marketing' | 'sync';
  trigger_type: 'event' | 'schedule' | 'manual' | 'webhook';
  trigger_config: Record<string, any>;
  steps: WorkflowStep[];
  is_template: boolean;
  is_active: boolean;
  execution_count: number;
  last_executed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
  next_step_id?: string;
  condition_true_id?: string;
  condition_false_id?: string;
}

export interface WorkflowExecution {
  id: string;
  user_id: string;
  workflow_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  current_step: number;
  total_steps: number;
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  step_results: any[];
  error_message?: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  workflow?: { name: string };
}

export interface StepDefinition {
  id: string;
  name: string;
  description?: string;
  step_type: 'action' | 'condition' | 'delay' | 'loop' | 'webhook';
  icon?: string;
  category: string;
  config_schema: Record<string, any>;
  is_global: boolean;
}

// Map automation_workflows row → WorkflowTemplate interface
function mapToTemplate(row: any): WorkflowTemplate {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    category: row.workflow_data?.category || 'general',
    trigger_type: row.trigger_type || 'manual',
    trigger_config: row.trigger_config || {},
    steps: row.steps || [],
    is_template: row.workflow_data?.is_template || false,
    is_active: row.is_active ?? false,
    execution_count: row.execution_count || 0,
    last_executed_at: row.last_run_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const WorkflowService = {
  async getWorkflows(): Promise<WorkflowTemplate[]> {
    const { data, error } = await supabase
      .from('automation_workflows')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapToTemplate);
  },

  async getWorkflow(id: string): Promise<WorkflowTemplate> {
    const { data, error } = await supabase
      .from('automation_workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapToTemplate(data);
  },

  async createWorkflow(workflow: Partial<WorkflowTemplate>): Promise<WorkflowTemplate> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('automation_workflows')
      .insert({
        name: workflow.name || 'Nouveau workflow',
        description: workflow.description,
        trigger_type: workflow.trigger_type || 'manual',
        trigger_config: workflow.trigger_config || {},
        steps: (workflow.steps || []) as unknown as Record<string, any>[],
        is_active: workflow.is_active ?? true,
        workflow_data: {
          category: workflow.category || 'general',
          is_template: workflow.is_template || false,
        },
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return mapToTemplate(data);
  },

  async updateWorkflow(id: string, updates: Partial<WorkflowTemplate>): Promise<WorkflowTemplate> {
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.trigger_type !== undefined) updateData.trigger_type = updates.trigger_type;
    if (updates.trigger_config !== undefined) updateData.trigger_config = updates.trigger_config;
    if (updates.steps !== undefined) updateData.steps = updates.steps as unknown as Record<string, any>[];
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
    if (updates.execution_count !== undefined) updateData.execution_count = updates.execution_count;
    if (updates.last_executed_at !== undefined) updateData.last_run_at = updates.last_executed_at;
    if (updates.category !== undefined || updates.is_template !== undefined) {
      updateData.workflow_data = {
        category: updates.category || 'general',
        is_template: updates.is_template || false,
      };
    }

    const { data, error } = await supabase
      .from('automation_workflows')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapToTemplate(data);
  },

  async deleteWorkflow(id: string): Promise<void> {
    const { error } = await supabase
      .from('automation_workflows')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Executions
  async executeWorkflow(workflowId: string, inputData?: Record<string, any>): Promise<WorkflowExecution> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const workflow = await this.getWorkflow(workflowId);

    const { data, error } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: workflowId,
        input_data: inputData || {},
        total_steps: (workflow.steps || []).length,
        status: 'running',
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Simulate execution completion
    setTimeout(async () => {
      await supabase
        .from('workflow_executions')
        .update({
          status: 'completed',
          current_step: (workflow.steps || []).length,
          completed_at: new Date().toISOString(),
          duration_ms: 2500,
        })
        .eq('id', data.id);

      await supabase
        .from('automation_workflows')
        .update({
          execution_count: (workflow.execution_count || 0) + 1,
          last_run_at: new Date().toISOString(),
        })
        .eq('id', workflowId);
    }, 2500);

    return data as unknown as WorkflowExecution;
  },

  async getExecutions(workflowId?: string): Promise<WorkflowExecution[]> {
    let query = supabase
      .from('workflow_executions')
      .select(`*, workflow:automation_workflows(name)`)
      .order('started_at', { ascending: false })
      .limit(50);

    if (workflowId) {
      query = query.eq('workflow_id', workflowId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as WorkflowExecution[];
  },

  // Step Definitions
  async getStepDefinitions(): Promise<StepDefinition[]> {
    const { data, error } = await supabase
      .from('workflow_step_definitions')
      .select('*')
      .eq('is_global', true);

    if (error) throw error;
    return (data || []) as unknown as StepDefinition[];
  },

  async getWorkflowStats(): Promise<{
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    successRate: number;
  }> {
    const { data: workflows } = await supabase
      .from('automation_workflows')
      .select('is_active, execution_count');

    const { data: executions } = await supabase
      .from('workflow_executions')
      .select('status');

    const workflowList = workflows || [];
    const executionList = executions || [];
    const successfulExecutions = executionList.filter(e => e.status === 'completed').length;

    return {
      totalWorkflows: workflowList.length,
      activeWorkflows: workflowList.filter(w => w.is_active).length,
      totalExecutions: executionList.length,
      successRate: executionList.length > 0 ? (successfulExecutions / executionList.length) * 100 : 0,
    };
  },
};
