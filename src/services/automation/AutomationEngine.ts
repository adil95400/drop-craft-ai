import { supabase } from "@/integrations/supabase/client";

export interface AutomationWorkflow {
  id: string;
  name: string;
  description?: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  steps: AutomationStep[];
  status: 'draft' | 'active' | 'paused' | 'error';
  success_count: number;
  failure_count: number;
  execution_count: number;
  last_executed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AutomationStep {
  id: string;
  type: 'condition' | 'action' | 'delay' | 'branch';
  name: string;
  config: Record<string, any>;
  order: number;
  enabled: boolean;
}

export interface AutomationTrigger {
  type: string;
  name: string;
  description: string;
  config_schema: Record<string, any>;
  supported_events: string[];
}

export interface AutomationAction {
  type: string;
  name: string;
  description: string;
  config_schema: Record<string, any>;
  category: string;
}

export interface AutomationExecution {
  id: string;
  workflow_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  input_data: Record<string, any>;
  output_data?: Record<string, any>;
  step_results: AutomationStepResult[];
  error_message?: string;
  started_at: Date;
  completed_at?: Date;
  execution_time_ms?: number;
}

export interface AutomationStepResult {
  step_id: string;
  status: 'success' | 'failed' | 'skipped';
  output: Record<string, any>;
  error?: string;
  execution_time_ms: number;
}

export class AutomationEngine {
  async getWorkflows(userId: string): Promise<AutomationWorkflow[]> {
    const { data, error } = await supabase
      .from('automation_workflows')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any[];
  }

  async createWorkflow(userId: string, workflow: Partial<AutomationWorkflow>): Promise<AutomationWorkflow> {
    const { data, error } = await supabase
      .from('automation_workflows')
      .insert({
        user_id: userId,
        name: workflow.name || 'New Workflow',
        description: workflow.description,
        trigger_type: workflow.trigger_type || 'manual',
        trigger_config: workflow.trigger_config || {} as any,
        steps: workflow.steps || [] as any,
        status: workflow.status || 'draft'
      })
      .select()
      .single();

    if (error) throw error;
    return data as any;
  }

  async updateWorkflow(workflowId: string, updates: Partial<AutomationWorkflow>): Promise<AutomationWorkflow> {
    const { data, error } = await supabase
      .from('automation_workflows')
      .update(updates as any)
      .eq('id', workflowId)
      .select()
      .single();

    if (error) throw error;
    return data as any;
  }

