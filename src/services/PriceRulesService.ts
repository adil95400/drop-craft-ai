/**
 * Price Rules Service
 * Gestion des règles de tarification dynamique
 */
import { supabase } from '@/integrations/supabase/client';

// Types
export interface PriceCondition {
  field: string;
  operator: string;
  value: string | number;
}

export interface PriceCalculation {
  type: 'percentage' | 'fixed' | 'formula';
  value?: number;
  formula?: string;
  roundTo?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface PriceRule {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  rule_type: 'markup' | 'margin' | 'fixed' | 'rounding' | 'competitive' | 'tiered';
  priority: number;
  conditions: PriceCondition[];
  calculation: PriceCalculation;
  apply_to: 'all' | 'category' | 'supplier' | 'tag' | 'sku_pattern';
  apply_filter?: Record<string, unknown>;
  is_active: boolean;
  products_affected: number;
  last_applied_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PriceRuleLog {
  id: string;
  rule_id: string;
  user_id: string;
  action: 'applied' | 'reverted' | 'simulated';
  products_count: number;
  total_price_change: number;
  avg_price_change_percent: number;
  details?: Record<string, unknown>;
  executed_at: string;
}

export interface CreatePriceRuleInput {
  name: string;
  description?: string;
  rule_type: PriceRule['rule_type'];
  priority?: number;
  conditions?: PriceCondition[];
  calculation: PriceCalculation;
  apply_to?: PriceRule['apply_to'];
  apply_filter?: Record<string, unknown>;
}

// Helpers
function transformRule(row: Record<string, unknown>): PriceRule {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    rule_type: row.rule_type as PriceRule['rule_type'],
    priority: row.priority as number,
    conditions: (row.conditions || []) as PriceCondition[],
    calculation: (row.calculation || {}) as PriceCalculation,
    apply_to: row.apply_to as PriceRule['apply_to'],
    apply_filter: row.apply_filter as Record<string, unknown> | undefined,
    is_active: row.is_active as boolean,
    products_affected: row.products_affected as number,
    last_applied_at: row.last_applied_at as string | undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function transformLog(row: Record<string, unknown>): PriceRuleLog {
  return {
    id: row.id as string,
    rule_id: row.rule_id as string,
    user_id: row.user_id as string,
    action: row.action as PriceRuleLog['action'],
    products_count: row.products_count as number,
    total_price_change: Number(row.total_price_change) || 0,
    avg_price_change_percent: Number(row.avg_price_change_percent) || 0,
    details: row.details as Record<string, unknown> | undefined,
    executed_at: row.executed_at as string,
  };
}

export const PriceRulesService = {
  // ========== RULES ==========

  async getRules(): Promise<PriceRule[]> {
    const { data, error } = await supabase
      .from('price_rules')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformRule);
  },

  async getRule(ruleId: string): Promise<PriceRule> {
    const { data, error } = await supabase
      .from('price_rules')
      .select('*')
      .eq('id', ruleId)
      .single();

    if (error) throw error;
    return transformRule(data);
  },

  async createRule(input: CreatePriceRuleInput): Promise<PriceRule> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Non authentifié');

    const insertData = {
      user_id: userData.user.id,
      name: input.name,
      description: input.description,
      rule_type: input.rule_type,
      priority: input.priority || 0,
      conditions: input.conditions || [],
      calculation: input.calculation,
      apply_to: input.apply_to || 'all',
      apply_filter: input.apply_filter,
    };

    const { data, error } = await supabase
      .from('price_rules')
      .insert(insertData as never)
      .select()
      .single();

    if (error) throw error;
    return transformRule(data);
  },

  async updateRule(ruleId: string, updates: Partial<PriceRule>): Promise<PriceRule> {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.conditions !== undefined) updateData.conditions = updates.conditions;
    if (updates.calculation !== undefined) updateData.calculation = updates.calculation;
    if (updates.apply_to !== undefined) updateData.apply_to = updates.apply_to;
    if (updates.apply_filter !== undefined) updateData.apply_filter = updates.apply_filter;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

    const { data, error } = await supabase
      .from('price_rules')
      .update(updateData)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    return transformRule(data);
  },

  async deleteRule(ruleId: string): Promise<void> {
    const { error } = await supabase.from('price_rules').delete().eq('id', ruleId);
    if (error) throw error;
  },

