import { supabase } from '@/integrations/supabase/client';

export interface AutomationRule {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  rule_type: string;
  trigger_conditions: any;
  ai_conditions: any;
  actions: any;
  is_active: boolean;
  priority: number;
  execution_count: number;
  success_rate: number;
  last_executed_at?: string;
  performance_metrics: any;
  created_at: string;
  updated_at: string;
}

export interface AutomationExecution {
  success: boolean;
  analysis: any;
  decisions: any[];
  results: any[];
  executedActions: number;
}

export class AutomationEngineService {
  
  static async getAllRules(): Promise<AutomationRule[]> {
    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createRule(ruleData: Partial<AutomationRule>): Promise<AutomationRule> {
    const { data, error } = await supabase
      .from('automation_rules')
      .insert(ruleData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateRule(id: string, updates: Partial<AutomationRule>): Promise<AutomationRule> {
    const { data, error } = await supabase
      .from('automation_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteRule(id: string): Promise<void> {
    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async executeRule(ruleId: string, inputData: any): Promise<AutomationExecution> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('ai-automation-engine', {
      body: {
        ruleId,
        inputData,
        userId: currentUser.user.id
      }
    });

    if (error) throw error;
    return data;
  }

  static async toggleRuleStatus(id: string, isActive: boolean): Promise<AutomationRule> {
    return this.updateRule(id, { is_active: isActive });
  }

  static async getExecutionHistory(ruleId: string) {
    const { data, error } = await supabase
      .from('automation_executions')
      .select('*')
      .eq('workflow_id', ruleId)
      .order('started_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  static async getRulesByType(ruleType: AutomationRule['rule_type']): Promise<AutomationRule[]> {
    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('rule_type', ruleType)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Templates de règles prédéfinies
  static getPresetRules(): Partial<AutomationRule>[] {
    return [
      {
        name: 'Réapprovisionnement Intelligent',
        rule_type: 'inventory',
        description: 'Déclenche automatiquement les commandes fournisseur quand le stock est bas',
        trigger_conditions: {
          stock_level: 'below_threshold',
          demand_trend: 'stable_or_increasing'
        },
        ai_conditions: {
          confidence_threshold: 80,
          risk_tolerance: 'medium'
        },
        actions: [
          {
            type: 'create_purchase_order',
            parameters: {
              quantity_calculation: 'optimal',
              supplier_selection: 'best_performance'
            }
          }
        ]
      },
      {
        name: 'Prix Dynamiques',
        rule_type: 'pricing',
        description: 'Ajuste automatiquement les prix selon la demande et la concurrence',
        trigger_conditions: {
          market_change: 'significant',
          demand_change: 'notable'
        },
        ai_conditions: {
          confidence_threshold: 85,
          profit_margin_protection: true
        },
        actions: [
          {
            type: 'update_price',
            parameters: {
              max_change: 15,
              protection_margin: 20
            }
          }
        ]
      },
      {
        name: 'Campagnes Automatisées',
        rule_type: 'marketing',
        description: 'Lance des campagnes marketing basées sur le comportement client',
        trigger_conditions: {
          customer_behavior: 'abandoned_cart',
          time_since_last_purchase: '>30_days'
        },
        ai_conditions: {
          segment_match: 'high_value_customer',
          engagement_probability: '>60%'
        },
        actions: [
          {
            type: 'create_campaign',
            parameters: {
              campaign_type: 'email_retargeting',
              discount_offer: 'dynamic'
            }
          }
        ]
      }
    ];
  }
}