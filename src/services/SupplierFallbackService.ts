/**
 * SupplierFallbackService — P1-2
 * Gère le basculement automatique vers un fournisseur alternatif en cas de rupture.
 */
import { supabase } from '@/integrations/supabase/client';

export interface FallbackRule {
  id: string;
  product_id: string | null;
  primary_supplier_id: string | null;
  fallback_suppliers: Array<{ supplier_id: string; priority: number; max_price?: number }>;
  trigger_condition: 'out_of_stock' | 'low_stock' | 'price_increase';
  low_stock_threshold: number;
  price_increase_threshold: number;
  auto_switch: boolean;
  notify_on_switch: boolean;
  is_active: boolean;
  switch_count: number;
  last_switch_at: string | null;
  created_at: string;
}

export class SupplierFallbackService {
  private static instance: SupplierFallbackService;
  static getInstance() {
    if (!this.instance) this.instance = new SupplierFallbackService();
    return this.instance;
  }

  async getRules(userId: string): Promise<FallbackRule[]> {
    const { data, error } = await (supabase
      .from('supplier_fallback_rules') as any)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async createRule(userId: string, rule: Partial<FallbackRule>) {
    const { data, error } = await (supabase
      .from('supplier_fallback_rules') as any)
      .insert({ ...rule, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateRule(ruleId: string, updates: Partial<FallbackRule>) {
    const { data, error } = await (supabase
      .from('supplier_fallback_rules') as any)
      .update(updates)
      .eq('id', ruleId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteRule(ruleId: string) {
    const { error } = await (supabase
      .from('supplier_fallback_rules') as any)
      .delete()
      .eq('id', ruleId);
    if (error) throw error;
  }

  /**
   * Évalue le fallback pour un produit donné.
   * Retourne le meilleur fournisseur alternatif disponible.
   */
  async evaluateFallback(userId: string, productId: string): Promise<{
    shouldSwitch: boolean;
    bestAlternative: { supplier_id: string; price: number } | null;
    reason: string;
  }> {
    // Get fallback rule for this product
    const { data: rules } = await (supabase
      .from('supplier_fallback_rules') as any)
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('is_active', true)
      .limit(1);

    if (!rules?.length) return { shouldSwitch: false, bestAlternative: null, reason: 'No fallback rule configured' };

    const rule = rules[0];

    // Get current product stock & supplier products
    const { data: supplierProducts } = await supabase
      .from('supplier_products')
      .select('id, supplier_id, price, stock_quantity, is_active')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (!supplierProducts?.length) return { shouldSwitch: false, bestAlternative: null, reason: 'No supplier products linked' };

    // Find available alternatives sorted by priority in fallback_suppliers
    const fallbackOrder = rule.fallback_suppliers as Array<{ supplier_id: string; priority: number; max_price?: number }>;
    
    for (const fb of fallbackOrder.sort((a: any, b: any) => a.priority - b.priority)) {
      const sp = supplierProducts.find((s: any) => s.supplier_id === fb.supplier_id);
      if (sp && (sp.stock_quantity ?? 0) > 0 && (!fb.max_price || sp.price <= fb.max_price)) {
        return {
          shouldSwitch: true,
          bestAlternative: { supplier_id: fb.supplier_id, price: sp.price },
          reason: `Stock available at fallback supplier (priority ${fb.priority})`,
        };
      }
    }

    return { shouldSwitch: false, bestAlternative: null, reason: 'No fallback suppliers with available stock' };
  }

  /** Record a supplier switch in history */
  async recordSwitch(userId: string, ruleId: string, productId: string, newSupplierId: string, oldPrice: number, newPrice: number) {
    // Update switch count
    await (supabase.from('supplier_fallback_rules') as any)
      .update({ last_switch_at: new Date().toISOString(), switch_count: supabase.rpc ? undefined : 0 })
      .eq('id', ruleId);

    // Log price change
    await (supabase.from('price_change_history') as any)
      .insert({
        user_id: userId,
        product_id: productId,
        old_price: oldPrice,
        new_price: newPrice,
        change_percent: oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0,
        change_type: 'fallback',
        source: 'supplier_fallback_service',
        metadata: { rule_id: ruleId, new_supplier_id: newSupplierId },
      });
  }
}

export const supplierFallbackService = SupplierFallbackService.getInstance();
