import { supabase } from '@/integrations/supabase/client';

export interface CustomerSegment {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  segment_type: 'dynamic' | 'static' | 'ai_generated';
  rules: SegmentRule[];
  customer_count: number;
  avg_order_value?: number;
  total_revenue?: number;
  last_calculated_at?: string;
  auto_update: boolean;
  update_frequency: 'hourly' | 'daily' | 'weekly';
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SegmentRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: any;
}

export interface SegmentMember {
  id: string;
  segment_id: string;
  customer_id: string;
  added_at: string;
  score?: number;
  metadata: Record<string, any>;
  customer?: { first_name: string; last_name: string; email: string };
}

export interface RFMScore {
  id: string;
  user_id: string;
  customer_id: string;
  recency_score: number;
  frequency_score: number;
  monetary_score: number;
  rfm_segment: string;
  total_orders: number;
  total_spent: number;
  avg_order_value?: number;
  days_since_last_order?: number;
  calculated_at: string;
  customer?: { first_name: string; last_name: string; email: string };
}

export const CustomerSegmentationService = {
  // Segments
  async getSegments(): Promise<CustomerSegment[]> {
    const { data, error } = await supabase
      .from('customer_segments')
      .select('*')
      .order('customer_count', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as CustomerSegment[];
  },

  async getSegment(id: string): Promise<CustomerSegment> {
    const { data, error } = await supabase
      .from('customer_segments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as CustomerSegment;
  },

  async createSegment(segment: Partial<CustomerSegment>): Promise<CustomerSegment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('customer_segments')
      .insert({
        name: segment.name || 'Nouveau segment',
        description: segment.description,
        segment_type: segment.segment_type || 'dynamic',
        rules: (segment.rules || []) as unknown as Record<string, any>[],
        auto_update: segment.auto_update ?? true,
        update_frequency: segment.update_frequency || 'daily',
        tags: segment.tags || [],
        is_active: segment.is_active ?? true,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as CustomerSegment;
  },

  async updateSegment(id: string, updates: Partial<CustomerSegment>): Promise<CustomerSegment> {
    const updateData: Record<string, any> = { ...updates, updated_at: new Date().toISOString() };
    if (updates.rules) {
      updateData.rules = updates.rules as unknown as Record<string, any>[];
    }
    
    const { data, error } = await supabase
      .from('customer_segments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as CustomerSegment;
  },

  async deleteSegment(id: string): Promise<void> {
    const { error } = await supabase
      .from('customer_segments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Segment Members
  async getSegmentMembers(segmentId: string): Promise<SegmentMember[]> {
    const { data, error } = await supabase
      .from('customer_segment_members')
      .select(`*, customer:customers(first_name, last_name, email)`)
      .eq('segment_id', segmentId)
      .order('score', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as SegmentMember[];
  },

  // RFM Scores
  async getRFMScores(): Promise<RFMScore[]> {
    const { data, error } = await supabase
      .from('customer_rfm_scores')
      .select(`*, customer:customers(first_name, last_name, email)`)
      .order('calculated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as RFMScore[];
  },

  async calculateRFMScores(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get all customers with their orders
    const { data: customers } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id);

    const { data: orders } = await supabase
      .from('orders')
      .select('customer_id, total_amount, created_at')
      .eq('user_id', user.id);

    if (!customers || !orders) return;

    // Calculate RFM for each customer
    for (const customer of customers) {
      const customerOrders = orders.filter(o => o.customer_id === customer.id);
      
      if (customerOrders.length === 0) continue;

      const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const avgOrderValue = totalSpent / customerOrders.length;
      
      const lastOrder = customerOrders.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      
      const daysSinceLastOrder = Math.floor(
        (Date.now() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Simple RFM scoring (1-5 scale)
      const recencyScore = daysSinceLastOrder <= 30 ? 5 : daysSinceLastOrder <= 90 ? 4 : daysSinceLastOrder <= 180 ? 3 : daysSinceLastOrder <= 365 ? 2 : 1;
      const frequencyScore = customerOrders.length >= 10 ? 5 : customerOrders.length >= 5 ? 4 : customerOrders.length >= 3 ? 3 : customerOrders.length >= 2 ? 2 : 1;
      const monetaryScore = totalSpent >= 1000 ? 5 : totalSpent >= 500 ? 4 : totalSpent >= 200 ? 3 : totalSpent >= 50 ? 2 : 1;

      // Determine segment
      const avgScore = (recencyScore + frequencyScore + monetaryScore) / 3;
      let rfmSegment = 'À risque';
      if (avgScore >= 4.5) rfmSegment = 'Champions';
      else if (avgScore >= 4) rfmSegment = 'Fidèles';
      else if (avgScore >= 3) rfmSegment = 'Potentiels';
      else if (avgScore >= 2) rfmSegment = 'À réactiver';

      // Upsert RFM score
      await supabase
        .from('customer_rfm_scores')
        .upsert({
          user_id: user.id,
          customer_id: customer.id,
          recency_score: recencyScore,
          frequency_score: frequencyScore,
          monetary_score: monetaryScore,
          rfm_segment: rfmSegment,
          total_orders: customerOrders.length,
          total_spent: totalSpent,
          avg_order_value: avgOrderValue,
          days_since_last_order: daysSinceLastOrder,
          calculated_at: new Date().toISOString()
        }, { onConflict: 'user_id,customer_id' });
    }
  },

  async getSegmentStats(): Promise<{
    totalSegments: number;
    totalCustomersSegmented: number;
    avgSegmentSize: number;
    rfmDistribution: Record<string, number>;
  }> {
    const { data: segments } = await supabase
      .from('customer_segments')
      .select('customer_count');

    const { data: rfmScores } = await supabase
      .from('customer_rfm_scores')
      .select('rfm_segment');

    const segmentList = segments || [];
    const rfmList = rfmScores || [];

    const rfmDistribution: Record<string, number> = {};
    rfmList.forEach(r => {
      rfmDistribution[r.rfm_segment] = (rfmDistribution[r.rfm_segment] || 0) + 1;
    });

    const totalCustomers = segmentList.reduce((sum, s) => sum + (s.customer_count || 0), 0);

    return {
      totalSegments: segmentList.length,
      totalCustomersSegmented: totalCustomers,
      avgSegmentSize: segmentList.length > 0 ? Math.round(totalCustomers / segmentList.length) : 0,
      rfmDistribution
    };
  }
};
