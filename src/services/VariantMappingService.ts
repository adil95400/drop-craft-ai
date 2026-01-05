/**
 * Variant Mapping Service
 * Gestion des mappings de variantes fournisseur → catalogue
 */
import { supabase } from '@/integrations/supabase/client';

export interface VariantMapping {
  id: string;
  user_id: string;
  supplier_id?: string;
  product_id?: string;
  source_variant_id?: string;
  source_sku?: string;
  source_option_name: string;
  source_option_value: string;
  target_option_name: string;
  target_option_value: string;
  is_active: boolean;
  auto_sync: boolean;
  priority: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface VariantMappingRule {
  id: string;
  user_id: string;
  supplier_id?: string;
  rule_name: string;
  option_type: string;
  source_pattern: string;
  target_value: string;
  transformation_type: 'exact' | 'regex' | 'contains' | 'prefix';
  is_active: boolean;
  priority: number;
  apply_to_all_products: boolean;
  created_at: string;
  updated_at: string;
}

export interface VariantMappingTemplate {
  id: string;
  name: string;
  description?: string;
  option_type: string;
  mappings: { source: string; target: string }[];
  is_global: boolean;
  user_id?: string;
  usage_count: number;
  created_at: string;
}

export interface CreateMappingInput {
  supplier_id?: string;
  product_id?: string;
  source_variant_id?: string;
  source_sku?: string;
  source_option_name: string;
  source_option_value: string;
  target_option_name: string;
  target_option_value: string;
  is_active?: boolean;
  auto_sync?: boolean;
  priority?: number;
  metadata?: Record<string, any>;
}

export interface CreateRuleInput {
  supplier_id?: string;
  rule_name: string;
  option_type: string;
  source_pattern: string;
  target_value: string;
  transformation_type?: 'exact' | 'regex' | 'contains' | 'prefix';
  is_active?: boolean;
  priority?: number;
  apply_to_all_products?: boolean;
}

export const VariantMappingService = {
  // ========== MAPPINGS ==========
  
  async getMappings(filters?: { 
    supplier_id?: string; 
    product_id?: string;
    option_type?: string;
  }): Promise<VariantMapping[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('variant_mappings')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: false });

