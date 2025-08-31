import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type EnterpriseIntegrations = Database['public']['Tables']['enterprise_integrations']['Row'];
type EnterpriseSettings = Database['public']['Tables']['enterprise_settings']['Row'];

export class EnterpriseIntegrationService {
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

  async getSyncStatus(integrationId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('enterprise-integration', {
        body: {
          action: 'get_sync_status',
          integration_id: integrationId
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting sync status:', error);
      throw error;
    }
  }

  async configureWebhook(integrationId: string, webhookConfig: any) {
    try {
      const { data, error } = await supabase.functions.invoke('enterprise-integration', {
        body: {
          action: 'configure_webhook',
          integration_id: integrationId,
          webhook_config: webhookConfig
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error configuring webhook:', error);
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
      const { data, error } = await supabase
        .from('enterprise_integrations')
        .insert({
          integration_type: integration.integration_type!,
          provider_name: integration.provider_name!,
          configuration: integration.configuration || {},
          authentication_data: integration.authentication_data || {},
          sync_frequency: integration.sync_frequency || 'daily',
          is_active: integration.is_active ?? false
        } as any)
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

  // Enterprise Settings Management
  async setSetting(category: string, key: string, value: any, accessLevel: string = 'user') {
    try {
      const { data, error } = await supabase.functions.invoke('enterprise-integration', {
        body: {
          action: 'manage_settings',
          setting_action: 'set',
          setting_category: category,
          setting_key: key,
          setting_value: value,
          access_level: accessLevel
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error setting enterprise setting:', error);
      throw error;
    }
  }

  async getSetting(category: string, key: string) {
    try {
      const { data, error } = await supabase.functions.invoke('enterprise-integration', {
        body: {
          action: 'manage_settings',
          setting_action: 'get',
          setting_category: category,
          setting_key: key
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting enterprise setting:', error);
      throw error;
    }
  }

  async getSettings(category: string): Promise<EnterpriseSettings[]> {
    try {
      const { data, error } = await supabase.functions.invoke('enterprise-integration', {
        body: {
          action: 'manage_settings',
          setting_action: 'list',
          setting_category: category
        }
      });

      if (error) throw error;
      return data?.settings || [];
    } catch (error) {
      console.error('Error getting enterprise settings:', error);
      throw error;
    }
  }

  async deleteSetting(category: string, key: string) {
    try {
      const { data, error } = await supabase.functions.invoke('enterprise-integration', {
        body: {
          action: 'manage_settings',
          setting_action: 'delete',
          setting_category: category,
          setting_key: key
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting enterprise setting:', error);
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
      },
      inventory: {
        name: 'Inventory Management',
        description: 'Sync inventory levels and stock management across platforms',
        providers: ['TradeGecko', 'Cin7', 'DEAR Inventory', 'inFlow'],
        features: ['Stock Level Sync', 'Warehouse Management', 'Low Stock Alerts', 'Transfer Orders'],
        configuration_fields: [
          { name: 'api_url', label: 'API URL', type: 'url', required: true },
          { name: 'auth_token', label: 'Authentication Token', type: 'password', required: true },
          { name: 'warehouse_id', label: 'Default Warehouse ID', type: 'text', required: false }
        ]
      },
      accounting: {
        name: 'Accounting & Finance',
        description: 'Integrate with accounting software for financial data sync',
        providers: ['QuickBooks', 'Xero', 'FreshBooks', 'Wave'],
        features: ['Invoice Sync', 'Payment Tracking', 'Expense Management', 'Tax Reporting'],
        configuration_fields: [
          { name: 'company_id', label: 'Company ID', type: 'text', required: true },
          { name: 'consumer_key', label: 'Consumer Key', type: 'text', required: true },
          { name: 'consumer_secret', label: 'Consumer Secret', type: 'password', required: true }
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
          sync_frequency: frequency,
          is_active: true
        })
        .eq('id', integrationId);

      if (error) throw error;

      // In a real implementation, you would schedule the actual sync job here
      console.log(`Scheduled ${frequency} sync for integration ${integrationId}`);
      
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
        error_count: Array.isArray(integration.error_logs) ? integration.error_logs.length : 0,
        performance_score: this.calculatePerformanceScore(integration),
        uptime_percentage: this.calculateUptimePercentage(integration),
        recommendations: this.generateHealthRecommendations(integration)
      };

      return health;
    } catch (error) {
      console.error('Error getting integration health:', error);
      throw error;
    }
  }

  private calculatePerformanceScore(integration: EnterpriseIntegrations): number {
    const metrics = integration.performance_metrics as any;
    if (!metrics) return 50;

    let score = 100;
    
    // Deduct points for recent errors
    if (Array.isArray(integration.error_logs) && integration.error_logs.length > 0) {
      score -= Math.min(integration.error_logs.length * 10, 40);
    }

    // Deduct points for failed sync status
    if (integration.sync_status === 'error') {
      score -= 30;
    } else if (integration.sync_status === 'warning') {
      score -= 15;
    }

    // Factor in success rate if available
    if (metrics.success_rate) {
      score = (score * metrics.success_rate) / 100;
    }

    return Math.max(0, Math.round(score));
  }

  private calculateUptimePercentage(integration: EnterpriseIntegrations): number {
    // Simplified uptime calculation
    // In reality, this would be based on historical sync success/failure data
    const errorCount = Array.isArray(integration.error_logs) ? integration.error_logs.length : 0;
    const baseUptime = 100;
    const uptimeDeduction = Math.min(errorCount * 2, 20);
    
    return Math.max(80, baseUptime - uptimeDeduction);
  }

  private generateHealthRecommendations(integration: EnterpriseIntegrations): string[] {
    const recommendations: string[] = [];
    const errorCount = Array.isArray(integration.error_logs) ? integration.error_logs.length : 0;

    if (integration.sync_status === 'error') {
      recommendations.push('Integration is currently failing - check configuration and connectivity');
    }

    if (errorCount > 5) {
      recommendations.push('High error rate detected - consider reviewing API limits and authentication');
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