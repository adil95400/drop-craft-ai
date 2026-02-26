/**
 * @module AutomationEngineService
 * @description CRUD & execution service for automation rules.
 *
 * Rules are persisted in `automation_rules` / `automation_workflows` tables
 * and executed server-side via the `ai-automation-engine` edge function.
 *
 * The service also exposes preset rule templates for quick onboarding
 * (inventory reorder, dynamic pricing, automated campaigns).
 */
import { supabase } from '@/integrations/supabase/client';

/** Domain model for an automation rule (mapped from DB records). */
export interface AutomationRule {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  /** Discriminator: "inventory" | "pricing" | "marketing" | "custom" */
  rule_type: string;
  trigger_conditions: any;
  ai_conditions: any;
  actions: any;
  is_active: boolean;
  priority: number;
  execution_count: number;
  /** 0–100 success percentage. */
  success_rate: number;
  last_executed_at?: string;
  performance_metrics: any;
  created_at: string;
  updated_at: string;
}

/** Result returned after executing a rule via the AI engine. */
export interface AutomationExecution {
  success: boolean;
  analysis: any;
  decisions: any[];
  results: any[];
  executedActions: number;
}

/**
 * Map a raw database record to the {@link AutomationRule} domain model.
 * Handles column-name differences between `automation_rules` and the UI model.
 */
function mapToAutomationRule(record: any): AutomationRule {
  return {
    id: record.id,
    user_id: record.user_id,
    name: record.name,
    description: record.description,
    rule_type: record.trigger_type || 'custom',
    trigger_conditions: record.trigger_config || {},
    ai_conditions: {},
    actions: record.action_config || {},
    is_active: record.is_active ?? true,
    priority: 5,
    execution_count: record.trigger_count || 0,
    success_rate: 100,
    last_executed_at: record.last_triggered_at,
    performance_metrics: {},
    created_at: record.created_at,
    updated_at: record.updated_at
  };
}

export class AutomationEngineService {
  
  /** Fetch all automation rules for the authenticated user, newest first. */
  static async getAllRules(): Promise<AutomationRule[]> {
    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapToAutomationRule);
  }

  /**
   * Create a new automation rule.
   * Inserts into `automation_workflows` and returns the mapped domain model.
   * @throws Error if the user is not authenticated.
   */
  static async createRule(ruleData: {
    name: string;
    description?: string;
    rule_type: string;
    trigger_conditions?: any;
    ai_conditions?: any;
    actions?: any;
    is_active?: boolean;
    priority?: number;
  }): Promise<AutomationRule> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('automation_workflows')
      .insert({
        user_id: currentUser.user.id,
        name: ruleData.name,
        description: ruleData.description || '',
        trigger_type: ruleData.rule_type,
        action_type: 'custom',
        trigger_config: ruleData.trigger_conditions || {},
        action_config: ruleData.actions || {},
        is_active: ruleData.is_active ?? true,
        trigger_count: 0
      } as any)
      .select()
      .single();

    if (error) throw error;
    return mapToAutomationRule(data);
  }

  /**
   * Partially update an existing automation rule.
   * Only provided fields are sent to the database.
   */
  static async updateRule(id: string, updates: Partial<AutomationRule>): Promise<AutomationRule> {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;
    if (updates.trigger_conditions) dbUpdates.trigger_config = updates.trigger_conditions;
    if (updates.actions) dbUpdates.action_config = updates.actions;

    const { data, error } = await supabase
      .from('automation_rules')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapToAutomationRule(data);
  }

  /** Delete a rule by ID. */
  static async deleteRule(id: string): Promise<void> {
    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Execute a rule server-side via the AI automation engine edge function.
   * @param ruleId    - The rule to execute.
   * @param inputData - Contextual data (product, order, etc.) fed to the AI.
   * @returns Execution result with decisions taken and actions performed.
   */
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

  /** Convenience wrapper to enable/disable a rule. */
  static async toggleRuleStatus(id: string, isActive: boolean): Promise<AutomationRule> {
    return this.updateRule(id, { is_active: isActive });
  }

  /**
   * Fetch execution history for a specific rule from activity logs.
   * @param ruleId - The rule whose history to retrieve.
   * @returns Last 50 activity log entries for this rule.
   */
  static async getExecutionHistory(ruleId: string) {
    const { data, error } = await (supabase
      .from('activity_logs') as any)
      .select('*')
      .eq('entity_id', ruleId)
      .eq('entity_type', 'automation')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all active rules of a specific type.
   * @param ruleType - Filter value (e.g. "inventory", "pricing").
   */
  static async getRulesByType(ruleType: string): Promise<AutomationRule[]> {
    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('trigger_type', ruleType)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapToAutomationRule);
  }

  /**
   * Return built-in preset rule templates for quick setup.
   * These are not persisted — they serve as starting points for {@link createRule}.
   */
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
