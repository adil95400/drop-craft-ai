/**
 * Feed Rules Service - Routes through FastAPI
 * CRUD + execution via shopOptiApi, zero direct Supabase
 */
import { shopOptiApi } from '@/services/api/ShopOptiApiClient';
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
  // ========== RULES (via FastAPI) ==========
  
  async getRules(feedId?: string): Promise<FeedRule[]> {
    const res = await shopOptiApi.getFeedRules();
    if (!res.success || !res.data) return [];
    
    const rules = Array.isArray(res.data) ? res.data : res.data?.rules || [];
    let mapped = rules.map(transformRule);
    
    if (feedId) {
      mapped = mapped.filter(r => r.feed_id === feedId);
    }
    
    return mapped.sort((a, b) => b.priority - a.priority);
  },

  async getRule(ruleId: string): Promise<FeedRule> {
    // Use list + filter since API may not have single-rule endpoint
    const rules = await this.getRules();
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) throw new Error('Règle non trouvée');
    return rule;
  },

  async createRule(input: CreateRuleInput): Promise<FeedRule> {
    const res = await shopOptiApi.createFeedRule({
      name: input.name,
      conditions: input.conditions,
      actions: input.actions,
      priority: input.priority,
    });
    
    if (!res.success) throw new Error(res.error || 'Création échouée');
    return transformRule(res.data || res);
  },

  async updateRule(ruleId: string, updates: Partial<FeedRule>): Promise<FeedRule> {
    const res = await shopOptiApi.updateFeedRule(ruleId, {
      name: updates.name,
      conditions: updates.conditions,
      actions: updates.actions,
      is_active: updates.is_active,
    });
    
    if (!res.success) throw new Error(res.error || 'Mise à jour échouée');
    return transformRule(res.data || res);
  },

  async deleteRule(ruleId: string): Promise<void> {
    const res = await shopOptiApi.deleteFeedRule(ruleId);
    if (!res.success) throw new Error(res.error || 'Suppression échouée');
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

  // ========== TEMPLATES (Supabase reads OK — config data, not business logic) ==========

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

    const templateConditions = Array.isArray(template.conditions) 
      ? template.conditions as unknown as RuleCondition[]
      : [];
    const templateActions = Array.isArray(template.actions) 
      ? template.actions as unknown as RuleAction[]
      : [];

    return this.createRule({
      name: template.name,
      description: template.description,
      feed_id: feedId,
      conditions: templateConditions,
      actions: templateActions,
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

  // ========== EXECUTIONS (via FastAPI — creates a job) ==========

  async getExecutions(ruleId?: string, limit: number = 50): Promise<FeedRuleExecution[]> {
    // Read executions from Supabase (read-only, realtime compatible)
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

  async executeRule(ruleId: string, feedId?: string): Promise<FeedRuleExecution> {
    // Execute via FastAPI — creates a background job
    const res = await shopOptiApi.testFeedRule(ruleId);
    
    if (!res.success) throw new Error(res.error || 'Exécution échouée');
    
    // Return the execution result from API
    const execData = res.data || res;
    return {
      id: execData.id || execData.execution_id || crypto.randomUUID(),
      rule_id: ruleId,
      user_id: execData.user_id || '',
      feed_id: feedId,
      products_matched: execData.products_matched || 0,
      products_modified: execData.products_modified || 0,
      execution_time_ms: execData.execution_time_ms || 0,
      status: execData.status || 'success',
      changes_summary: execData.changes_summary,
      executed_at: execData.executed_at || new Date().toISOString(),
    };
  },

  // ========== STATS ==========

  async getStats(): Promise<{
    totalRules: number;
    activeRules: number;
    totalExecutions: number;
    avgProductsModified: number;
  }> {
    const rules = await this.getRules();
    
    const [executionsResult] = await Promise.all([
      supabase.from('feed_rule_executions').select('products_modified'),
    ]);

    const executions = executionsResult.data || [];
    const totalModified = executions.reduce((sum, e) => sum + (e.products_modified || 0), 0);

    return {
      totalRules: rules.length,
      activeRules: rules.filter(r => r.is_active).length,
      totalExecutions: executions.length,
      avgProductsModified: executions.length > 0 ? Math.round(totalModified / executions.length) : 0,
    };
  },

  // ========== FIELD OPTIONS (static, no backend needed) ==========

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
