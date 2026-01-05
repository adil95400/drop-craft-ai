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

export const WorkflowService = {
  // Templates
  async getWorkflows(): Promise<WorkflowTemplate[]> {
    const { data, error } = await supabase
      .from('workflow_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as WorkflowTemplate[];
  },

  async getWorkflow(id: string): Promise<WorkflowTemplate> {
    const { data, error } = await supabase
      .from('workflow_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as WorkflowTemplate;
  },

  async createWorkflow(workflow: Partial<WorkflowTemplate>): Promise<WorkflowTemplate> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('workflow_templates')
      .insert({
        name: workflow.name || 'Nouveau workflow',
        description: workflow.description,
        category: workflow.category || 'general',
        trigger_type: workflow.trigger_type || 'manual',
        trigger_config: workflow.trigger_config || {},
        steps: (workflow.steps || []) as unknown as Record<string, any>[],
        is_template: workflow.is_template || false,
        is_active: workflow.is_active ?? true,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as WorkflowTemplate;
  },

  async updateWorkflow(id: string, updates: Partial<WorkflowTemplate>): Promise<WorkflowTemplate> {
    const updateData: Record<string, any> = { ...updates, updated_at: new Date().toISOString() };
    if (updates.steps) {
      updateData.steps = updates.steps as unknown as Record<string, any>[];
    }
    
    const { data, error } = await supabase
      .from('workflow_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as WorkflowTemplate;
  },

  async deleteWorkflow(id: string): Promise<void> {
    const { error } = await supabase
      .from('workflow_templates')
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
        user_id: user.id
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
          duration_ms: 2500
        })
        .eq('id', data.id);

      await supabase
        .from('workflow_templates')
        .update({
          execution_count: (workflow.execution_count || 0) + 1,
          last_executed_at: new Date().toISOString()
        })
        .eq('id', workflowId);
    }, 2500);

    return data as unknown as WorkflowExecution;
  },

  async getExecutions(workflowId?: string): Promise<WorkflowExecution[]> {
    let query = supabase
      .from('workflow_executions')
      .select(`*, workflow:workflow_templates(name)`)
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
      .from('workflow_templates')
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
      successRate: executionList.length > 0 ? (successfulExecutions / executionList.length) * 100 : 0
    };
  }
};
