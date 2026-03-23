/**
 * SupplierSelectionService
 * Optimal supplier selection algorithm based on price, stock, reliability, delivery time
 */
import { supabase } from '@/integrations/supabase/client';

export interface SupplierCandidate {
  id: string;
  supplier_id: string;
  supplier_name: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  is_primary: boolean;
  is_locked: boolean;
  priority: number;
  delivery_days?: number;
  reliability_score?: number;
  last_synced_at?: string;
}

export interface SelectionCriteria {
  weights: {
    price: number;       // 0-1, importance of price
    stock: number;       // 0-1, importance of stock availability
    reliability: number; // 0-1, importance of supplier reliability
    delivery: number;    // 0-1, importance of delivery speed
  };
  constraints: {
    minStock: number;
    maxPrice?: number;
    maxDeliveryDays?: number;
    minReliability?: number;
  };
}

export interface SelectionResult {
  optimalSupplierId: string;
  candidates: Array<SupplierCandidate & { score: number; breakdown: Record<string, number> }>;
  reason: string;
}

const DEFAULT_CRITERIA: SelectionCriteria = {
  weights: { price: 0.4, stock: 0.25, reliability: 0.2, delivery: 0.15 },
  constraints: { minStock: 1 },
};

export class SupplierSelectionService {
  private static instance: SupplierSelectionService;
  static getInstance() {
    if (!this.instance) this.instance = new SupplierSelectionService();
    return this.instance;
  }

  /**
   * Find the optimal supplier for a product based on scoring
   */
  async selectOptimal(
    userId: string,
    productId: string,
    criteria: Partial<SelectionCriteria> = {}
  ): Promise<SelectionResult> {
    const merged: SelectionCriteria = {
      weights: { ...DEFAULT_CRITERIA.weights, ...criteria.weights },
      constraints: { ...DEFAULT_CRITERIA.constraints, ...criteria.constraints },
    };

    // Get all supplier products for this catalog product
    const { data: candidates } = await (supabase
      .from('supplier_products') as any)
      .select('id, supplier_id, price, cost_price, stock_quantity, is_primary, is_locked, priority, last_synced_at, name')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!candidates?.length) {
      return { optimalSupplierId: '', candidates: [], reason: 'No suppliers linked' };
    }

    // Filter by constraints
    const eligible = candidates.filter((c: any) => {
      if ((c.stock_quantity || 0) < merged.constraints.minStock) return false;
      if (merged.constraints.maxPrice && c.price > merged.constraints.maxPrice) return false;
      return true;
    });

    if (!eligible.length) {
      return { optimalSupplierId: '', candidates: [], reason: 'No suppliers meet constraints' };
    }

    // If a supplier is locked, always prefer it
    const locked = eligible.find((c: any) => c.is_locked);
    if (locked) {
      return {
        optimalSupplierId: locked.id,
        candidates: eligible.map((c: any) => ({
          ...c, supplier_name: c.name || '',
          score: c.id === locked.id ? 100 : 0,
          breakdown: { locked: c.id === locked.id ? 100 : 0 },
        })),
        reason: 'Locked supplier selected',
      };
    }

    // Score each candidate
    const prices = eligible.map((c: any) => c.price || Infinity);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const maxStock = Math.max(...eligible.map((c: any) => c.stock_quantity || 0));

    const scored = eligible.map((c: any) => {
      const priceScore = maxPrice > minPrice
        ? ((maxPrice - (c.price || maxPrice)) / (maxPrice - minPrice)) * 100
        : 100;

      const stockScore = maxStock > 0
        ? ((c.stock_quantity || 0) / maxStock) * 100
        : 0;

      // Reliability from supplier table or default
      const reliabilityScore = (c.reliability_score || 0.7) * 100;

      // Delivery - inverse (lower is better), default 7 days
      const deliveryDays = c.delivery_days || 7;
      const deliveryScore = Math.max(0, 100 - (deliveryDays * 5));

      const totalScore =
        priceScore * merged.weights.price +
        stockScore * merged.weights.stock +
        reliabilityScore * merged.weights.reliability +
        deliveryScore * merged.weights.delivery;

      return {
        ...c,
        supplier_name: c.name || '',
        score: Math.round(totalScore * 100) / 100,
        breakdown: {
          price: Math.round(priceScore),
          stock: Math.round(stockScore),
          reliability: Math.round(reliabilityScore),
          delivery: Math.round(deliveryScore),
        },
      };
    });

    scored.sort((a: any, b: any) => b.score - a.score);
    const best = scored[0];

    return {
      optimalSupplierId: best.id,
      candidates: scored,
      reason: `Best score: ${best.score} (price: ${best.breakdown.price}, stock: ${best.breakdown.stock})`,
    };
  }

  /**
   * Batch evaluate all products for a user and generate recommendations
   */
  async evaluateAll(userId: string): Promise<{
    total: number;
    suboptimal: number;
    recommendations: Array<{ productId: string; currentId: string; optimalId: string; savings: number }>;
  }> {
    // Get products with multiple suppliers
    const { data: multiSupplier } = await supabase
      .from('supplier_products')
      .select('product_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .not('product_id', 'is', null);

    if (!multiSupplier?.length) return { total: 0, suboptimal: 0, recommendations: [] };

    // Group by product_id, only keep those with multiple suppliers
    const counts: Record<string, number> = {};
    for (const sp of multiSupplier) {
      counts[sp.product_id!] = (counts[sp.product_id!] || 0) + 1;
    }
    const multiProductIds = Object.entries(counts)
      .filter(([, count]) => count > 1)
      .map(([id]) => id);

    const recommendations: Array<{ productId: string; currentId: string; optimalId: string; savings: number }> = [];

    for (const productId of multiProductIds.slice(0, 50)) {
      const result = await this.selectOptimal(userId, productId);
      if (!result.optimalSupplierId || !result.candidates.length) continue;

      const current = result.candidates.find((c) => c.is_primary);
      const optimal = result.candidates[0];
      if (current && optimal.id !== current.id) {
        const savings = (current.price || 0) - (optimal.price || 0);
        if (savings > 0.5) {
          recommendations.push({
            productId,
            currentId: current.id,
            optimalId: optimal.id,
            savings,
          });
        }
      }
    }

    return {
      total: multiProductIds.length,
      suboptimal: recommendations.length,
      recommendations,
    };
  }
}

export const supplierSelectionService = SupplierSelectionService.getInstance();
