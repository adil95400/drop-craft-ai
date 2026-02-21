/**
 * Feed Rules Service - Routes through Supabase direct
 */
import { supabase } from '@/integrations/supabase/client';

// Types
export interface RuleCondition {
  field: string;
  operator: string;
  value?: string | number | boolean;
}

export interface RuleAction {
  type: string;
  field?: string;
  value?: string | number;
  operation?: string;
  reason?: string;
}

export interface FeedRule {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  feed_id?: string;
  is_active: boolean;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  match_type: 'all' | 'any';
  execution_count: number;
  last_executed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FeedRuleTemplate {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  category: string;
  is_global: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  match_type: string;
  usage_count: number;
  created_at: string;
}

export interface FeedRuleExecution {
  id: string;
  rule_id: string;
  user_id: string;
  feed_id?: string;
  products_matched: number;
  products_modified: number;
  execution_time_ms: number;
  status: 'success' | 'partial' | 'failed';
  error_message?: string;
  changes_summary?: Record<string, unknown>;
  executed_at: string;
}

export interface CreateRuleInput {
  name: string;
  description?: string;
  feed_id?: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  match_type?: 'all' | 'any';
  priority?: number;
}

function transformRule(row: Record<string, unknown>): FeedRule {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    feed_id: row.feed_id as string | undefined,
    is_active: row.is_active as boolean,
    priority: row.priority as number,
    conditions: (row.conditions || []) as RuleCondition[],
    actions: (row.actions || []) as RuleAction[],
    match_type: row.match_type as 'all' | 'any',
    execution_count: row.execution_count as number,
    last_executed_at: row.last_executed_at as string | undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function transformTemplate(row: Record<string, unknown>): FeedRuleTemplate {
  return {
    id: row.id as string,
    user_id: row.user_id as string | undefined,
    name: row.name as string,
    description: row.description as string | undefined,
    category: row.category as string,
    is_global: row.is_global as boolean,
    conditions: (row.conditions || []) as RuleCondition[],
    actions: (row.actions || []) as RuleAction[],
    match_type: row.match_type as string,
    usage_count: row.usage_count as number,
    created_at: row.created_at as string,
  };
}

function transformExecution(row: Record<string, unknown>): FeedRuleExecution {
  return {
    id: row.id as string,
    rule_id: row.rule_id as string,
    user_id: row.user_id as string,
    feed_id: row.feed_id as string | undefined,
    products_matched: row.products_matched as number,
    products_modified: row.products_modified as number,
    execution_time_ms: row.execution_time_ms as number,
    status: row.status as 'success' | 'partial' | 'failed',
    error_message: row.error_message as string | undefined,
    changes_summary: row.changes_summary as Record<string, unknown> | undefined,
    executed_at: row.executed_at as string,
  };
}

export const FeedRulesService = {
  async getRules(feedId?: string): Promise<FeedRule[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    let query = supabase
      .from('feed_rules')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('priority', { ascending: false });

    if (feedId) {
      query = query.eq('feed_id', feedId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(transformRule);
  },

  async getRule(ruleId: string): Promise<FeedRule> {
    const { data, error } = await supabase
      .from('feed_rules')
      .select('*')
      .eq('id', ruleId)
      .single();
    if (error) throw error;
    return transformRule(data);
  },

  async createRule(input: CreateRuleInput): Promise<FeedRule> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Non authentifié');

    const { data, error } = await supabase
      .from('feed_rules')
      .insert({
        user_id: userData.user.id,
        name: input.name,
        description: input.description,
        feed_id: input.feed_id,
        conditions: input.conditions as any,
        actions: input.actions as any,
        match_type: input.match_type || 'all',
        priority: input.priority || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return transformRule(data);
  },

  async updateRule(ruleId: string, updates: Partial<FeedRule>): Promise<FeedRule> {
    const updateData: Record<string, any> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.conditions !== undefined) updateData.conditions = updates.conditions;
    if (updates.actions !== undefined) updateData.actions = updates.actions;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
    if (updates.priority !== undefined) updateData.priority = updates.priority;

    const { data, error } = await supabase
      .from('feed_rules')
      .update(updateData)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    return transformRule(data);
  },

  async deleteRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('feed_rules')
      .delete()
      .eq('id', ruleId);
    if (error) throw error;
  },

  async toggleRule(ruleId: string, isActive: boolean): Promise<FeedRule> {
    return this.updateRule(ruleId, { is_active: isActive });
  },

  async duplicateRule(ruleId: string): Promise<FeedRule> {
    const original = await this.getRule(ruleId);
    return this.createRule({
      name: `${original.name} (copie)`,
      description: original.description,
      feed_id: original.feed_id,
      conditions: original.conditions,
      actions: original.actions,
      match_type: original.match_type,
      priority: original.priority,
    });
  },

  // ========== TEMPLATES ==========

  async getTemplates(category?: string): Promise<FeedRuleTemplate[]> {
    let query = supabase
      .from('feed_rule_templates')
      .select('*')
      .order('usage_count', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(transformTemplate);
  },

  async createFromTemplate(templateId: string, feedId?: string): Promise<FeedRule> {
    const { data: template, error: templateError } = await supabase
      .from('feed_rule_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    await supabase
      .from('feed_rule_templates')
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq('id', templateId);

    return this.createRule({
      name: template.name,
      description: template.description,
      feed_id: feedId,
      conditions: (template.conditions || []) as unknown as RuleCondition[],
      actions: (template.actions || []) as unknown as RuleAction[],
      match_type: template.match_type as 'all' | 'any',
    });
  },

  async saveAsTemplate(ruleId: string, category: string = 'custom'): Promise<FeedRuleTemplate> {
    const rule = await this.getRule(ruleId);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Non authentifié');

    const { data, error } = await supabase
      .from('feed_rule_templates')
      .insert({
        user_id: userData.user.id,
        name: rule.name,
        description: rule.description,
        category,
        conditions: rule.conditions,
        actions: rule.actions,
        match_type: rule.match_type,
      })
      .select()
      .single();

    if (error) throw error;
    return transformTemplate(data);
  },

  // ========== EXECUTIONS ==========

  async getExecutions(ruleId?: string, limit: number = 50): Promise<FeedRuleExecution[]> {
    let query = supabase
      .from('feed_rule_executions')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(limit);

    if (ruleId) {
      query = query.eq('rule_id', ruleId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(transformExecution);
  },

  async executeRule(ruleId: string, feedId?: string): Promise<FeedRuleExecution & { products_matched?: number; products_modified?: number }> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Non authentifié');

    // Call the Edge Function to actually apply rules to products
    const { data: result, error: fnError } = await supabase.functions.invoke('execute-feed-rules', {
      body: { rule_id: ruleId, preview_only: false },
    });

    if (fnError) throw new Error(fnError.message || 'Erreur exécution règle');
    if (!result?.ok) throw new Error(result?.error || 'Erreur exécution règle');

    // The Edge Function already logged the execution, fetch the latest one
    const { data: execData, error: execError } = await supabase
      .from('feed_rule_executions')
      .select('*')
      .eq('rule_id', ruleId)
      .eq('user_id', userData.user.id)
      .order('executed_at', { ascending: false })
      .limit(1)
      .single();

    if (execError) {
      // Return a synthetic result from the function response
      return {
        id: crypto.randomUUID(),
        rule_id: ruleId,
        user_id: userData.user.id,
        products_matched: result.data.products_matched,
        products_modified: result.data.products_modified,
        execution_time_ms: result.data.execution_time_ms,
        status: 'success',
        executed_at: new Date().toISOString(),
      };
    }

    return {
      ...transformExecution(execData),
      products_matched: result.data.products_matched,
      products_modified: result.data.products_modified,
    };
  },

  async previewRule(ruleId: string): Promise<{
    products_total: number;
    products_matched: number;
    products_modified: number;
    preview: Array<{ product_id: string; title: string; changes: Record<string, { before: any; after: any }> }>;
  }> {
    const { data: result, error } = await supabase.functions.invoke('execute-feed-rules', {
      body: { rule_id: ruleId, preview_only: true },
    });

    if (error) throw new Error(error.message || 'Erreur prévisualisation');
    if (!result?.ok) throw new Error(result?.error || 'Erreur prévisualisation');

    return result.data;
  },

  // ========== STATS ==========

  async getStats(): Promise<{
    totalRules: number;
    activeRules: number;
    totalExecutions: number;
    avgProductsModified: number;
  }> {
    const rules = await this.getRules();
    
    const { data: executions } = await supabase
      .from('feed_rule_executions')
      .select('products_modified');

    const execs = executions || [];
    const totalModified = execs.reduce((sum, e) => sum + (e.products_modified || 0), 0);

    return {
      totalRules: rules.length,
      activeRules: rules.filter(r => r.is_active).length,
      totalExecutions: execs.length,
      avgProductsModified: execs.length > 0 ? Math.round(totalModified / execs.length) : 0,
    };
  },

  // ========== FIELD OPTIONS ==========

  getFieldOptions(): { value: string; label: string; type: string }[] {
    return [
      { value: 'title', label: 'Titre', type: 'string' },
      { value: 'description', label: 'Description', type: 'string' },
      { value: 'price', label: 'Prix', type: 'number' },
      { value: 'compare_at_price', label: 'Prix barré', type: 'number' },
      { value: 'cost', label: 'Coût', type: 'number' },
      { value: 'margin_percent', label: 'Marge (%)', type: 'number' },
      { value: 'stock', label: 'Stock', type: 'number' },
      { value: 'category', label: 'Catégorie', type: 'string' },
      { value: 'brand', label: 'Marque', type: 'string' },
      { value: 'sku', label: 'SKU', type: 'string' },
      { value: 'weight', label: 'Poids', type: 'number' },
      { value: 'tags', label: 'Tags', type: 'array' },
    ];
  },

  getOperatorOptions(fieldType: string): { value: string; label: string }[] {
    const stringOperators = [
      { value: 'equals', label: 'Égal à' },
      { value: 'not_equals', label: 'Différent de' },
      { value: 'contains', label: 'Contient' },
      { value: 'not_contains', label: 'Ne contient pas' },
      { value: 'starts_with', label: 'Commence par' },
      { value: 'ends_with', label: 'Finit par' },
      { value: 'is_empty', label: 'Est vide' },
      { value: 'is_not_empty', label: "N'est pas vide" },
    ];

    const numberOperators = [
      { value: 'equals', label: 'Égal à' },
      { value: 'not_equals', label: 'Différent de' },
      { value: 'greater_than', label: 'Supérieur à' },
      { value: 'less_than', label: 'Inférieur à' },
      { value: 'greater_or_equal', label: 'Supérieur ou égal' },
      { value: 'less_or_equal', label: 'Inférieur ou égal' },
      { value: 'between', label: 'Entre' },
    ];

    return fieldType === 'number' ? numberOperators : stringOperators;
  },

  getActionOptions(): { value: string; label: string; requiresField: boolean }[] {
    return [
      { value: 'exclude', label: 'Exclure du feed', requiresField: false },
      { value: 'include', label: 'Inclure dans le feed', requiresField: false },
      { value: 'set_field', label: 'Définir une valeur', requiresField: true },
      { value: 'modify_field', label: 'Modifier la valeur', requiresField: true },
      { value: 'append_text', label: 'Ajouter du texte', requiresField: true },
      { value: 'prepend_text', label: 'Préfixer avec texte', requiresField: true },
      { value: 'set_category', label: 'Changer la catégorie', requiresField: false },
      { value: 'add_tag', label: 'Ajouter un tag', requiresField: false },
      { value: 'remove_tag', label: 'Supprimer un tag', requiresField: false },
    ];
  },
};
