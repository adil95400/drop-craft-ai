import { supabase } from '@/integrations/supabase/client';

export interface CRMContact {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  tags: string[];
  status: 'active' | 'inactive' | 'lead' | 'customer';
  lifecycle_stage: 'subscriber' | 'lead' | 'marketing_qualified_lead' | 'sales_qualified_lead' | 'opportunity' | 'customer' | 'evangelist';
  source?: string;
  lead_score: number;
  attribution: Record<string, any>;
  custom_fields: Record<string, any>;
  last_contacted_at?: string;
  last_activity_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CRMSegment {
  id: string;
  user_id: string;
  name: string;
  description: string;
  criteria: Record<string, any>;
  contact_count: number;
  created_at: string;
  updated_at: string;
}

export interface CRMActivity {
  id: string;
  user_id: string;
  contact_id: string;
  activity_type: 'email' | 'call' | 'meeting' | 'note' | 'task' | 'deal';
  subject: string;
  description?: string;
  metadata: Record<string, any>;
  completed: boolean;
  due_date?: string;
  created_at: string;
}

export class RealCRMService {
  private static instance: RealCRMService;

  static getInstance(): RealCRMService {
    if (!RealCRMService.instance) {
      RealCRMService.instance = new RealCRMService();
    }
    return RealCRMService.instance;
  }

  // Contacts Management
  async getContacts(filters?: {
    status?: string;
    lifecycle_stage?: string;
    source?: string;
    search?: string;
    tags?: string[];
    limit?: number;
  }): Promise<CRMContact[]> {
    let query = supabase
      .from('crm_contacts')
      .select('*');

    if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.lifecycle_stage) {
        query = query.eq('lifecycle_stage', filters.lifecycle_stage);
      }
      if (filters.source) {
        query = query.eq('source', filters.source);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
    }

    query = query
      .order('updated_at', { ascending: false })
      .limit(filters?.limit || 100);

    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transform Supabase data to typed CRM contacts
    return (data || []).map(contact => ({
      ...contact,
      tags: Array.isArray(contact.tags) ? contact.tags : [],
      attribution: typeof contact.attribution === 'object' && contact.attribution !== null 
        ? contact.attribution as Record<string, any>
        : {},
      custom_fields: typeof contact.custom_fields === 'object' && contact.custom_fields !== null
        ? contact.custom_fields as Record<string, any>
        : {},
      status: contact.status as 'active' | 'inactive' | 'lead' | 'customer',
      lifecycle_stage: contact.lifecycle_stage as 'subscriber' | 'lead' | 'marketing_qualified_lead' | 'sales_qualified_lead' | 'opportunity' | 'customer' | 'evangelist',
    } as CRMContact));
  }

