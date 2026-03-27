import { supabase } from '@/integrations/supabase/client';

export interface AutomationWorkflow {
  id: string;
  name: string;
  description?: string;
  trigger_type: 'time' | 'event' | 'condition';
  trigger_config: Record<string, any>;
  steps: AutomationStep[];
  status: 'draft' | 'active' | 'paused';
  user_id: string;
  created_at: string;
  updated_at: string;
  last_executed_at?: string;
  execution_count: number;
  success_count: number;
  failure_count: number;
}

export interface AutomationStep {
  id: string;
  type: 'action' | 'condition' | 'delay';
  config: Record<string, any>;
  order: number;
}

export interface AutomationExecution {
  id: string;
  workflow_id: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  execution_time_ms?: number;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  step_results: AutomationStepResult[];
  error_message?: string;
}

export interface AutomationStepResult {
  step_id: string;
  status: 'success' | 'failed' | 'skipped';
  execution_time_ms: number;
  output: Record<string, any>;
  error?: string;
}

export class AutomationEngine {
  private static instance: AutomationEngine;
  
  public static getInstance(): AutomationEngine {
    if (!this.instance) {
      this.instance = new AutomationEngine();
    }
    return this.instance;
  }

  async getWorkflows(userId: string): Promise<AutomationWorkflow[]> {
    const { data, error } = await supabase
      .from('automation_workflows')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error || !data) return [];

    return data.map((w: any) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      trigger_type: w.trigger_type || 'event',
      trigger_config: w.trigger_config || {},
      steps: Array.isArray(w.steps) ? w.steps : [],
      status: w.status === 'active' ? 'active' : w.status === 'paused' ? 'paused' : 'draft',
      user_id: w.user_id,
      created_at: w.created_at,
      updated_at: w.updated_at,
      last_executed_at: w.last_run_at,
      execution_count: w.execution_count || w.run_count || 0,
      success_count: w.execution_count || w.run_count || 0,
      failure_count: 0,
    }));
  }

  async getExecutions(): Promise<AutomationExecution[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('entity_type', 'automation_execution')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) return [];

    return data.map((log: any) => ({
      id: log.id,
      workflow_id: log.entity_id || '',
      status: log.severity === 'error' ? 'failed' : 'completed',
      started_at: log.created_at,
      completed_at: log.created_at,
      execution_time_ms: (log.details as any)?.duration_ms || 0,
      step_results: [],
    }));
  }

  async updateWorkflow(workflow: AutomationWorkflow): Promise<AutomationWorkflow> {
    const { error } = await supabase
      .from('automation_workflows')
      .update({
        name: workflow.name,
        description: workflow.description,
        status: workflow.status,
        steps: workflow.steps as any,
        trigger_type: workflow.trigger_type,
        trigger_config: workflow.trigger_config as any,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workflow.id);

    if (error) throw error;
    return { ...workflow, updated_at: new Date().toISOString() };
  }

  async executeWorkflow(workflow: AutomationWorkflow, inputData?: Record<string, any>): Promise<AutomationExecution> {
    const execution: AutomationExecution = {
      id: crypto.randomUUID(),
      workflow_id: workflow.id,
      status: 'running',
      started_at: new Date().toISOString(),
      step_results: [],
      input_data: inputData
    };

    try {
      for (const step of workflow.steps.sort((a, b) => a.order - b.order)) {
        const stepResult = await this.executeStep(step, execution);
        execution.step_results.push(stepResult);
        
        if (stepResult.status === 'failed') {
          execution.status = 'failed';
          execution.error_message = stepResult.error;
          break;
        }
      }

      if (execution.status === 'running') {
        execution.status = 'completed';
      }
    } catch (error) {
      execution.status = 'failed';
      execution.error_message = error instanceof Error ? error.message : 'Unknown error';
    }

    execution.completed_at = new Date().toISOString();
    execution.execution_time_ms = Date.now() - new Date(execution.started_at).getTime();

    return execution;
  }

  private async executeStep(step: AutomationStep, execution: AutomationExecution): Promise<AutomationStepResult> {
    const startTime = Date.now();
    
    try {
      let output: Record<string, any> = {};
      
      switch (step.type) {
        case 'action':
          output = await this.executeAction(step.config, execution);
          break;
        case 'condition':
          output = await this.evaluateCondition(step.config, execution);
          break;
        case 'delay':
          await this.executeDelay(step.config);
          output = { delayed: true, duration_ms: step.config.duration_ms || 1000 };
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      return {
        step_id: step.id,
        status: 'success',
        execution_time_ms: Date.now() - startTime,
        output
      };
    } catch (error) {
      return {
        step_id: step.id,
        status: 'failed',
        execution_time_ms: Date.now() - startTime,
        output: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async executeAction(config: Record<string, any>, execution: AutomationExecution): Promise<Record<string, any>> {
    // Simulate action execution
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      action_type: config.action_type,
      executed: true,
      timestamp: new Date().toISOString(),
      config
    };
  }

  private async evaluateCondition(config: Record<string, any>, execution: AutomationExecution): Promise<Record<string, any>> {
    // Evaluate condition based on actual config values
    let result = true;
    if (config.condition_type === 'threshold' && config.threshold != null && config.current_value != null) {
      result = config.current_value >= config.threshold;
    } else if (config.condition_type === 'equals' && config.expected != null && config.actual != null) {
      result = config.expected === config.actual;
    }
    // Default to true if no evaluable condition is provided

    return {
      condition_met: result,
      condition_type: config.condition_type,
      evaluated_at: new Date().toISOString()
    };
  }

  private async executeDelay(config: Record<string, any>): Promise<void> {
    const duration = config.duration_ms || 1000;
    await new Promise(resolve => setTimeout(resolve, Math.min(duration, 5000))); // Max 5s for demo
  }
}

export const automationEngine = AutomationEngine.getInstance();