import { supabase } from "@/integrations/supabase/client";

export class OrderFulfillmentService {
  private static instance: OrderFulfillmentService;

  static getInstance(): OrderFulfillmentService {
    if (!OrderFulfillmentService.instance) {
      OrderFulfillmentService.instance = new OrderFulfillmentService();
    }
    return OrderFulfillmentService.instance;
  }

  async getFulfillmentRules(userId: string) {
    const { data, error } = await (supabase
      .from('fulfilment_rules') as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createFulfillmentRule(userId: string, rule: {
    rule_name: string;
    trigger_conditions: any;
    fulfillment_actions: any;
    supplier_network_id?: string;
    auto_place_order: boolean;
    notification_settings?: any;
  }) {
    const { data, error } = await supabase
      .from('fulfilment_rules')
      .insert({
        user_id: userId,
        name: rule.rule_name,
        conditions: rule.trigger_conditions,
        actions: rule.fulfillment_actions,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateFulfillmentRule(ruleId: string, updates: any) {
    const { data, error } = await supabase
      .from('fulfilment_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteFulfillmentRule(ruleId: string) {
    const { error } = await supabase
      .from('fulfilment_rules')
      .delete()
      .eq('id', ruleId);

    if (error) throw error;
  }

  async processOrder(userId: string, orderId: string, ruleId: string) {
    const { data, error } = await supabase.functions.invoke('order-fulfillment-auto', {
      body: {
        userId,
        orderId,
        ruleId,
        action: 'process'
      }
    });

    if (error) throw error;
    return data;
  }

  async getFulfillmentLogs(userId: string, filters?: {
    orderId?: string;
    ruleId?: string;
    status?: string;
    limit?: number;
  }) {
    let query = supabase
      .from('automation_execution_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async checkActiveRules(userId: string) {
    const { data, error } = await supabase.functions.invoke('order-fulfillment-auto', {
      body: {
        userId,
        action: 'check_rules'
      }
    });

    if (error) throw error;
    return data;
  }
}

export const orderFulfillmentService = OrderFulfillmentService.getInstance();