  async applyRule(ruleId: string): Promise<PriceRuleLog> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Non authentifié');

    // Get the rule details
    const { data: rule, error: ruleError } = await supabase
      .from('price_rules')
      .select('*')
      .eq('id', ruleId)
      .single();

    if (ruleError || !rule) throw new Error('Règle non trouvée');

    // Get products that match the rule criteria
    let productsQuery = supabase
      .from('products')
      .select('id, price, cost_price, name, category')
      .eq('user_id', userData.user.id)
      .not('price', 'is', null);

    // Apply filter based on rule.apply_to
    const applyFilter = rule.apply_filter as Record<string, unknown> | null;
    if (rule.apply_to === 'category' && applyFilter?.category) {
      productsQuery = productsQuery.eq('category', applyFilter.category as string);
    }

    const { data: products, error: productsError } = await productsQuery;
    if (productsError) throw productsError;

    const calculation = (rule.calculation || { type: 'percentage', value: 10 }) as unknown as PriceCalculation;
    let totalChange = 0;
    let updatedCount = 0;

    // Apply price changes to each product
    for (const product of products || []) {
      let newPrice = product.price;
      const costPrice = product.cost_price || product.price * 0.6;

      switch (rule.rule_type) {
        case 'markup':
          // Apply markup percentage on cost
          newPrice = costPrice * (1 + (calculation.value || 30) / 100);
          break;
        case 'margin':
          // Set price to achieve target margin
          newPrice = costPrice / (1 - (calculation.value || 25) / 100);
          break;
        case 'fixed':
          // Add or subtract fixed amount
          newPrice = product.price + (calculation.value || 0);
          break;
        case 'rounding':
          // Round to psychological price
          const roundTo = calculation.roundTo || 99;
          newPrice = Math.floor(product.price) + roundTo / 100;
          break;
        case 'competitive':
          // Reduce by competitive percentage
          newPrice = product.price * (1 - (calculation.value || 5) / 100);
          break;
      }

      // Apply min/max constraints
      if (calculation.minPrice) newPrice = Math.max(newPrice, calculation.minPrice);
      if (calculation.maxPrice) newPrice = Math.min(newPrice, calculation.maxPrice);
      
      newPrice = Math.round(newPrice * 100) / 100;

      if (newPrice !== product.price) {
        // Update product price
        await supabase
          .from('products')
          .update({ price: newPrice, updated_at: new Date().toISOString() })
          .eq('id', product.id);

        // Log price change
        await supabase.from('price_history').insert({
          user_id: userData.user.id,
          product_id: product.id,
          old_price: product.price,
          new_price: newPrice,
          change_reason: `Règle: ${rule.name}`,
          source: 'price_rule',
        } as never);

        totalChange += newPrice - product.price;
        updatedCount++;
      }
    }

    const avgChangePercent = updatedCount > 0 
      ? (totalChange / (products || []).reduce((sum, p) => sum + p.price, 0)) * 100 
      : 0;

    // Log the rule execution
    const { data, error } = await supabase
      .from('price_rule_logs')
      .insert({
        rule_id: ruleId,
        user_id: userData.user.id,
        action: 'applied',
        products_count: updatedCount,
        total_price_change: totalChange,
        avg_price_change_percent: avgChangePercent,
      } as never)
      .select()
      .single();

    if (error) throw error;

