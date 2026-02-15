import { supabase } from '@/integrations/supabase/client'

export interface AutomationRule {
  id: string
  name: string
  trigger_type: 'order_placed' | 'stock_low' | 'payment_received' | 'shipping_delay'
  conditions: Record<string, any>
  actions: AutomationAction[]
  is_active: boolean
  execution_count: number
  success_rate: number
  last_executed_at?: string
}

export interface AutomationAction {
  type: 'send_email' | 'update_stock' | 'notify_supplier' | 'create_support_ticket' | 'update_status'
  config: Record<string, any>
  delay_minutes?: number
}

export interface OrderAutomationJob {
  id: string
  order_id: string
  rule_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  scheduled_at: string
  completed_at?: string
  error_message?: string
  actions_executed: number
  total_actions: number
}

export class OrderAutomationService {
  private static instance: OrderAutomationService

  public static getInstance(): OrderAutomationService {
    if (!OrderAutomationService.instance) {
      OrderAutomationService.instance = new OrderAutomationService()
    }
    return OrderAutomationService.instance
  }

  async createAutomationRule(rule: {
    name: string
    trigger_type: string
    conditions: any
    actions: any[]
    is_active: boolean
  }): Promise<AutomationRule> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('automation_workflows')
      .insert({
        user_id: user.id,
        name: rule.name,
        trigger_type: rule.trigger_type,
        action_type: 'order_automation',
        trigger_config: { trigger_type: rule.trigger_type, ...rule.conditions },
        action_config: rule.actions,
        is_active: rule.is_active,
        trigger_count: 0
      } as any)
      .select()
      .single()

    if (error) throw error
    return this.mapDatabaseRuleToAutomationRule(data)
  }

  async getAutomationRules(): Promise<AutomationRule[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('user_id', user.id)
      .eq('action_type', 'order_automation')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(this.mapDatabaseRuleToAutomationRule)
  }

  async processOrderAutomation(orderId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('order-automation-processor', {
      body: { order_id: orderId, trigger_type: 'order_placed', immediate_processing: true }
    })

    if (error) throw error
    console.log('Order automation processed:', data)
  }

  async getAutomationStats(): Promise<{
    total_rules: number
    active_rules: number
    jobs_completed_today: number
    success_rate: number
    time_saved_hours: number
  }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get rules count
    const { data: rules } = await supabase
      .from('automation_rules')
      .select('id, is_active, trigger_count')
      .eq('user_id', user.id)
      .eq('action_type', 'order_automation')

    const totalRules = rules?.length || 0
    const activeRules = rules?.filter(r => r.is_active).length || 0

    // Get today's execution logs
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: logs } = await (supabase
      .from('activity_logs') as any)
      .select('severity')
      .eq('user_id', user.id)
      .eq('entity_type', 'automation')
      .gte('created_at', today.toISOString())

    const completedToday = logs?.filter((l: any) => l.severity === 'info').length || 0
    const totalToday = logs?.length || 0
    const successRate = totalToday > 0 ? (completedToday / totalToday) * 100 : 100

    // Estimate time saved (2 min per automated action)
    const totalExecutions = rules?.reduce((sum, r) => sum + (r.trigger_count || 0), 0) || 0
    const timeSavedHours = (totalExecutions * 2) / 60

    return {
      total_rules: totalRules,
      active_rules: activeRules,
      jobs_completed_today: completedToday,
      success_rate: Math.round(successRate),
      time_saved_hours: Math.round(timeSavedHours * 10) / 10
    }
  }

  async toggleAutomationRule(ruleId: string, isActive: boolean): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('automation_rules')
      .update({ is_active: isActive } as any)
      .eq('id', ruleId)
      .eq('user_id', user.id)

    if (error) throw error
  }

  async getAutomationJobs(status?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let query = (supabase
      .from('activity_logs') as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('entity_type', 'automation')
      .order('created_at', { ascending: false })
      .limit(100)

    if (status) query = query.eq('severity', status === 'completed' ? 'info' : 'error')

    const { data, error } = await query
    if (error) throw error

    return (data || []).map((log: any) => ({
      id: log.id,
      order_id: (log.input_data as any)?.order_id || '',
      rule_id: log.trigger_id || '',
      status: log.status,
      scheduled_at: log.executed_at,
      completed_at: log.executed_at,
      error_message: log.error_message,
      actions_executed: (log.output_data as any)?.actions_executed || 0,
      total_actions: (log.output_data as any)?.actions_executed || 0
    }))
  }

  private mapDatabaseRuleToAutomationRule(dbRule: any): AutomationRule {
    return {
      id: dbRule.id,
      name: dbRule.name,
      trigger_type: dbRule.trigger_config?.trigger_type || dbRule.trigger_type || 'order_placed',
      conditions: dbRule.trigger_config || {},
      actions: dbRule.action_config || [],
      is_active: dbRule.is_active,
      execution_count: dbRule.trigger_count || 0,
      success_rate: 100,
      last_executed_at: dbRule.last_triggered_at
    }
  }
}

export const orderAutomationService = OrderAutomationService.getInstance()
