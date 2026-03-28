/**
 * Returns Automation Service
 * Frontend service for automated returns, exchanges, and RMA workflows
 */
import { supabase } from '@/integrations/supabase/client';

export interface ReturnAutomationRule {
  id: string;
  name: string;
  is_active: boolean;
  priority: number;
  trigger_conditions: {
    reason_category?: string[];
    amount_max?: number;
    amount_min?: number;
    customer_order_count?: number;
  };
  auto_actions: {
    auto_approve?: boolean;
    generate_label?: boolean;
    send_notification?: boolean;
    create_supplier_return?: boolean;
    auto_refund?: boolean;
  };
  refund_config?: {
    method?: string;
    percentage?: number;
    deduct_shipping?: boolean;
  };
}

export class ReturnsAutomationService {
  private static async invoke(action: string, params: Record<string, any> = {}) {
    const { data, error } = await supabase.functions.invoke('returns-workflow-automation', {
      body: { action, ...params },
    });
    if (error) throw error;
    return data;
  }

  /** Get all active automation rules */
  static async getRules(): Promise<ReturnAutomationRule[]> {
    const result = await this.invoke('check_rules');
    return result?.data?.rules || [];
  }

  /** Auto-process a return using matching rules */
  static async autoProcess(returnId: string) {
    return this.invoke('auto_process', { returnId });
  }

  /** Create a return shipping label */
  static async createLabel(returnId: string, carrierCode = 'colissimo', shipmentDetails?: any) {
    return this.invoke('create_label', { returnId, carrierCode, shipmentDetails });
  }

  /** Create a supplier-side return (RMA to supplier) */
  static async createSupplierReturn(returnId: string) {
    return this.invoke('create_supplier_return', { returnId });
  }

  /** Process a return manually */
  static async processReturn(returnId: string) {
    return this.invoke('process_return', { returnId });
  }

  /** Get return statistics */
  static async getReturnStats() {
    const { data: returns, error } = await supabase
      .from('returns' as any)
      .select('status, refund_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.warn('Returns table may not exist:', error.message);
      return { total: 0, pending: 0, approved: 0, refunded: 0, totalRefundAmount: 0 };
    }

    const items = returns || [];
    return {
      total: items.length,
      pending: items.filter((r: any) => r.status === 'pending').length,
      approved: items.filter((r: any) => r.status === 'approved').length,
      refunded: items.filter((r: any) => r.status === 'refunded').length,
      totalRefundAmount: items.reduce((s: number, r: any) => s + (r.refund_amount || 0), 0),
    };
  }
}