    if (filters?.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id);
    }
    if (filters?.product_id) {
      query = query.eq('product_id', filters.product_id);
    }
    if (filters?.option_type) {
      query = query.eq('source_option_name', filters.option_type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as VariantMapping[];
  },

  async createMapping(input: CreateMappingInput): Promise<VariantMapping> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('variant_mappings')
      .insert({
        user_id: user.id,
        ...input
      })
      .select()
      .single();

    if (error) throw error;
    return data as VariantMapping;
  },

  async createBulkMappings(mappings: CreateMappingInput[]): Promise<VariantMapping[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const mappingsWithUser = mappings.map(m => ({
      user_id: user.id,
      ...m
    }));

    const { data, error } = await supabase
      .from('variant_mappings')
      .insert(mappingsWithUser)
      .select();

    if (error) throw error;
    return (data || []) as VariantMapping[];
  },

  async updateMapping(id: string, updates: Partial<CreateMappingInput>): Promise<VariantMapping> {
    const { data, error } = await supabase
      .from('variant_mappings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as VariantMapping;
  },

  async deleteMapping(id: string): Promise<void> {
    const { error } = await supabase
      .from('variant_mappings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async deleteBulkMappings(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('variant_mappings')
      .delete()
      .in('id', ids);

    if (error) throw error;
  },

  // ========== RULES ==========

  async getRules(supplier_id?: string): Promise<VariantMappingRule[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('variant_mapping_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: false });

    if (supplier_id) {
      query = query.eq('supplier_id', supplier_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as VariantMappingRule[];
  },

  async createRule(input: CreateRuleInput): Promise<VariantMappingRule> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('variant_mapping_rules')
      .insert({
        user_id: user.id,
        ...input
      })
      .select()
      .single();

    if (error) throw error;
    return data as VariantMappingRule;
  },

  async updateRule(id: string, updates: Partial<CreateRuleInput>): Promise<VariantMappingRule> {
    const { data, error } = await supabase
      .from('variant_mapping_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as VariantMappingRule;
  },

  async deleteRule(id: string): Promise<void> {
    const { error } = await supabase
      .from('variant_mapping_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ========== TEMPLATES ==========

  async getTemplates(): Promise<VariantMappingTemplate[]> {
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('variant_mapping_templates')
      .select('*')
      .order('usage_count', { ascending: false });

    // Get global templates + user's own templates
    if (user) {
      query = query.or(`is_global.eq.true,user_id.eq.${user.id}`);
    } else {
      query = query.eq('is_global', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as VariantMappingTemplate[];
  },

  async applyTemplate(templateId: string, supplier_id?: string, product_id?: string): Promise<VariantMapping[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('variant_mapping_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    // Increment usage count
    await supabase
      .from('variant_mapping_templates')
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq('id', templateId);

    // Create mappings from template
    const mappings = (template.mappings as { source: string; target: string }[]).map(m => ({
      user_id: user.id,
      supplier_id,
      product_id,
      source_option_name: template.option_type,
      source_option_value: m.source,
      target_option_name: template.option_type,
      target_option_value: m.target,
      is_active: true,
      auto_sync: true
    }));

    const { data, error } = await supabase
      .from('variant_mappings')
      .upsert(mappings, { 
        onConflict: 'user_id,supplier_id,source_option_name,source_option_value,target_option_name',
        ignoreDuplicates: true 
      })
      .select();

    if (error) throw error;
    return (data || []) as VariantMapping[];
  },

  async createTemplate(input: {
    name: string;
    description?: string;
    option_type: string;
    mappings: { source: string; target: string }[];
  }): Promise<VariantMappingTemplate> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('variant_mapping_templates')
      .insert({
        user_id: user.id,
        is_global: false,
        ...input
      })
      .select()
      .single();

    if (error) throw error;
    return data as VariantMappingTemplate;
  },

  // ========== UTILITIES ==========

  applyTransformation(value: string, rule: VariantMappingRule): string | null {
    switch (rule.transformation_type) {
      case 'exact':
        return value === rule.source_pattern ? rule.target_value : null;
      case 'contains':
        return value.includes(rule.source_pattern) ? rule.target_value : null;
      case 'prefix':
        return value.startsWith(rule.source_pattern) ? rule.target_value : null;
      case 'regex':
        try {
          const regex = new RegExp(rule.source_pattern, 'i');
          return regex.test(value) ? rule.target_value : null;
        } catch {
          return null;
        }
      default:
        return null;
    }
  },

  async autoMapVariant(
    sourceOptionName: string, 
    sourceOptionValue: string, 
    supplier_id?: string
  ): Promise<string | null> {
    const rules = await this.getRules(supplier_id);
    const activeRules = rules.filter(r => r.is_active && r.option_type === sourceOptionName);

    // Sort by priority
    activeRules.sort((a, b) => b.priority - a.priority);

    for (const rule of activeRules) {
      const result = this.applyTransformation(sourceOptionValue, rule);
      if (result) return result;
    }

    return null;
  },

  // Get mapping stats
  async getStats(): Promise<{
    total_mappings: number;
    active_mappings: number;
    total_rules: number;
    mappings_by_type: Record<string, number>;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const [mappingsResult, rulesResult] = await Promise.all([
      supabase
        .from('variant_mappings')
        .select('id, is_active, source_option_name')
        .eq('user_id', user.id),
      supabase
        .from('variant_mapping_rules')
        .select('id')
        .eq('user_id', user.id)
    ]);

    const mappings = mappingsResult.data || [];
    const rules = rulesResult.data || [];

    const mappingsByType: Record<string, number> = {};
    mappings.forEach(m => {
      const type = m.source_option_name;
      mappingsByType[type] = (mappingsByType[type] || 0) + 1;
    });

    return {
      total_mappings: mappings.length,
      active_mappings: mappings.filter(m => m.is_active).length,
      total_rules: rules.length,
      mappings_by_type: mappingsByType
    };
  }
};