  async createContact(contact: Omit<CRMContact, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<CRMContact> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('crm_contacts')
      .insert({
        ...contact,
        user_id: user.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      tags: Array.isArray(data.tags) ? data.tags : [],
      attribution: typeof data.attribution === 'object' && data.attribution !== null 
        ? data.attribution as Record<string, any>
        : {},
      custom_fields: typeof data.custom_fields === 'object' && data.custom_fields !== null
        ? data.custom_fields as Record<string, any>
        : {},
      status: data.status as 'active' | 'inactive' | 'lead' | 'customer',
      lifecycle_stage: data.lifecycle_stage as 'subscriber' | 'lead' | 'marketing_qualified_lead' | 'sales_qualified_lead' | 'opportunity' | 'customer' | 'evangelist',
    } as CRMContact;
  }

  async updateContact(id: string, updates: Partial<CRMContact>): Promise<CRMContact> {
    const { data, error } = await supabase
      .from('crm_contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      tags: Array.isArray(data.tags) ? data.tags : [],
      attribution: typeof data.attribution === 'object' && data.attribution !== null 
        ? data.attribution as Record<string, any>
        : {},
      custom_fields: typeof data.custom_fields === 'object' && data.custom_fields !== null
        ? data.custom_fields as Record<string, any>
        : {},
      status: data.status as 'active' | 'inactive' | 'lead' | 'customer',
      lifecycle_stage: data.lifecycle_stage as 'subscriber' | 'lead' | 'marketing_qualified_lead' | 'sales_qualified_lead' | 'opportunity' | 'customer' | 'evangelist',
    } as CRMContact;
  }

  async deleteContact(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_contacts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Lead Scoring
  async updateLeadScore(contactId: string, scoreChange: number, reason: string): Promise<void> {
    const { data: contact } = await supabase
      .from('crm_contacts')
      .select('lead_score, attribution')
      .eq('id', contactId)
      .single();

    if (!contact) throw new Error('Contact not found');

    const newScore = Math.max(0, Math.min(100, contact.lead_score + scoreChange));
    
    const currentAttribution = typeof contact.attribution === 'object' && contact.attribution !== null
      ? contact.attribution as Record<string, any>
      : {};
    
    const scoreHistory = Array.isArray(currentAttribution.score_history) 
      ? currentAttribution.score_history 
      : [];

    const updatedAttribution = {
      ...currentAttribution,
      score_history: [
        ...scoreHistory,
        {
          timestamp: new Date().toISOString(),
          old_score: contact.lead_score,
          new_score: newScore,
          change: scoreChange,
          reason,
        },
      ].slice(-10), // Keep last 10 score changes
    };

    await supabase
      .from('crm_contacts')
      .update({
        lead_score: newScore,
        attribution: updatedAttribution,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', contactId);
  }

  // Segmentation
  async getSegments(): Promise<CRMSegment[]> {
    const { data, error } = await supabase
      .from('marketing_segments')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(segment => ({
      ...segment,
      criteria: typeof segment.criteria === 'object' && segment.criteria !== null
        ? segment.criteria as Record<string, any>
        : {},
    } as CRMSegment));
  }

  async createSegment(segment: Omit<CRMSegment, 'id' | 'user_id' | 'contact_count' | 'created_at' | 'updated_at'>): Promise<CRMSegment> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Calculate contact count based on criteria
    const contactCount = await this.calculateSegmentSize(segment.criteria);

    const { data, error } = await supabase
      .from('marketing_segments')
      .insert({
        ...segment,
        user_id: user.user.id,
        contact_count: contactCount,
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      criteria: typeof data.criteria === 'object' && data.criteria !== null
        ? data.criteria as Record<string, any>
        : {},
    } as CRMSegment;
  }

  private async calculateSegmentSize(criteria: Record<string, any>): Promise<number> {
    let query = supabase
      .from('crm_contacts')
      .select('id', { count: 'exact' });

    // Apply criteria filters
    if (criteria.status) {
      query = query.eq('status', criteria.status);
    }
    if (criteria.lifecycle_stage) {
      query = query.eq('lifecycle_stage', criteria.lifecycle_stage);
    }
    if (criteria.source) {
      query = query.eq('source', criteria.source);
    }
    if (criteria.min_lead_score) {
      query = query.gte('lead_score', criteria.min_lead_score);
    }
    if (criteria.max_lead_score) {
      query = query.lte('lead_score', criteria.max_lead_score);
    }
    if (criteria.tags && criteria.tags.length > 0) {
      query = query.overlaps('tags', criteria.tags);
    }
    if (criteria.created_after) {
      query = query.gte('created_at', criteria.created_after);
    }
    if (criteria.last_activity_after) {
      query = query.gte('last_activity_at', criteria.last_activity_after);
    }

    const { count, error } = await query;
    
    if (error) throw error;
    return count || 0;
  }

  // Activities
  async getActivities(contactId?: string, limit?: number): Promise<CRMActivity[]> {
    let query = supabase
      .from('activity_logs')
      .select('*');

    if (contactId) {
      query = query.eq('entity_id', contactId);
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(limit || 50);

    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transform activity logs to CRM activities
    return (data || []).map(log => ({
      id: log.id,
      user_id: log.user_id,
      contact_id: log.entity_id,
      activity_type: (log.action as 'email' | 'call' | 'meeting' | 'note' | 'task' | 'deal') || 'note',
      subject: log.description,
      description: log.description,
      metadata: typeof log.metadata === 'object' && log.metadata !== null 
        ? log.metadata as Record<string, any>
        : {},
      completed: true,
      created_at: log.created_at,
    } as CRMActivity));
  }

  async createActivity(activity: Omit<CRMActivity, 'id' | 'user_id' | 'created_at'>): Promise<CRMActivity> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: user.user.id,
        action: activity.activity_type,
        entity_type: 'contact',
        entity_id: activity.contact_id,
        description: activity.subject,
        metadata: {
          ...activity.metadata,
          activity_type: activity.activity_type,
          completed: activity.completed,
          due_date: activity.due_date,
        },
      })
      .select()
      .single();

    if (error) throw error;

    // Update contact last activity
    await supabase
      .from('crm_contacts')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', activity.contact_id);

    return {
      id: data.id,
      user_id: data.user_id,
      contact_id: data.entity_id,
      activity_type: activity.activity_type,
      subject: activity.subject,
      description: activity.description,
      metadata: activity.metadata,
      completed: activity.completed,
      due_date: activity.due_date,
      created_at: data.created_at,
    };
  }

  // Analytics
  async getCRMAnalytics(): Promise<{
    totalContacts: number;
    byLifecycleStage: Record<string, number>;
    bySource: Record<string, number>;
    byLeadScore: { range: string; count: number }[];
    recentActivities: CRMActivity[];
    conversionRates: Record<string, number>;
  }> {
    const { data: contacts } = await supabase
      .from('crm_contacts')
      .select('*');

    if (!contacts) {
      throw new Error('Failed to fetch contacts for analytics');
    }

    const totalContacts = contacts.length;

    const byLifecycleStage = contacts.reduce((acc, contact) => {
      acc[contact.lifecycle_stage] = (acc[contact.lifecycle_stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySource = contacts.reduce((acc, contact) => {
      const source = contact.source || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byLeadScore = [
      { range: '0-20', count: contacts.filter(c => c.lead_score <= 20).length },
      { range: '21-40', count: contacts.filter(c => c.lead_score > 20 && c.lead_score <= 40).length },
      { range: '41-60', count: contacts.filter(c => c.lead_score > 40 && c.lead_score <= 60).length },
      { range: '61-80', count: contacts.filter(c => c.lead_score > 60 && c.lead_score <= 80).length },
      { range: '81-100', count: contacts.filter(c => c.lead_score > 80).length },
    ];

    const recentActivities = await this.getActivities(undefined, 10);

    const conversionRates = {
      'subscriber_to_lead': this.calculateConversionRate(contacts, 'subscriber', 'lead'),
      'lead_to_mql': this.calculateConversionRate(contacts, 'lead', 'marketing_qualified_lead'),
      'mql_to_sql': this.calculateConversionRate(contacts, 'marketing_qualified_lead', 'sales_qualified_lead'),
      'sql_to_customer': this.calculateConversionRate(contacts, 'sales_qualified_lead', 'customer'),
    };

    return {
      totalContacts,
      byLifecycleStage,
      bySource,
      byLeadScore,
      recentActivities,
      conversionRates,
    };
  }

  private calculateConversionRate(contacts: any[], fromStage: string, toStage: string): number {
    const fromCount = contacts.filter(c => c.lifecycle_stage === fromStage).length;
    const toCount = contacts.filter(c => c.lifecycle_stage === toStage).length;
    
    if (fromCount === 0) return 0;
    return Math.round((toCount / (fromCount + toCount)) * 100);
  }

  // Bulk Operations
  async bulkUpdateContacts(contactIds: string[], updates: Partial<CRMContact>): Promise<void> {
    const { error } = await supabase
      .from('crm_contacts')
      .update(updates)
      .in('id', contactIds);

    if (error) throw error;
  }

  async bulkDeleteContacts(contactIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('crm_contacts')
      .delete()
      .in('id', contactIds);

    if (error) throw error;
  }
}

export const realCRMService = RealCRMService.getInstance();