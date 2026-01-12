import { supabase } from '@/integrations/supabase/client';

export type BulkEditItemType = 'products' | 'orders' | 'customers' | 'campaigns';

export interface BulkEditResult {
  success: number;
  failed: number;
  errors: { id: string; error: string }[];
}

export const BulkEditService = {
  async bulkUpdateProducts(ids: string[], changes: Record<string, any>): Promise<BulkEditResult> {
    const result: BulkEditResult = { success: 0, failed: 0, errors: [] };
    
    // Map frontend field names to database columns
    const fieldMapping: Record<string, string> = {
      category: 'category',
      price: 'price',
      costPrice: 'cost_price',
      status: 'status',
      isFeatured: 'is_featured'
    };
    
    const dbChanges: Record<string, any> = {};
    for (const [key, value] of Object.entries(changes)) {
      const dbField = fieldMapping[key] || key;
      dbChanges[dbField] = value;
    }

    // Perform batch update
    const { error } = await supabase
      .from('products')
      .update(dbChanges)
      .in('id', ids);

    if (error) {
      result.failed = ids.length;
      result.errors.push({ id: 'batch', error: error.message });
    } else {
      result.success = ids.length;
    }

    return result;
  },

  async bulkUpdateOrders(ids: string[], changes: Record<string, any>): Promise<BulkEditResult> {
    const result: BulkEditResult = { success: 0, failed: 0, errors: [] };
    
    const fieldMapping: Record<string, string> = {
      status: 'status',
      priority: 'priority',
      carrier: 'carrier_code'
    };
    
    const dbChanges: Record<string, any> = {};
    for (const [key, value] of Object.entries(changes)) {
      const dbField = fieldMapping[key] || key;
      dbChanges[dbField] = value;
    }

    const { error } = await supabase
      .from('orders')
      .update(dbChanges)
      .in('id', ids);

    if (error) {
      result.failed = ids.length;
      result.errors.push({ id: 'batch', error: error.message });
    } else {
      result.success = ids.length;
    }

    return result;
  },

  async bulkUpdateCustomers(ids: string[], changes: Record<string, any>): Promise<BulkEditResult> {
    const result: BulkEditResult = { success: 0, failed: 0, errors: [] };
    
    const fieldMapping: Record<string, string> = {
      status: 'status',
      segment: 'segment',
      isSubscribed: 'is_subscribed'
    };
    
    const dbChanges: Record<string, any> = {};
    for (const [key, value] of Object.entries(changes)) {
      const dbField = fieldMapping[key] || key;
      dbChanges[dbField] = value;
    }

    const { error } = await supabase
      .from('customers')
      .update(dbChanges)
      .in('id', ids);

    if (error) {
      result.failed = ids.length;
      result.errors.push({ id: 'batch', error: error.message });
    } else {
      result.success = ids.length;
    }

    return result;
  },

  async bulkUpdateCampaigns(ids: string[], changes: Record<string, any>): Promise<BulkEditResult> {
    const result: BulkEditResult = { success: 0, failed: 0, errors: [] };
    
    const fieldMapping: Record<string, string> = {
      status: 'status',
      budget: 'budget',
      isAutomated: 'is_active'
    };
    
    const dbChanges: Record<string, any> = {};
    for (const [key, value] of Object.entries(changes)) {
      const dbField = fieldMapping[key] || key;
      dbChanges[dbField] = value;
    }

    const { error } = await supabase
      .from('ad_campaigns')
      .update(dbChanges)
      .in('id', ids);

    if (error) {
      result.failed = ids.length;
      result.errors.push({ id: 'batch', error: error.message });
    } else {
      result.success = ids.length;
    }

    return result;
  },

  async bulkUpdate(
    itemType: BulkEditItemType, 
    ids: string[], 
    changes: Record<string, any>
  ): Promise<BulkEditResult> {
    switch (itemType) {
      case 'products':
        return this.bulkUpdateProducts(ids, changes);
      case 'orders':
        return this.bulkUpdateOrders(ids, changes);
      case 'customers':
        return this.bulkUpdateCustomers(ids, changes);
      case 'campaigns':
        return this.bulkUpdateCampaigns(ids, changes);
      default:
        return { success: 0, failed: ids.length, errors: [{ id: 'unknown', error: 'Type non supporté' }] };
    }
  }
};
