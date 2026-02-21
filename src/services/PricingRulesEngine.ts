/**
 * PricingRulesEngine — P1-3
 * Moteur de règles pour l'ajustement automatique des prix.
 */
import { supabase } from '@/integrations/supabase/client';

export interface PricingRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: string; // margin | markup | competitive | fixed
  conditions: Record<string, any>;
  actions: Record<string, any>;
  calculation: Record<string, any> | null;
  min_price: number | null;
  max_price: number | null;
  target_margin: number | null;
  margin_protection: number;
  rounding_strategy: 'nearest_99' | 'nearest_50' | 'round_up' | 'none';
  competitor_strategy: string | null;
  competitor_offset: number | null;
  apply_to: string; // all | category | tag | product
  apply_filter: Record<string, any> | null;
  is_active: boolean;
  priority: number;
  products_affected: number;
  execution_count: number;
  last_executed_at: string | null;
}

export interface PriceCalculation {
  originalPrice: number;
  calculatedPrice: number;
  roundedPrice: number;
  margin: number;
  marginProtected: boolean;
  ruleApplied: string;
}

export class PricingRulesEngine {
  private static instance: PricingRulesEngine;
  static getInstance() {
    if (!this.instance) this.instance = new PricingRulesEngine();
    return this.instance;
  }

  async getRules(userId: string): Promise<PricingRule[]> {
    const { data, error } = await (supabase
      .from('pricing_rules') as any)
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async createRule(userId: string, rule: Partial<PricingRule>) {
    const { data, error } = await (supabase
      .from('pricing_rules') as any)
      .insert({ ...rule, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateRule(ruleId: string, updates: Partial<PricingRule>) {
    const { data, error } = await (supabase
      .from('pricing_rules') as any)
      .update(updates)
      .eq('id', ruleId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteRule(ruleId: string) {
    const { error } = await (supabase
      .from('pricing_rules') as any)
      .delete()
      .eq('id', ruleId);
    if (error) throw error;
  }

  /**
   * Calcule le prix final en appliquant les règles dans l'ordre de priorité.
   */
  calculatePrice(costPrice: number, rules: PricingRule[]): PriceCalculation {
    if (!rules.length || costPrice <= 0) {
      return {
        originalPrice: costPrice,
        calculatedPrice: costPrice,
        roundedPrice: costPrice,
        margin: 0,
        marginProtected: false,
        ruleApplied: 'none',
      };
    }

    const activeRules = rules.filter(r => r.is_active).sort((a, b) => a.priority - b.priority);
    let price = costPrice;
    let appliedRule = 'none';

    for (const rule of activeRules) {
      switch (rule.rule_type) {
        case 'margin':
          if (rule.target_margin) {
            price = costPrice / (1 - rule.target_margin / 100);
            appliedRule = rule.name;
          }
          break;
        case 'markup':
          if (rule.calculation?.markup_percent) {
            price = costPrice * (1 + rule.calculation.markup_percent / 100);
            appliedRule = rule.name;
          }
          break;
        case 'fixed':
          if (rule.calculation?.fixed_amount) {
            price = costPrice + rule.calculation.fixed_amount;
            appliedRule = rule.name;
          }
          break;
        case 'competitive':
          // Competitive pricing is handled server-side with real competitor data
          break;
      }
    }

    // Apply margin protection
    const marginProtection = activeRules[0]?.margin_protection ?? 15;
    const minAllowedPrice = costPrice / (1 - marginProtection / 100);
    let marginProtected = false;

    if (price < minAllowedPrice) {
      price = minAllowedPrice;
      marginProtected = true;
    }

    // Apply min/max bounds
    const firstRule = activeRules[0];
    if (firstRule?.min_price && price < firstRule.min_price) price = firstRule.min_price;
    if (firstRule?.max_price && price > firstRule.max_price) price = firstRule.max_price;

    // Apply rounding
    const roundingStrategy = firstRule?.rounding_strategy ?? 'nearest_99';
    const roundedPrice = this.applyRounding(price, roundingStrategy);

    const margin = costPrice > 0 ? ((roundedPrice - costPrice) / roundedPrice) * 100 : 0;

    return {
      originalPrice: costPrice,
      calculatedPrice: price,
      roundedPrice,
      margin,
      marginProtected,
      ruleApplied: appliedRule,
    };
  }

  private applyRounding(price: number, strategy: string): number {
    switch (strategy) {
      case 'nearest_99':
        return Math.floor(price) + 0.99;
      case 'nearest_50':
        return Math.round(price * 2) / 2;
      case 'round_up':
        return Math.ceil(price);
      case 'none':
      default:
        return Math.round(price * 100) / 100;
    }
  }

  /**
   * Applique les règles à un batch de produits et enregistre les changements.
   */
  async applyRulesToProducts(userId: string, ruleId: string): Promise<{ applied: number; changes: number }> {
    const { data, error } = await supabase.functions.invoke('apply-pricing-rules', {
      body: { userId, ruleId },
    });
    if (error) throw error;
    return data;
  }
}

export const pricingRulesEngine = PricingRulesEngine.getInstance();