    // Update rule metadata
    await supabase
      .from('price_rules')
      .update({ 
        last_applied_at: new Date().toISOString(),
        products_affected: updatedCount,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', ruleId);

    return transformLog(data);
  },

  async simulateRule(ruleId: string): Promise<PriceRuleLog> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Non authentifié');

    // Get the rule details
    const { data: rule, error: ruleError } = await supabase
      .from('price_rules')
      .select('*')
      .eq('id', ruleId)
      .single();

    if (ruleError || !rule) throw new Error('Règle non trouvée');

    // Get products that would be affected
    let productsQuery = supabase
      .from('products')
      .select('id, sku, price, cost_price, name, category')
      .eq('user_id', userData.user.id)
      .not('price', 'is', null)
      .limit(100);

    const applyFilter = rule.apply_filter as Record<string, unknown> | null;
    if (rule.apply_to === 'category' && applyFilter?.category) {
      productsQuery = productsQuery.eq('category', applyFilter.category as string);
    }

    const { data: products } = await productsQuery;
    const calculation = (rule.calculation || { type: 'percentage', value: 10 }) as unknown as PriceCalculation;

    // Calculate what prices would be
    const sampleProducts: { sku: string; old_price: number; new_price: number }[] = [];
    let totalChange = 0;

    for (const product of (products || []).slice(0, 10)) {
      let newPrice = product.price;
      const costPrice = product.cost_price || product.price * 0.6;

      switch (rule.rule_type) {
        case 'markup':
          newPrice = costPrice * (1 + (calculation.value || 30) / 100);
          break;
        case 'margin':
          newPrice = costPrice / (1 - (calculation.value || 25) / 100);
          break;
        case 'fixed':
          newPrice = product.price + (calculation.value || 0);
          break;
        case 'rounding':
          const roundTo = calculation.roundTo || 99;
          newPrice = Math.floor(product.price) + roundTo / 100;
          break;
        case 'competitive':
          newPrice = product.price * (1 - (calculation.value || 5) / 100);
          break;
      }

      if (calculation.minPrice) newPrice = Math.max(newPrice, calculation.minPrice);
      if (calculation.maxPrice) newPrice = Math.min(newPrice, calculation.maxPrice);
      
      newPrice = Math.round(newPrice * 100) / 100;
      totalChange += newPrice - product.price;

      sampleProducts.push({
        sku: product.sku || product.id.slice(0, 8),
        old_price: product.price,
        new_price: newPrice,
      });
    }

    const productsCount = (products || []).length;
    const avgChangePercent = productsCount > 0 
      ? (totalChange / (products || []).reduce((sum, p) => sum + p.price, 0)) * 100 
      : 0;

    // Log the simulation (no actual changes)
    const { data, error } = await supabase
      .from('price_rule_logs')
      .insert({
        rule_id: ruleId,
        user_id: userData.user.id,
        action: 'simulated',
        products_count: productsCount,
        total_price_change: totalChange,
        avg_price_change_percent: avgChangePercent,
        details: { sample_products: sampleProducts }
      } as never)
      .select()
      .single();

    if (error) throw error;
    return transformLog(data);
  },

  // ========== LOGS ==========

  async getLogs(ruleId?: string, limit: number = 50): Promise<PriceRuleLog[]> {
    let query = supabase
      .from('price_rule_logs')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(limit);

    if (ruleId) query = query.eq('rule_id', ruleId);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(transformLog);
  },

  // ========== STATS ==========

  async getStats(): Promise<{
    totalRules: number;
    activeRules: number;
    totalProductsAffected: number;
    recentApplications: number;
  }> {
    const { data, error } = await supabase.from('price_rules').select('*');
    if (error) throw error;

    const rules = data || [];
    const today = new Date().toISOString().split('T')[0];

    return {
      totalRules: rules.length,
      activeRules: rules.filter(r => r.is_active).length,
      totalProductsAffected: rules.reduce((sum, r) => sum + (r.products_affected || 0), 0),
      recentApplications: rules.filter(r => r.last_applied_at?.startsWith(today)).length,
    };
  },

  // ========== OPTIONS ==========

  getRuleTypeOptions(): { value: string; label: string; description: string }[] {
    return [
      { value: 'markup', label: 'Markup', description: 'Majoration sur le coût' },
      { value: 'margin', label: 'Marge', description: 'Marge bénéficiaire cible' },
      { value: 'fixed', label: 'Prix fixe', description: 'Ajout/retrait montant fixe' },
      { value: 'rounding', label: 'Arrondi', description: 'Arrondi psychologique' },
      { value: 'competitive', label: 'Compétitif', description: 'Basé sur la concurrence' },
      { value: 'tiered', label: 'Par palier', description: 'Prix selon quantité/valeur' },
    ];
  },

  getApplyToOptions(): { value: string; label: string }[] {
    return [
      { value: 'all', label: 'Tous les produits' },
      { value: 'category', label: 'Par catégorie' },
      { value: 'supplier', label: 'Par fournisseur' },
      { value: 'tag', label: 'Par tag' },
      { value: 'sku_pattern', label: 'Par pattern SKU' },
    ];
  },
};
