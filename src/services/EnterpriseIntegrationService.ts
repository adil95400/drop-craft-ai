import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type EnterpriseIntegrations = Database['public']['Tables']['enterprise_integrations']['Row'];

// Local settings type since enterprise_settings table doesn't exist
interface EnterpriseSetting {
  key: string;
  value: any;
  category: string;
}

export class EnterpriseIntegrationService {
  static async getEnterpriseIntegrations() {
    const { data, error } = await supabase
      .from('enterprise_integrations')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async getEnterpriseSettings(): Promise<EnterpriseSetting[]> {
    // Return default settings since enterprise_settings table doesn't exist
    return [
      { key: 'default_sync_frequency', value: 'hourly', category: 'general' },
      { key: 'enable_notifications', value: true, category: 'general' },
      { key: 'api_rate_limit', value: 1000, category: 'performance' }
    ]
  }

  static async createEnterpriseIntegration(integrationData: {
    providerName: string;
    integrationType: string;
    configuration: any;
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const { data, error } = await supabase
      .from('enterprise_integrations')
      .insert({
        user_id: user.id,
        name: integrationData.providerName,
        integration_type: integrationData.integrationType,
        config: integrationData.configuration,
        is_active: false,
        sync_status: 'disconnected'
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateEnterpriseSetting(key: string, value: any, category: string): Promise<EnterpriseSetting> {
    // Since enterprise_settings table doesn't exist, just return the setting
    console.log('Setting updated:', { key, value, category })
    return { key, value, category }
  }

  static async syncEnterpriseIntegration(integrationId: string) {
    const { data, error } = await supabase
      .from('enterprise_integrations')
      .update({ 
        last_sync_at: new Date().toISOString(),
        sync_status: 'syncing'
      })
      .eq('id', integrationId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async testConnection(integrationType: string, providerName: string, configuration: any) {
    try {
      const { data, error } = await supabase.functions.invoke('enterprise-integration', {
        body: {
          action: 'test_connection',
          integration_type: integrationType,
          provider_name: providerName,
          configuration
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error testing connection:', error);
      throw error;
    }
  }

  async syncIntegration(integrationId: string, syncType: 'full' | 'incremental' = 'incremental') {
    try {
      const { data, error } = await supabase.functions.invoke('enterprise-integration', {
        body: {
          action: 'sync_integration',
          integration_id: integrationId,
          sync_type: syncType
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error syncing integration:', error);
      throw error;
    }
  }

  async getIntegrations(): Promise<EnterpriseIntegrations[]> {
    try {
      const { data, error } = await supabase
        .from('enterprise_integrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching integrations:', error);
      throw error;
    }
  }

  async getIntegration(id: string): Promise<EnterpriseIntegrations | null> {
    try {
      const { data, error } = await supabase
        .from('enterprise_integrations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching integration:', error);
      throw error;
    }
  }

  async createIntegration(integration: Partial<EnterpriseIntegrations>) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('enterprise_integrations')
        .insert({
          user_id: user.id,
          integration_type: integration.integration_type!,
          name: integration.name || 'New Integration',
          config: integration.config || {},
          is_active: integration.is_active ?? false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating integration:', error);
      throw error;
    }
  }

  async updateIntegration(id: string, updates: Partial<EnterpriseIntegrations>) {
    try {
      const { data, error } = await supabase
        .from('enterprise_integrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating integration:', error);
      throw error;
    }
  }

  async deleteIntegration(id: string) {
    try {
      const { error } = await supabase
        .from('enterprise_integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting integration:', error);
      throw error;
    }
  }

  // Integration Templates
  getIntegrationTemplates() {
    return {
      erp: {
        name: 'Enterprise Resource Planning',
        description: 'Sync with ERP systems for comprehensive business data integration',
        providers: ['SAP', 'Oracle NetSuite', 'Microsoft Dynamics', 'Odoo'],
        features: ['Order Management', 'Inventory Sync', 'Financial Data', 'Supplier Management'],
        configuration_fields: [
          { name: 'api_endpoint', label: 'API Endpoint', type: 'url', required: true },
          { name: 'api_key', label: 'API Key', type: 'password', required: true },
          { name: 'company_id', label: 'Company ID', type: 'text', required: true }
        ]
      },
      crm: {
        name: 'Customer Relationship Management',
        description: 'Integrate with CRM systems for customer data synchronization',
        providers: ['Salesforce', 'HubSpot', 'Pipedrive', 'Zoho CRM'],
        features: ['Contact Sync', 'Lead Management', 'Deal Tracking', 'Activity Logs'],
        configuration_fields: [
          { name: 'instance_url', label: 'Instance URL', type: 'url', required: true },
          { name: 'client_id', label: 'Client ID', type: 'text', required: true },
          { name: 'client_secret', label: 'Client Secret', type: 'password', required: true }
        ]
      },
      analytics: {
        name: 'Analytics & Reporting',
        description: 'Connect to analytics platforms for enhanced reporting capabilities',
        providers: ['Google Analytics', 'Adobe Analytics', 'Mixpanel', 'Segment'],
        features: ['Event Tracking', 'Custom Metrics', 'Audience Segments', 'Conversion Tracking'],
        configuration_fields: [
          { name: 'tracking_id', label: 'Tracking ID', type: 'text', required: true },
          { name: 'api_secret', label: 'API Secret', type: 'password', required: true }
        ]
      }
    };
  }

  // Sync scheduling
  async scheduleSyncJob(integrationId: string, frequency: 'hourly' | 'daily' | 'weekly') {
    try {
      const { error } = await supabase
        .from('enterprise_integrations')
        .update({
          is_active: true,
          config: { sync_frequency: frequency }
        })
        .eq('id', integrationId);

      if (error) throw error;
      
      return { success: true, message: `Sync scheduled to run ${frequency}` };
    } catch (error) {
      console.error('Error scheduling sync job:', error);
      throw error;
    }
  }

  // Health monitoring
  async getIntegrationHealth(integrationId: string) {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      const health = {
        status: integration.sync_status,
        last_sync: integration.last_sync_at,
        error_count: integration.last_error ? 1 : 0,
        performance_score: this.calculatePerformanceScore(integration),
        uptime_percentage: 99.5,
        recommendations: this.generateHealthRecommendations(integration)
      };

      return health;
    } catch (error) {
      console.error('Error getting integration health:', error);
      throw error;
    }
  }

  private calculatePerformanceScore(integration: EnterpriseIntegrations): number {
    let score = 100;
    
    if (integration.last_error) {
      score -= 30;
    }

    if (integration.sync_status === 'error') {
      score -= 30;
    } else if (integration.sync_status === 'warning') {
      score -= 15;
    }

    return Math.max(0, Math.round(score));
  }

  private generateHealthRecommendations(integration: EnterpriseIntegrations): string[] {
    const recommendations: string[] = [];

    if (integration.sync_status === 'error') {
      recommendations.push('Integration is currently failing - check configuration and connectivity');
    }

    if (integration.last_error) {
      recommendations.push('Recent errors detected - review error logs');
    }

    if (integration.last_sync_at) {
      const lastSync = new Date(integration.last_sync_at);
      const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceSync > 24) {
        recommendations.push('Last sync was over 24 hours ago - check sync schedule and system status');
      }
    }

    if (!integration.is_active) {
      recommendations.push('Integration is inactive - enable it to resume data synchronization');
    }

    if (recommendations.length === 0) {
      recommendations.push('Integration is healthy and operating normally');
    }

    return recommendations;
  }
}
