import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const token = req.headers.get('x-extension-token')
    const { action, data } = await req.json()

    // Validate token
    let userId = null
    if (token) {
      const { data: authData } = await supabase
        .from('extension_auth_tokens')
        .select('user_id')
        .eq('token', token)
        .eq('is_active', true)
        .single()
      
      userId = authData?.user_id
    }

    // Report extension error
    if (action === 'report_error') {
      const { error_type, error_message, stack_trace, context } = data

      await supabase.from('extension_errors').insert({
        user_id: userId,
        error_type,
        error_message,
        stack_trace,
        context,
        extension_version: context?.version,
        browser_info: context?.browser
      })

      // Check for critical errors
      if (error_type === 'critical') {
        console.error('🚨 Critical extension error:', error_message)
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Error reported' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send heartbeat
    if (action === 'heartbeat') {
      const { version, browser, active_tabs } = data

      await supabase.from('extension_heartbeats').insert({
        user_id: userId,
        extension_version: version,
        browser_info: browser,
        active_tabs,
        timestamp: new Date().toISOString()
      })

      return new Response(
        JSON.stringify({ success: true, status: 'alive' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get health metrics
    if (action === 'metrics') {
      // Get error rate
      const { data: errors } = await supabase
        .from('extension_errors')
        .select('id, error_type, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      // Get active users
      const { data: heartbeats } = await supabase
        .from('extension_heartbeats')
        .select('user_id')
        .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString())

      const activeUsers = new Set(heartbeats?.map(h => h.user_id)).size

      // Get analytics summary
      const { data: analytics } = await supabase
        .from('extension_analytics')
        .select('event_type, event_data')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      const metrics = {
        health_status: errors && errors.length > 100 ? 'degraded' : 'healthy',
        error_count_24h: errors?.length || 0,
        critical_errors: errors?.filter(e => e.error_type === 'critical').length || 0,
        active_users_5m: activeUsers,
        total_events_24h: analytics?.length || 0,
        import_success_rate: calculateSuccessRate(analytics || []),
        last_updated: new Date().toISOString()
      }

      return new Response(
        JSON.stringify(metrics),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Run automated tests
    if (action === 'run_tests') {
      const tests = [
        {
          name: 'Token Validation',
          test: async () => {
            const { data } = await supabase
              .from('extension_auth_tokens')
              .select('id')
              .eq('is_active', true)
              .limit(1)
            return data && data.length > 0
          }
        },
        {
          name: 'Product Import',
          test: async () => {
            const { error } = await supabase
              .from('supplier_products')
              .select('id')
              .limit(1)
            return !error
          }
        },
        {
          name: 'Analytics Logging',
          test: async () => {
            const { error } = await supabase
              .from('extension_analytics')
              .select('id')
              .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
              .limit(1)
            return !error
          }
        }
      ]

      const results = []
      for (const test of tests) {
        try {
          const passed = await test.test()
          results.push({ name: test.name, passed, error: null })
        } catch (error) {
          results.push({ name: test.name, passed: false, error: error.message })
        }
      }

      const allPassed = results.every(r => r.passed)

      return new Response(
        JSON.stringify({ 
          success: true, 
          all_passed: allPassed,
          results 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Health monitor error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function calculateSuccessRate(analytics: any[]): number {
  const imports = analytics.filter(a => a.event_type === 'bulk_import')
  if (imports.length === 0) return 100

  const totalSuccessful = imports.reduce((sum, i) => sum + (i.event_data?.successful || 0), 0)
  const totalFailed = imports.reduce((sum, i) => sum + (i.event_data?.failed || 0), 0)
  const total = totalSuccessful + totalFailed

  return total > 0 ? Math.round((totalSuccessful / total) * 100) : 100
}
