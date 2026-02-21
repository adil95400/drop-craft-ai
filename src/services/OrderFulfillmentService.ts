import { supabase } from "@/integrations/supabase/client";
import { fromTable } from "@/integrations/supabase/typedClient";

export class OrderFulfillmentService {
  private static instance: OrderFulfillmentService;

  static getInstance(): OrderFulfillmentService {
    if (!OrderFulfillmentService.instance) {
      OrderFulfillmentService.instance = new OrderFulfillmentService();
    }
    return OrderFulfillmentService.instance;
  }

  async getFulfillmentRules(userId: string) {
    const { data, error } = await supabase
      .from('fulfilment_rules')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createFulfillmentRule(userId: string, rule: {
    name: string;
    description?: string;
    conditions: any;
    actions: any[];
    priority?: number;
  }) {
    const { data, error } = await supabase
      .from('fulfilment_rules')
      .insert({
        user_id: userId,
        name: rule.name,
        description: rule.description || null,
        conditions: rule.conditions,
        actions: rule.actions,
        priority: rule.priority || 0,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateFulfillmentRule(ruleId: string, userId: string, updates: any) {
    const { data, error } = await supabase
      .from('fulfilment_rules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', ruleId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteFulfillmentRule(ruleId: string, userId: string) {
    const { error } = await supabase
      .from('fulfilment_rules')
      .delete()
      .eq('id', ruleId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async processOrder(orderId: string, ruleId: string) {
    const { data, error } = await supabase.functions.invoke('order-fulfillment-auto', {
      body: { orderId, ruleId, action: 'process' }
    });

    if (error) throw error;
    return data;
  }

  async checkActiveRules() {
    const { data, error } = await supabase.functions.invoke('order-fulfillment-auto', {
      body: { action: 'check_rules' }
    });

    if (error) throw error;
    return data;
  }

  async getFulfillmentLogs(userId: string, filters?: {
    status?: string;
    limit?: number;
  }) {
    let query = fromTable('activity_logs')
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
    return data || [];
  }
}

export const orderFulfillmentService = OrderFulfillmentService.getInstance();
