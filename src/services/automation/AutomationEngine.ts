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
    // Mock workflows for demo
    return [
      {
        id: '1',
        name: 'Automated Stock Reorder',
        description: 'Automatically reorder products when stock is low',
        trigger_type: 'condition',
        trigger_config: { threshold: 10 },
        steps: [
          { id: '1', type: 'condition', config: { stock_level: '<= 10' }, order: 1 },
          { id: '2', type: 'action', config: { action_type: 'reorder', quantity: 100 }, order: 2 }
        ],
        status: 'active',
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        execution_count: 45,
        success_count: 42,
        failure_count: 3
      }
    ];
  }

  async getExecutions(): Promise<AutomationExecution[]> {
    // Mock executions for demo
    return [
      {
        id: '1',
        workflow_id: '1',
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        execution_time_ms: 1500,
        step_results: [
          { step_id: '1', status: 'success', execution_time_ms: 500, output: { condition_met: true } },
          { step_id: '2', status: 'success', execution_time_ms: 1000, output: { order_placed: true } }
        ]
      }
    ];
  }

  async updateWorkflow(workflow: AutomationWorkflow): Promise<AutomationWorkflow> {
    // Mock update
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