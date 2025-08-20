import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      throw new Error('Invalid auth token');
    }

    console.log(`Automation Engine action: ${action} for user: ${user.id}`);

    switch (action) {
      case 'create_workflow':
        return await createWorkflow(user.id, data);
      
      case 'execute_workflow':
        return await executeWorkflow(user.id, data);
      
      case 'sync_prices':
        return await syncPrices(user.id, data);
      
      case 'import_products':
        return await importProducts(user.id, data);
      
      case 'update_inventory':
        return await updateInventory(user.id, data);
      
      case 'process_order':
        return await processOrder(user.id, data);
      
      case 'get_workflows':
        return await getWorkflows(user.id);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error in automation engine function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function createWorkflow(userId: string, data: any) {
  const {
    name,
    description,
    trigger_type,
    trigger_config,
    steps
  } = data;

  const { data: workflow, error } = await supabase
    .from('automation_workflows')
    .insert({
      user_id: userId,
      name,
      description,
      trigger_type,
      trigger_config,
      steps,
      status: 'draft'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating workflow:', error);
    throw error;
  }

  console.log(`Created workflow: ${workflow.id}`);

  return new Response(
    JSON.stringify({ 
      success: true, 
      workflow
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function executeWorkflow(userId: string, data: any) {
  const { workflow_id, input_data = {} } = data;

  // Get workflow
  const { data: workflow, error: workflowError } = await supabase
    .from('automation_workflows')
    .select('*')
    .eq('id', workflow_id)
    .eq('user_id', userId)
    .single();

  if (workflowError || !workflow) {
    throw new Error('Workflow not found');
  }

  if (workflow.status !== 'active') {
    throw new Error('Workflow is not active');
  }

  // Create execution record
  const { data: execution, error: executionError } = await supabase
    .from('automation_executions')
    .insert({
      workflow_id,
      user_id: userId,
      input_data,
      status: 'running'
    })
    .select()
    .single();

  if (executionError) {
    console.error('Error creating execution:', executionError);
    throw executionError;
  }

  console.log(`Starting execution: ${execution.id} for workflow: ${workflow.name}`);

  try {
    const startTime = Date.now();
    const stepResults = [];

    // Execute each step
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      console.log(`Executing step ${i + 1}: ${step.type}`);

      let stepResult;
      switch (step.type) {
        case 'sync_prices':
          stepResult = await executeSyncPricesStep(userId, step, input_data);
          break;
        case 'import_products':
          stepResult = await executeImportProductsStep(userId, step, input_data);
          break;
        case 'update_inventory':
          stepResult = await executeUpdateInventoryStep(userId, step, input_data);
          break;
        case 'send_email':
          stepResult = await executeSendEmailStep(userId, step, input_data);
          break;
        case 'wait':
          stepResult = await executeWaitStep(step);
          break;
        case 'condition':
          stepResult = await executeConditionStep(step, input_data);
          break;
        default:
          stepResult = { success: false, error: `Unknown step type: ${step.type}` };
      }

      stepResults.push({
        step_index: i,
        step_type: step.type,
        ...stepResult
      });

      // If step failed and not configured to continue on error, stop execution
      if (!stepResult.success && !step.continue_on_error) {
        break;
      }
    }

    const executionTime = Date.now() - startTime;
    const allSuccessful = stepResults.every(r => r.success);

    // Update execution record
    await supabase
      .from('automation_executions')
      .update({
        status: allSuccessful ? 'completed' : 'failed',
        step_results: stepResults,
        execution_time_ms: executionTime,
        completed_at: new Date().toISOString()
      })
      .eq('id', execution.id);

    // Update workflow stats
    await supabase
      .from('automation_workflows')
      .update({
        execution_count: workflow.execution_count + 1,
        success_count: workflow.success_count + (allSuccessful ? 1 : 0),
        failure_count: workflow.failure_count + (allSuccessful ? 0 : 1),
        last_executed_at: new Date().toISOString()
      })
      .eq('id', workflow_id);

    return new Response(
      JSON.stringify({ 
        success: allSuccessful, 
        execution_id: execution.id,
        step_results: stepResults,
        execution_time_ms: executionTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error executing workflow:', error);
    
    // Update execution record with error
    await supabase
      .from('automation_executions')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', execution.id);

    throw error;
  }
}

async function executeSyncPricesStep(userId: string, step: any, inputData: any) {
  console.log('Executing sync prices step');
  
  // Simulate price synchronization with external suppliers
  const productsUpdated = Math.floor(Math.random() * 50) + 10;
  
  // In a real implementation, this would:
  // 1. Fetch products from user's catalog
  // 2. Query supplier APIs for current prices
  // 3. Update product prices in database
  // 4. Log changes for audit trail
  
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API calls
  
  return {
    success: true,
    products_updated: productsUpdated,
    message: `Successfully updated prices for ${productsUpdated} products`
  };
}

async function executeImportProductsStep(userId: string, step: any, inputData: any) {
  console.log('Executing import products step');
  
  // Simulate product import from external sources
  const productsImported = Math.floor(Math.random() * 20) + 5;
  
  // In a real implementation, this would:
  // 1. Connect to supplier APIs (AliExpress, BigBuy, etc.)
  // 2. Fetch trending/winning products
  // 3. Process product data (images, descriptions, etc.)
  // 4. Import to user's catalog
  
  await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate import process
  
  return {
    success: true,
    products_imported: productsImported,
    message: `Successfully imported ${productsImported} new products`
  };
}

async function executeUpdateInventoryStep(userId: string, step: any, inputData: any) {
  console.log('Executing update inventory step');
  
  // Simulate inventory synchronization
  const inventoryUpdated = Math.floor(Math.random() * 100) + 20;
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    success: true,
    inventory_updated: inventoryUpdated,
    message: `Successfully updated inventory for ${inventoryUpdated} products`
  };
}

async function executeSendEmailStep(userId: string, step: any, inputData: any) {
  console.log('Executing send email step');
  
  // Simulate email sending
  const emailsSent = Math.floor(Math.random() * 10) + 1;
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    emails_sent: emailsSent,
    message: `Successfully sent ${emailsSent} emails`
  };
}

async function executeWaitStep(step: any) {
  const waitTime = step.duration || 1000;
  console.log(`Waiting for ${waitTime}ms`);
  
  await new Promise(resolve => setTimeout(resolve, waitTime));
  
  return {
    success: true,
    waited_ms: waitTime,
    message: `Wait completed: ${waitTime}ms`
  };
}

async function executeConditionStep(step: any, inputData: any) {
  console.log('Executing condition step');
  
  // Simple condition evaluation (in real implementation, would be more sophisticated)
  const condition = step.condition || true;
  const result = typeof condition === 'boolean' ? condition : Math.random() > 0.3;
  
  return {
    success: true,
    condition_result: result,
    message: `Condition evaluated: ${result}`
  };
}

async function syncPrices(userId: string, data: any) {
  console.log('Manual price sync triggered');
  
  // Simulate manual price sync
  const mockSync = {
    products_checked: 150,
    products_updated: 23,
    price_changes: [
      { product_id: '1', old_price: 29.99, new_price: 27.50 },
      { product_id: '2', old_price: 15.90, new_price: 16.50 }
    ],
    execution_time_ms: 4500
  };
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      sync_result: mockSync
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function importProducts(userId: string, data: any) {
  console.log('Manual product import triggered');
  
  const mockImport = {
    products_found: 50,
    products_imported: 12,
    categories: ['Electronics', 'Fashion', 'Home & Garden'],
    execution_time_ms: 8000
  };
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      import_result: mockImport
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateInventory(userId: string, data: any) {
  console.log('Manual inventory update triggered');
  
  const mockInventory = {
    products_checked: 200,
    stock_updated: 45,
    out_of_stock: 3,
    low_stock_alerts: 8,
    execution_time_ms: 2800
  };
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      inventory_result: mockInventory
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function processOrder(userId: string, data: any) {
  console.log('Processing order automation');
  
  const { order_id } = data;
  
  const mockProcessing = {
    order_id,
    steps_completed: [
      'Order validated',
      'Inventory reserved',
      'Supplier notified',
      'Customer confirmation sent',
      'Tracking number generated'
    ],
    estimated_shipping: '2-3 business days',
    execution_time_ms: 1200
  };
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      processing_result: mockProcessing
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getWorkflows(userId: string) {
  const { data: workflows, error } = await supabase
    .from('automation_workflows')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching workflows:', error);
    throw error;
  }

  // Get execution stats for each workflow
  const workflowsWithStats = await Promise.all(
    workflows.map(async (workflow) => {
      const { data: executions } = await supabase
        .from('automation_executions')
        .select('status, execution_time_ms')
        .eq('workflow_id', workflow.id)
        .order('started_at', { ascending: false })
        .limit(10);

      const recentExecutions = executions || [];
      const avgExecutionTime = recentExecutions.length > 0
        ? recentExecutions.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / recentExecutions.length
        : 0;

      return {
        ...workflow,
        recent_executions: recentExecutions.length,
        avg_execution_time_ms: avgExecutionTime,
        success_rate: workflow.execution_count > 0 
          ? (workflow.success_count / workflow.execution_count) * 100 
          : 100
      };
    })
  );

  return new Response(
    JSON.stringify({ 
      success: true, 
      workflows: workflowsWithStats
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}