  async executeWorkflow(workflowId: string, inputData: Record<string, any> = {}): Promise<AutomationExecution> {
    // Create execution record
    const { data: execution, error: execError } = await supabase
      .from('automation_executions')
      .insert({
        workflow_id: workflowId,
        user_id: inputData.user_id,
        status: 'running',
        input_data: inputData,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (execError) throw execError;

    try {
      // Get workflow details
      const { data: workflow, error: workflowError } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (workflowError) throw workflowError;

      // Execute workflow steps
      const stepResults = await this.executeWorkflowSteps(workflow, inputData);

      // Update execution with results
      const { data: updatedExecution, error: updateError } = await supabase
        .from('automation_executions')
        .update({
          status: 'completed',
          step_results: stepResults as any,
          completed_at: new Date().toISOString(),
          execution_time_ms: Date.now() - new Date(execution.started_at).getTime()
        })
        .eq('id', execution.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update workflow stats
      await supabase
        .from('automation_workflows')
        .update({
          success_count: workflow.success_count + 1,
          execution_count: workflow.execution_count + 1,
          last_executed_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      return updatedExecution as any;

    } catch (error) {
      // Update execution with error
      await supabase
        .from('automation_executions')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', execution.id);

      throw error;
    }
  }

  private async executeWorkflowSteps(workflow: any, inputData: Record<string, any>): Promise<AutomationStepResult[]> {
    const results: AutomationStepResult[] = [];
    let context = { ...inputData };

    for (const step of workflow.steps) {
      const startTime = Date.now();
      
      try {
        const result = await this.executeStep(step, context);
        
        results.push({
          step_id: step.id,
          status: 'success',
          output: result,
          execution_time_ms: Date.now() - startTime
        });

        // Update context with step results
        context = { ...context, ...result };

      } catch (error) {
        results.push({
          step_id: step.id,
          status: 'failed',
          output: {},
          error: error instanceof Error ? error.message : 'Unknown error',
          execution_time_ms: Date.now() - startTime
        });

        // Stop execution on error (could be configurable)
        break;
      }
    }

    return results;
  }

  private async executeStep(step: AutomationStep, context: Record<string, any>): Promise<Record<string, any>> {
    switch (step.type) {
      case 'condition':
        return this.executeCondition(step, context);
      case 'action':
        return this.executeAction(step, context);
      case 'delay':
        return this.executeDelay(step, context);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async executeCondition(step: AutomationStep, context: Record<string, any>): Promise<Record<string, any>> {
    const { condition, value, operator } = step.config;
    const contextValue = this.getValueFromContext(condition, context);
    
    const result = this.evaluateCondition(contextValue, operator, value);
    
    return { conditionResult: result, contextValue, expectedValue: value };
  }

  private async executeAction(step: AutomationStep, context: Record<string, any>): Promise<Record<string, any>> {
    const { action_type, config } = step.config;

    switch (action_type) {
      case 'send_email':
        return this.sendEmail(config, context);
      case 'update_record':
        return this.updateRecord(config, context);
      case 'create_notification':
        return this.createNotification(config, context);
      case 'webhook':
        return this.callWebhook(config, context);
      default:
        throw new Error(`Unknown action type: ${action_type}`);
    }
  }

  private async executeDelay(step: AutomationStep, context: Record<string, any>): Promise<Record<string, any>> {
    const { duration } = step.config;
    await new Promise(resolve => setTimeout(resolve, duration * 1000));
    return { delayed: duration };
  }

  private getValueFromContext(path: string, context: Record<string, any>): any {
    return path.split('.').reduce((obj, key) => obj?.[key], context);
  }

  private evaluateCondition(contextValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals': return contextValue === expectedValue;
      case 'not_equals': return contextValue !== expectedValue;
      case 'greater_than': return contextValue > expectedValue;
      case 'less_than': return contextValue < expectedValue;
      case 'contains': return String(contextValue).includes(expectedValue);
      case 'exists': return contextValue !== null && contextValue !== undefined;
      default: return false;
    }
  }

  private async sendEmail(config: any, context: Record<string, any>): Promise<Record<string, any>> {
    // Mock email sending
    console.log('Sending email:', config, context);
    return { emailSent: true, recipient: config.to };
  }

  private async updateRecord(config: any, context: Record<string, any>): Promise<Record<string, any>> {
    const { table, id, updates } = config;
    
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return { recordUpdated: true, table, id };
  }

  private async createNotification(config: any, context: Record<string, any>): Promise<Record<string, any>> {
    // Mock notification creation
    console.log('Creating notification:', config, context);
    return { notificationCreated: true, message: config.message };
  }

  private async callWebhook(config: any, context: Record<string, any>): Promise<Record<string, any>> {
    const { url, method = 'POST', headers = {}, payload } = config;
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ ...payload, context })
    });

    const result = await response.json();
    return { webhookCalled: true, status: response.status, result };
  }

  async getAvailableTriggers(): Promise<AutomationTrigger[]> {
    return [
      {
        type: 'manual',
        name: 'Manual Trigger',
        description: 'Manually execute the workflow',
        config_schema: {},
        supported_events: ['execute']
      },
      {
        type: 'schedule',
        name: 'Scheduled Trigger',
        description: 'Execute on a schedule (cron expression)',
        config_schema: {
          cron: { type: 'string', required: true, description: 'Cron expression' }
        },
        supported_events: ['time']
      },
      {
        type: 'webhook',
        name: 'Webhook Trigger',
        description: 'Execute when webhook is called',
        config_schema: {
          secret: { type: 'string', required: false, description: 'Webhook secret' }
        },
        supported_events: ['webhook']
      },
      {
        type: 'data_change',
        name: 'Data Change Trigger',
        description: 'Execute when data changes',
        config_schema: {
          table: { type: 'string', required: true, description: 'Table to monitor' },
          operation: { type: 'string', required: true, description: 'INSERT, UPDATE, DELETE' }
        },
        supported_events: ['insert', 'update', 'delete']
      }
    ];
  }

  async getAvailableActions(): Promise<AutomationAction[]> {
    return [
      {
        type: 'send_email',
        name: 'Send Email',
        description: 'Send an email notification',
        category: 'Communication',
        config_schema: {
          to: { type: 'string', required: true },
          subject: { type: 'string', required: true },
          body: { type: 'string', required: true }
        }
      },
      {
        type: 'update_record',
        name: 'Update Record',
        description: 'Update a database record',
        category: 'Database',
        config_schema: {
          table: { type: 'string', required: true },
          id: { type: 'string', required: true },
          updates: { type: 'object', required: true }
        }
      },
      {
        type: 'create_notification',
        name: 'Create Notification',
        description: 'Create an in-app notification',
        category: 'Communication',
        config_schema: {
          title: { type: 'string', required: true },
          message: { type: 'string', required: true },
          type: { type: 'string', required: false }
        }
      },
      {
        type: 'webhook',
        name: 'Call Webhook',
        description: 'Make an HTTP request to external service',
        category: 'Integration',
        config_schema: {
          url: { type: 'string', required: true },
          method: { type: 'string', required: false },
          headers: { type: 'object', required: false },
          payload: { type: 'object', required: false }
        }
      }
    ];
  }

  async getExecutions(workflowId?: string): Promise<AutomationExecution[]> {
    let query = supabase
      .from('automation_executions')
      .select('*')
      .order('started_at', { ascending: false });

    if (workflowId) {
      query = query.eq('workflow_id', workflowId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as any[];
  }
}

export const automationEngine = new AutomationEngine();