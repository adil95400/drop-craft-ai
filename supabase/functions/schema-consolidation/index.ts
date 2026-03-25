import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: string[] = []

    // 1. Drop FK from workflow_executions → workflow_templates
    const { error: e1 } = await supabase.rpc('exec_sql_admin', {
      sql_text: `ALTER TABLE public.workflow_executions DROP CONSTRAINT IF EXISTS workflow_executions_workflow_id_fkey`
    })
    results.push(e1 ? `FK drop: ${e1.message}` : 'FK dropped')

    // 2. Add FK to automation_workflows
    const { error: e2 } = await supabase.rpc('exec_sql_admin', {
      sql_text: `ALTER TABLE public.workflow_executions ADD CONSTRAINT workflow_executions_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.automation_workflows(id) ON DELETE CASCADE`
    })
    results.push(e2 ? `FK add: ${e2.message}` : 'FK added to automation_workflows')

    // 3. Drop legacy tables
    for (const table of ['saved_workflows', 'workflow_templates', 'repricing_rules']) {
      const { error } = await supabase.rpc('exec_sql_admin', {
        sql_text: `DROP TABLE IF EXISTS public.${table} CASCADE`
      })
      results.push(error ? `Drop ${table}: ${error.message}` : `Dropped ${table}`)
    }

    // 4. Drop orphaned functions
    for (const fn of ['automation_rules_insert_fn', 'automation_rules_update_fn', 'automation_rules_delete_fn']) {
      const { error } = await supabase.rpc('exec_sql_admin', {
        sql_text: `DROP FUNCTION IF EXISTS public.${fn}() CASCADE`
      })
      results.push(error ? `Drop ${fn}: ${error.message}` : `Dropped ${fn}`)
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
