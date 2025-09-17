import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, timeframe = '24h' } = await req.json()

    if (!user_id) {
      throw new Error('User ID is required')
    }

    // Calculate time range based on timeframe
    let timeRangeStart: Date
    switch (timeframe) {
      case '1h':
        timeRangeStart = new Date(Date.now() - 60 * 60 * 1000)
        break
      case '24h':
        timeRangeStart = new Date(Date.now() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        timeRangeStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        timeRangeStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        timeRangeStart = new Date(Date.now() - 24 * 60 * 60 * 1000)
    }

    // Get total automation rules
    const { data: allRules, error: rulesError } = await supabase
      .from('automation_rules')
      .select('id, is_active, execution_count, success_rate, created_at')
      .eq('user_id', user_id)

    if (rulesError) {
      throw new Error('Failed to fetch automation rules')
    }

    const totalRules = allRules.length
    const activeRules = allRules.filter(rule => rule.is_active).length

    // Get automation executions for the timeframe
    const { data: executions, error: executionsError } = await supabase
      .from('automation_execution_logs')
      .select('*')
      .eq('user_id', user_id)
      .gte('started_at', timeRangeStart.toISOString())

    if (executionsError) {
      throw new Error('Failed to fetch execution logs')
    }

    // Calculate execution stats
    const totalExecutions = executions.length
    const completedExecutions = executions.filter(exec => exec.status === 'completed').length
    const failedExecutions = executions.filter(exec => exec.status === 'failed').length
    const successRate = totalExecutions > 0 ? (completedExecutions / totalExecutions * 100) : 100

    // Calculate time saved (estimate based on automation types)
    const timeSavedMinutes = executions.reduce((total, exec) => {
      const inputData = exec.input_data as any
      const actionType = inputData?.action_type || 'generic'
      
      // Estimate time saved per automation type (in minutes)
      const timeSavings: { [key: string]: number } = {
        'order_automation': 15,
        'stock_management': 20,
        'email_automation': 10,
        'report_generation': 30,
        'inventory_update': 25,
        'customer_notification': 8,
        'generic': 12
      }
      
      return total + (timeSavings[actionType] || timeSavings['generic'])
    }, 0)

    const timeSavedHours = Math.round(timeSavedMinutes / 60 * 100) / 100

    // Get automation performance by type
    const automationsByType = executions.reduce((acc: any, exec) => {
      const inputData = exec.input_data as any
      const type = inputData?.automation_type || 'other'
      
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          successes: 0,
          failures: 0,
          avg_execution_time_ms: 0
        }
      }
      
      acc[type].count++
      if (exec.status === 'completed') acc[type].successes++
      if (exec.status === 'failed') acc[type].failures++
      acc[type].avg_execution_time_ms += exec.execution_time_ms || 0
      
      return acc
    }, {})

    // Calculate averages
    Object.keys(automationsByType).forEach(type => {
      const typeData = automationsByType[type]
      typeData.avg_execution_time_ms = Math.round(typeData.avg_execution_time_ms / typeData.count)
      typeData.success_rate = Math.round((typeData.successes / typeData.count) * 100)
    })

    // Get top performing rules
    const topRules = allRules
      .sort((a, b) => (b.execution_count || 0) - (a.execution_count || 0))
      .slice(0, 5)
      .map(rule => ({
        id: rule.id,
        execution_count: rule.execution_count || 0,
        success_rate: Math.round((rule.success_rate || 100) * 100) / 100,
        is_active: rule.is_active
      }))

    // Calculate cost savings (rough estimate)
    const averageHourlyCost = 25 // Estimate $25/hour for manual operations
    const costSavings = Math.round(timeSavedHours * averageHourlyCost * 100) / 100

    // Get recent automation trends (last 7 days hourly breakdown)
    const trendData = await calculateAutomationTrends(supabase, user_id)

    const stats = {
      total_rules: totalRules,
      active_rules: activeRules,
      inactive_rules: totalRules - activeRules,
      jobs_completed_today: completedExecutions,
      jobs_failed_today: failedExecutions,
      total_executions_period: totalExecutions,
      success_rate: Math.round(successRate * 100) / 100,
      time_saved_hours: timeSavedHours,
      cost_savings_usd: costSavings,
      timeframe,
      performance_by_type: automationsByType,
      top_performing_rules: topRules,
      trends: trendData,
      efficiency_metrics: {
        avg_execution_time_ms: executions.length > 0 ? 
          Math.round(executions.reduce((sum, exec) => sum + (exec.execution_time_ms || 0), 0) / executions.length) : 0,
        automation_coverage: Math.round((activeRules / Math.max(totalRules, 1)) * 100),
        reliability_score: Math.round(successRate)
      }
    }

    // Log the stats request
    await supabase
      .from('activity_logs')
      .insert({
        user_id,
        action: 'automation_stats_generated',
        entity_type: 'system',
        entity_id: crypto.randomUUID(),
        description: `Automation statistics generated for ${timeframe}`,
        metadata: {
          timeframe,
          total_rules: totalRules,
          active_rules: activeRules,
          success_rate: successRate
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Automation statistics generated successfully',
        stats,
        generated_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Automation stats error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function calculateAutomationTrends(supabase: any, userId: string) {
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  const { data: recentExecutions, error } = await supabase
    .from('automation_execution_logs')
    .select('started_at, status')
    .eq('user_id', userId)
    .gte('started_at', last7Days.toISOString())
    .order('started_at', { ascending: true })

  if (error || !recentExecutions) {
    return {
      daily_executions: [],
      trend_direction: 'stable',
      growth_rate: 0
    }
  }

  // Group executions by day
  const dailyExecutions: { [date: string]: { total: number, successes: number } } = {}
  
  recentExecutions.forEach(exec => {
    const date = exec.started_at.split('T')[0]
    if (!dailyExecutions[date]) {
      dailyExecutions[date] = { total: 0, successes: 0 }
    }
    dailyExecutions[date].total++
    if (exec.status === 'completed') {
      dailyExecutions[date].successes++
    }
  })

  // Convert to array format
  const dailyData = Object.entries(dailyExecutions)
    .map(([date, data]) => ({
      date,
      total_executions: data.total,
      successful_executions: data.successes,
      success_rate: Math.round((data.successes / data.total) * 100)
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Calculate trend
  const executionCounts = dailyData.map(d => d.total_executions)
  const trendDirection = calculateTrend(executionCounts)
  const growthRate = calculateGrowthRate(executionCounts)

  return {
    daily_executions: dailyData,
    trend_direction: trendDirection,
    growth_rate: Math.round(growthRate * 100) / 100
  }
}

function calculateTrend(values: number[]): string {
  if (values.length < 2) return 'stable'
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2))
  const secondHalf = values.slice(Math.floor(values.length / 2))
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
  
  const change = (secondAvg - firstAvg) / Math.max(firstAvg, 1)
  
  if (change > 0.1) return 'increasing'
  if (change < -0.1) return 'decreasing'
  return 'stable'
}

function calculateGrowthRate(values: number[]): number {
  if (values.length < 2) return 0
  
  const firstValue = values[0] || 1
  const lastValue = values[values.length - 1] || 1
  
  return ((lastValue - firstValue) / firstValue) * 100
}