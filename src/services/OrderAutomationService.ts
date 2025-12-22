import { supabase } from '@/integrations/supabase/client'

export interface AutomationRule {
  id: string
  name: string
  trigger_type: 'order_placed' | 'stock_low' | 'payment_received' | 'shipping_delay'
  conditions: {
    order_status?: string
    payment_status?: string
    product_category?: string
    customer_tier?: string
    order_value_min?: number
    stock_threshold?: number
  }
  actions: AutomationAction[]
  is_active: boolean
  execution_count: number
  success_rate: number
  last_executed_at?: string
}

export interface AutomationAction {
  type: 'send_email' | 'update_stock' | 'notify_supplier' | 'create_support_ticket' | 'apply_discount' | 'auto_refund'
  config: {
    template_id?: string
    recipient?: string
    message?: string
    discount_percentage?: number
    refund_amount?: number
    supplier_id?: string
    priority?: 'low' | 'medium' | 'high'
  }
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
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('automation_rules')
        .insert([{
          user_id: user.id,
          name: rule.name,
          trigger_type: rule.trigger_type,
          action_type: 'order_automation',
          trigger_config: {
            trigger_type: rule.trigger_type,
            ...rule.conditions
          },
          action_config: rule.actions,
          is_active: rule.is_active,
          trigger_count: 0
        }])
        .select()
        .single()

      if (error) throw error
      return this.mapDatabaseRuleToAutomationRule(data)
    } catch (error) {
      console.error('Failed to create automation rule:', error)
      throw error
    }
  }

  async getAutomationRules(): Promise<AutomationRule[]> {
    try {
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
    } catch (error) {
      console.error('Failed to fetch automation rules:', error)
      throw error
    }
  }

  async processOrderAutomation(orderId: string): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('order-automation-processor', {
        body: {
          order_id: orderId,
          trigger_type: 'order_placed',
          immediate_processing: true
        }
      })

      if (error) throw error
      console.log('Order automation processed:', data)
    } catch (error) {
      console.error('Order automation processing failed:', error)
      throw error
    }
  }

  async handleStockAutomation(productId: string, currentStock: number): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('stock-automation-handler', {
        body: {
          product_id: productId,
          current_stock: currentStock,
          trigger_type: 'stock_low',
          auto_reorder: true,
          backup_suppliers: true
        }
      })

      if (error) throw error
      console.log('Stock automation handled:', data)
    } catch (error) {
      console.error('Stock automation failed:', error)
      throw error
    }
  }

  async processRefundAutomation(orderId: string, reason: string, amount?: number): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('refund-automation-processor', {
        body: {
          order_id: orderId,
          refund_reason: reason,
          refund_amount: amount,
          auto_approve: true,
          notify_customer: true
        }
      })

      if (error) throw error
      console.log('Refund automation processed:', data)
    } catch (error) {
      console.error('Refund automation failed:', error)
      throw error
    }
  }

  async getAutomationJobs(status?: string): Promise<OrderAutomationJob[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      let query = supabase
        .from('automation_execution_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('executed_at', { ascending: false })
        .limit(100)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []).map((log: any) => ({
        id: log.id,
        order_id: (log.input_data as any)?.order_id || '',
        rule_id: log.trigger_id || '',
        status: log.status as 'pending' | 'processing' | 'completed' | 'failed',
        scheduled_at: log.executed_at,
        completed_at: log.executed_at,
        error_message: log.error_message,
        actions_executed: 1,
        total_actions: 1
      }))
    } catch (error) {
      console.error('Failed to fetch automation jobs:', error)
      throw error
    }
  }

  async toggleAutomationRule(ruleId: string, isActive: boolean): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('automation_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId)
        .eq('user_id', user.id)

      if (error) throw error
    } catch (error) {
      console.error('Failed to toggle automation rule:', error)
      throw error
    }
  }

  async getAutomationStats(): Promise<{
    total_rules: number
    active_rules: number
    jobs_completed_today: number
    success_rate: number
    time_saved_hours: number
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase.functions.invoke('automation-stats', {
        body: { user_id: user.id, timeframe: '24h' }
      })

      if (error) throw error
      return data.stats || {
        total_rules: 0,
        active_rules: 0,
        jobs_completed_today: 0,
        success_rate: 0,
        time_saved_hours: 0
      }
    } catch (error) {
      console.error('Failed to fetch automation stats:', error)
      return {
        total_rules: 0,
        active_rules: 0,
        jobs_completed_today: 0,
        success_rate: 0,
        time_saved_hours: 0
      }
    }
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
